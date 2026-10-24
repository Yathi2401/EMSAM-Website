import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import XLSX from "xlsx";
import mongoose from "../config/db.js";
import app from "../app.js";
import { User, initializeModels } from "../models/index.js";
import { Admission, AdmissionSettings } from "../models/admissions.js";
import { defaultAdmissionFields } from "../../shared/admissionForm.js";
import { validateFormDesign, validateCustomAnswers, validNic } from "../utils/admissionForm.js";

test("form design validates required fields, choices and typed answers", () => {
  for (const value of ["200012345678", "001234567v", "123456789X"]) assert.equal(validNic(value), true);
  for (const value of ["", "123", "123456789A", "20001234567", { $ne: null }]) assert.equal(validNic(value), false);
  const fields = defaultAdmissionFields();
  assert.throws(() => validateFormDesign(fields.filter(field => field.id !== "nic")));
  assert.throws(() => validateFormDesign(fields.map(field => field.id === "nic" ? { ...field, required: false } : field)));
  assert.throws(() => validateFormDesign(fields.map(field => field.id === "nic" ? { ...field, visible: false } : field)));
  assert.throws(() => validateFormDesign([...fields, fields[0]]));
  const custom = { id: `custom_${randomUUID()}`, type: "select", label: "Session", required: true, visible: true, width: "half", help: "", placeholder: "", options: ["Morning", "Evening"] };
  const design = validateFormDesign([...fields, custom]);
  assert.throws(() => validateCustomAnswers("{}", design, []));
  assert.throws(() => validateCustomAnswers(JSON.stringify({ [custom.id]: "Unknown" }), design, []));
  assert.throws(() => validateCustomAnswers('{"__proto__":"value"}', design, []));
  assert.throws(() => validateCustomAnswers("[]", design, []));
  assert.throws(() => validateFormDesign([...fields, { ...custom, options: ["Same", " Same "] }]));
  for (const [type, invalid, valid] of [["date", "2027-02-30", "2027-02-28"], ["number", "Infinity", "12.5"], ["checkbox", "false", "true"]]) {
    const config = [{ ...custom, type }];
    assert.throws(() => validateCustomAnswers(JSON.stringify({ [custom.id]: invalid }), config, []));
    assert.equal(validateCustomAnswers(JSON.stringify({ [custom.id]: valid }), config, []).length, 1);
  }
});

