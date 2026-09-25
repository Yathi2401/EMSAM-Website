import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import XLSX from "xlsx";
import mongoose from "../config/db.js";
import { User, Announcement, PastPaper, ExamResult, ContactMessage } from "../models/index.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { examStreams, validText, validYear } from "../utils/validation.js";
import { prepareResultRows, inTransaction } from "../utils/resultImport.js";
import { paperBucket, storePaper } from "../utils/paperStorage.js";

const router = express.Router();
const papersFolder = fileURLToPath(new URL("../uploads/papers/", import.meta.url));
const tempFolder = fileURLToPath(new URL("../uploads/temp/", import.meta.url));
const cloud = Boolean(process.env.VERCEL);
if (!cloud) {
  fs.mkdirSync(papersFolder, { recursive: true });
  fs.mkdirSync(tempFolder, { recursive: true });
}

const paperStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, papersFolder),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._ -]/g, "_");
    cb(null, `${randomUUID()}-${safeName.slice(-180)}`);
  },
});

const uploadPaper = multer({
  storage: cloud ? multer.memoryStorage() : paperStorage,
  limits: { fileSize: (cloud ? 4 : 25) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype === "application/pdf");
  },
});

const uploadSpreadsheet = multer({
  ...(cloud ? { storage: multer.memoryStorage() } : { dest: tempFolder }),
  limits: { fileSize: (cloud ? 4 : 10) * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, [".xlsx", ".xls"].includes(path.extname(file.originalname).toLowerCase())),
});

function removeUpload(file) {
  if (!file?.path) return;
  try { fs.unlinkSync(file.path); } catch (error) {
    if (error.code !== "ENOENT") console.error("Unable to remove upload:", error);
  }
}

router.use(requireAuth, requireAdmin);

router.get("/announcements", async (_req, res, next) => {
  try {
    const rows = await Announcement.find().select("title is_published").sort({ _id: -1 });
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/papers", async (_req, res, next) => {
  try {
    const rows = await PastPaper.find().select("title is_published").sort({ _id: -1 });
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/summary", async (_req, res) => {
  try {
    const [users, papers, results, messages] = await Promise.all([
      User.countDocuments({ role: "student" }), PastPaper.countDocuments(),
      ExamResult.countDocuments(), ContactMessage.countDocuments({ status: "new" }),
    ]);

    res.json({
      students: users,
      papers,
      results,
      newMessages: messages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load dashboard summary." });
  }
});

router.get("/messages", async (_req, res) => {
  try {
    const rows = await ContactMessage.find().sort({ created_at: -1 });
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load messages." });
  }
});

router.patch("/messages/:id", async (req, res, next) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id) || !["new", "read", "replied"].includes(req.body?.status)) {
    return res.status(400).json({ message: "Provide a valid message ID and status." });
  }
  try {
    const message = await ContactMessage.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status } }, { new: true, runValidators: true });
    if (!message) return res.status(404).json({ message: "Message not found." });
    res.json({ message: "Message status updated." });
  } catch (error) { next(error); }
});

router.get("/users", async (_req, res) => {
  try {
    const rows = await User.find().sort({ created_at: -1 });
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load users." });
  }
});

router.post("/announcements", async (req, res) => {
  const { category, title, summary, eventDate, imageUrl } = req.body || {};

  if (!validText(category, 80) || !validText(title, 200) || !validText(summary, 10000) ||
      !validText(imageUrl, 500, true) || (eventDate && (typeof eventDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || !Number.isFinite(Date.parse(eventDate))))) {
    return res.status(400).json({ message: "Category, title and summary are required." });
  }

  try {
    const result = await Announcement.create({ category, title, summary, event_date: eventDate || null, image_url: imageUrl || null });

    res.status(201).json({ message: "Announcement published.", id: result.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to publish announcement." });
  }
});

router.delete("/announcements/:id", async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: "Invalid announcement ID." });
  try {
    const result = await Announcement.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Announcement not found." });
    res.json({ message: "Announcement deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to delete announcement." });
  }
});

