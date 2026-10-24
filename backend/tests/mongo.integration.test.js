import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import XLSX from "xlsx";
import mongoose from "../config/db.js";
import app from "../app.js";
import { User, Announcement, PastPaper, ExamResult, ContactMessage } from "../models/index.js";
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
    return { headers: res.headers, status: res.status, data: await res.json() };
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
  await t.test("optional index login and authenticated profile editing", async () => {
    const body = { fullName: "Profile Student", email: "profile@example.test", password: "StudentTest123", indexNumber: "dw/001" };
    assert.equal((await request("/auth/register", { method: "POST", body })).status, 201);
    assert.equal((await request("/auth/register", { method: "POST", body: { ...body, email: "duplicate@example.test", indexNumber: "DW/001" } })).status, 409);
    const login = await request("/auth/login", { method: "POST", body: { identifier: " dw/001 ", password: body.password } });
    assert.equal(login.status, 200);
    assert.equal((await request("/auth/login", { method: "POST", body: { identifier: "DW/001", password: "wrong" } })).status, 401);
    const edits = { fullName: "Updated Name", email: "updated@example.test", phone: "", school: "My Other School", stream: "Biological Science", alYear: "2028", indexNumber: "00042", role: "admin", is_active: false };
    assert.equal((await request("/auth/me", { method: "PUT", body: edits })).status, 401);
    const saved = await request("/auth/me", { method: "PUT", token: login.data.token, body: edits });
    assert.equal(saved.status, 200);
    assert.equal(saved.data.role, "student");
    assert.equal(saved.data.is_active, true);
    assert.equal(saved.data.password_hash, undefined);
    assert.equal(saved.data.index_number, "00042");
    const refreshed = (await request("/auth/me", { token: login.data.token })).data;
    assert.equal(refreshed.full_name, edits.fullName);
    assert.equal(refreshed.school, edits.school);
    assert.equal((await request("/auth/login", { method: "POST", body: { identifier: "00042", password: body.password } })).status, 200);
    assert.equal((await request("/auth/login", { method: "POST", body: { email: edits.email, password: body.password } })).status, 200);
    for (const invalid of [{ indexNumber: { $ne: null } }, { indexNumber: "a@b" }, { fullName: " " }, { email: "invalid" }, { alYear: "2200" }]) {
      assert.equal((await request("/auth/me", { method: "PUT", token: login.data.token, body: { ...edits, ...invalid } })).status, 400);
    }
    assert.equal((await request("/auth/me", { method: "PUT", token: login.data.token, body: { ...edits, email: "student@example.test" } })).status, 409);
    assert.equal((await request("/auth/me", { method: "PUT", token: login.data.token, body: { ...edits, indexNumber: "", alYear: "" } })).status, 200);
    const cleared = (await request("/auth/me", { token: login.data.token })).data;
    assert.equal(cleared.index_number, undefined);
    assert.equal(cleared.al_year, undefined);
    assert.equal((await request("/auth/login", { method: "POST", body: { identifier: "00042", password: body.password } })).status, 401);
    assert.equal((await request("/auth/register", { method: "POST", body: { ...body, email: "reuse@example.test", indexNumber: "00042" } })).status, 201);
    assert.equal((await request("/auth/me", { method: "PUT", token: login.data.token, body: edits })).status, 409);
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
  await t.test("announcement editing persists and validates changes with admin permissions", async () => {
    const body = { category: "General", title: "Original", summary: "Original summary" };
    const added = await request("/admin/announcements", { method: "POST", token, body });
    assert.equal(added.status, 201);
    const route = `/admin/announcements/${added.data.id}`;
    const edited = { category: "Dreamway", title: "Updated", summary: "Updated summary", eventDate: "2026-10-31", imageUrl: "/media/updated.jpg" };
    assert.equal((await request(route, { method: "PUT", body: edited })).status, 401);
    await request("/auth/register", { method: "POST", body: { fullName: "Edit Student", email: "edit@example.test", password: "StudentTest123" } });
    const student = await request("/auth/login", { method: "POST", body: { email: "edit@example.test", password: "StudentTest123" } });
    assert.equal((await request(route, { method: "PUT", token: student.data.token, body: edited })).status, 403);
    for (const invalid of [{ title: " " }, { title: "x".repeat(201) }, { summary: "" }, { eventDate: "2026-02-30" }, { eventDate: 123 }, { imageUrl: {} }]) {
      assert.equal((await request(route, { method: "PUT", token, body: { ...edited, ...invalid } })).status, 400);
    }
    assert.equal((await Announcement.findById(added.data.id)).title, body.title);
    assert.equal((await request(route, { method: "PUT", token, body: edited })).status, 200);
    const stored = await Announcement.findById(added.data.id);
    assert.equal(stored.title, edited.title);
    assert.equal(stored.summary, edited.summary);
    assert.equal(stored.category, edited.category);
    assert.equal(stored.event_date.toISOString().slice(0, 10), edited.eventDate);
    assert.equal(stored.image_url, edited.imageUrl);
    for (const path of ["/announcements", "/admin/announcements"]) {
      const refreshed = (await request(path, { token })).data.find(item => item.id === added.data.id);
      assert.equal(refreshed.title, edited.title);
      assert.equal(refreshed.summary, edited.summary);
    }
    assert.equal((await request(route, { method: "PUT", token, body: { ...edited, eventDate: "", imageUrl: "" } })).status, 200);
    const cleared = await Announcement.findById(added.data.id);
    assert.equal(cleared.event_date, null);
    assert.equal(cleared.image_url, null);
    assert.equal((await request("/admin/announcements/invalid", { method: "PUT", token, body: edited })).status, 400);
    assert.equal((await request(route, { method: "DELETE", token })).status, 200);
    assert.equal(await Announcement.findById(added.data.id), null);
    assert.equal((await request(route, { method: "PUT", token, body: edited })).status, 404);
    assert.ok(!(await request("/announcements")).data.some(item => item.id === added.data.id));
  });
  await t.test("announcement photos upload, download, persist, replace and clean up", async () => {
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=", "base64");
    function photoForm(bytes = png) {
      const form = new FormData();
      form.append("category", "General");
      form.append("title", "Photo test");
      form.append("summary", "Photo announcement");
      form.append("photo", new Blob([bytes], { type: "image/png" }), "photo.png");
      return form;
    }
    assert.equal((await request("/admin/announcements", { method: "POST", body: photoForm() })).status, 401);
    assert.equal((await request("/admin/announcements", { method: "POST", token, body: photoForm(Buffer.from("not an image")) })).status, 400);
    assert.equal((await request("/admin/announcements", { method: "POST", token, body: photoForm(Buffer.alloc(4 * 1024 * 1024 + 1)) })).status, 400);
    const added = await request("/admin/announcements", { method: "POST", token, body: photoForm() });
    assert.equal(added.status, 201);
    const route = `/admin/announcements/${added.data.id}`;
    const first = await Announcement.findById(added.data.id);
    const download = await fetch(new URL(first.image_url, base));
    assert.equal(download.status, 200);
    assert.equal(download.headers.get("content-type"), "image/png");
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), png);
    const details = { category: "General", title: "Changed title", summary: "Updated summary" };
    assert.equal((await request(route, { method: "PUT", token, body: details })).status, 200);
    assert.equal((await Announcement.findById(first.id)).image_url, first.image_url);
    assert.equal((await request(route, { method: "PUT", token, body: photoForm(Buffer.from("invalid")) })).status, 400);
    assert.equal((await Announcement.findById(first.id)).image_url, first.image_url);
    assert.equal((await request(route, { method: "PUT", token, body: photoForm() })).status, 200);
    const replaced = await Announcement.findById(first.id);
    assert.notEqual(replaced.image_url, first.image_url);
    assert.equal((await fetch(new URL(first.image_url, base))).status, 404);
    assert.equal((await request(route, { method: "PUT", token, body: { ...details, imageUrl: "" } })).status, 200);
    assert.equal((await fetch(new URL(replaced.image_url, base))).status, 404);
    assert.equal((await Announcement.findById(first.id)).image_url, null);
    assert.equal((await request(route, { method: "PUT", token, body: photoForm() })).status, 200);
    const last = await Announcement.findById(first.id);
    assert.equal((await request(route, { method: "DELETE", token })).status, 200);
    assert.equal((await fetch(new URL(last.image_url, base))).status, 404);
    assert.equal(await mongoose.connection.collection("announcement_images.files").countDocuments(), 0);
    assert.equal(await mongoose.connection.collection("announcement_images.chunks").countDocuments(), 0);
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
    const stored = await PastPaper.findById(paper.data.id);
    const download = await fetch(new URL(stored.file_url, base));
    assert.equal(download.status, 200);
    assert.equal(download.headers.get("content-type"), "application/pdf");
    assert.ok((await download.text()).startsWith("%PDF-"));
    assert.equal((await request(`/admin/papers/${paper.data.id}`, { method: "DELETE", token })).status, 200);
    assert.equal(await PastPaper.countDocuments(), 48);
  });
  await t.test("message status requires an admin and validates updates", async () => {
    const message = await ContactMessage.findOne();
    const route = `/admin/messages/${message.id}`;
    assert.equal((await request(route, { method: "PATCH", body: { status: "read" } })).status, 401);
    assert.equal((await request(route, { method: "PATCH", token, body: { status: "unknown" } })).status, 400);
    assert.equal((await request(route, { method: "PATCH", token, body: { status: "read" } })).status, 200);
    assert.equal((await ContactMessage.findById(message.id)).status, "read");
    assert.equal((await request("/admin/summary", { token })).data.newMessages, 0);
  });
  await t.test("registration rejects short passwords and result requests are limited atomically", async () => {
    const registered = await request("/auth/register", { method: "POST", body: { fullName: "Short Password", email: "short@example.test", password: "short12" } });
    assert.equal(registered.status, 400);
    const accepted = await request("/auth/register", { method: "POST", body: { fullName: "Eight Characters", email: "eight@example.test", password: "Eight123" } });
    assert.equal(accepted.status, 201);
    await mongoose.connection.collection("request_limits").deleteMany({});
    const responses = await Promise.all(Array.from({ length: 65 }, () => request("/results")));
    assert.equal(responses.filter(response => response.status === 429).length, 5);
    assert.equal(responses.filter(response => response.status === 400).length, 60);
    assert.ok(Number(responses.find(response => response.status === 429).headers.get("retry-after")) > 0);
    const counters = await mongoose.connection.collection("request_limits").find().toArray();
    assert.equal(counters.length, 1);
    assert.equal(counters[0].count, 65);
    assert.match(counters[0]._id, /^[a-f0-9]{64}$/);
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
