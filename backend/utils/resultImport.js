function invalid(message) {
  return Object.assign(new Error(message), { status: 400 });
}

// Normalize a copy: the uploaded workbook and source data are never rewritten.
export function prepareResultRows(rows, stream) {
  const headers = rows[0] || [];
  const expectedSubject = stream === "Biological Science" ? "BIO" : "MATHS";
  if (!/NAME/i.test(String(headers[0])) || !/INDEX/i.test(String(headers[1])) ||
      String(headers[2]).trim().toUpperCase() !== expectedSubject ||
      String(headers[5]).trim().toUpperCase() !== "PHY" ||
      String(headers[8]).trim().toUpperCase() !== "CHE" ||
      !/Z\.?\s*Average/i.test(String(headers[11])) || !/Rank/i.test(String(headers[12]))) {
    throw invalid("The spreadsheet columns do not match the selected stream and results template.");
  }
  const seen = new Set();
  const result = [];
  for (let i = 1; i < rows.length; i += 1) {
    const source = rows[i];
    if (source.every(value => value == null || String(value).trim() === "")) continue;
    const row = [...source];
    const name = String(row[0] ?? "").trim();
    const index = String(row[1] ?? "").trim();
    if (!name || name.length > 180 || !index || index.length > 30) throw invalid(`Row ${i + 1}: a valid name and index number are required.`);
    if (seen.has(index)) throw invalid(`Row ${i + 1}: duplicate index number.`);
    seen.add(index);
    row[0] = name;
    row[1] = index;
    for (const column of [2, 5, 8, 11, 12]) {
      const value = row[column];
      if (value == null || String(value).trim() === "" || String(value).trim() === "_") {
        row[column] = null;
        continue;
      }
      const numeric = Number(value);
      if (!["number", "string"].includes(typeof value) || !Number.isFinite(numeric) ||
          ([2, 5, 8].includes(column) && (numeric < 0 || numeric > 100)) ||
          (column === 11 && Math.abs(numeric) >= 10000) ||
          (column === 12 && (!Number.isInteger(numeric) || numeric < 1 || numeric > 2147483647))) {
        throw invalid(`Row ${i + 1}, column ${column + 1}: invalid numeric value.`);
      }
      row[column] = numeric;
    }
    for (const column of [3, 6, 9]) {
      row[column] = row[column] == null ? null : String(row[column]).trim();
      if (row[column]?.length > 5) throw invalid(`Row ${i + 1}: invalid grade.`);
    }
    result.push(row);
  }
  if (!result.length) throw invalid("The spreadsheet contains no result records.");
  return result;
}

export async function inTransaction(connection, operation) {
  return connection.transaction(operation);
}
