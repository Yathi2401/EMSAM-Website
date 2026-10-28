import { useState } from "react";
import { FaUserGraduate } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import ProfileFields from "../components/ProfileFields";
import PageHero from "../components/PageHero";
import SiteFooter from "../components/SiteFooter";
import SiteNavbar from "../components/SiteNavbar";
import { apiRequest } from "../services/api";
import "./Auth.css";

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  indexNumber: "",
  school: "",
  stream: "",
  alYear: "2027",
  password: "",
  confirmPassword: "",
};

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    if (form.password !== form.confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setStatus({ type: "success", message: data.message });
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <SiteNavbar />
      <main>
        <PageHero
          eyebrow="Student Membership"
          title="Create Your Account"
          description="Register for future EMSAM services, examination applications and student resources."
          image="/media/dreamway-logo.jpg"
        />

        <section className="auth-section">
          <div className="auth-card register-card">
            <div className="auth-card-title">
              <span>
                <FaUserGraduate />
              </span>
              <div>
                <p>Student Registration</p>
                <h2>Join the EMSAM Platform</h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="register-grid">
              <ProfileFields form={form} onChange={setForm} disabled={loading} />
              <div>
                <label htmlFor="register-password">Password (at least 8 characters)</label>
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="register-confirm">Confirm Password</label>
                <input
                  id="register-confirm"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <p className="full-field">
                Read how we use your information in our <Link to="/privacy">privacy notice</Link>.
              </p>
              <button type="submit" className="full-field" disabled={loading}>
                {loading ? "Creating account..." : "Create Student Account"}
              </button>
            </form>

            {status.message && (
              <p
                role={status.type === "error" ? "alert" : "status"}
                className={`form-status ${status.type}`}
              >
                {status.message}
              </p>
            )}
            <p className="auth-switch">
              Already registered? <Link to="/login">Login here</Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default Register;
