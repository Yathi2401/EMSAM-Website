import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import XLSX from "xlsx";
import { Admission, AdmissionSettings, getAdmissionSettings, admissionsOpen } from "../models/admissions.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { validText, validEmail, validYear, examStreams } from "../utils/validation.js";
import { imageType } from "../utils/announcementImages.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024, files: 1, fields: 25, fieldSize: 6000 } });
const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "admission_receipts" });
const phoneValid = value => typeof value === "string" && /^[+\d][\d ()-]{6,29}$/.test(value.trim());
const receiptType = buffer => imageType(buffer) || (buffer.subarray(0, 5).toString() === "%PDF-" ? "application/pdf" : null);
const reply = entry => ({ reference: entry.reference, title: entry.title, year: entry.year, message: "Application received. Your payment is pending administrator verification." });

router.get("/admissions/settings", async (_req, res) => {
  const settings = await getAdmissionSettings();
  res.set("Cache-Control", "no-store").json({ ...settings.toJSON(), accepting: admissionsOpen(settings) });
});

router.post("/admissions", rateLimit("admission", 15), upload.single("receipt"), async (req, res, next) => {
  let receiptId;
  try {
    const body = req.body || {};
    if (typeof body.submissionKey !== "string" || !/^[a-f\d-]{36}$/i.test(body.submissionKey)) return res.status(400).json({ message: "Refresh the page and try again." });
    const existing = await Admission.findOne({ submissionKey: body.submissionKey });
    if (existing) return res.json(reply(existing));
    const settings = await getAdmissionSettings();
    if (!admissionsOpen(settings)) return res.status(409).json({ message: "Admissions are closed. Please contact EMSAM for assistance." });
    if (Number(body.year) !== settings.year) return res.status(409).json({ message: "The admission intake has changed. Reload this page before applying." });
    const version = settings.updatedAt?.toISOString() || "";
    if (body.settingsVersion !== version) return res.status(409).json({ message: "Admission details have changed. Reload this page and check the current fee and payment instructions before applying." });
    const required = { fullName: 150, district: 100, school: 180 };
    const optional = { whatsapp: 30, email: 150, centre: 180, paymentReference: 150, coordinatorName: 150 };
    if (Object.entries(required).some(([key, max]) => !validText(body[key], max)) ||
        Object.entries(optional).some(([key, max]) => !validText(body[key], max, true)) ||
        !phoneValid(body.phone) || (body.whatsapp && !phoneValid(body.whatsapp)) ||
        (body.email && !validEmail(body.email)) || !examStreams.includes(body.stream) || !validYear(body.alYear) ||
        !["bank", "coordinator"].includes(body.paymentMethod) || body.consent !== "true") {
      return res.status(400).json({ message: "Check your personal details, phone number, stream, A/L year and declaration." });
    }
    if (settings.centres.length && !settings.centres.includes(body.centre)) return res.status(400).json({ message: "Select an available examination centre." });
    if (body.paymentMethod === "bank" && (!req.file || !validText(body.paymentReference, 150))) return res.status(400).json({ message: "Enter the name used as your bank reference and upload the payment receipt." });
    if (body.paymentMethod === "coordinator" && !validText(body.coordinatorName, 150)) return res.status(400).json({ message: "Enter the coordinator you will pay or have paid." });
    if (body.paymentMethod === "coordinator" && req.file) return res.status(400).json({ message: "A receipt upload is only used for bank transfers." });
    let contentType;
    if (req.file) {
      contentType = receiptType(req.file.buffer);
      if (!contentType) return res.status(400).json({ message: "Upload a PDF, JPG, PNG or WebP receipt (up to 3 MB)." });
      const stream = bucket().openUploadStream("payment-receipt", { metadata: { contentType } });
      receiptId = stream.id;
      await new Promise((resolve, reject) => { stream.on("finish", resolve); stream.on("error", reject); stream.end(req.file.buffer); });
    }
    const latestSettings = await getAdmissionSettings();
    if (!admissionsOpen(latestSettings) || latestSettings.updatedAt?.toISOString() !== version) {
      if (receiptId) await bucket().delete(receiptId);
      return res.status(409).json({ message: "Admission settings have just changed or admissions have closed. Reload the page or contact EMSAM." });
    }
    const details = Object.fromEntries([...Object.keys(required), ...Object.keys(optional), "phone", "stream"].map(key => [key, typeof body[key] === "string" ? body[key].trim() : ""]));
    const entry = await Admission.create({ ...details, alYear: Number(body.alYear), paymentMethod: body.paymentMethod,
      paymentReference: body.paymentMethod === "bank" ? body.paymentReference.trim() : "",
      coordinatorName: body.paymentMethod === "coordinator" ? body.coordinatorName.trim() : "",
      year: settings.year, title: settings.title, fee: settings.fee, submissionKey: body.submissionKey,
      reference: `DW-${settings.year}-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`,
      receiptId, receiptType: contentType, consentAt: new Date() });
    return res.status(201).json(reply(entry));
  } catch (error) {
    if (receiptId) await bucket().delete(receiptId).catch(() => {});
    if (error.code === 11000) {
      const existing = await Admission.findOne({ submissionKey: req.body.submissionKey });
      if (existing) return res.json(reply(existing));
    }
    return next(error);
  }
});

