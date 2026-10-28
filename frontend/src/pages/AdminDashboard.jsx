import { useEffect, useRef, useState } from "react";
import { FaBullhorn, FaEnvelope, FaFilePdf, FaSignOutAlt, FaUsers } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import SiteNavbar from "../components/SiteNavbar";
import AnnouncementManager from "../components/AnnouncementManager";
import { apiRequest, clearSession, getCurrentUser, serverFileUrl } from "../services/api";
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
  const [busy, setBusy] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [papers, setPapers] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [announcement, setAnnouncement] = useState(initialAnnouncement);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
  const announcementTitleRef = useRef(null);
  const announcementPhotoRef = useRef(null);
  const [announcementPhoto, setAnnouncementPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoError, setPhotoError] = useState("");

  useEffect(() => {
    if (!announcementPhoto) {
      setPhotoPreview("");
      return;
    }
    const url = URL.createObjectURL(announcementPhoto);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [announcementPhoto]);
  const [paper, setPaper] = useState({
    title: "",
    subject: "",
    stream: "Both",
    year: "2026",
    paperType: "Paper I",
    file: null,
  });
  const [resultImport, setResultImport] = useState({
    stream: "Physical Science",
    examYear: "2026",
    file: null,
  });
  const [status, setStatus] = useState({ type: "", message: "" });

  async function loadDashboard(
    resources = ["summary", "messages", "users", "announcements", "papers"],
  ) {
    const setters = {
      summary: setSummary,
      messages: setMessages,
      users: setUsers,
      announcements: setAnnouncements,
      papers: setPapers,
    };
    try {
      await Promise.all(
        resources.map(async (resource) => {
          const data = await apiRequest(`/admin/${resource}`);
          setters[resource](data);
        }),
      );
    } catch (error) {
      if (error.status === 401) navigate("/login", { replace: true });
      if (error.status === 403) navigate("/dashboard", { replace: true });
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
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

  async function deleteItem(resource, item) {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const data = await apiRequest(`/admin/${resource}/${item.id}`, { method: "DELETE" });
      setStatus({ type: "success", message: data.message });
      if (resource === "announcements" && item.id === editingAnnouncementId)
        cancelAnnouncementEdit();
      const setItems = resource === "announcements" ? setAnnouncements : setPapers;
      setItems((items) => items.filter((entry) => entry.id !== item.id));
      if (resource === "papers") await loadDashboard(["summary"]);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setDeleting(false);
    }
  }

  function cancelAnnouncementEdit() {
    setEditingAnnouncementId(null);
    setAnnouncement(initialAnnouncement);
    resetPhoto();
  }

  function resetPhoto() {
    setAnnouncementPhoto(null);
    setPhotoError("");
    if (announcementPhotoRef.current) announcementPhotoRef.current.value = "";
  }

  function selectPhoto(event) {
    const file = event.target.files[0];
    setPhotoError("");
    if (
      file &&
      (!["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 4 * 1024 * 1024)
    ) {
      setAnnouncementPhoto(null);
      event.target.value = "";
      setPhotoError("Choose a JPG, PNG or WebP photo up to 4 MB.");
      return;
    }
    setAnnouncementPhoto(file || null);
  }

  function editAnnouncement(item) {
    if (
      editingAnnouncementId &&
      !window.confirm("Discard the current edit and edit this announcement?")
    )
      return;
    setEditingAnnouncementId(item.id);
    resetPhoto();
    setAnnouncement({
      category: item.category,
      title: item.title,
      summary: item.summary,
      eventDate: item.event_date ? item.event_date.slice(0, 10) : "",
      imageUrl: item.image_url || "",
    });
    setStatus({ type: "", message: "" });
    announcementTitleRef.current?.focus();
    announcementTitleRef.current?.scrollIntoView({ block: "center" });
  }

  async function submitAnnouncement(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });
    try {
      const formData = new FormData();
      for (const [key, value] of Object.entries(announcement)) formData.append(key, value);
      if (announcementPhoto) formData.append("photo", announcementPhoto);
      const data = await apiRequest(
        editingAnnouncementId
          ? `/admin/announcements/${editingAnnouncementId}`
          : "/admin/announcements",
        {
          method: editingAnnouncementId ? "PUT" : "POST",
          body: formData,
        },
      );
      setStatus({ type: "success", message: data.message });
      cancelAnnouncementEdit();
      await loadDashboard(["announcements"]);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function uploadPaper(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
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
      setPaper({
        title: "",
        subject: "",
        stream: "Both",
        year: "2026",
        paperType: "Paper I",
        file: null,
      });
      formElement.reset();
      await loadDashboard(["papers", "summary"]);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function importResults(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
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
      formElement.reset();
      await loadDashboard(["summary"]);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function submitOnce(event, handler) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await handler(event);
    } finally {
      setBusy(false);
    }
  }

  async function updateMessage(id, value) {
    setBusy(true);
    try {
      await apiRequest(`/admin/messages/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: value }),
      });
      setMessages((items) =>
        items.map((item) => (item.id === id ? { ...item, status: value } : item)),
      );
      await loadDashboard(["summary"]);
      setStatus({ type: "success", message: "Message status updated." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setBusy(false);
    }
  }

  const matchingUsers = users.filter((account) =>
    `${account.full_name} ${account.email} ${account.school || ""}`
      .toLowerCase()
      .includes(userSearch.toLowerCase()),
  );
  const pageCount = Math.max(1, Math.ceil(matchingUsers.length / 10));
  const currentPage = Math.min(userPage, pageCount);

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
            <button type="button" onClick={logout}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </section>

        <section className="dashboard-content">
          <div className="section-shell">
            {loading && <p role="status">Loading dashboard...</p>}
            {status.message && (
              <p
                role={status.type === "error" ? "alert" : "status"}
                className={`form-status ${status.type}`}
              >
                {status.message}
              </p>
            )}

            <div className="admin-summary-grid">
              <div>
                <FaUsers />
                <span>Students</span>
                <strong>{summary?.students ?? "—"}</strong>
              </div>
              <div>
                <FaFilePdf />
                <span>Past Papers</span>
                <strong>{summary?.papers ?? "—"}</strong>
              </div>
              <div>
                <FaBullhorn />
                <span>Results</span>
                <strong>{summary?.results ?? "—"}</strong>
              </div>
              <div>
                <FaEnvelope />
                <span>New Messages</span>
                <strong>{summary?.newMessages ?? "—"}</strong>
              </div>
            </div>

            <section className="messages-card">
              <h2>Examination Admissions</h2>
              <p>
                Open or close applications, edit intake details, review receipts and download the
                admission register as Excel.
              </p>
              <Link to="/admin/admissions" className="primary-button">
                Manage Admissions
              </Link>
            </section>

            <div className="admin-forms-grid">
              <form
                className="admin-form"
                onSubmit={(event) => submitOnce(event, submitAnnouncement)}
              >
                <h2>{editingAnnouncementId ? "Edit Announcement" : "Publish Announcement"}</h2>
                <label htmlFor="announcement-category">Category</label>
                <select
                  id="announcement-category"
                  disabled={busy}
                  value={announcement.category}
                  onChange={(e) => setAnnouncement({ ...announcement, category: e.target.value })}
                >
                  {Array.from(
                    new Set([
                      "Dreamway",
                      "Pathfinder",
                      "Results",
                      "Resources",
                      "General",
                      announcement.category,
                    ]),
                  ).map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
                <label htmlFor="announcement-title">Title</label>
                <input
                  id="announcement-title"
                  ref={announcementTitleRef}
                  disabled={busy}
                  maxLength={200}
                  value={announcement.title}
                  onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                  required
                />
                <label htmlFor="announcement-summary">Summary</label>
                <textarea
                  id="announcement-summary"
                  disabled={busy}
                  maxLength={10000}
                  rows="4"
                  value={announcement.summary}
                  onChange={(e) => setAnnouncement({ ...announcement, summary: e.target.value })}
                  required
                />
                <label htmlFor="announcement-date">Event Date</label>
                <input
                  id="announcement-date"
                  disabled={busy}
                  type="date"
                  value={announcement.eventDate}
                  onChange={(e) => setAnnouncement({ ...announcement, eventDate: e.target.value })}
                />
                <label htmlFor="announcement-image">Photo (optional)</label>
                <input
                  id="announcement-image"
                  ref={announcementPhotoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy}
                  onChange={selectPhoto}
                  aria-describedby="announcement-photo-help"
                />
                <p id="announcement-photo-help" className="photo-help">
                  Choose a JPG, PNG or WebP photo up to 4 MB. When editing, leave this empty to keep
                  the current photo.
                </p>
                {photoError && (
                  <p role="alert" className="form-status error">
                    {photoError}
                  </p>
                )}
                {(photoPreview || announcement.imageUrl) && (
                  <div className="announcement-photo-preview">
                    <img
                      src={photoPreview || serverFileUrl(announcement.imageUrl)}
                      alt="Announcement photo preview"
                    />
                    <button
                      className="cancel-edit"
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        resetPhoto();
                        setAnnouncement({ ...announcement, imageUrl: "" });
                      }}
                    >
                      Remove Photo
                    </button>
                  </div>
                )}
                <button type="submit" disabled={busy || deleting || Boolean(photoError)}>
                  {busy ? "Please wait..." : editingAnnouncementId ? "Save Changes" : "Publish"}
                </button>
                {editingAnnouncementId && (
                  <button
                    className="cancel-edit"
                    type="button"
                    disabled={busy || deleting}
                    onClick={cancelAnnouncementEdit}
                  >
                    Cancel
                  </button>
                )}
              </form>

              <form className="admin-form" onSubmit={(event) => submitOnce(event, uploadPaper)}>
                <h2>Upload Past Paper</h2>
                <label>Title</label>
                <input
                  value={paper.title}
                  onChange={(e) => setPaper({ ...paper, title: e.target.value })}
                  required
                />
                <label>Subject</label>
                <select
                  value={paper.subject}
                  onChange={(e) => setPaper({ ...paper, subject: e.target.value })}
                  required
                >
                  <option value="">Select</option>
                  <option>Biology</option>
                  <option>Chemistry</option>
                  <option>Physics</option>
                  <option>Combined Mathematics</option>
                </select>
                <label>Stream</label>
                <select
                  value={paper.stream}
                  onChange={(e) => setPaper({ ...paper, stream: e.target.value })}
                >
                  <option>Both</option>
                  <option>Physical Science</option>
                  <option>Biological Science</option>
                </select>
                <div className="admin-two-fields">
                  <div>
                    <label>Year</label>
                    <input
                      type="number"
                      value={paper.year}
                      onChange={(e) => setPaper({ ...paper, year: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Type</label>
                    <select
                      value={paper.paperType}
                      onChange={(e) => setPaper({ ...paper, paperType: e.target.value })}
                    >
                      <option>Paper I</option>
                      <option>Paper II</option>
                      <option>Marking Scheme</option>
                      <option>Paper II - Essay</option>
                      <option>Paper II - Structured</option>
                    </select>
                  </div>
                </div>
                <label>PDF File</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPaper({ ...paper, file: e.target.files[0] })}
                  required
                />
                <button type="submit" disabled={busy}>
                  Upload Paper
                </button>
              </form>

              <form className="admin-form" onSubmit={(event) => submitOnce(event, importResults)}>
                <h2>Import Results</h2>
                <label>Stream</label>
                <select
                  value={resultImport.stream}
                  onChange={(e) => setResultImport({ ...resultImport, stream: e.target.value })}
                >
                  <option>Physical Science</option>
                  <option>Biological Science</option>
                </select>
                <label>Exam Year</label>
                <input
                  type="number"
                  value={resultImport.examYear}
                  onChange={(e) => setResultImport({ ...resultImport, examYear: e.target.value })}
                />
                <label>Excel File</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setResultImport({ ...resultImport, file: e.target.files[0] })}
                  required
                />
                <button type="submit" disabled={busy}>
                  Import Results
                </button>
              </form>
            </div>

            <AnnouncementManager
              items={announcements}
              loading={loading}
              disabled={busy || deleting}
              onEdit={editAnnouncement}
              onDelete={deleteItem}
            />

            <section className="messages-card">
              <h2>Manage Past Papers</h2>
              <div className="admin-record-list">
                {papers.map((item) => (
                  <div className="admin-record" key={item.id}>
                    <span>
                      {item.title}
                      {!item.is_published && " (Unpublished)"}
                    </span>
                    <button
                      type="button"
                      disabled={busy || deleting}
                      onClick={() => deleteItem("papers", item)}
                      aria-label={`Delete ${item.title}`}
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {!loading && papers.length === 0 && <p>No past papers available.</p>}
              </div>
            </section>

            <section className="messages-card">
              <h2>Registered Users</h2>
              <label htmlFor="user-search">Search by name, email or school</label>
              <input
                id="user-search"
                className="user-search"
                type="search"
                value={userSearch}
                onChange={(event) => {
                  setUserSearch(event.target.value);
                  setUserPage(1);
                }}
              />
              <p>{matchingUsers.length} matching users</p>
              <div className="admin-record-list">
                {matchingUsers.slice((currentPage - 1) * 10, currentPage * 10).map((account) => (
                  <article className="admin-record" key={account.id}>
                    <div>
                      <strong>{account.full_name}</strong>
                      <p>{account.email}</p>
                      <p>
                        {account.school || "School not provided"} · {account.stream}
                      </p>
                    </div>
                    <span>
                      {account.role} · {account.is_active ? "Active" : "Disabled"}
                    </span>
                  </article>
                ))}
                {matchingUsers.length === 0 && <p>No matching users.</p>}
                <nav className="user-pagination" aria-label="User pages">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setUserPage(currentPage - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {pageCount}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage === pageCount}
                    onClick={() => setUserPage(currentPage + 1)}
                  >
                    Next
                  </button>
                </nav>
              </div>
            </section>

            <div className="messages-card">
              <h2>Contact Messages</h2>
              <div className="message-list">
                {messages.map((message) => (
                  <article key={message.id}>
                    <div>
                      <strong>{message.full_name}</strong>
                      <span>{message.email}</span>
                    </div>
                    <h3>{message.subject}</h3>
                    <p>{message.message}</p>
                    <label htmlFor={`status-${message.id}`}>Status</label>
                    <select
                      id={`status-${message.id}`}
                      value={message.status}
                      disabled={busy}
                      onChange={(event) => updateMessage(message.id, event.target.value)}
                    >
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="replied">Replied</option>
                    </select>
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