test("NIC and designed forms persist privately, preserve history and export to Excel", { timeout: 180000 }, async t => {
  process.env.JWT_SECRET = "form-designer-integration-only";
  const mongo = await MongoMemoryServer.create({ binary: { version: "7.0.14" } });
  t.after(async () => { await mongoose.disconnect(); await mongo.stop(); });
  await mongoose.connect(mongo.getUri("form_test")); await initializeModels();
  const admin = await User.create({ full_name: "Admin", email: "form-admin@example.test", role: "admin", password_hash: "unused" });
  const student = await User.create({ full_name: "Student", email: "form-student@example.test", role: "student", password_hash: "unused" });
  const auth = jwt.sign({ id: admin.id }, process.env.JWT_SECRET);
  const studentAuth = jwt.sign({ id: student.id }, process.env.JWT_SECRET);
  const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function request(path, { method = "GET", body, token } = {}) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
    const response = await fetch(base + path, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
    return { status: response.status, data: await response.json() };
  }
  const customId = `custom_${randomUUID()}`;
  const custom = { id: customId, label: "Preferred session", type: "select", required: true, visible: true, width: "half", options: ["Morning", "Evening"], help: "Select one", placeholder: "" };
  const fields = [...defaultAdmissionFields(), custom];
  const body = { version: "", formHeading: "Application details", formIntro: "Complete all required fields.", formFields: fields };
  assert.equal((await request("/admin/admissions/form", { method: "PUT", body })).status, 401);
  assert.equal((await request("/admin/admissions/form", { method: "PUT", body, token: studentAuth })).status, 403);
  let saved = await request("/admin/admissions/form", { method: "PUT", body, token: auth });
  assert.equal(saved.status, 200); assert.equal(saved.data.isOpen, false);
  assert.equal((await request("/admissions/settings")).data.formFields.at(-1).label, "Preferred session");
  assert.equal((await request("/admin/admissions/form", { method: "PUT", body, token: auth })).status, 409);
  const opened = await request("/admin/admissions/settings", { method: "PUT", body: { ...saved.data, isOpen: true, bankDetails: "Test bank", coordinators: "Test coordinator" }, token: auth });
  assert.equal(opened.status, 200); let settings = opened.data;
  function form(overrides = {}) {
    const result = new FormData();
    const values = { submissionKey: randomUUID(), year: settings.year, settingsVersion: settings.updatedAt, fullName: "TEST APPLICANT", nic: "001234567v", district: "Mullaitivu", phone: "0771234567", school: "Test school", stream: "Physical Science", alYear: "2027", centre: settings.centres[0], paymentMethod: "coordinator", coordinatorName: "Test coordinator", consent: "true", customAnswers: JSON.stringify({ [customId]: "Morning" }), ...overrides };
    for (const [key, value] of Object.entries(values)) result.append(key, value);
    return result;
  }
  for (const nic of ["", "invalid", "1234567890123"]) assert.equal((await request("/admissions", { method: "POST", body: form({ nic }) })).status, 400);
  assert.equal((await request("/admissions", { method: "POST", body: form({ customAnswers: "{}" }) })).status, 400);
  const added = await request("/admissions", { method: "POST", body: form() });
  assert.equal(added.status, 201); assert.equal(added.data.nic, undefined); assert.equal(added.data.customAnswers, undefined);
  const entry = await Admission.findOne({ reference: added.data.reference });
  assert.equal(entry.nic, "001234567V"); assert.equal(entry.customAnswers[0].value, "Morning");
  assert.equal((await request("/admin/admissions", { token: studentAuth })).status, 403);
  const list = await request("/admin/admissions", { token: auth });
  assert.equal(list.data.items[0].nic, "001234567V");
  const changedFields = fields.map(field => field.id === customId ? { ...field, label: "New session label" } : field);
  saved = await request("/admin/admissions/form", { method: "PUT", body: { ...body, version: settings.updatedAt, formFields: changedFields }, token: auth });
  assert.equal(saved.status, 200); assert.equal(saved.data.isOpen, true);
  assert.equal((await request("/admissions", { method: "POST", body: form() })).status, 409);
  settings = saved.data;
  assert.equal((await request("/admissions", { method: "POST", body: form({ nic: "200012345678" }) })).status, 201);
  assert.equal((await Admission.findById(entry.id)).customAnswers[0].label, "Preferred session");
  // Removing a field from future forms preserves its previous answers and export column.
  const removed = await request("/admin/admissions/form", { method: "PUT", body: { ...body, version: settings.updatedAt, formFields: defaultAdmissionFields() }, token: auth });
  assert.equal(removed.status, 200);
  const exported = await fetch(base + "/admin/admissions/export", { headers: { Authorization: `Bearer ${auth}` } });
  const book = XLSX.read(Buffer.from(await exported.arrayBuffer()), { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json(book.Sheets.Admissions);
  const old = rows.find(row => row["Application reference"] === entry.reference);
  assert.equal(old["NIC number"], "001234567V");
  assert.equal(Object.entries(old).find(([key]) => key.endsWith("Preferred session"))[1], "Morning");
  // Pre-feature applications can still be reviewed without fabricating a NIC.
  const legacy = await Admission.create({ reference: "LEGACY-TEST", submissionKey: randomUUID(), year: 2026, title: "Legacy", fee: 250, fullName: "Legacy applicant", district: "Mullaitivu", phone: "0771234567", school: "Test", stream: "Physical Science", alYear: 2026, paymentMethod: "coordinator", consentAt: new Date() });
  assert.equal((await request(`/admin/admissions/${legacy.id}`, { method: "PATCH", body: { paymentStatus: "verified", adminNotes: "Legacy record", examIndex: "" }, token: auth })).status, 200);
  assert.equal((await Admission.findById(legacy.id)).nic, undefined);
  assert.equal((await AdmissionSettings.findById("current")).isOpen, true);
});
