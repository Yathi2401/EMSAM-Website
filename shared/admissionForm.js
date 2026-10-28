export const coreFieldRules = {
  fullName: { type: "text", max: 150, required: true },
  nic: { type: "text", max: 12, required: true },
  stream: { type: "stream", required: true },
  alYear: { type: "number", required: true },
  school: { type: "school", max: 180, required: true },
  district: { type: "text", max: 100, required: true },
  centre: { type: "centre", max: 180, required: true },
  phone: { type: "tel", max: 30, required: true },
  whatsapp: { type: "tel", max: 30, required: false },
  email: { type: "email", max: 150, required: false },
};
export const customFieldTypes = {
  text: "Short answer",
  textarea: "Long answer",
  select: "Dropdown",
  number: "Number",
  date: "Date",
  checkbox: "Checkbox",
  heading: "Section heading",
};
export function defaultAdmissionFields() {
  const labels = {
    fullName: "Full name / முழுப்பெயர்",
    nic: "NIC number / தேசிய அடையாள அட்டை இலக்கம்",
    stream: "Stream / பிரிவு",
    alYear: "A/L examination year",
    school: "School / பாடசாலை",
    district: "District / மாவட்டம்",
    centre: "Examination centre / பரீட்சை நிலையம்",
    phone: "Contact number / தொலைபேசி இலக்கம்",
    whatsapp: "WhatsApp number",
    email: "Email address",
  };
  return Object.entries(coreFieldRules).map(([id, rule]) => ({
    id,
    type: rule.type,
    label: labels[id],
    required: rule.required,
    visible: true,
    width: ["fullName", "nic", "school", "email"].includes(id) ? "full" : "half",
    placeholder: "",
    help: id === "nic" ? "Enter 12 digits, or 9 digits followed by V or X." : "",
    options: [],
  }));
}
export function isCoreField(id) {
  return Object.hasOwn(coreFieldRules, id);
}
export function shownAdmissionFields(fields, centres = []) {
  return fields.filter((field) => field.visible && (field.id !== "centre" || centres.length > 0));
}
