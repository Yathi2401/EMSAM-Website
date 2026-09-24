import test from "node:test";
import assert from "node:assert/strict";
import { prepareResultRows } from "../utils/resultImport.js";

const header = ["NAME", "INDEX NO", "BIO", "GRADE", "Z", "PHY", "GRADE", "Z", "CHE", "GRADE", "Z", "Z.Average", "Rank"];
const record = ["Test Student", "00123", 75, "A", null, 60, "B", null, 50, "C", null, "_", "_"];

test("missing numeric values become null without mutating source rows", () => {
  const source = [header, record];
  const original = structuredClone(source);
  const [row] = prepareResultRows(source, "Biological Science");
  assert.equal(row[11], null);
  assert.equal(row[12], null);
  assert.equal(row[1], "00123");
  assert.deepEqual(source, original);
});

test("zero marks and zero Z average remain zero", () => {
  const row = [...record];
  row[2] = 0;
  row[11] = "0";
  const [result] = prepareResultRows([header, row], "Biological Science");
  assert.equal(result[2], 0);
  assert.equal(result[11], 0);
});

test("rejects wrong stream, duplicate indices and invalid numbers before writes", () => {
  assert.throws(() => prepareResultRows([header, record], "Physical Science"), /columns/);
  assert.throws(() => prepareResultRows([header, record, record], "Biological Science"), /duplicate/);
  const invalid = [...record];
  invalid[2] = "invalid";
  assert.throws(() => prepareResultRows([header, invalid], "Biological Science"), /Row 2/);
});

test("rejects incomplete rows and empty workbooks", () => {
  assert.throws(() => prepareResultRows([header, ["Student"]], "Biological Science"), /index/);
  assert.throws(() => prepareResultRows([header, []], "Biological Science"), /no result/);
});


