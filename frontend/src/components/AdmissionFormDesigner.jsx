import { useEffect, useState } from "react";
import { FiArrowDown, FiArrowUp, FiPlus, FiTrash2, FiSave } from "react-icons/fi";
import AdmissionFields from "./AdmissionFields";
import { coreFieldRules, customFieldTypes, isCoreField } from "../../../shared/admissionForm.js";
import { apiRequest } from "../services/api";

export default function AdmissionFormDesigner({ settings, onSaved }) {
  const [fields, setFields] = useState(() => settings.formFields.map(field => ({ ...field, options: [...field.options] })));
  const [heading, setHeading] = useState(settings.formHeading);
  const [intro, setIntro] = useState(settings.formIntro);
  const [selectedId, setSelectedId] = useState("nic");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [baseVersion, setBaseVersion] = useState(settings.updatedAt || "");
  const [mobile, setMobile] = useState(false);
  const selected = fields.find(field => field.id === selectedId);
  const requiredCore = selected && isCoreField(selected.id) && coreFieldRules[selected.id].required;
  useEffect(() => {
    if (!dirty) {
      setFields(settings.formFields.map(field => ({ ...field, options: [...field.options] })));
      setHeading(settings.formHeading); setIntro(settings.formIntro); setBaseVersion(settings.updatedAt || "");
    }
  }, [settings.updatedAt]);
  useEffect(() => {
    const warn = event => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function update(values) { setFields(fields.map(field => field.id === selectedId ? { ...field, ...values } : field)); setDirty(true); setMessage(null); }
  function move(index, direction) {
    const next = [...fields]; [next[index], next[index + direction]] = [next[index + direction], next[index]];
    setFields(next); setDirty(true); setMessage(null);
  }
  function addField() {
    const id = `custom_${crypto.randomUUID()}`;
    setFields([...fields, { id, label: "New question", type: "text", required: false, visible: true, width: "full", placeholder: "", help: "", options: [] }]);
    setSelectedId(id); setDirty(true); setMessage(null);
  }
  function removeField() {
    setFields(fields.filter(field => field.id !== selectedId)); setSelectedId("nic"); setDirty(true); setMessage(null);
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setMessage(null);
    try {
      const saved = await apiRequest("/admin/admissions/form", { method: "PUT", body: JSON.stringify({ formHeading: heading, formIntro: intro, formFields: fields, version: baseVersion }) });
      setFields(saved.formFields); setHeading(saved.formHeading); setIntro(saved.formIntro); setBaseVersion(saved.updatedAt); setDirty(false); onSaved(saved);
      setMessage({ text: "Form design saved. The admission open/closed setting has not changed." });
    } catch (error) { setMessage({ error: true, text: error.message }); } finally { setBusy(false); }
  }
  return <section className="ad-designer">
    <div className="ad-card"><div className="ad-heading-row"><div><h2>Design your application</h2><p>Add questions, arrange fields and preview what students will see.</p></div><span className={`ad-badge ${dirty ? "pending" : "verified"}`}>{dirty ? "Unsaved changes" : "Saved design"}</span></div><p className="ad-notice">NIC and the required standard fields stay required. You can edit their labels, hints, position and width. Payment and declaration sections remain part of every application. Previously submitted answers are preserved.</p></div>
    {message && <p role={message.error ? "alert" : "status"} className={`ad-message ${message.error ? "error" : "success"}`}>{message.text}</p>}
    <form onSubmit={save}><fieldset disabled={busy} className="ad-fieldset">
      <div className="ad-builder-layout"><div className="ad-card ad-builder-controls">
        <label className="ad-field">Form section heading<input maxLength={150} required value={heading} onChange={event => { setHeading(event.target.value); setDirty(true); }} /></label>
        <label className="ad-field">Form introduction<textarea maxLength={500} value={intro} onChange={event => { setIntro(event.target.value); setDirty(true); }} /></label>
        <div className="ad-heading-row"><h3>Fields ({fields.length}/30)</h3><button className="ad-button secondary" type="button" disabled={fields.length >= 30} onClick={addField}><FiPlus /> Add field</button></div>
        <ol className="ad-builder-list">{fields.map((field, index) => <li key={field.id} className={selectedId === field.id ? "selected" : ""}>
          <button type="button" className="ad-builder-field" aria-pressed={selectedId === field.id} onClick={() => setSelectedId(field.id)}><span>{index + 1}</span><span>{field.label}<small>{!field.visible ? "Hidden" : field.type === "heading" ? "Section heading" : field.required ? "Required" : "Optional"}{isCoreField(field.id) ? " · Standard field" : ""}</small></span></button>
          <div className="ad-order-buttons"><button type="button" aria-label={`Move ${field.label} up`} disabled={index === 0} onClick={() => move(index, -1)}><FiArrowUp /></button><button type="button" aria-label={`Move ${field.label} down`} disabled={index === fields.length - 1} onClick={() => move(index, 1)}><FiArrowDown /></button></div>
        </li>)}</ol>
      </div><div className="ad-builder-right">
        {selected && <div className="ad-card"><h3>Edit selected field</h3><label className="ad-field">Field label<input value={selected.label} required maxLength={150} onChange={event => update({ label: event.target.value })} /></label>
          <div className="ad-form-grid"><label className="ad-field">Field type<select value={selected.type} disabled={isCoreField(selected.id)} onChange={event => update({ type: event.target.value, options: event.target.value === "select" ? ["Option 1", "Option 2"] : [], ...(event.target.value === "heading" ? { required: false, width: "full" } : {}) })}>{isCoreField(selected.id) ? <option value={selected.type}>Standard {selected.id} field</option> : Object.entries(customFieldTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="ad-field">Field width<select value={selected.width} disabled={selected.type === "heading"} onChange={event => update({ width: event.target.value })}><option value="full">Full row</option><option value="half">Half row</option></select></label></div>
          {selected.type === "select" && <label className="ad-field">Dropdown choices (one per line)<textarea rows={5} maxLength={4530} value={selected.options.join("\n")} onChange={event => update({ options: event.target.value.split("\n") })} /><small>Up to 30 unique choices.</small></label>}
          {!["heading", "checkbox"].includes(selected.type) && <label className="ad-field">Placeholder<input maxLength={150} value={selected.placeholder} onChange={event => update({ placeholder: event.target.value })} /></label>}
          <label className="ad-field">Help text<textarea maxLength={500} value={selected.help} onChange={event => update({ help: event.target.value })} /></label>
          <div className="ad-builder-flags"><label><input type="checkbox" disabled={requiredCore || selected.type === "heading"} checked={selected.required} onChange={event => update({ required: event.target.checked })} /> Required</label><label><input type="checkbox" disabled={requiredCore} checked={selected.visible} onChange={event => update({ visible: event.target.checked })} /> Visible</label>{!isCoreField(selected.id) && <button type="button" className="ad-text-button ad-remove" onClick={removeField}><FiTrash2 /> Remove field</button>}</div>
        </div>}
        <div className="ad-heading-row"><h3>Student preview</h3><button className="ad-button secondary" type="button" onClick={() => setMobile(!mobile)}>{mobile ? "Show desktop layout" : "Show phone layout"}</button></div>
        <div className={`ad-card ad-form-preview ${mobile ? "phone" : ""}`}><h2>{heading}</h2><p>{intro}</p><AdmissionFields fields={fields} centres={settings.centres.split("\n").filter(Boolean)} values={{ alYear: String(settings.year) }} onChange={() => {}} disabled /><div className="ad-notice">Payment options, receipt upload and the declaration follow this section.</div></div>
      </div></div>
      <div className="ad-builder-save"><p>{dirty ? "Save to publish these fields to the application page." : "The saved design is used for new applications."}</p><button className="ad-button" type="submit" disabled={busy || !dirty}><FiSave /> {busy ? "Saving…" : "Save form design"}</button></div>
    </fieldset></form>
  </section>;
}
