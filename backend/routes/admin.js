import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import XLSX from "xlsx";
import pool from "../config/db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();
const papersFolder = path.resolve("uploads/papers");
const tempFolder = path.resolve("uploads/temp");
fs.mkdirSync(papersFolder, { recursive: true });
fs.mkdirSync(tempFolder, { recursive: true });

const paperStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, papersFolder),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._ -]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const uploadPaper = multer({
  storage: paperStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype === "application/pdf");
  },
});

const uploadSpreadsheet = multer({ dest: tempFolder });

router.use(requireAuth, requireAdmin);

router.get("/summary", async (_req, res) => {
  try {
    const [[users]] = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role = 'student'");
    const [[papers]] = await pool.query("SELECT COUNT(*) AS count FROM past_papers");
    const [[results]] = await pool.query("SELECT COUNT(*) AS count FROM exam_results");
    const [[messages]] = await pool.query("SELECT COUNT(*) AS count FROM contact_messages WHERE status = 'new'");

    res.json({
      students: users.count,
      papers: papers.count,
      results: results.count,
      newMessages: messages.count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load dashboard summary." });
  }
});

router.get("/messages", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, email, subject, message, status, created_at
       FROM contact_messages ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load messages." });
  }
});

router.get("/users", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, school, stream, al_year, role, is_active, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load users." });
  }
});

router.post("/announcements", async (req, res) => {
  const { category, title, summary, eventDate, imageUrl } = req.body;

  if (!category || !title || !summary) {
    return res.status(400).json({ message: "Category, title and summary are required." });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO announcements (category, title, summary, event_date, image_url)
       VALUES (?, ?, ?, ?, ?)`,
      [category, title, summary, eventDate || null, imageUrl || null]
    );

    res.status(201).json({ message: "Announcement published.", id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to publish announcement." });
  }
});

router.delete("/announcements/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM announcements WHERE id = ?", [req.params.id]);
    res.json({ message: "Announcement deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to delete announcement." });
  }
});

router.post("/papers", uploadPaper.single("paper"), async (req, res) => {
  const { title, subject, stream, year, paperType } = req.body;

  if (!req.file || !title || !subject || !stream || !year || !paperType) {
    return res.status(400).json({ message: "Paper file and all paper details are required." });
  }

  const fileUrl = `/uploads/papers/${req.file.filename}`;

  try {
    const [result] = await pool.query(
      `INSERT INTO past_papers
       (title, subject, stream, exam_year, paper_type, file_name, file_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, subject, stream, Number(year), paperType, req.file.filename, fileUrl]
    );

    res.status(201).json({ message: "Past paper uploaded.", id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to save the past paper." });
  }
});

router.delete("/papers/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT file_name FROM past_papers WHERE id = ?", [req.params.id]);

    if (rows.length > 0) {
      const filePath = path.join(papersFolder, rows[0].file_name);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await pool.query("DELETE FROM past_papers WHERE id = ?", [req.params.id]);
    res.json({ message: "Past paper deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to delete the paper." });
  }
});

router.post("/results/import", uploadSpreadsheet.single("resultsFile"), async (req, res) => {
  const stream = req.body.stream;
  const examYear = Number(req.body.examYear || 2026);

  if (!req.file || !stream) {
    return res.status(400).json({ message: "Spreadsheet and stream are required." });
  }

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    let imported = 0;

    for (const row of rows.slice(1)) {
      if (!row[0] || !row[1]) continue;

      const subject1Name = stream === "Biological Science" ? "Biology" : "Combined Mathematics";

      await pool.query(
        `INSERT INTO exam_results
         (full_name, index_number, stream,
          subject1_name, subject1_mark, subject1_grade,
          subject2_name, subject2_mark, subject2_grade,
          subject3_name, subject3_mark, subject3_grade,
          z_average, rank_number, exam_year)
         VALUES (?, ?, ?, ?, ?, ?, 'Physics', ?, ?, 'Chemistry', ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          full_name = VALUES(full_name),
          subject1_mark = VALUES(subject1_mark), subject1_grade = VALUES(subject1_grade),
          subject2_mark = VALUES(subject2_mark), subject2_grade = VALUES(subject2_grade),
          subject3_mark = VALUES(subject3_mark), subject3_grade = VALUES(subject3_grade),
          z_average = VALUES(z_average), rank_number = VALUES(rank_number)`,
        [
          row[0], String(row[1]), stream,
          subject1Name, row[2], row[3],
          row[5], row[6],
          row[8], row[9],
          row[11], row[12], examYear,
        ]
      );
      imported += 1;
    }

    fs.unlinkSync(req.file.path);
    res.json({ message: `${imported} result records imported successfully.` });
  } catch (error) {
    console.error(error);
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Unable to import the results spreadsheet." });
  }
});

export default router;
