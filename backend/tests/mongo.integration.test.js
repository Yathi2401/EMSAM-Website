import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import XLSX from "xlsx";
import mongoose from "../config/db.js";
import app from "../app.js";
import { User, PastPaper, ExamResult, ContactMessage } from "../models/index.js";
import { seedDatabase } from "../scripts/setupDatabase.js";

test("MongoDB API, seeding and transactional imports", { timeout: 1200000 }, async (t) => {
  process.env.JWT_SECRET = "integration-test-only-secret";
  process.env.ADMIN_EMAIL = "admin@example.test";
  process.env.ADMIN_PASSWORD = "IntegrationTestPassword123";
  const mongo = await MongoMemoryReplSet.create({ binary: { version: process.env.MONGOMS_VERSION || "7.0.14" }, replSet: { count: 1 } });
  t.after(async () => { await mongoose.disconnect(); await mongo.stop(); });
  await mongoose.connect(mongo.getUri("emsam_test"));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function request(path, { method = "GET", body, token } = {}) {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
    const res = await fetch(base + path, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
    return { status: res.status, data: await res.json() };
  }
  let token;
  await t.test("seeds all source records and preserves existing accounts on rerun", async () => {
    await seedDatabase();
    const admin = await User.findOne({ email: process.env.ADMIN_EMAIL }).select("+password_hash");
    await seedDatabase();
    assert.equal((await User.findById(admin.id).select("+password_hash")).password_hash, admin.password_hash);
    assert.equal(await PastPaper.countDocuments(), 48);
    assert.equal(await ExamResult.countDocuments(), 287);
    const login = await request("/auth/login", { method: "POST", body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } });
    assert.equal(login.status, 200);
    token = login.data.token;
    assert.match(login.data.user.id, /^[a-f0-9]{24}$/);
  });
  await t.test("registration, duplicate emails, role checks and disabled sessions", async () => {
    const body = { fullName: "Test Student", email: "student@example.test", password: "StudentTest123", stream: "Physical Science" };
    const registered = await request("/auth/register", { method: "POST", body });
    assert.equal(registered.status, 201);
    assert.equal((await request("/auth/register", { method: "POST", body })).status, 409);
    const login = await request("/auth/login", { method: "POST", body });
    assert.equal(login.status, 200);
    const profile = await request("/auth/me", { token: login.data.token });
    assert.equal(profile.status, 200);
    assert.equal(profile.data.password_hash, undefined);
    assert.equal((await request("/admin/users", { token: login.data.token })).status, 403);
    await User.updateOne({ _id: registered.data.userId }, { $set: { is_active: false } });
    assert.equal((await request("/auth/me", { token: login.data.token })).status, 401);
    assert.equal((await request("/auth/register", { method: "POST", body: { ...body, email: { $ne: null } } })).status, 400);
  });
  await t.test("public search, results, contact messages and admin summary", async () => {
    const papers = await request("/papers?stream=Physical+Science&year=2026");
    assert.equal(papers.status, 200);
    assert.ok(papers.data.length > 0);
    assert.ok(papers.data.every(p => p.exam_year === 2026 && ["Physical Science", "Both"].includes(p.stream) && p.id));
    assert.deepEqual((await request("/papers?search=%5Bimpossible%5D")).data, []);
    const sample = await ExamResult.findOne();
    const query = new URLSearchParams({ indexNumber: sample.index_number, stream: sample.stream, year: sample.exam_year });
    const result = await request(`/results?${query}`);
    assert.equal(result.status, 200);
    assert.equal(result.data.index_number, sample.index_number);
    const contact = await request("/contact", { method: "POST", body: { fullName: "Test", email: "test@example.test", subject: "Test", message: "Test message" } });
    assert.equal(contact.status, 201);
    assert.equal(await ContactMessage.countDocuments(), 1);
    assert.equal((await request("/admin/summary", { token })).data.results, 287);
    const users = await request("/admin/users", { token });
    assert.ok(users.data.every(user => !user.password_hash));
  });
  await t.test("admin announcement and PDF create/delete uses ObjectIds", async () => {
    const added = await request("/admin/announcements", { method: "POST", token, body: { category: "General", title: "Integration test", summary: "Test announcement" } });
    assert.equal(added.status, 201);
    assert.ok((await request("/announcements")).data.some(a => a.id === added.data.id));
    assert.equal((await request(`/admin/announcements/${added.data.id}`, { method: "DELETE", token })).status, 200);
    assert.equal((await request("/admin/announcements/invalid", { method: "DELETE", token })).status, 400);
    const form = new FormData();
    for (const [key, value] of Object.entries({ title: "Test PDF", subject: "Physics", stream: "Both", year: "2026", paperType: "Paper I" })) form.append(key, value);
    form.append("paper", new Blob(["%PDF-1.4\nTest fixture"], { type: "application/pdf" }), "integration-test.pdf");
    const paper = await request("/admin/papers", { method: "POST", token, body: form });
    assert.equal(paper.status, 201);
    assert.equal((await request(`/admin/papers/${paper.data.id}`, { method: "DELETE", token })).status, 200);
    assert.equal(await PastPaper.countDocuments(), 48);
  });
  function importForm(bytes, stream) {
    const form = new FormData();
    form.append("resultsFile", new Blob([bytes]), "results.xlsx");
    form.append("stream", stream);
    form.append("examYear", "2026");
    return form;
  }
  await t.test("both original Excel files import without changing their bytes", async () => {
    const folder = new URL("../data/source-results/", import.meta.url);
    for (const filename of fs.readdirSync(folder)) {
      const file = new URL(filename, folder);
      const bytes = fs.readFileSync(file);
      const before = createHash("sha256").update(bytes).digest("hex");
      const stream = filename.startsWith("Biological") ? "Biological Science" : "Physical Science";
      const response = await request("/admin/results/import", { method: "POST", token, body: importForm(bytes, stream) });
      assert.equal(response.status, 200, response.data.message);
      assert.equal(createHash("sha256").update(fs.readFileSync(file)).digest("hex"), before);
    }
    assert.equal(await ExamResult.countDocuments(), 287);
    assert.equal(await ExamResult.countDocuments({ z_average: null }), 173);
  });
  await t.test("a database failure rolls back every imported row", async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ["NAME", "INDEX", "BIO", "GRADE", "Z", "PHY", "GRADE", "Z", "CHE", "GRADE", "Z", "Z.Average", "Rank"],
      ["Test One", "test-1", 50, "C", null, 50, "C", null, 50, "C", null, 0, 1],
      ["Test Two", "test-2", 50, "C", null, 50, "C", null, 50, "C", null, 0, 2],
    ]), "Results");
    const original = ExamResult.findOneAndUpdate;
    let calls = 0;
    ExamResult.findOneAndUpdate = function (...args) {
      if (++calls === 2) throw new Error("Simulated database failure");
      return original.apply(this, args);
    };
    try {
      const response = await request("/admin/results/import", { method: "POST", token, body: importForm(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }), "Biological Science") });
      assert.equal(response.status, 500);
      assert.equal(await ExamResult.countDocuments({ index_number: { $in: ["test-1", "test-2"] } }), 0);
    } finally { ExamResult.findOneAndUpdate = original; }
  });
});
