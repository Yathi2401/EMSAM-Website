import { useState } from "react";
import { FaUserGraduate } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import PageHero from "../components/PageHero";
import SiteFooter from "../components/SiteFooter";
import SiteNavbar from "../components/SiteNavbar";
import { apiRequest } from "../services/api";
import "./Auth.css";

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
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
              <span><FaUserGraduate /></span>
              <div><p>Student Registration</p><h2>Join the EMSAM Platform</h2></div>
            </div>

            <form onSubmit={handleSubmit} className="register-grid">
              <div className="full-field"><label>Full Name</label><input name="fullName" value={form.fullName} onChange={handleChange} required /></div>
              <div><label>Email Address</label><input name="email" type="email" value={form.email} onChange={handleChange} required /></div>
              <div><label>Phone Number</label><input name="phone" value={form.phone} onChange={handleChange} /></div>
              <div><label>School</label><input name="school" value={form.school} onChange={handleChange} /></div>
              <div><label>A/L Stream</label><select name="stream" value={form.stream} onChange={handleChange} required><option value="">Select stream</option><option>Physical Science</option><option>Biological Science</option><option>Other</option></select></div>
              <div className="full-field"><label>A/L Examination Year</label><input name="alYear" type="number" min="2026" max="2035" value={form.alYear} onChange={handleChange} /></div>
              <div><label>Password</label><input name="password" type="password" value={form.password} onChange={handleChange} required /></div>
              <div><label>Confirm Password</label><input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required /></div>
              <button type="submit" className="full-field" disabled={loading}>{loading ? "Creating account..." : "Create Student Account"}</button>
            </form>

            {status.message && <p className={`form-status ${status.type}`}>{status.message}</p>}
            <p className="auth-switch">Already registered? <Link to="/login">Login here</Link></p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default Register;
