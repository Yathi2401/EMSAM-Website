import mongoose from "mongoose";
import { examStreams } from "../utils/validation.js";

function schema(fields) {
  return new mongoose.Schema(fields, {
    autoCreate: false,
    autoIndex: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { transform(_doc, value) {
      value.id = value._id.toString();
      delete value._id;
      delete value.__v;
      delete value.password_hash;
      return value;
    } },
  });
}
const text = (maxlength, required = false) => ({ type: String, trim: true, maxlength, required });
const year = { type: Number, min: 2000, max: 2100, validate: Number.isInteger };
const mark = { type: Number, min: 0, max: 100, default: null };

export const User = mongoose.model("User", schema({
  full_name: text(150, true),
  email: { ...text(150, true), lowercase: true, unique: true },
  phone: text(30), school: text(180),
  stream: { type: String, enum: [...examStreams, "Other"], default: "Other" },
  al_year: year,
  password_hash: { type: String, required: true, select: false },
  role: { type: String, enum: ["student", "admin"], default: "student" },
  is_active: { type: Boolean, default: true },
}), "users");

export const Announcement = mongoose.model("Announcement", schema({
  category: text(80, true), title: text(200, true), summary: text(10000, true),
  event_date: { type: Date, default: null }, image_url: text(500),
  is_published: { type: Boolean, default: true },
}), "announcements");

export const PastPaper = mongoose.model("PastPaper", schema({
  title: text(255, true), subject: text(100, true),
  stream: { type: String, enum: [...examStreams, "Both"], required: true },
  exam_year: { ...year, required: true }, paper_type: text(100, true),
  file_name: { ...text(255, true), unique: true }, file_url: text(600, true),
  is_published: { type: Boolean, default: true },
}), "past_papers");

const resultSchema = schema({
  full_name: text(180, true), index_number: text(30, true),
  stream: { type: String, enum: examStreams, required: true },
  subject1_name: text(100), subject1_mark: mark, subject1_grade: text(5),
  subject2_name: text(100), subject2_mark: mark, subject2_grade: text(5),
  subject3_name: text(100), subject3_mark: mark, subject3_grade: text(5),
  z_average: { type: Number, default: null },
  rank_number: { type: Number, min: 1, default: null, validate: value => value == null || Number.isInteger(value) },
  exam_year: { ...year, required: true },
});
resultSchema.index({ index_number: 1, stream: 1, exam_year: 1 }, { unique: true });
export const ExamResult = mongoose.model("ExamResult", resultSchema, "exam_results");

export const ContactMessage = mongoose.model("ContactMessage", schema({
  full_name: text(150, true), email: { ...text(150, true), lowercase: true },
  subject: text(200, true), message: text(10000, true),
  status: { type: String, enum: ["new", "read", "replied"], default: "new" },
}), "contact_messages");

export async function initializeModels() {
  // Create collections and indexes only after connectDatabase() has completed.
  await Promise.all([User, Announcement, PastPaper, ExamResult, ContactMessage].map(async model => {
    await model.createCollection();
    await model.createIndexes();
  }));
}
