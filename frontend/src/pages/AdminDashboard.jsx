import { useEffect, useState } from "react";
import { FaBullhorn, FaEnvelope, FaFilePdf, FaSignOutAlt, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import SiteNavbar from "../components/SiteNavbar";
import { apiRequest, clearSession, getCurrentUser } from "../services/api";
import "./Dashboard.css";

const initialAnnouncement = {
  category: "Dreamway",
  title: "",
  summary: "",
  eventDate: "",
  imageUrl: "",
};

function AdminDashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [summary, setSummary] = useState(null);
  const [messages, setMessages] = useState([]);
  const [announcement, setAnnouncement] = useState(initialAnnouncement);
  const [paper, setPaper] = useState({ title: "", subject: "", stream: "Both", year: "2026", paperType: "Paper I", file: null });
  const [resultImport, setResultImport] = useState({ stream: "Physical Science", examYear: "2026", file: null });
  const [status, setStatus] = useState({ type: "", message: "" });

  async function loadDashboard() {
    try {
      const [summaryData, messageData] = await Promise.all([
        apiRequest("/admin/summary"),
        apiRequest("/admin/messages"),
      ]);
      setSummary(summaryData);
      setMessages(messageData);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login");
      return;
    }
    loadDashboard();
  }, []);

  function logout() {
    clearSession();
    navigate("/");
  }

  async function submitAnnouncement(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });
    try {
      const data = await apiRequest("/admin/announcements", {
        method: "POST",
        body: JSON.stringify(announcement),
      });
      setStatus({ type: "success", message: data.message });
      setAnnouncement(initialAnnouncement);
      loadDashboard();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function uploadPaper(event) {
    event.preventDefault();
    if (!paper.file) {
      setStatus({ type: "error", message: "Choose a PDF file." });
      return;
    }

    const formData = new FormData();
    formData.append("paper", paper.file);
    formData.append("title", paper.title);
    formData.append("subject", paper.subject);
    formData.append("stream", paper.stream);
    formData.append("year", paper.year);
    formData.append("paperType", paper.paperType);

    try {
      const data = await apiRequest("/admin/papers", { method: "POST", body: formData });
      setStatus({ type: "success", message: data.message });
      setPaper({ title: "", subject: "", stream: "Both", year: "2026", paperType: "Paper I", file: null });
      loadDashboard();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function importResults(event) {
    event.preventDefault();
    if (!resultImport.file) {
      setStatus({ type: "error", message: "Choose an Excel results file." });
      return;
    }

    const formData = new FormData();
    formData.append("resultsFile", resultImport.file);
    formData.append("stream", resultImport.stream);
    formData.append("examYear", resultImport.examYear);

    try {
      const data = await apiRequest("/admin/results/import", { method: "POST", body: formData });
      setStatus({ type: "success", message: data.message });
      setResultImport({ ...resultImport, file: null });
      loadDashboard();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  return (
    <div className="dashboard-page admin-dashboard">
      <SiteNavbar />
      <main>
        <section className="dashboard-hero">
          <div className="section-shell dashboard-hero-inner">
            <div>
              <p>EMSAM Administration</p>
              <h1>Admin Dashboard</h1>
              <span>Manage announcements, past papers, results and student messages.</span>
            </div>
            <button type="button" onClick={logout}><FaSignOutAlt /> Logout</button>
          </div>
        </section>

        <section className="dashboard-content">
          <div className="section-shell">
            {status.message && <p className={`form-status ${status.type}`}>{status.message}</p>}

            <div className="admin-summary-grid">
              <div><FaUsers /><span>Students</span><strong>{summary?.students ?? "—"}</strong></div>
              <div><FaFilePdf /><span>Past Papers</span><strong>{summary?.papers ?? "—"}</strong></div>
              <div><FaBullhorn /><span>Results</span><strong>{summary?.results ?? "—"}</strong></div>
              <div><FaEnvelope /><span>New Messages</span><strong>{summary?.newMessages ?? "—"}</strong></div>
            </div>

            <div className="admin-forms-grid">
              <form className="admin-form" onSubmit={submitAnnouncement}>
                <h2>Publish Announcement</h2>
                <label>Category</label>
                <select value={announcement.category} onChange={(e) => setAnnouncement({ ...announcement, category: e.target.value })}><option>Dreamway</option><option>Pathfinder</option><option>Results</option><option>Resources</option><option>General</option></select>
                <label>Title</label>
                <input value={announcement.title} onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })} required />
                <label>Summary</label>
                <textarea rows="4" value={announcement.summary} onChange={(e) => setAnnouncement({ ...announcement, summary: e.target.value })} required />
                <label>Event Date</label>
                <input type="date" value={announcement.eventDate} onChange={(e) => setAnnouncement({ ...announcement, eventDate: e.target.value })} />
                <label>Frontend Image Path</label>
                <input placeholder="/media/image-name.jpg" value={announcement.imageUrl} onChange={(e) => setAnnouncement({ ...announcement, imageUrl: e.target.value })} />
                <button type="submit">Publish</button>
              </form>

              <form className="admin-form" onSubmit={uploadPaper}>
                <h2>Upload Past Paper</h2>
                <label>Title</label>
                <input value={paper.title} onChange={(e) => setPaper({ ...paper, title: e.target.value })} required />
                <label>Subject</label>
                <select value={paper.subject} onChange={(e) => setPaper({ ...paper, subject: e.target.value })} required><option value="">Select</option><option>Biology</option><option>Chemistry</option><option>Physics</option><option>Combined Mathematics</option></select>
                <label>Stream</label>
                <select value={paper.stream} onChange={(e) => setPaper({ ...paper, stream: e.target.value })}><option>Both</option><option>Physical Science</option><option>Biological Science</option></select>
                <div className="admin-two-fields">
                  <div><label>Year</label><input type="number" value={paper.year} onChange={(e) => setPaper({ ...paper, year: e.target.value })} /></div>
                  <div><label>Type</label><select value={paper.paperType} onChange={(e) => setPaper({ ...paper, paperType: e.target.value })}><option>Paper I</option><option>Paper II</option><option>Marking Scheme</option><option>Paper II - Essay</option><option>Paper II - Structured</option></select></div>
                </div>
                <label>PDF File</label>
                <input type="file" accept="application/pdf" onChange={(e) => setPaper({ ...paper, file: e.target.files[0] })} required />
                <button type="submit">Upload Paper</button>
              </form>

              <form className="admin-form" onSubmit={importResults}>
                <h2>Import Results</h2>
                <label>Stream</label>
                <select value={resultImport.stream} onChange={(e) => setResultImport({ ...resultImport, stream: e.target.value })}><option>Physical Science</option><option>Biological Science</option></select>
                <label>Exam Year</label>
                <input type="number" value={resultImport.examYear} onChange={(e) => setResultImport({ ...resultImport, examYear: e.target.value })} />
                <label>Excel File</label>
                <input type="file" accept=".xlsx,.xls" onChange={(e) => setResultImport({ ...resultImport, file: e.target.files[0] })} required />
                <button type="submit">Import Results</button>
              </form>
            </div>

            <div className="messages-card">
              <h2>Contact Messages</h2>
              <div className="message-list">
                {messages.map((message) => (
                  <article key={message.id}>
                    <div><strong>{message.full_name}</strong><span>{message.email}</span></div>
                    <h3>{message.subject}</h3>
                    <p>{message.message}</p>
                  </article>
                ))}
                {messages.length === 0 && <p className="empty-text">No contact messages.</p>}
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default AdminDashboard;
