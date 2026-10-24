import { useEffect, useState } from "react";
import { FaBookOpen, FaChartLine, FaSignOutAlt, FaUserGraduate } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import ProfileFields from "../components/ProfileFields";
import "./Auth.css";
import SiteFooter from "../components/SiteFooter";
import SiteNavbar from "../components/SiteNavbar";
import { apiRequest, clearSession, getCurrentUser } from "../services/api";
import "./Dashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const user = getCurrentUser();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  function editProfile() {
    setForm({ fullName: profile.full_name, email: profile.email, phone: profile.phone || "",
      school: profile.school || "", indexNumber: profile.index_number || "",
      stream: profile.stream, alYear: profile.al_year || "" });
    setStatus({ type: "", message: "" });
    setEditing(true);
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: "", message: "" });
    try {
      const updated = await apiRequest("/auth/me", { method: "PUT", body: JSON.stringify(form) });
      setProfile(updated);
      localStorage.setItem("emsamUser", JSON.stringify({ ...user, fullName: updated.full_name, email: updated.email }));
      setEditing(false);
      setStatus({ type: "success", message: "Your profile has been updated." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    apiRequest("/auth/me")
      .then(setProfile)
      .catch((requestError) => {
        if (requestError.status === 401) navigate("/login", { replace: true });
        setError(requestError.message);
      });
  }, []);

  function logout() {
    clearSession();
    navigate("/");
  }

  return (
    <div className="dashboard-page">
      <SiteNavbar />
      <main>
        <section className="dashboard-hero">
          <div className="section-shell dashboard-hero-inner">
            <div>
              <p>Student Dashboard</p>
              <h1>Welcome, {profile?.full_name || user?.fullName || "Student"}</h1>
              <span>Access your EMSAM student services and account information.</span>
            </div>
            <button type="button" onClick={logout}><FaSignOutAlt /> Logout</button>
          </div>
        </section>

        <section className="dashboard-content">
          <div className="section-shell">
            {error && <p className="form-status error">{error}</p>}

            <div className="dashboard-service-grid">
              <Link to="/past-papers"><FaBookOpen /><h3>Past Papers</h3><p>Search and download Dreamway resources.</p></Link>
              <Link to="/results"><FaChartLine /><h3>Results</h3><p>Search your Dreamway examination result.</p></Link>
              <Link to="/dreamway"><FaUserGraduate /><h3>Dreamway</h3><p>View examination information and timetables.</p></Link>
            </div>

            <div className="profile-card">
              <div className="profile-heading"><h2>Your Profile</h2>{profile && !editing && <button type="button" onClick={editProfile}>Edit Profile</button>}</div>
              {status.message && <p role="status" className={`form-status ${status.type}`}>{status.message}</p>}
              {!profile ? (
                <p className="loading-text">{error ? "Account information could not be loaded." : "Loading account information..."}</p>
              ) : editing ? (
                <form className="auth-card profile-edit register-grid" onSubmit={saveProfile}>
                  <ProfileFields form={form} onChange={setForm} disabled={saving} />
                  <div className="full-field profile-actions"><button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button><button type="button" disabled={saving} onClick={() => { setEditing(false); setStatus({ type: "", message: "" }); }}>Cancel</button></div>
                </form>
              ) : (
                <div className="profile-grid">
                  <div><span>Full Name</span><strong>{profile.full_name}</strong></div>
                  <div><span>Email</span><strong>{profile.email}</strong></div>
                  <div><span>Index Number</span><strong>{profile.index_number || "Not provided"}</strong></div>
                  <div><span>Phone</span><strong>{profile.phone || "Not provided"}</strong></div>
                  <div><span>School</span><strong>{profile.school || "Not provided"}</strong></div>
                  <div><span>Stream</span><strong>{profile.stream}</strong></div>
                  <div><span>A/L Year</span><strong>{profile.al_year || "Not provided"}</strong></div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default StudentDashboard;
