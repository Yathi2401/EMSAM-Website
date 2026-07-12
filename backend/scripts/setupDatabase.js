import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");

const databaseName = process.env.DB_NAME || "emsam_db";

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true,
});

try {
  console.log(`Creating database '${databaseName}' if required...`);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${databaseName}\``);

  const schemaSql = fs.readFileSync(path.join(backendRoot, "database", "schema.sql"), "utf8");
  await connection.query(schemaSql);

  const adminEmail = process.env.ADMIN_EMAIL || "admin@emsam.lk";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const studentHash = await bcrypt.hash("Student@123", 10);

  await connection.query(
    `INSERT INTO users (full_name, email, phone, school, stream, al_year, password_hash, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), role = 'admin'`,
    ["EMSAM Administrator", adminEmail, "", "EMSAM", "Other", 2026, adminHash]
  );

  await connection.query(
    `INSERT INTO users (full_name, email, phone, school, stream, al_year, password_hash, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'student')
     ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash)`,
    ["Demo Student", "student@emsam.lk", "0700000000", "Demo School", "Physical Science", 2026, studentHash]
  );

  const announcements = [
    {
      category: "Dreamway",
      title: "Dreamway 2026 Results Published",
      summary: "The final results for the 2026 Dreamway Physical Science and Biological Science examinations are now available through the result search page.",
      eventDate: "2026-06-12",
      imageUrl: "/media/dreamway-results-2026.jpg",
    },
    {
      category: "Pathfinder",
      title: "Pathfinder 2.0 Career Guidance Programme",
      summary: "EMSAM successfully conducted Pathfinder 2.0 to guide A/L students on university courses, application preferences and career pathways.",
      eventDate: "2026-05-01",
      imageUrl: "/media/pathfinder-poster-1.jpg",
    },
    {
      category: "Resources",
      title: "Dreamway Past Papers 2023–2026 Available",
      summary: "Students can now search and download Dreamway question papers and marking schemes for Biology, Chemistry, Physics and Combined Mathematics.",
      eventDate: "2026-07-10",
      imageUrl: "/media/5-years-celebration.jpg",
    },
  ];

  for (const item of announcements) {
    const [existing] = await connection.query("SELECT id FROM announcements WHERE title = ?", [item.title]);
    if (existing.length === 0) {
      await connection.query(
        `INSERT INTO announcements (category, title, summary, event_date, image_url)
         VALUES (?, ?, ?, ?, ?)`,
        [item.category, item.title, item.summary, item.eventDate, item.imageUrl]
      );
    }
  }

  const papers = JSON.parse(fs.readFileSync(path.join(backendRoot, "data", "papers.json"), "utf8"));
  for (const paper of papers) {
    await connection.query(
      `INSERT INTO past_papers
       (title, subject, stream, exam_year, paper_type, file_name, file_url, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         title = VALUES(title), subject = VALUES(subject), stream = VALUES(stream),
         exam_year = VALUES(exam_year), paper_type = VALUES(paper_type),
         file_url = VALUES(file_url), is_published = VALUES(is_published)`,
      [paper.title, paper.subject, paper.stream, paper.year, paper.paper_type, paper.file_name, paper.file_url, paper.is_published]
    );
  }

  const results = JSON.parse(fs.readFileSync(path.join(backendRoot, "data", "results-2026.json"), "utf8"));
  for (const result of results) {
    await connection.query(
      `INSERT INTO exam_results
       (full_name, index_number, stream,
        subject1_name, subject1_mark, subject1_grade,
        subject2_name, subject2_mark, subject2_grade,
        subject3_name, subject3_mark, subject3_grade,
        z_average, rank_number, exam_year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        subject1_mark = VALUES(subject1_mark), subject1_grade = VALUES(subject1_grade),
        subject2_mark = VALUES(subject2_mark), subject2_grade = VALUES(subject2_grade),
        subject3_mark = VALUES(subject3_mark), subject3_grade = VALUES(subject3_grade),
        z_average = VALUES(z_average), rank_number = VALUES(rank_number)`,
      [
        result.full_name,
        result.index_number,
        result.stream,
        result.subject1_name,
        result.subject1_mark,
        result.subject1_grade,
        result.subject2_name,
        result.subject2_mark,
        result.subject2_grade,
        result.subject3_name,
        result.subject3_mark,
        result.subject3_grade,
        result.z_average === "_" ? null : result.z_average,
        result.rank === "_" ? null : result.rank,
        result.exam_year,
      ]
    );
  }

  console.log("Database setup completed successfully.");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log("Demo student: student@emsam.lk / Student@123");
  console.log(`Seeded ${papers.length} past papers and ${results.length} result records.`);
} catch (error) {
  console.error("Database setup failed:", error.message);
  process.exitCode = 1;
} finally {
  await connection.end();
}