router.use("/admin/admissions", requireAuth, requireAdmin, (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
router.get("/admin/admissions/settings", async (_req, res) => res.json(await getAdmissionSettings()));
router.put("/admin/admissions/settings", async (req, res) => {
  const b = req.body || {};
  if (!validText(b.title, 150) || !validText(b.description, 4000) || !validYear(b.year) || typeof b.isOpen !== "boolean" ||
      !Number.isFinite(b.fee) || b.fee < 0 || b.fee > 1000000 ||
      ["bankDetails", "coordinators", "instructions", "schedule"].some(key => !validText(b[key], ["instructions", "schedule"].includes(key) ? 5000 : 3000, true)) ||
      !Array.isArray(b.centres) || b.centres.length > 40 || b.centres.some(value => !validText(value, 180)) ||
      (b.deadline && (typeof b.deadline !== "string" || !Number.isFinite(Date.parse(b.deadline))))) {
    return res.status(400).json({ message: "Check the admission settings, year, fee, centres and closing date." });
  }
  if (b.isOpen && (!validText(b.bankDetails, 3000) || !validText(b.coordinators, 3000) || (b.deadline && Date.parse(b.deadline) <= Date.now()))) return res.status(400).json({ message: "Before opening, enter bank and coordinator details and a future closing date (or leave the date empty)." });
  const settings = await AdmissionSettings.findOneAndUpdate({ _id: "current" }, { $set: {
    title: b.title, description: b.description, year: Number(b.year), isOpen: b.isOpen, fee: b.fee,
    bankDetails: b.bankDetails || "", coordinators: b.coordinators || "", instructions: b.instructions || "", schedule: b.schedule || "",
    deadline: b.deadline || null, centres: [...new Set(b.centres.map(value => value.trim()))],
  } }, { upsert: true, returnDocument: "after", runValidators: true });
  res.json(settings);
});

function filters(query) {
  const filter = {};
  if (query.year && validYear(query.year)) filter.year = Number(query.year);
  if (["pending", "verified", "rejected"].includes(query.status)) filter.paymentStatus = query.status;
  if (typeof query.search === "string" && query.search.trim()) {
    const regex = new RegExp(query.search.trim().slice(0, 150).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = ["reference", "fullName", "phone", "school"].map(key => ({ [key]: regex }));
  }
  return filter;
}
router.get("/admin/admissions", async (req, res) => {
  const filter = filters(req.query);
  const page = Math.max(1, Math.min(100000, Number.parseInt(req.query.page, 10) || 1));
  const [items, total] = await Promise.all([Admission.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 20).limit(20), Admission.countDocuments(filter)]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / 20)) });
});
router.get("/admin/admissions/export", async (req, res) => {
  const filter = filters(req.query);
  if (await Admission.countDocuments(filter) > 10000) return res.status(400).json({ message: "Filter by intake year or payment status to export fewer than 10,000 applications." });
  const entries = await Admission.find(filter).sort({ createdAt: -1 }).lean();
  const columns = { reference: "Application reference", examIndex: "Examination index", title: "Intake", year: "Intake year", fullName: "Full name", district: "District", phone: "Phone", whatsapp: "WhatsApp", email: "Email", school: "School", stream: "Stream", alYear: "A/L year", centre: "Examination centre", fee: "Fee (LKR)", paymentMethod: "Payment method", paymentReference: "Bank reference name", coordinatorName: "Coordinator", paymentStatus: "Payment status", adminNotes: "Admin notes" };
  const rows = entries.map(entry => [...Object.keys(columns).map(key => entry[key] ?? ""), entry.receiptId ? "Yes" : "No", entry.createdAt.toISOString(), entry.consentAt.toISOString(), entry.reviewedAt?.toISOString() || ""]);
  const sheet = XLSX.utils.aoa_to_sheet([[...Object.values(columns), "Receipt uploaded", "Submitted (UTC)", "Declaration accepted (UTC)", "Reviewed (UTC)"], ...rows]);
  // Text cells remain strings (including phone numbers, leading zeroes and formula-like input).
  sheet["!cols"] = Array.from({ length: Object.keys(columns).length + 4 }, () => ({ wch: 24 }));
  sheet["!autofilter"] = { ref: sheet["!ref"] };
  const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, "Admissions");
  res.set({ "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="EMSAM-admissions.xlsx"' });
  res.send(XLSX.write(book, { type: "buffer", bookType: "xlsx", compression: true }));
});
router.patch("/admin/admissions/:id", async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: "Invalid application." });
  if (!["pending", "verified", "rejected"].includes(req.body?.paymentStatus) || !validText(req.body.adminNotes, 2000, true) || (req.body.examIndex && (typeof req.body.examIndex !== "string" || !/^[A-Za-z0-9/-]{1,30}$/.test(req.body.examIndex)))) return res.status(400).json({ message: "Check the payment status, examination index and notes (up to 2,000 characters)." });
  const update = { $set: { paymentStatus: req.body.paymentStatus, adminNotes: req.body.adminNotes || "", reviewedBy: req.user._id, reviewedAt: new Date() } };
  if (req.body.examIndex) update.$set.examIndex = req.body.examIndex.toUpperCase();
  else update.$unset = { examIndex: 1 };
  let entry;
  try { entry = await Admission.findByIdAndUpdate(req.params.id, update, { returnDocument: "after", runValidators: true }); }
  catch (error) { if (error.code === 11000) return res.status(409).json({ message: "That examination index is already assigned in this intake year." }); throw error; }
  if (!entry) return res.status(404).json({ message: "Application not found." });
  res.json(entry);
});
router.get("/admin/admissions/:id/receipt", async (req, res, next) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: "Invalid application." });
  const entry = await Admission.findById(req.params.id);
  if (!entry?.receiptId) return res.status(404).json({ message: "No receipt is attached to this application." });
  const file = await bucket().find({ _id: entry.receiptId }).next();
  if (!file) return res.status(404).json({ message: "Receipt not found." });
  const extension = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[entry.receiptType] || "bin";
  res.set({ "Content-Type": entry.receiptType || "application/octet-stream", "X-Content-Type-Options": "nosniff", "Content-Disposition": `attachment; filename="${entry.reference}-receipt.${extension}"` });
  bucket().openDownloadStream(entry.receiptId).on("error", next).pipe(res);
});
export default router;
