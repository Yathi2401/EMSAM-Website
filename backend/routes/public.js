import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "EMSAM API" });
});

router.get("/announcements", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, category, title, summary, event_date, image_url, created_at
       FROM announcements
       WHERE is_published = TRUE
       ORDER BY COALESCE(event_date, created_at) DESC, id DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load announcements." });
  }
});

router.get("/papers", async (req, res) => {
  const { subject, year, type, stream, search } = req.query;
  const conditions = ["is_published = TRUE"];
  const values = [];

  if (subject) {
    conditions.push("subject = ?");
    values.push(subject);
  }

  if (year) {
    conditions.push("exam_year = ?");
    values.push(Number(year));
  }

  if (type) {
    conditions.push("paper_type = ?");
    values.push(type);
  }

  if (stream) {
    conditions.push("(stream = ? OR stream = 'Both')");
    values.push(stream);
  }

  if (search) {
    conditions.push("(title LIKE ? OR subject LIKE ?)");
    values.push(`%${search}%`, `%${search}%`);
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, title, subject, stream, exam_year, paper_type, file_name, file_url
       FROM past_papers
       WHERE ${conditions.join(" AND ")}
       ORDER BY exam_year DESC, subject ASC, title ASC`,
      values
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load past papers." });
  }
});

router.get("/results", async (req, res) => {
  const { indexNumber, stream, year = 2026 } = req.query;

  if (!indexNumber || !stream) {
    return res.status(400).json({ message: "Index number and stream are required." });
  }

  try {
    const [rows] = await pool.query(
      `SELECT full_name, index_number, stream,
              subject1_name, subject1_mark, subject1_grade,
              subject2_name, subject2_mark, subject2_grade,
              subject3_name, subject3_mark, subject3_grade,
              z_average, rank_number, exam_year
       FROM exam_results
       WHERE index_number = ? AND stream = ? AND exam_year = ?
       LIMIT 1`,
      [indexNumber.trim(), stream, Number(year)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No result was found for the provided details." });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to search results." });
  }
});

router.post("/contact", async (req, res) => {
  const { fullName, email, subject, message } = req.body;

  if (!fullName || !email || !subject || !message) {
    return res.status(400).json({ message: "Please complete all contact form fields." });
  }

  try {
    await pool.query(
      `INSERT INTO contact_messages (full_name, email, subject, message)
       VALUES (?, ?, ?, ?)`,
      [fullName.trim(), email.toLowerCase().trim(), subject.trim(), message.trim()]
    );

    res.status(201).json({ message: "Your message has been sent to EMSAM." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to send your message." });
  }
});

export default router;
