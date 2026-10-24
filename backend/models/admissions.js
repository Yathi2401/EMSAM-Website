import mongoose from "mongoose";

const options = { timestamps: true, toJSON: { transform(_doc, value) {
  value.id = String(value._id); delete value._id; delete value.__v; delete value.submissionKey; return value;
} } };
const text = (max, required = false) => ({ type: String, trim: true, maxlength: max, required });
export const AdmissionSettings = mongoose.model("AdmissionSettings", new mongoose.Schema({
  _id: { type: String, default: "current" },
  title: { ...text(150), default: "Dreamway Examination Admission" },
  year: { type: Number, default: 2027, min: 2000, max: 2100 },
  isOpen: { type: Boolean, default: false },
  description: { ...text(4000), default: "Apply for the Dreamway practice examination. Complete your details and select your payment method." },
  deadline: { type: Date, default: null },
  fee: { type: Number, default: 250, min: 0, max: 1000000 },
  bankDetails: { ...text(3000), default: "" },
  coordinators: { ...text(3000), default: "" },
  instructions: { ...text(5000), default: "Use your full name as the bank transfer reference. Keep your application reference for enquiries." },
  schedule: { ...text(5000), default: "" },
  centres: { type: [String], default: ["Mu/Puthukkudiyiruppu Central College", "Mu/Vidyananda College", "Mu/Mullaitivu Maha Vidyalayam", "Mu/Udaiyarkaddu Maha Vidyalayam", "Mu/Visuvamadu Maha Vidyalayam", "Mu/Mallavi Central College", "Mu/Oddusuddan Maha Vidyalayam", "Mu/Mankulam Maha Vidyalayam", "Mu/Kumulamunai Maha Vidyalayam"] },
}, options), "admission_settings");

export const Admission = mongoose.model("Admission", new mongoose.Schema({
  reference: { ...text(40, true), unique: true },
  submissionKey: { ...text(80, true), unique: true, select: false },
  year: { type: Number, required: true }, title: text(150, true), fee: { type: Number, required: true },
  fullName: text(150, true), district: text(100, true),
  phone: text(30, true), whatsapp: text(30), email: text(150),
  school: text(180, true), stream: { type: String, enum: ["Physical Science", "Biological Science"], required: true },
  alYear: { type: Number, required: true }, centre: text(180),
  examIndex: text(30),
  paymentMethod: { type: String, enum: ["bank", "coordinator"], required: true },
  paymentReference: text(150), coordinatorName: text(150),
  receiptId: { type: mongoose.Schema.Types.ObjectId, default: null },
  receiptType: text(80),
  paymentStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
  adminNotes: { ...text(2000), default: "" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  reviewedAt: { type: Date, default: null },
  consentAt: { type: Date, required: true },
}, options), "admissions");
Admission.schema.index({ year: 1, examIndex: 1 }, { unique: true, partialFilterExpression: { examIndex: { $type: "string" } } });

export async function getAdmissionSettings() {
  return (await AdmissionSettings.findById("current")) || new AdmissionSettings();
}
export function admissionsOpen(settings) {
  return settings.isOpen && (!settings.deadline || new Date(settings.deadline).getTime() > Date.now());
}
