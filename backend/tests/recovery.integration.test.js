import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "../config/db.js";
import app from "../app.js";
import { User, initializeModels } from "../models/index.js";
import { Admission } from "../models/admissions.js";
import { resetMailer } from "../utils/resetEmail.js";
import { removeExpiredReceipts, receiptCutoff } from "../utils/receiptRetention.js";

test("password recovery and receipt retention", { timeout: 180000 }, async (t) => {
  process.env.JWT_SECRET = "recovery-test-secret";
  process.env.FRONTEND_URL = "https://emsam.example.test";
  process.env.CRON_SECRET = "cron-test-secret";
  const mongo = await MongoMemoryServer.create({ binary: { version: "7.0.14" } });
  t.after(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });
  await mongoose.connect(mongo.getUri("recovery_test"));
  await initializeModels();
  const mailbox = [];
  const original = { ...resetMailer };
  resetMailer.configured = () => true;
  resetMailer.send = async (to, url) => mailbox.push({ to, url });
  t.after(() => Object.assign(resetMailer, original));
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function request(path, body, token) {
    const response = await fetch(base + path, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, data: await response.json() };
  }
  const user = await User.create({
    full_name: "Recovery Test",
    email: "recovery@example.test",
    password_hash: await bcrypt.hash("OriginalPassword123", 10),
  });
  const login = await request("/auth/login", {
    email: user.email,
    password: "OriginalPassword123",
  });
  await t.test("generic replies, hashed expiring tokens and email cooldown", async () => {
    const known = await request("/auth/forgot-password", { email: user.email });
    const unknown = await request("/auth/forgot-password", { email: "unknown@example.test" });
    assert.equal(known.status, 200);
    assert.deepEqual(known, unknown);
    await request("/auth/forgot-password", { email: user.email });
    assert.equal(mailbox.length, 1);
    const token = new URL(mailbox[0].url).hash.slice(7);
    assert.equal(new URL(mailbox[0].url).origin, "https://emsam.example.test");
    const stored = await User.findById(user.id).select("+reset_hash +reset_expires");
    assert.equal(stored.reset_hash, createHash("sha256").update(token).digest("hex"));
    assert.notEqual(stored.reset_hash, token);
    assert.ok(stored.reset_expires > new Date());
    const profile = await request("/auth/me", null, login.data.token);
    for (const key of [
      "reset_hash",
      "reset_expires",
      "reset_requested",
      "session_version",
      "password_hash",
    ])
      assert.equal(profile.data[key], undefined);
  });
  await t.test("one-time reset rejects weak passwords and revokes old sessions", async () => {
    const token = new URL(mailbox[0].url).hash.slice(7);
    assert.equal((await request("/auth/reset-password", { token, password: "short" })).status, 400);
    const results = await Promise.all(
      [1, 2].map(() => request("/auth/reset-password", { token, password: "NewPassword123" })),
    );
    assert.deepEqual(results.map((result) => result.status).sort(), [200, 400]);
    assert.equal((await request("/auth/me", null, login.data.token)).status, 401);
    assert.equal(
      (await request("/auth/login", { email: user.email, password: "OriginalPassword123" })).status,
      401,
    );
    const next = await request("/auth/login", { email: user.email, password: "NewPassword123" });
    assert.equal(next.status, 200);
    assert.equal((await request("/auth/me", null, next.data.token)).status, 200);
  });
  await t.test("expired tokens and unconfigured mail fail safely", async () => {
    await request("/auth/forgot-password", { email: user.email });
    const token = new URL(mailbox.at(-1).url).hash.slice(7);
    await User.updateOne({ _id: user._id }, { reset_expires: new Date(0) });
    assert.equal(
      (await request("/auth/reset-password", { token, password: "AnotherPassword123" })).status,
      400,
    );
    resetMailer.configured = () => false;
    assert.equal((await request("/auth/forgot-password", { email: user.email })).status, 503);
    assert.equal((await request("/auth/forgot-password", { email: user.email })).status, 429);
  });
  await t.test(
    "retention deletes old receipt files but preserves applications and recent files",
    async () => {
      const now = new Date("2026-10-25T12:00:00Z");
      assert.equal(receiptCutoff(now).toISOString(), "2025-10-25T12:00:00.000Z");
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: "admission_receipts",
      });
      async function entry(reference, createdAt) {
        const stream = bucket.openUploadStream("test-receipt");
        await new Promise((resolve, reject) => {
          stream.on("finish", resolve);
          stream.on("error", reject);
          stream.end(Buffer.from("test-only"));
        });
        return Admission.create({
          reference,
          submissionKey: reference,
          year: 2025,
          title: "Test intake",
          fee: 250,
          fullName: "Test applicant",
          district: "Test",
          phone: "0771234567",
          school: "Test",
          stream: "Physical Science",
          alYear: 2025,
          paymentMethod: "bank",
          consentAt: createdAt,
          createdAt,
          receiptId: stream.id,
          receiptType: "application/pdf",
        });
      }
      const old = await entry("OLD", new Date("2025-10-24T12:00:00Z"));
      const recent = await entry("RECENT", new Date("2026-10-24T12:00:00Z"));
      assert.equal((await request("/internal/receipt-retention")).status, 401);
      assert.equal((await request("/internal/receipt-retention", null, "wrong")).status, 401);
      assert.equal((await bucket.find({ _id: old.receiptId }).toArray()).length, 1);
      assert.deepEqual(await removeExpiredReceipts({ now }), { removed: 1, remaining: 0 });
      assert.equal(await Admission.countDocuments(), 2);
      assert.equal((await Admission.findById(old._id)).receiptId, null);
      assert.equal((await Admission.findById(old._id)).fullName, "Test applicant");
      assert.equal((await bucket.find({ _id: old.receiptId }).toArray()).length, 0);
      assert.equal((await bucket.find({ _id: recent.receiptId }).toArray()).length, 1);
      assert.deepEqual(await removeExpiredReceipts({ now }), { removed: 0, remaining: 0 });
    },
  );
});
