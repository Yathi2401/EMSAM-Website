import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

test("authentication checks current account status and role", async (t) => {
  const oldSecret = process.env.JWT_SECRET;
  const oldQuery = User.findById;
  process.env.JWT_SECRET = "test-only-secret";
  t.after(() => {
    User.findById = oldQuery;
    if (oldSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = oldSecret;
  });
  const token = jwt.sign({ id: "507f1f77bcf86cd799439011", role: "admin" }, process.env.JWT_SECRET);
  for (const account of [null, { id: "507f1f77bcf86cd799439011", role: "admin", is_active: 0 }, { id: "507f1f77bcf86cd799439011", role: "student", is_active: 1 }, { id: "507f1f77bcf86cd799439011", role: "admin", is_active: 1 }]) {
    User.findById = async () => account;
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json() { return this; } };
    let continued = false;
    await requireAuth(req, res, () => { continued = true; });
    if (!account?.is_active) {
      assert.equal(res.statusCode, 401);
      assert.equal(continued, false);
    } else {
      assert.equal(continued, true);
      requireAdmin(req, res, () => {});
      assert.equal(res.statusCode, account.role === "admin" ? 200 : 403);
    }
  }
  User.findById = async () => { throw new Error("Database unavailable"); };
  let forwarded;
  await requireAuth({ headers: { authorization: `Bearer ${token}` } }, {}, error => { forwarded = error; });
  assert.equal(forwarded.message, "Database unavailable");
});

