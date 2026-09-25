import { rateLimit } from "../middleware/rateLimit.js";
import express from "express";
import { Announcement, PastPaper, ExamResult, ContactMessage } from "../models/index.js";
import { examStreams, validText, validEmail, validYear } from "../utils/validation.js";
import mongoose from "mongoose";
import { paperBucket } from "../utils/paperStorage.js";

const router = express.Router();

router.get("/paper-files/:id", async (req, res, next) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: "Invalid file ID." });
  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    const bucket = paperBucket();
    const [file] = await bucket.find({ _id: id }).toArray();
    if (!file) return res.status(404).json({ message: "Paper file not found." });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", file.length);
    res.setHeader("Content-Disposition", 'inline; filename="paper.pdf"');
    bucket.openDownloadStream(id).on("error", next).pipe(res);
  } catch (error) { next(error); }
});

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "EMSAM API" });
});

router.get("/announcements", async (_req, res) => {
  try {
    const rows = await Announcement.find({ is_published: true });
    rows.sort((a, b) => new Date(b.event_date || b.created_at) - new Date(a.event_date || a.created_at) || b.id.localeCompare(a.id));

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load announcements." });
  }
});

router.get("/papers", async (req, res) => {
  const { subject, year, type, stream, search } = req.query;
  if (![subject, type, stream, search].every(value => validText(value, 255, true)) || (year !== undefined && !validYear(year))) {
    return res.status(400).json({ message: "Provide valid search filters and exam year." });
  }
  const filter = { is_published: true };

  if (subject) {
    filter.subject = subject;
  }

  if (year) {
    filter.exam_year = Number(year);
  }

  if (type) {
    filter.paper_type = type;
  }

  if (stream) {
    filter.stream = { $in: [stream, "Both"] };
  }

  if (search) {
    const literal = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [{ title: { $regex: literal, $options: "i" } }, { subject: { $regex: literal, $options: "i" } }];
  }

  try {
    const rows = await PastPaper.find(filter).sort({ exam_year: -1, subject: 1, title: 1 });

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load past papers." });
  }
});

router.get("/results", rateLimit("results", 60), async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const { indexNumber, stream, year = 2026 } = req.query;

  if (!validText(indexNumber, 30) || !examStreams.includes(stream) || !validYear(year)) {
    return res.status(400).json({ message: "A valid index number, stream and exam year are required." });
  }

  try {
    const result = await ExamResult.findOne({ index_number: indexNumber.trim(), stream, exam_year: Number(year) });

    if (!result) {
      return res.status(404).json({ message: "No result was found for the provided details." });
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to search results." });
  }
});

router.post("/contact", rateLimit("contact", 10), async (req, res) => {
  const { fullName, email, subject, message } = req.body || {};

  if (!validText(fullName, 150) || !validEmail(email) || !validText(subject, 200) || !validText(message, 10000)) {
    return res.status(400).json({ message: "Please provide a valid name, email, subject and message (up to 10,000 characters)." });
  }

  try {
    await ContactMessage.create({ full_name: fullName.trim(), email: email.toLowerCase().trim(), subject: subject.trim(), message: message.trim() });

    res.status(201).json({ message: "Your message has been sent to EMSAM." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to send your message." });
  }
});

export default router;
