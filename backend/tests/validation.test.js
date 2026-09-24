import test from "node:test";
import assert from "node:assert/strict";
import { validText, validEmail, validYear } from "../utils/validation.js";

test("invalid request types and whitespace are rejected", () => {
  for (const value of [{}, [], 42, true, "   "]) assert.equal(validText(value, 150), false);
  assert.equal(validText(null, 150, true), true);
  assert.equal(validText("A student", 150), true);
});

test("email and year validation handles malformed API input", () => {
  assert.equal(validEmail(" Student@example.com "), true);
  for (const value of ["student", "a@b", {}, "a b@example.com"]) assert.equal(validEmail(value), false);
  for (const value of [true, [], [2026], "", "bad", "2026.5", 9999]) assert.equal(validYear(value), false);
  assert.equal(validYear("2026"), true);
});
