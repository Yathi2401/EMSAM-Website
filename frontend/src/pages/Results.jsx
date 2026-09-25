import { useState } from "react";
import { FaAward, FaSearch } from "react-icons/fa";
import PageHero from "../components/PageHero";
import SiteFooter from "../components/SiteFooter";
import SiteNavbar from "../components/SiteNavbar";
import { apiRequest } from "../services/api";
import "./Results.css";

function Results() {
  const [form, setForm] = useState({ indexNumber: "", stream: "" });
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setResult(null);
    setStatus({ type: "", message: "" });

    if (!form.indexNumber || !form.stream) {
      setStatus({ type: "error", message: "Enter your index number and select your stream." });
      return;
    }

    setLoading(true);
    try {
      const query = new URLSearchParams({ ...form, year: "2026" });
      const data = await apiRequest(`/results?${query.toString()}`);
      setResult(data);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  const subjects = result
    ? [
        { name: result.subject1_name, mark: result.subject1_mark, grade: result.subject1_grade },
        { name: result.subject2_name, mark: result.subject2_mark, grade: result.subject2_grade },
        { name: result.subject3_name, mark: result.subject3_mark, grade: result.subject3_grade },
      ]
    : [];

  return (
    <div className="results-page">
      <SiteNavbar />
      <main>
        <PageHero
          eyebrow="Dreamway Examination 2026"
          title="Check Your Results"
          description="Results are not displayed as a public list. Enter the correct index number and stream to retrieve an individual result. Anyone with these details can look up a result."
          image="/media/dreamway-results-2026.jpg"
        />

        <section className="results-section">
          <div className="section-shell results-layout">
            <form className="result-form" onSubmit={handleSubmit}>
              <div className="result-form-title">
                <FaSearch />
                <div>
                  <p>Student Result Search</p>
                  <h2>Enter Your Details</h2>
                </div>
              </div>

              <label htmlFor="indexNumber">Index Number</label>
              <input
                id="indexNumber"
                name="indexNumber"
                value={form.indexNumber}
                onChange={handleChange}
                placeholder="Example: 2007259"
              />

              <label htmlFor="stream">A/L Stream</label>
              <select id="stream" name="stream" value={form.stream} onChange={handleChange}>
                <option value="">Select stream</option>
                <option>Physical Science</option>
                <option>Biological Science</option>
              </select>

              <button type="submit" disabled={loading}>
                {loading ? "Searching..." : "Search Result"}
              </button>

              {status.message && <p role="status" className={`form-status ${status.type}`}>{status.message}</p>}
            </form>

            <div className="result-display">
              {!result ? (
                <div className="result-placeholder">
                  <FaAward />
                  <h3>Your result will appear here</h3>
                  <p>Use the form to search the 2026 Dreamway final results.</p>
                </div>
              ) : (
                <div className="result-sheet">
                  <div className="result-sheet-header">
                    <img src="/media/dreamway-logo.jpg" alt="Dreamway logo" />
                    <div>
                      <span>Dreamway Examination {result.exam_year}</span>
                      <h2>{result.full_name}</h2>
                      <p>Index: {result.index_number} • {result.stream}</p>
                    </div>
                  </div>

                  <div className="subject-results">
                    {subjects.map((subject) => (
                      <div key={subject.name}>
                        <span>{subject.name}</span>
                        <strong>{subject.mark}</strong>
                        <em>{subject.grade}</em>
                      </div>
                    ))}
                  </div>

                  <div className="result-summary">
                    <div><span>Z Average</span><strong>{result.z_average == null ? "Not available" : Number(result.z_average).toFixed(4)}</strong></div>
                    <div><span>Rank</span><strong>{result.rank_number ?? "Not available"}</strong></div>
                  </div>
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

export default Results;
