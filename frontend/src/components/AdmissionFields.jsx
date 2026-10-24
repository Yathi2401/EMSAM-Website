import { useId, useState } from "react";
import { coreFieldRules, isCoreField, shownAdmissionFields } from "../../../shared/admissionForm.js";
import { scienceSchools } from "../data/schools";

export default function AdmissionFields({ fields, centres, values, onChange, answers = {}, onAnswer = () => {}, disabled = false }) {
  const prefix = useId();
  const [otherSchool, setOtherSchool] = useState(Boolean(values.school && !scienceSchools.includes(values.school)));
  return <fieldset className="ad-fieldset ad-form-grid" disabled={disabled}>
    {shownAdmissionFields(fields, centres).map(field => {
      const id = `${prefix}-${field.id}`;
      const core = isCoreField(field.id);
      const value = (core ? values[field.id] : answers[field.id]) || "";
      const update = value => core ? onChange(field.id, value) : onAnswer(field.id, value);
      const maxLength = core ? coreFieldRules[field.id].max : field.type === "textarea" ? 2000 : 300;
      const shared = { id, value, onChange: event => update(event.target.value), required: field.required, placeholder: field.placeholder, "aria-describedby": field.help ? `${id}-help` : undefined };
      if (field.type === "heading") return <div className="ad-full ad-custom-heading" key={field.id}><h3>{field.label}</h3>{field.help && <p>{field.help}</p>}</div>;
      if (field.type === "checkbox") return <div key={field.id} className={field.width === "full" ? "ad-full" : ""}><label className="ad-check" htmlFor={id}><input id={id} type="checkbox" checked={value === "true"} required={field.required} onChange={event => update(String(event.target.checked))} /><span>{field.label}{field.required ? " *" : " (optional)"}{field.help && <small className="ad-field-help">{field.help}</small>}</span></label></div>;
      let input;
      if (field.type === "school") input = <><select {...shared} value={otherSchool ? "__other__" : value} onChange={event => { setOtherSchool(event.target.value === "__other__"); update(event.target.value === "__other__" ? "" : event.target.value); }}><option value="">Select your school</option>{scienceSchools.map(school => <option key={school}>{school}</option>)}<option value="__other__">Other school</option></select>{otherSchool && <><label htmlFor={`${id}-other`}>Enter your school name</label><input id={`${id}-other`} value={value} required maxLength={180} onChange={event => update(event.target.value)} /></>}</>;
      else if (["select", "stream", "centre"].includes(field.type)) {
        const options = field.type === "stream" ? ["Biological Science", "Physical Science"] : field.type === "centre" ? centres : field.options;
        input = <select {...shared}><option value="">{field.placeholder || "Select an option"}</option>{options.map(option => <option key={option}>{option}</option>)}</select>;
      } else if (field.type === "textarea") input = <textarea {...shared} maxLength={maxLength} rows={4} />;
      else input = <input {...shared} type={field.type} maxLength={maxLength} min={field.id === "alYear" ? 2000 : undefined} max={field.id === "alYear" ? 2100 : undefined} step={field.type === "number" ? field.id === "alYear" ? "1" : "any" : undefined}
        pattern={field.id === "nic" ? "(?:[0-9]{12}|[0-9]{9}[VvXx])" : undefined}
        title={field.id === "nic" ? "12 digits, or 9 digits followed by V or X" : undefined}
        autoComplete={field.id === "fullName" ? "name" : field.id === "email" ? "email" : field.id === "phone" ? "tel" : "off"} />;
      return <div className={`ad-field ${field.width === "full" ? "ad-full" : ""}`} key={field.id}><label htmlFor={id}>{field.label}{field.required ? " *" : " (optional)"}</label>{input}{field.help && <small id={`${id}-help`}>{field.help}</small>}</div>;
    })}
  </fieldset>;
}
