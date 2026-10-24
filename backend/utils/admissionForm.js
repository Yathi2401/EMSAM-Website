import { coreFieldRules, customFieldTypes, isCoreField, shownAdmissionFields } from "../../shared/admissionForm.js";
import { validText } from "./validation.js";

export const validNic = value => typeof value === "string" && /^(?:\d{12}|\d{9}[VX])$/i.test(value.trim());

export function validateFormDesign(fields) {
  if (!Array.isArray(fields) || fields.length < 10 || fields.length > 30) throw new Error("Keep the standard fields and use no more than 20 additional fields.");
  const ids = new Set();
  const result = fields.map(field => {
    if (!field || typeof field !== "object" || typeof field.id !== "string" || ids.has(field.id)) throw new Error("Each form field must have a unique identifier.");
    ids.add(field.id);
    const core = isCoreField(field.id) ? coreFieldRules[field.id] : null;
    if (!core && (!/^custom_[a-f0-9-]{36}$/.test(field.id) || !Object.hasOwn(customFieldTypes, field.type))) throw new Error("Choose a supported custom field type.");
    if (core && (field.type !== core.type || (core.required && (!field.required || !field.visible)))) throw new Error("Required standard fields, including NIC, must remain visible and required.");
    if (!validText(field.label, 150) || !validText(field.help, 500, true) || !validText(field.placeholder, 150, true) ||
        typeof field.required !== "boolean" || typeof field.visible !== "boolean" || !["half", "full"].includes(field.width)) throw new Error("Check the field label, help text, visibility and layout.");
    const options = field.type === "select" ? field.options : [];
    if (!Array.isArray(options) || (field.type === "select" && (options.length < 1 || options.length > 30 || options.some(value => !validText(value, 150)) || new Set(options.map(value => value.trim())).size !== options.length))) throw new Error("Dropdowns need 1–30 different, non-empty choices (up to 150 characters each).");
    return { id: field.id, type: field.type, label: field.label.trim(), help: field.help?.trim() || "", placeholder: field.placeholder?.trim() || "",
      required: field.type === "heading" ? false : field.required, visible: field.visible,
      width: field.type === "heading" ? "full" : field.width, options: options.map(value => value.trim()) };
  });
  if (Object.keys(coreFieldRules).some(id => !ids.has(id))) throw new Error("Standard application fields cannot be removed. Hide optional fields instead.");
  return result;
}

export function validateCustomAnswers(raw, fields, centres) {
  let submitted;
  try { submitted = raw ? JSON.parse(raw) : {}; } catch { throw new Error("Invalid additional application answers."); }
  if (!submitted || Array.isArray(submitted) || typeof submitted !== "object") throw new Error("Invalid additional application answers.");
  const active = shownAdmissionFields(fields, centres).filter(field => !isCoreField(field.id) && field.type !== "heading");
  const allowed = new Set(active.map(field => field.id));
  if (Object.keys(submitted).some(id => !allowed.has(id))) throw new Error("The application form has changed. Reload it before submitting.");
  return active.map(field => {
    const value = Object.hasOwn(submitted, field.id) ? submitted[field.id] : "";
    if (typeof value !== "string" || value.length > (field.type === "textarea" ? 2000 : 300)) throw new Error(`Check the answer for ${field.label}.`);
    const answer = value.trim();
    if (field.required && (!answer || (field.type === "checkbox" && answer !== "true"))) throw new Error(`${field.label} is required.`);
    if (answer) {
      if (field.type === "select" && !field.options.includes(answer)) throw new Error(`Choose an available option for ${field.label}.`);
      if (field.type === "number" && (!/^-?\d+(?:\.\d+)?$/.test(answer) || !Number.isFinite(Number(answer)))) throw new Error(`Enter a valid number for ${field.label}.`);
      if (field.type === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(answer) || !Number.isFinite(Date.parse(answer)) || new Date(answer).toISOString().slice(0, 10) !== answer)) throw new Error(`Enter a valid date for ${field.label}.`);
      if (field.type === "checkbox" && !["true", "false"].includes(answer)) throw new Error(`Check the answer for ${field.label}.`);
    }
    // Snapshot labels and types so later form edits do not rewrite historical answers.
    return { fieldId: field.id, label: field.label, type: field.type, value: field.type === "checkbox" ? (answer === "true" ? "Yes" : "No") : answer };
  });
}
