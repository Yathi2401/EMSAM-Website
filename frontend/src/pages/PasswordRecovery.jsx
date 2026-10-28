import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SiteNavbar from "../components/SiteNavbar";
import SiteFooter from "../components/SiteFooter";
import PageHero from "../components/PageHero";
import { apiRequest, clearSession } from "../services/api";
import "./Auth.css";

export default function PasswordRecovery({ reset = false }) {
  const [token] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get("token") || "",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState(null);
  useEffect(() => {
    if (reset && window.location.hash)
      window.history.replaceState(window.history.state, "", window.location.pathname);
  }, [reset]);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    if (reset && password !== confirm) {
      setMessage({ error: true, text: "Passwords do not match." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const result = await apiRequest(reset ? "/auth/reset-password" : "/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(reset ? { token, password } : { email }),
      });
      if (reset) clearSession();
      setDone(true);
      setPassword("");
      setConfirm("");
      setMessage({ text: result.message });
    } catch (error) {
      setMessage({ error: true, text: error.message });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <SiteNavbar />
      <main>
        <PageHero
          eyebrow="Account help"
          title={reset ? "Choose a New Password" : "Forgot Your Password?"}
          description={
            reset
              ? "Choose a password you do not use on another website."
              : "Enter the email address registered with your EMSAM account."
          }
          image="/media/emsam-logo.jpg"
        />
        <section className="auth-section">
          <div className="auth-card small-card">
            {reset && !token ? (
              <p role="alert">
                This reset link is missing or invalid.{" "}
                <Link to="/forgot-password">Request a new link</Link>.
              </p>
            ) : (
              !done && (
                <form onSubmit={submit}>
                  <fieldset disabled={busy} className="recovery-fields">
                    {reset ? (
                      <>
                        <label htmlFor="new-password">New password</label>
                        <input
                          id="new-password"
                          type="password"
                          autoComplete="new-password"
                          minLength={8}
                          required
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                        />
                        <label htmlFor="confirm-password">Confirm new password</label>
                        <input
                          id="confirm-password"
                          type="password"
                          autoComplete="new-password"
                          minLength={8}
                          required
                          value={confirm}
                          onChange={(event) => setConfirm(event.target.value)}
                        />
                        <p>Use at least 8 characters.</p>
                      </>
                    ) : (
                      <>
                        <label htmlFor="recovery-email">Email address</label>
                        <input
                          id="recovery-email"
                          type="email"
                          autoComplete="email"
                          maxLength={150}
                          required
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                        />
                      </>
                    )}
                    <button type="submit">
                      {busy ? "Please wait…" : reset ? "Change password" : "Send reset link"}
                    </button>
                  </fieldset>
                </form>
              )
            )}
            {message && (
              <p
                role={message.error ? "alert" : "status"}
                className={`form-status ${message.error ? "error" : "success"}`}
              >
                {message.text}
              </p>
            )}
            <p className="auth-switch">
              <Link to="/login">Back to login</Link>
            </p>
            <p className="auth-switch">
              Need help? <Link to="/contact">Contact EMSAM</Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
