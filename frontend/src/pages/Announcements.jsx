import { useEffect, useState } from "react";
import { FaCalendarAlt } from "react-icons/fa";
import PageHero from "../components/PageHero";
import SiteFooter from "../components/SiteFooter";
import SiteNavbar from "../components/SiteNavbar";
import { apiRequest } from "../services/api";
import "./Announcements.css";

function formatDate(value) {
  if (!value) return "Latest update";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Announcements() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/announcements")
      .then(setItems)
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <div className="announcements-page">
      <SiteNavbar />
      <main>
        <PageHero
          eyebrow="EMSAM Updates"
          title="Announcements"
          description="Important information about Dreamway examinations, results, Pathfinder programmes and student resources."
          image="/media/dreamway-results-2026.jpg"
        />

        <section className="announcement-section">
          <div className="section-shell">
            <div className="section-heading">
              <p className="eyebrow">Latest Information</p>
              <h2>News for Students</h2>
              <p>Announcements are managed through the administrator dashboard.</p>
            </div>

            {error && <p className="form-status error">{error}</p>}

            <div className="announcement-grid">
              {items.map((item) => (
                <article className="announcement-card" key={item.id}>
                  {item.image_url && <img src={item.image_url} alt="" />}
                  <div className="announcement-content">
                    <div className="announcement-meta">
                      <span>{item.category}</span>
                      <time><FaCalendarAlt /> {formatDate(item.event_date || item.created_at)}</time>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                  </div>
                </article>
              ))}
            </div>

            {!error && items.length === 0 && (
              <p className="empty-text">No announcements are available. Start the backend and run the database setup.</p>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default Announcements;
