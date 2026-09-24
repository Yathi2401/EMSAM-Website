export const examStreams = ["Physical Science", "Biological Science"];

export function validText(value, maxLength, optional = false) {
  if (optional && (value == null || value === "")) return true;
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

export function validEmail(value) {
  return validText(value, 150) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validYear(value) {
  return ["string", "number"].includes(typeof value) && Number.isInteger(Number(value)) && Number(value) >= 2000 && Number(value) <= 2100;
}
