import { useState } from "react";
import { FaLock } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import PageHero from "../components/PageHero";
import SiteFooter from "../components/SiteFooter";
import SiteNavbar from "../components/SiteNavbar";
import { apiRequest, saveSession } from "../services/api";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      saveSession(data.token, data.user);
      navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
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
          eyebrow="Member Access"
          title="Welcome Back"
          description="Students and EMSAM administrators can log in to access their dashboard and services."
          image="/media/emsam-logo.jpg"
        />

        <section className="auth-section">
          <div className="auth-card small-card">
            <div className="auth-card-title">
              <span><FaLock /></span>
              <div><p>Secure Login</p><h2>Access Your Account</h2></div>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="email">Email Address</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />
              <button type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
              {status.message && <p className={`form-status ${status.type}`}>{status.message}</p>}
            </form>

            <p className="auth-switch">Do not have an account? <Link to="/register">Register here</Link></p>
            <div className="demo-login">
              <strong>Demo accounts after database setup</strong>
              <span>Admin: admin@emsam.lk / Admin@123</span>
              <span>Student: student@emsam.lk / Student@123</span>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default Login;
