import { FaBriefcase, FaFileAlt, FaGraduationCap } from "react-icons/fa";
import PageHero from "../components/PageHero";
import SiteFooter from "../components/SiteFooter";
import SiteNavbar from "../components/SiteNavbar";
import "./Pathfinder.css";

function Pathfinder() {
  return (
    <div className="pathfinder-page">
      <SiteNavbar />
      <main>
        <PageHero
          eyebrow="Career and University Guidance"
          title="Pathfinder 2.0"
          description="Helping A/L Physical Science and Biological Science students discover university courses, career pathways and the correct university application process."
          image="/media/pathfinder-poster-1.jpg"
        />

        <section className="pathfinder-focus">
          <div className="section-shell">
            <div className="section-heading">
              <p className="eyebrow">What Students Explore</p>
              <h2>Discover. Decide. Succeed.</h2>
              <p>
                Pathfinder turns a complex university decision into a clear and practical process.
              </p>
            </div>
            <div className="pathfinder-focus-grid">
              <article><FaGraduationCap /><h3>University Courses</h3><p>Degree options, entry routes and course information for science students.</p></article>
              <article><FaFileAlt /><h3>Preference Form Guidance</h3><p>Step-by-step support for completing first and second preference selections.</p></article>
              <article><FaBriefcase /><h3>Career Pathways</h3><p>Career opportunities, professional routes and current job-market awareness.</p></article>
            </div>
          </div>
        </section>

        <section className="pathfinder-gallery">
          <div className="section-shell pathfinder-gallery-grid">
            <div className="pathfinder-main-poster">
              <img src="/media/pathfinder-poster-2.jpg" alt="Pathfinder 2.0 poster" />
            </div>
            <div className="pathfinder-photo-grid">
              <img src="/media/seminarphoto1-2026.jpg" alt="Pathfinder seminar activity" />
              <img src="/media/seminarphoto2-2026.jpg" alt="Pathfinder guidance session" />
              <img src="/media/seminarphoto3-2026.jpg" alt="Pathfinder student seminar" />
              <img src="/media/seminarphoto4-2026.jpg" alt="Pathfinder presentation" />
            </div>
          </div>
        </section>

        <section className="pathfinder-cta">
          <div className="section-shell">
            <p>Guiding Minds. Building Futures.</p>
            <h2>Plan Today, Lead Tomorrow</h2>
            <span>
              Future Pathfinder registrations and resources can be managed through the EMSAM admin dashboard.
            </span>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default Pathfinder;