router.post("/papers", uploadPaper.single("paper"), async (req, res) => {
  const { title, subject, stream, year, paperType } = req.body || {};

  if (!req.file || !validText(title, 255) || !validText(subject, 100) ||
      ![...examStreams, "Both"].includes(stream) || !validYear(year) || !validText(paperType, 100)) {
    removeUpload(req.file);
    return res.status(400).json({ message: "Paper file and all paper details are required." });
  }

  let storedId;

  try {
    let signature = req.file.buffer?.subarray(0, 5);
    if (!signature) {
      const handle = await fs.promises.open(req.file.path, "r");
      signature = Buffer.alloc(5);
      try { await handle.read(signature, 0, 5, 0); } finally { await handle.close(); }
    }
    if (signature.toString() !== "%PDF-") {
      removeUpload(req.file);
      return res.status(400).json({ message: "The uploaded file is not a PDF." });
    }
    const filename = req.file.filename || `${randomUUID()}.pdf`;
    if (cloud) storedId = await storePaper(req.file.buffer, filename);
    const fileUrl = storedId ? `/api/paper-files/${storedId}` : `/uploads/papers/${filename}`;
    const result = await PastPaper.create({ title, subject, stream, exam_year: Number(year), paper_type: paperType, file_name: filename, file_url: fileUrl });

    res.status(201).json({ message: "Past paper uploaded.", id: result.id });
  } catch (error) {
    console.error(error);
    removeUpload(req.file);
    if (storedId) await paperBucket().delete(storedId).catch(cleanupError => console.error(cleanupError));
    res.status(500).json({ message: "Unable to save the past paper." });
  }
});

router.delete("/papers/:id", async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: "Invalid paper ID." });
  try {
    const paper = await PastPaper.findById(req.params.id);

    if (!paper) return res.status(404).json({ message: "Paper not found." });
    const filePath = path.resolve(papersFolder, paper.file_name);
    if (path.dirname(filePath) !== path.resolve(papersFolder)) throw new Error("Invalid paper file path.");

    await PastPaper.deleteOne({ _id: paper._id });
    if (paper.file_url.startsWith("/api/paper-files/")) {
      await paperBucket().delete(new mongoose.Types.ObjectId(paper.file_url.split("/").pop()));
    } else if (!cloud) removeUpload({ path: filePath });
    res.json({ message: "Past paper deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to delete the paper." });
  }
});

router.post("/results/import", uploadSpreadsheet.single("resultsFile"), async (req, res) => {
  const stream = req.body?.stream;
  const year = req.body?.examYear || 2026;
  const examYear = Number(year);

  if (!req.file || !examStreams.includes(stream) || !validYear(year)) {
    removeUpload(req.file);
    return res.status(400).json({ message: "An Excel spreadsheet, valid stream and exam year are required." });
  }

  try {
    let workbook;
    try {
      workbook = req.file.buffer ? XLSX.read(req.file.buffer, { type: "buffer" }) : XLSX.readFile(req.file.path);
    } catch {
      throw Object.assign(new Error("Unable to read this Excel spreadsheet."), { status: 400 });
    }
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = prepareResultRows(XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }), stream);
    const imported = await inTransaction(mongoose.connection, async (session) => {
      for (const row of rows) {
        await ExamResult.findOneAndUpdate(
          { index_number: row[1], stream, exam_year: examYear },
          { $set: {
            full_name: row[0], subject1_name: stream === "Biological Science" ? "Biology" : "Combined Mathematics",
            subject1_mark: row[2], subject1_grade: row[3],
            subject2_name: "Physics", subject2_mark: row[5], subject2_grade: row[6],
            subject3_name: "Chemistry", subject3_mark: row[8], subject3_grade: row[9],
            z_average: row[11], rank_number: row[12],
          } },
          { upsert: true, runValidators: true, session }
        );
      }
      return rows.length;
    });

    res.json({ message: `${imported} result records imported successfully.` });
  } catch (error) {
    console.error(error);
    if (error.code === 20) return res.status(503).json({ message: "Result imports require MongoDB Atlas or a local replica set. No changes were saved." });
    res.status(error.status === 400 ? 400 : 500).json({ message: error.status === 400 ? error.message : "Unable to import the results spreadsheet. No changes were saved." });
  } finally {
    removeUpload(req.file);
  }
});

export default router;
