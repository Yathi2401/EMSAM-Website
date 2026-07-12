import { FaFacebookF, FaInstagram, FaTelegramPlane, FaWhatsapp } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./SiteFooter.css";

const socialLinks = [
  {
    name: "Facebook",
    note: "EMSAM updates",
    url: "https://www.facebook.com/share/1B4k8YdiPM/?mibextid=wwXIfr",
    icon: <FaFacebookF />,
    className: "facebook",
  },
  {
    name: "Instagram",
    note: "Activities & photos",
    url: "https://www.instagram.com/emsam_2020?igsh=MWxqdmJxb2d2cW9ybg==",
    icon: <FaInstagram />,
    className: "instagram",
  },
  {
    name: "WhatsApp",
    note: "Join community",
    url: "https://chat.whatsapp.com/LZCMu324Ej0JXx1PYqzocl",
    icon: <FaWhatsapp />,
    className: "whatsapp",
  },
  {
    name: "Telegram",
    note: "Dreamway news",
    url: "https://t.me/dream_way2023",
    icon: <FaTelegramPlane />,
    className: "telegram",
  },
];

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid"></div>
      <div className="footer-inner">
        <div className="footer-about">
          <div className="footer-brand">
            <img src="/media/emsam-logo.jpg" alt="EMSAM logo" />
            <div>
              <h2>EMSAM</h2>
              <p>Engineering & Medical Students Association of Mullaitivu</p>
            </div>
          </div>
          <p className="footer-summary">
            Supporting students through examinations, educational resources,
            career guidance, university guidance and community service.
          </p>
        </div>

        <div className="footer-column">
          <h3>Explore</h3>
          <Link to="/about">About EMSAM</Link>
          <Link to="/dreamway">Dreamway</Link>
          <Link to="/pathfinder">Pathfinder</Link>
          <Link to="/announcements">Announcements</Link>
        </div>

        <div className="footer-column">
          <h3>Students</h3>
          <Link to="/past-papers">Past Papers</Link>
          <Link to="/results">Results</Link>
          <Link to="/register">Create Account</Link>
          <Link to="/contact">Contact EMSAM</Link>
        </div>

        <div className="footer-social">
          <h3>Stay Connected</h3>
          <div className="social-grid">
            {socialLinks.map((item) => (
              <a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className={`social-card ${item.className}`}
              >
                <span>{item.icon}</span>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.note}</small>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 Engineering & Medical Students Association of Mullaitivu. All rights reserved.
      </div>
    </footer>
  );
}

export default SiteFooter;
