import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiDownload, FiExternalLink, FiSettings, FiUsers } from "react-icons/fi";
import SiteNavbar from "../components/SiteNavbar";
import SiteFooter from "../components/SiteFooter";
import { apiRequest, downloadAdminFile, getCurrentUser } from "../services/api";
import "./Admissions.css";

function localDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export default function AdminAdmissions() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("applications");
  const [settings, setSettings] = useState(null);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [filters, setFilters] = useState({ year: "", status: "", search: "", page: 1 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [selected, setSelected] = useState(null);
  const reviewRef = useRef(null);
  useEffect(() => { if (selected) reviewRef.current?.focus(); }, [selected?.id]);
  const [refresh, setRefresh] = useState(0);
  const query = new URLSearchParams(filters).toString();
  useEffect(() => {
    if (getCurrentUser()?.role !== "admin") { navigate("/login", { replace: true }); return; }
    apiRequest("/admin/admissions/settings").then(value => setSettings({ ...value, deadline: localDate(value.deadline), centres: value.centres.join("\n") })).catch(error => setMessage({ error: true, text: error.message }));
  }, []);
  useEffect(() => {
    if (getCurrentUser()?.role !== "admin") return;
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      apiRequest(`/admin/admissions?${query}`).then(value => { if (active) setData(value); }).catch(error => {
        if (active) { setMessage({ error: true, text: error.message }); if (error.status === 401) navigate("/login"); }
      }).finally(() => { if (active) setLoading(false); });
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [query, refresh]);
  function changeFilter(key, value) { setFilters({ ...filters, [key]: value, page: 1 }); }
  async function saveSettings(event) {
    event.preventDefault(); setBusy(true); setMessage(null);
    try {
      const value = await apiRequest("/admin/admissions/settings", { method: "PUT", body: JSON.stringify({ ...settings, year: Number(settings.year), fee: Number(settings.fee), deadline: settings.deadline ? new Date(settings.deadline).toISOString() : null, centres: settings.centres.split("\n").map(s => s.trim()).filter(Boolean) }) });
      setSettings({ ...value, deadline: localDate(value.deadline), centres: value.centres.join("\n") });
      setMessage({ text: `Settings saved. Admissions are ${value.isOpen && (!value.deadline || Date.parse(value.deadline) > Date.now()) ? "open" : "closed"}.` });
    } catch (error) { setMessage({ error: true, text: error.message }); } finally { setBusy(false); }
  }
  async function download(path, filename) {
    setBusy(true); setMessage(null);
    try { await downloadAdminFile(path, filename); } catch (error) { setMessage({ error: true, text: error.message }); } finally { setBusy(false); }
  }
  async function review(event) {
    event.preventDefault(); setBusy(true); setMessage(null);
    try {
      await apiRequest(`/admin/admissions/${selected.id}`, { method: "PATCH", body: JSON.stringify({ paymentStatus: selected.paymentStatus, adminNotes: selected.adminNotes, examIndex: selected.examIndex || "" }) });
      setRefresh(value => value + 1); setSelected(null); setMessage({ text: "Payment review saved." });
    } catch (error) { setMessage({ error: true, text: error.message }); } finally { setBusy(false); }
  }
  const settingField = (key, label, type = "text", maxLength) => <label className="ad-field">{label}<input type={type} value={settings[key]} maxLength={maxLength} required={key === "title" || key === "year" || key === "fee"} min={key === "year" ? 2000 : key === "fee" ? 0 : undefined} max={key === "year" ? 2100 : key === "fee" ? 1000000 : undefined} step={key === "fee" ? "0.01" : undefined} onChange={e => setSettings({ ...settings, [key]: e.target.value })} /></label>;
  const settingArea = (key, label, maxLength, hint) => <label className="ad-field">{label}<textarea rows={4} value={settings[key]} maxLength={maxLength} required={key === "description"} onChange={e => setSettings({ ...settings, [key]: e.target.value })} />{hint && <small>{hint}</small>}</label>;
  return <div className="ad-page"><SiteNavbar /><main>
    <header className="ad-admin-header section-shell"><Link to="/admin" className="ad-back"><FiArrowLeft /> Dashboard</Link><div className="ad-heading-row"><div><p className="ad-eyebrow">EMSAM ADMINISTRATION</p><h1>Admissions workspace</h1><p>Manage your intake, applications and payment reviews.</p></div><Link to="/admissions" className="ad-button secondary"><FiExternalLink /> View admission page</Link></div></header>
    <section className="section-shell ad-admin-body">
      <div className="ad-tabs" role="tablist" aria-label="Admission workspace"><button type="button" role="tab" aria-selected={tab === "applications"} onClick={() => { setTab("applications"); setMessage(null); }}><FiUsers /> Applications</button><button type="button" role="tab" aria-selected={tab === "settings"} onClick={() => { setTab("settings"); setMessage(null); }}><FiSettings /> Intake settings</button></div>
      {message && <p className={`ad-message ${message.error ? "error" : "success"}`} role={message.error ? "alert" : "status"}>{message.text}</p>}
      {tab === "settings" && (!settings ? <p role="status">Loading settings…</p> : <form className="ad-card" onSubmit={saveSettings}><fieldset disabled={busy} className="ad-fieldset"><div className="ad-heading-row"><div><h2>Make the next intake yours</h2><p>Save changes to update the public admission page.</p></div><label className="ad-toggle"><input type="checkbox" checked={settings.isOpen} onChange={e => setSettings({ ...settings, isOpen: e.target.checked })} /> Accept applications</label></div>
        <div className="ad-notice">Applications close automatically at the deadline. Uncheck “Accept applications” and save to close them immediately. Existing submissions are retained when you edit the intake.</div>
        <div className="ad-form-grid">{settingField("title", "Admission title", "text", 150)}{settingField("year", "Intake year", "number")}{settingField("fee", "Examination fee (LKR)", "number")}{settingField("deadline", "Closing date & time (your local time)", "datetime-local")}</div>
        {settingArea("description", "Introduction", 4000)}
        {settingArea("centres", "Examination centres (one per line)", 7200, "Leave empty if students do not need to choose a centre.")}
        <div className="ad-form-grid">{settingArea("bankDetails", "Bank transfer details", 3000, "Include bank, branch, account name and account number.")}{settingArea("coordinators", "Coordinator payment details", 3000, "Include coordinator names, areas and contact numbers.")}</div>
        {settingArea("instructions", "Instructions for applicants", 5000)}{settingArea("schedule", "Examination & seminar timetable", 5000, "Enter the current dates, times and venues. The previous paper timetable is not reused.")}
        <button className="ad-button" type="submit">{busy ? "Saving…" : "Save intake settings"}</button>
      </fieldset></form>)}
      {tab === "applications" && <><div className="ad-card"><div className="ad-heading-row"><div><h2>Application register <span className="ad-count">{data.total}</span></h2><p>All submissions are saved automatically. Export uses the filters below.</p></div><button className="ad-button" disabled={busy || loading} onClick={() => download(`/admin/admissions/export?${query}`, "EMSAM-admissions.xlsx")}><FiDownload /> Export Excel</button></div>
        <div className="ad-filters"><label className="ad-field">Search<input value={filters.search} maxLength={150} placeholder="Name, reference, school or phone" onChange={e => changeFilter("search", e.target.value)} /></label><label className="ad-field">Intake year<input type="number" min="2000" max="2100" placeholder="All years" value={filters.year} onChange={e => changeFilter("year", e.target.value)} /></label><label className="ad-field">Payment status<select value={filters.status} onChange={e => changeFilter("status", e.target.value)}><option value="">All statuses</option><option value="pending">Pending</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select></label></div>
        <div className="ad-table-wrap"><table className="ad-table"><thead><tr><th>Applicant</th><th>School / stream</th><th>Payment</th><th>Submitted</th><th>Review</th></tr></thead><tbody>{loading ? <tr><td colSpan="5">Loading applications…</td></tr> : data.items.length === 0 ? <tr><td colSpan="5"><div className="ad-empty">No applications found. New submissions will appear here.</div></td></tr> : data.items.map(entry => <tr key={entry.id}><td><strong>{entry.fullName}</strong><small>{entry.reference}</small><small>{entry.phone}</small></td><td>{entry.school}<small>{entry.stream} · {entry.year}</small></td><td><span className={`ad-badge ${entry.paymentStatus}`}>{entry.paymentStatus}</span><small>{entry.paymentMethod === "bank" ? "Bank transfer" : "Coordinator"}</small></td><td>{new Date(entry.createdAt).toLocaleDateString()}</td><td><button className="ad-text-button" onClick={() => setSelected(entry)}>View details</button></td></tr>)}</tbody></table></div>
        <div className="ad-pagination"><button className="ad-button secondary" disabled={loading || filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Previous</button><span>Page {filters.page} of {data.pages}</span><button className="ad-button secondary" disabled={loading || filters.page >= data.pages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</button></div>
      </div>
      {selected && <section className="ad-card ad-review" aria-label="Application review" ref={reviewRef} tabIndex={-1}><div className="ad-heading-row"><div><p className="ad-eyebrow">{selected.reference}</p><h2>{selected.fullName}</h2></div><button className="ad-button secondary" disabled={busy} onClick={() => setSelected(null)}>Close details</button></div><dl className="ad-details">{Object.entries({ "Examination index": selected.examIndex, District: selected.district, Phone: selected.phone, WhatsApp: selected.whatsapp, Email: selected.email, School: selected.school, Stream: selected.stream, "A/L year": selected.alYear, Centre: selected.centre, "Fee (LKR)": selected.fee, "Payment method": selected.paymentMethod, "Bank reference name": selected.paymentReference, Coordinator: selected.coordinatorName }).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value === 0 ? 0 : value || "Not provided"}</dd></div>)}</dl>
        {selected.receiptId && <button className="ad-button secondary" disabled={busy} onClick={() => download(`/admin/admissions/${selected.id}/receipt`, "receipt")}><FiDownload /> Download private receipt</button>}
        <form onSubmit={review}><fieldset className="ad-fieldset" disabled={busy}><div className="ad-form-grid"><label className="ad-field">Payment review<select value={selected.paymentStatus} onChange={e => setSelected({ ...selected, paymentStatus: e.target.value })}><option value="pending">Pending verification</option><option value="verified">Payment verified</option><option value="rejected">Payment rejected</option></select></label><label className="ad-field">Examination index (optional)<input maxLength={30} pattern={"[A-Za-z0-9\\-\\/]+"} value={selected.examIndex || ""} onChange={e => setSelected({ ...selected, examIndex: e.target.value })} /><small>Assigned by EMSAM; unique within this intake year.</small></label><label className="ad-field">Internal notes<textarea maxLength={2000} value={selected.adminNotes} onChange={e => setSelected({ ...selected, adminNotes: e.target.value })} /></label></div><button type="submit" className="ad-button">{busy ? "Saving…" : "Save payment review"}</button></fieldset></form>
      </section>}</>}
    </section></main><SiteFooter /></div>;
}
