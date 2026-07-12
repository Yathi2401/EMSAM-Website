import { useState } from "react";
import { FaFacebookF, FaInstagram, FaTelegramPlane, FaWhatsapp } from "react-icons/fa";
import PageHero from "../components/PageHero";
import SiteFooter from "../components/SiteFooter";
import SiteNavbar from "../components/SiteNavbar";
import { apiRequest } from "../services/api";
import "./Contact.css";

function Contact() {
  const [form, setForm] = useState({ fullName: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const data = await apiRequest("/contact", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setStatus({ type: "success", message: data.message });
      setForm({ fullName: "", email: "", subject: "", message: "" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="contact-page">
      <SiteNavbar />
      <main>
        <PageHero
          eyebrow="Connect With EMSAM"
          title="Contact Us"
          description="Send questions about Dreamway, Pathfinder, student resources or association activities."
          image="/media/emsam-banner.jpg"
        />

        <section className="contact-section">
          <div className="section-shell contact-layout">
            <div className="contact-information">
              <p className="contact-label">Get in Touch</p>
              <h2>We Are Here to Support Students</h2>
              <p>
                EMSAM is based in Mullaitivu, Sri Lanka. Use the form or connect through our official social-media communities.
              </p>

              <div className="contact-info-cards">
                <div><strong>Location</strong><span>Mullaitivu, Sri Lanka</span></div>
                <div><strong>Organisation</strong><span>Engineering & Medical Students Association</span></div>
                <div><strong>Established</strong><span>2020</span></div>
              </div>

              <div className="contact-socials">
                <a href="https://www.facebook.com/share/1B4k8YdiPM/?mibextid=wwXIfr" target="_blank" rel="noreferrer" className="facebook"><FaFacebookF /></a>
                <a href="https://www.instagram.com/emsam_2020?igsh=MWxqdmJxb2d2cW9ybg==" target="_blank" rel="noreferrer" className="instagram"><FaInstagram /></a>
                <a href="https://chat.whatsapp.com/LZCMu324Ej0JXx1PYqzocl" target="_blank" rel="noreferrer" className="whatsapp"><FaWhatsapp /></a>
                <a href="https://t.me/dream_way2023" target="_blank" rel="noreferrer" className="telegram"><FaTelegramPlane /></a>
              </div>
            </div>

            <form className="contact-form" onSubmit={handleSubmit}>
              <h3>Send a Message</h3>
              <label htmlFor="fullName">Full Name</label>
              <input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} required />
              <label htmlFor="email">Email Address</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
              <label htmlFor="subject">Subject</label>
              <input id="subject" name="subject" value={form.subject} onChange={handleChange} required />
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" rows="6" value={form.message} onChange={handleChange} required />
              <button type="submit" disabled={loading}>{loading ? "Sending..." : "Send Message"}</button>
              {status.message && <p className={`form-status ${status.type}`}>{status.message}</p>}
            </form>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default Contact;
