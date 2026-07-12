import { useEffect, useState } from "react";
import { FaDownload, FaFilePdf, FaSearch } from "react-icons/fa";
import PageHero from "../components/PageHero";
import SiteFooter from "../components/SiteFooter";
import SiteNavbar from "../components/SiteNavbar";
import { apiRequest, serverFileUrl } from "../services/api";
import "./PastPapers.css";

const initialFilters = {
  subject: "",
  stream: "",
  year: "",
  type: "",
  search: "",
};

function PastPapers() {
  const [filters, setFilters] = useState(initialFilters);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPapers(activeFilters = filters) {
    setLoading(true);
    setError("");

    const query = new URLSearchParams();
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });

    try {
      const data = await apiRequest(`/papers?${query.toString()}`);
      setPapers(data);
    } catch (requestError) {
      setError(requestError.message);
      setPapers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPapers(initialFilters);
  }, []);

  function handleChange(event) {
    setFilters({ ...filters, [event.target.name]: event.target.value });
  }

  function handleSubmit(event) {
    event.preventDefault();
    loadPapers(filters);
  }

  function clearFilters() {
    setFilters(initialFilters);
    loadPapers(initialFilters);
  }

  return (
    <div className="papers-page">
      <SiteNavbar />
      <main>
        <PageHero
          eyebrow="Dreamway Academic Library"
          title="Past Papers"
          description="Search and download Dreamway question papers and marking schemes for Biology, Chemistry, Physics and Combined Mathematics from 2023 to 2026."
          image="/media/dreamway-timetable-2026.jpg"
        />

        <section className="papers-section">
          <div className="section-shell">
            <form className="paper-filters" onSubmit={handleSubmit}>
              <div className="paper-search-box">
                <FaSearch />
                <input
                  name="search"
                  value={filters.search}
                  onChange={handleChange}
                  placeholder="Search title or subject"
                />
              </div>

              <select name="subject" value={filters.subject} onChange={handleChange}>
                <option value="">All Subjects</option>
                <option>Biology</option>
                <option>Chemistry</option>
                <option>Physics</option>
                <option>Combined Mathematics</option>
              </select>

              <select name="stream" value={filters.stream} onChange={handleChange}>
                <option value="">All Streams</option>
                <option>Physical Science</option>
                <option>Biological Science</option>
              </select>

              <select name="year" value={filters.year} onChange={handleChange}>
                <option value="">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>

              <select name="type" value={filters.type} onChange={handleChange}>
                <option value="">All Types</option>
                <option>Paper I</option>
                <option>Paper II</option>
                <option>Paper II - Essay</option>
                <option>Paper II - Structured</option>
                <option>Marking Scheme</option>
                <option>Pure Mathematics</option>
                <option>Applied Mathematics</option>
              </select>

              <button type="submit">Apply Filters</button>
              <button type="button" className="clear-button" onClick={clearFilters}>Clear</button>
            </form>

            <div className="papers-result-header">
              <div>
                <p>Available Resources</p>
                <h2>{papers.length} Files</h2>
              </div>
              <span>PDF downloads are served securely through the EMSAM backend.</span>
            </div>

            {loading && <p className="loading-text">Loading past papers...</p>}
            {error && <p className="form-status error">{error}</p>}

            {!loading && !error && (
              <div className="paper-grid">
                {papers.map((paper) => (
                  <article className="paper-card" key={paper.id}>
                    <div className="paper-icon"><FaFilePdf /></div>
                    <div className="paper-card-info">
                      <span>{paper.subject} • {paper.exam_year}</span>
                      <h3>{paper.title}</h3>
                      <p>{paper.stream} | {paper.paper_type}</p>
                    </div>
                    <a href={serverFileUrl(paper.file_url)} target="_blank" rel="noreferrer">
                      <FaDownload /> Download
                    </a>
                  </article>
                ))}
              </div>
            )}

            {!loading && !error && papers.length === 0 && (
              <p className="empty-text">No past papers match the selected filters.</p>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default PastPapers;
