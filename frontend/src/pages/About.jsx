import PosterImage from "../components/PosterImage";
import { FaHandsHelping, FaLightbulb, FaStar, FaUsers } from "react-icons/fa";
import PageHero from "../components/PageHero";
import SiteFooter from "../components/SiteFooter";
import SiteNavbar from "../components/SiteNavbar";
import "./About.css";

const values = [
  { icon: <FaUsers />, title: "Unity", text: "Bringing students and volunteers together for a shared purpose." },
  { icon: <FaLightbulb />, title: "Knowledge", text: "Creating access to learning, academic support and guidance." },
  { icon: <FaHandsHelping />, title: "Service", text: "Supporting students and the Mullaitivu community responsibly." },
  { icon: <FaStar />, title: "Excellence", text: "Maintaining high standards in every EMSAM programme." },
];

function About() {
  return (
    <div className="about-page">
      <SiteNavbar />
      <main>
        <PageHero
          eyebrow="About Our Association"
          title="EMSAM"
          description="The Engineering and Medical Students Association of Mullaitivu is a student-led organisation that supports education, guidance, leadership and community service."
          image="/media/emsam-banner.jpg"
        />

        <section className="about-story">
          <div className="section-shell about-story-grid">
            <div className="about-story-copy">
              <p className="about-label">Our Story</p>
              <h2>Serving Students Since 2020</h2>
              <p>
                EMSAM was established to connect engineering and medical students
                from Mullaitivu and to use their knowledge and experience to support
                younger students. The association has grown through volunteer service,
                academic programmes and strong community participation.
              </p>
              <p>
                Dreamway provides examination support for A/L students, while
                Pathfinder helps students understand university opportunities and
                future career choices. Together, these programmes create a clear path
                from school education to higher education and professional development.
              </p>
            </div>
            <PosterImage
              src="/media/5-years-celebration.jpg"
              alt="Five years of Dreamway examination support"
              className="about-journey-image"
            />
          </div>
        </section>

        <section className="about-values-section">
          <div className="section-shell">
            <div className="section-heading light-heading">
              <p className="eyebrow">What Guides Us</p>
              <h2>Our Core Values</h2>
              <p>These four values guide how EMSAM plans, serves and grows.</p>
            </div>
            <div className="about-values-grid">
              {values.map((value, index) => (
                <article key={value.title} className="about-value-card">
                  <span className="about-value-number">0{index + 1}</span>
                  <div className="about-value-icon">{value.icon}</div>
                  <h3>{value.title}</h3>
                  <p>{value.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-impact">
          <div className="section-shell">
            <div className="section-heading">
              <p className="eyebrow">Our Impact</p>
              <h2>Growing With Our Student Community</h2>
            </div>
            <div className="about-impact-grid">
              <div><strong>2020</strong><span>Established</span></div>
              <div><strong>1000+</strong><span>Students Participated</span></div>
              <div><strong>15+</strong><span>Schools Covered</span></div>
              <div><strong>100+</strong><span>Volunteer Members</span></div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default About;
