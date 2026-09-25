import PosterImage from "../components/PosterImage";
import { FaBookOpen, FaCalendarAlt, FaChartLine, FaClipboardCheck, FaDownload } from "react-icons/fa";
import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import SiteFooter from "../components/SiteFooter";
import SiteNavbar from "../components/SiteNavbar";
import "./Dreamway.css";

function Dreamway() {
  return (
    <div className="dreamway-page">
      <SiteNavbar />
      <main>
        <PageHero
          eyebrow="A/L Practice Examination Programme"
          title="Dreamway"
          description="A structured examination support programme for G.C.E. Advanced Level Physical Science and Biological Science students in Mullaitivu."
          image="/media/5-years-celebration.jpg"
        >
          <div className="dreamway-hero-actions">
            <Link to="/past-papers" className="primary-button"><FaDownload /> Past Papers</Link>
            <Link to="/results" className="secondary-button">Check Results</Link>
          </div>
        </PageHero>

        <section className="dreamway-intro">
          <div className="section-shell">
            <div className="section-heading">
              <p className="eyebrow">Five Years of Examination Support</p>
              <h2>Prepare With Confidence</h2>
              <p>
                Dreamway gives students an examination experience similar to the A/L
                examination while providing resources that support improvement after each paper.
              </p>
            </div>

            <div className="dreamway-stream-grid">
              <article>
                <span>01</span>
                <h3>Physical Science</h3>
                <ul>
                  <li>Combined Mathematics</li>
                  <li>Physics</li>
                  <li>Chemistry</li>
                </ul>
              </article>
              <article>
                <span>02</span>
                <h3>Biological Science</h3>
                <ul>
                  <li>Biology</li>
                  <li>Physics</li>
                  <li>Chemistry</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="dreamway-services">
          <div className="section-shell">
            <div className="section-heading light-heading">
              <p className="eyebrow">Student Services</p>
              <h2>Everything in One Platform</h2>
            </div>
            <div className="dreamway-service-grid">
              <Link to="/past-papers"><FaBookOpen /><h3>Past Papers</h3><p>Question papers and marking schemes from 2023 to 2026.</p></Link>
              <Link to="/results"><FaChartLine /><h3>Results</h3><p>Search the 2026 final results securely using index number and stream.</p></Link>
              <a href="#timetable"><FaCalendarAlt /><h3>Timetable</h3><p>View the latest examination schedule and important dates.</p></a>
              <Link to="/register"><FaClipboardCheck /><h3>Student Account</h3><p>Create an account for future online examination registrations.</p></Link>
            </div>
          </div>
        </section>

        <section className="dreamway-posters" id="timetable">
          <div className="section-shell">
            <div className="section-heading">
              <p className="eyebrow">Dreamway 2026</p>
              <h2>Latest Examination Information</h2>
            </div>
            <div className="dreamway-poster-grid">
              <figure><PosterImage src="/media/dreamway-timetable-2026.jpg" alt="Dreamway 2026 timetable" /><figcaption>Examination Timetable</figcaption></figure>
              <figure><PosterImage src="/media/dreamway-results-2026.jpg" alt="Dreamway 2026 results announcement" /><figcaption>Results Announcement</figcaption></figure>
              <figure><PosterImage src="/media/dreamway-seminar-2026.jpg" alt="Dreamway 2026 seminar details" /><figcaption>Academic Seminar</figcaption></figure>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default Dreamway;
