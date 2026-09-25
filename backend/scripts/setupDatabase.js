import bcrypt from "bcryptjs";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import mongoose, { connectDatabase } from "../config/db.js";
import { User, Announcement, PastPaper, ExamResult, initializeModels } from "../models/index.js";

const readData = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), "utf8"));
const missingNumber = value => value == null || value === "_" ? null : Number(value);

export async function seedDatabase() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword === "Admin@123" || adminPassword.length < 8 || Buffer.byteLength(adminPassword) > 72) {
    throw new Error("Set ADMIN_PASSWORD to a unique password of at least 8 characters and at most 72 UTF-8 bytes.");
  }
  await initializeModels();
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@emsam.lk").trim().toLowerCase();
  // Re-running setup never resets an existing user's password or role.
  await User.updateOne({ email: adminEmail }, { $setOnInsert: {
    full_name: "EMSAM Administrator", email: adminEmail, school: "EMSAM", stream: "Other",
    al_year: 2026, password_hash: await bcrypt.hash(adminPassword, 10), role: "admin",
  } }, { upsert: true, runValidators: true });

  const announcements = [
    { category: "Dreamway", title: "Dreamway 2026 Results Published", summary: "The final results for the 2026 Dreamway Physical Science and Biological Science examinations are now available through the result search page.", event_date: "2026-06-12", image_url: "/media/dreamway-results-2026.jpg" },
    { category: "Pathfinder", title: "Pathfinder 2.0 Career Guidance Programme", summary: "EMSAM successfully conducted Pathfinder 2.0 to guide A/L students on university courses, application preferences and career pathways.", event_date: "2026-05-01", image_url: "/media/pathfinder-poster-1.jpg" },
    { category: "Resources", title: "Dreamway Past Papers 2023–2026 Available", summary: "Students can now search and download Dreamway question papers and marking schemes for Biology, Chemistry, Physics and Combined Mathematics.", event_date: "2026-07-10", image_url: "/media/5-years-celebration.jpg" },
  ];
  for (const item of announcements) {
    await Announcement.updateOne({ title: item.title }, { $setOnInsert: item }, { upsert: true, runValidators: true });
  }
  const papers = readData("papers.json");
  for (const paper of papers) {
    await PastPaper.updateOne({ file_name: paper.file_name }, { $setOnInsert: {
      title: paper.title, subject: paper.subject, stream: paper.stream, exam_year: paper.year,
      paper_type: paper.paper_type, file_name: paper.file_name, file_url: paper.file_url, is_published: Boolean(paper.is_published),
    } }, { upsert: true, runValidators: true });
  }
  const results = readData("results-2026.json");
  for (const result of results) {
    const { rank, ...fields } = result;
    const record = { ...fields, index_number: String(result.index_number),
      z_average: missingNumber(result.z_average), rank_number: missingNumber(rank) };
    await ExamResult.updateOne(
      { index_number: record.index_number, stream: record.stream, exam_year: record.exam_year },
      { $setOnInsert: record }, { upsert: true, runValidators: true }
    );
  }
  return { papers: papers.length, results: results.length, adminEmail };
}

// Keep the seed function importable by integration tests without running setup.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await connectDatabase();
    const seeded = await seedDatabase();
    console.log(`MongoDB setup complete: ${seeded.papers} papers and ${seeded.results} results checked.`);
    console.log(`Administrator: ${seeded.adminEmail}. Existing accounts and records were preserved.`);
  } catch (error) {
    console.error("MongoDB setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
