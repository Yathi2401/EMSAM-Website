import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiClipboard,
  FiFileText,
  FiLock,
  FiPrinter,
} from "react-icons/fi";
import SiteNavbar from "../components/SiteNavbar";
import SiteFooter from "../components/SiteFooter";
import { apiRequest } from "../services/api";
import AdmissionFields from "../components/AdmissionFields";
import {
  defaultAdmissionFields,
  isCoreField,
  shownAdmissionFields,
} from "../../../shared/admissionForm.js";
import "./Admissions.css";

const empty = {
  fullName: "",
  nic: "",
  district: "Mullaitivu",
  phone: "",
  whatsapp: "",
  email: "",
  school: "",
  stream: "",
  alYear: "",
  centre: "",
  paymentMethod: "bank",
  paymentReference: "",
  coordinatorName: "",
  consent: false,
};
const money = (amount) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(amount);
export default function Admissions() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(empty);
  const [answers, setAnswers] = useState({});
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);
  const keyRef = useRef(null);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const value = await apiRequest("/admissions/settings");
      setSettings({ ...value, formFields: value.formFields || defaultAdmissionFields() });
      setForm((current) => ({ ...current, alYear: current.alYear || String(value.year) }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (result || reviewing) resultRef.current?.focus();
  }, [result, reviewing]);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const field = (name, label, maxLength, type = "text", required = true) => (
    <label className="ad-field">
      {label}
      <input
        name={name}
        value={form[name]}
        onChange={change}
        type={type}
        required={required}
        maxLength={maxLength}
        min={type === "number" ? 2000 : undefined}
        max={type === "number" ? 2100 : undefined}
        autoComplete={
          name === "fullName"
            ? "name"
            : name === "email"
              ? "email"
              : name === "phone"
                ? "tel"
                : undefined
        }
      />
    </label>
  );
  function selectReceipt(e) {
    const file = e.target.files[0];
    setError("");
    if (
      file &&
      (file.size > 3 * 1024 * 1024 ||
        !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type))
    ) {
      setError("Choose a PDF, JPG, PNG or WebP receipt up to 3 MB.");
      e.target.value = "";
      setReceipt(null);
      return;
    }
    setReceipt(file || null);
  }
  function review(event) {
    event.preventDefault();
    setError("");
    if (form.paymentMethod === "bank" && !receipt) {
      setError("Upload your bank transfer receipt before continuing.");
      return;
    }
    setReviewing(true);
  }
  async function submit() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const storageKey = `emsam-admission-key-${settings.year}`;
      if (!keyRef.current) {
        try {
          keyRef.current = sessionStorage.getItem(storageKey);
        } catch {
          /* Storage may be disabled. */
        }
        keyRef.current ||= crypto.randomUUID();
        try {
          sessionStorage.setItem(storageKey, keyRef.current);
        } catch {
          /* In-memory key still prevents repeat submissions. */
        }
      }
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, String(value)));
      body.append("year", settings.year);
      body.append("submissionKey", keyRef.current);
      body.append("settingsVersion", settings.updatedAt || "");
      body.append(
        "customAnswers",
        JSON.stringify(
          Object.fromEntries(
            activeFields
              .filter((item) => !isCoreField(item.id) && item.type !== "heading")
              .map((item) => [item.id, answers[item.id] || ""]),
          ),
        ),
      );
      if (form.paymentMethod === "bank" && receipt) body.append("receipt", receipt);
      const confirmation = await apiRequest("/admissions", { method: "POST", body });
      setResult(confirmation);
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* No persistence required after success. */
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  const activeFields = settings ? shownAdmissionFields(settings.formFields, settings.centres) : [];
  const details = [
    ...activeFields
      .filter((item) => item.type !== "heading")
      .map((item) => [
        item.label,
        item.type === "checkbox"
          ? answers[item.id] === "true"
            ? "Yes"
            : "No"
          : (isCoreField(item.id) ? form[item.id] : answers[item.id]) || "Not provided",
      ]),
    ["Payment", form.paymentMethod === "bank" ? "Bank transfer" : "Pay a coordinator"],
    [
      "Payment reference / coordinator",
      form.paymentMethod === "bank" ? form.paymentReference : form.coordinatorName,
    ],
  ];
  return (
    <div className="ad-page">
      <SiteNavbar />
      <main>
        <section className="ad-hero">
          <div className="section-shell ad-hero-inner">
            <div>
              <p className="ad-eyebrow">DREAMWAY · EXAMINATION ADMISSIONS</p>
              {settings && (
                <span className={`ad-badge ${settings.accepting ? "open" : ""}`}>
                  {settings.accepting ? "Applications open" : "Applications closed"}
                </span>
              )}
              <h1>{settings?.title || "Your next step starts here."}</h1>
              <p>
                {settings?.description || "Apply for the Dreamway practice examination with EMSAM."}
              </p>
              {settings && (
                <div className="ad-hero-meta">
                  <div>
                    <small>INTAKE</small>
                    <strong>{settings.year}</strong>
                  </div>
                  <div>
                    <small>EXAMINATION FEE</small>
                    <strong>{money(settings.fee)}</strong>
                  </div>
                  <div>
                    <small>CLOSING DATE</small>
                    <strong>
                      {settings.deadline
                        ? new Date(settings.deadline).toLocaleString("en-LK", {
                            timeZone: "Asia/Colombo",
                            dateStyle: "medium",
                            timeStyle: "short",
                          }) + " (SL)"
                        : "To be announced"}
                    </strong>
                  </div>
                </div>
              )}
            </div>
            <div className="ad-hero-note">
              <FiClipboard />
              <h2>
                One application.
                <br />A step towards your future.
              </h2>
              <p>
                Keep your details ready, choose how to pay, and save your reference after
                submitting.
              </p>
              <div className="ad-steps">
                <span>
                  <b>1</b> Your details
                </span>
                <span>
                  <b>2</b> Payment
                </span>
                <span>
                  <b>3</b> Submit
                </span>
              </div>
            </div>
          </div>
        </section>
        {result ? (
          <section className="ad-confirmation" ref={resultRef} tabIndex={-1}>
            <div className="ad-card">
              <span className="ad-confirmation-icon">
                <FiCheckCircle />
              </span>
              <p className="ad-eyebrow">APPLICATION RECEIVED</p>
              <h2>Thank you, {form.fullName}.</h2>
              <p>{result.message}</p>
              <div className="ad-reference">
                <small>Your application reference</small>
                <strong>{result.reference}</strong>
              </div>
              <p>
                <strong>
                  {result.title} · {result.year}
                </strong>
              </p>
              <dl className="ad-details">
                {details.map(([label, value], index) => (
                  <div key={index}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="ad-notice">
                This confirms your submission, not payment approval or an examination admission
                ticket. EMSAM will assign your examination index separately. Keep this reference
                when contacting your coordinator.
              </div>
              <button className="ad-button" onClick={() => window.print()}>
                <FiPrinter /> Print / save confirmation
              </button>
              <p>
                <Link to="/dreamway">Back to Dreamway</Link>
              </p>
            </div>
          </section>
        ) : (
          <div className="section-shell ad-layout">
            <div>
              {loading && (
                <div className="ad-card" role="status">
                  Loading admission details…
                </div>
              )}
              {error && (
                <div className="ad-message error" role="alert">
                  {error}
                  {!settings && (
                    <p>
                      <button className="ad-button secondary" onClick={load}>
                        Try again
                      </button>
                    </p>
                  )}
                </div>
              )}
              {!loading && settings && !settings.accepting && (
                <section className="ad-card">
                  <div className="ad-section-title">
                    <span>
                      <FiLock />
                    </span>
                    <h2>Admissions are currently closed</h2>
                  </div>
                  <p>
                    Applications are not being accepted at the moment. Check back here for the next
                    opening or contact EMSAM for help.
                  </p>
                  <Link to="/contact" className="ad-button secondary">
                    Contact EMSAM <FiArrowRight />
                  </Link>
                </section>
              )}
              {!loading &&
                settings?.accepting &&
                (reviewing ? (
                  <section className="ad-card" ref={resultRef} tabIndex={-1}>
                    <div className="ad-section-title">
                      <span>03</span>
                      <div>
                        <h2>Review your application</h2>
                        <p>Check your information before submitting.</p>
                      </div>
                    </div>
                    <dl className="ad-details">
                      {details.map(([label, value], index) => (
                        <div key={index}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                    {form.paymentMethod === "bank" && (
                      <p>
                        <FiFileText /> Receipt: {receipt?.name}
                      </p>
                    )}
                    <p>
                      Examination fee: <strong>{money(settings.fee)}</strong>
                    </p>
                    <div className="ad-notice">
                      Payment will be checked by an administrator. Please submit only one
                      application.
                    </div>
                    <div className="ad-heading-row">
                      <button
                        className="ad-button secondary"
                        disabled={busy}
                        onClick={() => setReviewing(false)}
                      >
                        Edit details
                      </button>
                      <button className="ad-button" disabled={busy} onClick={submit}>
                        {busy ? "Submitting…" : "Submit application"}
                        <FiArrowRight />
                      </button>
                    </div>
                  </section>
                ) : (
                  <form onSubmit={review}>
                    <fieldset className="ad-fieldset" disabled={busy}>
                      <section className="ad-card">
                        <div className="ad-section-title">
                          <span>01</span>
                          <div>
                            <h2>{settings.formHeading || "Your examination details"}</h2>
                            <p>{settings.formIntro}</p>
                          </div>
                        </div>
                        <AdmissionFields
                          fields={settings.formFields}
                          centres={settings.centres}
                          values={form}
                          onChange={(id, value) =>
                            setForm((current) => ({ ...current, [id]: value }))
                          }
                          answers={answers}
                          onAnswer={(id, value) =>
                            setAnswers((current) => ({ ...current, [id]: value }))
                          }
                        />
                      </section>
                      <section className="ad-card">
                        <div className="ad-section-title">
                          <span>02</span>
                          <div>
                            <h2>Choose how to pay</h2>
                            <p>Examination fee: {money(settings.fee)}</p>
                          </div>
                        </div>
                        <div className="ad-payment-options">
                          {[
                            ["bank", "Bank transfer", "Transfer online and attach your receipt."],
                            [
                              "coordinator",
                              "Pay a coordinator",
                              "Arrange payment with an EMSAM coordinator.",
                            ],
                          ].map(([value, title, desc]) => (
                            <label className="ad-payment-option" key={value}>
                              <input
                                type="radio"
                                name="paymentMethod"
                                value={value}
                                checked={form.paymentMethod === value}
                                onChange={(e) => {
                                  change(e);
                                  setError("");
                                }}
                              />
                              <span>
                                <strong>{title}</strong>
                                <small>{desc}</small>
                              </span>
                            </label>
                          ))}
                        </div>
                        {form.paymentMethod === "bank" ? (
                          <>
                            <div className="ad-payment-info">
                              <strong>Bank transfer details</strong>
                              <br />
                              {settings.bankDetails}
                              <br />
                              <br />
                              Use your full name as the transfer reference.
                            </div>
                            {field(
                              "paymentReference",
                              "Your name used as the bank transfer reference",
                              150,
                            )}
                            <label className="ad-field ad-upload">
                              Payment receipt
                              <input
                                type="file"
                                accept="application/pdf,image/jpeg,image/png,image/webp"
                                onChange={selectReceipt}
                                required={!receipt}
                              />
                              <small>
                                {receipt
                                  ? `Selected: ${receipt.name}. Leave empty to keep this receipt.`
                                  : "Upload a clear PDF, JPG, PNG or WebP. Maximum 3 MB."}
                              </small>
                            </label>
                          </>
                        ) : (
                          <>
                            <div className="ad-payment-info">
                              <strong>Contact a coordinator</strong>
                              <br />
                              {settings.coordinators}
                            </div>
                            {field(
                              "coordinatorName",
                              "Name of the coordinator you will pay / have paid",
                              150,
                            )}
                            <p>
                              Your application will remain pending until an administrator confirms
                              the coordinator has received payment.
                            </p>
                          </>
                        )}
                      </section>
                      <section className="ad-card">
                        <label className="ad-check">
                          <input
                            type="checkbox"
                            required
                            checked={form.consent}
                            onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                          />
                          <span>
                            I confirm that these details are correct and agree that EMSAM may use my
                            application and payment information to organise the examination and
                            contact me about my admission.
                          </span>
                        </label>
                        <button className="ad-button ad-submit" type="submit">
                          Review application <FiArrowRight />
                        </button>
                      </section>
                    </fieldset>
                  </form>
                ))}
            </div>
            <aside className="ad-sidebar">
              <div className="ad-card">
                <p className="ad-eyebrow">BEFORE YOU APPLY</p>
                <h3>A little preparation helps.</h3>
                <ul className="ad-help-list">
                  <li>
                    <FiCheck /> Have your school, stream and preferred centre ready.
                  </li>
                  <li>
                    <FiCheck /> Use a contact number we can reach you on.
                  </li>
                  <li>
                    <FiCheck /> For bank transfers, use your name as the reference and keep a clear
                    receipt.
                  </li>
                  <li>
                    <FiLock /> Your application and receipt are available only to authorised EMSAM
                    administrators.
                  </li>
                </ul>
              </div>
              {settings?.instructions && (
                <div className="ad-card">
                  <h3>Applicant instructions</h3>
                  <p>{settings.instructions}</p>
                </div>
              )}
              {settings?.schedule && (
                <div className="ad-card">
                  <h3>Examination & seminar timetable</h3>
                  <p>{settings.schedule}</p>
                </div>
              )}
              <div className="ad-card">
                <h3>Need a hand?</h3>
                <p>Contact EMSAM if you need help with your application or payment.</p>
                <Link to="/contact" className="ad-text-button">
                  Get in touch <FiArrowRight />
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
