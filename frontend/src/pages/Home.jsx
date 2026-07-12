import { useEffect, useState } from "react";
import { FaArrowRight, FaBookOpen, FaCalendarAlt, FaGraduationCap } from "react-icons/fa";
import { Link } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import SiteNavbar from "../components/SiteNavbar";
import { apiRequest } from "../services/api";
import "./Home.css";

const galleryImages = [
  "/media/seminarphoto1-2026.jpg",
  "/media/seminarphoto2-2026.jpg",
  "/media/seminarphoto3-2026.jpg",
  "/media/seminarphoto4-2026.jpg",
];

function Home() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    apiRequest("/announcements")
      .then((data) => setAnnouncements(data.slice(0, 3)))
      .catch(() => setAnnouncements([]));
  }, []);

  return (
    <div className="home-page">
      <SiteNavbar />

      <main>
        <section className="home-hero">
          <div className="home-grid"></div>
          <div className="home-hero-inner">
            <div className="home-copy">
              <p className="home-eyebrow">Established 2020 • Mullaitivu</p>
              <h1>
                Empowering Minds.
                <strong>Building Futures.</strong>
              </h1>
              <p className="home-intro">
                The official digital platform of the Engineering and Medical
                Students Association of Mullaitivu, supporting students through
                examinations, career guidance, university guidance and community service.
              </p>

              <div className="home-actions">
                <Link to="/dreamway" className="primary-button">
                  Explore Dreamway <FaArrowRight />
                </Link>
                <Link to="/pathfinder" className="secondary-button">
                  Discover Pathfinder
                </Link>
              </div>

              <div className="home-stats">
                <div><strong>1000+</strong><span>Students Supported</span></div>
                <div><strong>15+</strong><span>Schools Covered</span></div>
                <div><strong>100+</strong><span>Volunteer Members</span></div>
              </div>
            </div>

            <div className="home-logo-area">
              <div className="home-ring ring-one"></div>
              <div className="home-ring ring-two"></div>
              <img src="/media/emsam-logo.jpg" alt="EMSAM official emblem" />
            </div>
          </div>
        </section>

        <section className="home-about">
          <div className="section-shell home-about-grid">
            <div className="home-about-image">
              <img src="/media/emsam-banner.jpg" alt="EMSAM association banner" />
            </div>
            <div className="home-about-copy">
              <p className="eyebrow">About EMSAM</p>
              <h2>A Student Association Built Around Service</h2>
              <p>
                EMSAM is a student-led organisation that creates opportunities for
                A/L students and young people in Mullaitivu. Our work connects
                education, professional guidance, volunteer service and leadership.
              </p>
              <div className="home-values">
                <span>Unity</span>
                <span>Knowledge</span>
                <span>Service</span>
                <span>Excellence</span>
              </div>
              <Link to="/about" className="dark-link">
                Learn more about EMSAM <FaArrowRight />
              </Link>
            </div>
          </div>
        </section>

        <section className="home-programmes">
          <div className="section-shell">
            <div className="section-heading light-heading">
              <p className="eyebrow">Our Main Programmes</p>
              <h2>Academic Support and Future Guidance</h2>
              <p>
                The homepage provides a short introduction. Each programme has its
                own dedicated page with full information and student services.
              </p>
            </div>

            <div className="programme-grid">
              <article className="programme-card dreamway-card">
                <img src="/media/5-years-celebration.jpg" alt="Five years of Dreamway" />
                <div className="programme-card-content">
                  <span><FaBookOpen /> Examination Support</span>
                  <h3>Dreamway</h3>
                  <p>
                    Practice examinations, past papers, timetables and results for
                    Physical Science and Biological Science students.
                  </p>
                  <Link to="/dreamway">View Dreamway <FaArrowRight /></Link>
                </div>
              </article>

              <article className="programme-card pathfinder-card">
                <img src="/media/pathfinder-poster-1.jpg" alt="Pathfinder 2.0 programme" />
                <div className="programme-card-content">
                  <span><FaGraduationCap /> Career Guidance</span>
                  <h3>Pathfinder</h3>
                  <p>
                    Career awareness, university course information and support for
                    completing university preference applications.
                  </p>
                  <Link to="/pathfinder">View Pathfinder <FaArrowRight /></Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="home-gallery">
          <div className="section-shell">
            <div className="section-heading">
              <p className="eyebrow">2026 Activities</p>
              <h2>Learning, Guidance and Community</h2>
              <p>
                Moments from our recent examination and Pathfinder seminar activities.
              </p>
            </div>
            <div className="gallery-grid">
              {galleryImages.map((image, index) => (
                <img key={image} src={image} alt={`EMSAM activity ${index + 1}`} />
              ))}
            </div>
          </div>
        </section>

        <section className="home-news">
          <div className="section-shell">
            <div className="section-heading">
              <p className="eyebrow">Latest Updates</p>
              <h2>Announcements for Students</h2>
            </div>

            <div className="news-grid">
              {announcements.length > 0 ? (
                announcements.map((item) => (
                  <article className="news-card" key={item.id}>
                    <span>{item.category}</span>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <Link to="/announcements">Read more <FaArrowRight /></Link>
                  </article>
                ))
              ) : (
                <article className="news-card">
                  <span><FaCalendarAlt /> EMSAM</span>
                  <h3>Latest updates will appear here</h3>
                  <p>
                    Start the backend and complete the database setup to load live announcements.
                  </p>
                  <Link to="/announcements">View announcements</Link>
                </article>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

export default Home;
