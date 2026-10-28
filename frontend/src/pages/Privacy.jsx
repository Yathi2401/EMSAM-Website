import { Link } from "react-router-dom";
import SiteNavbar from "../components/SiteNavbar";
import SiteFooter from "../components/SiteFooter";
import PageHero from "../components/PageHero";

export default function Privacy() {
  return (
    <>
      <SiteNavbar />
      <main>
        <PageHero
          eyebrow="Your information"
          title="Privacy & Your Data"
          description="How EMSAM uses information provided through this website."
          image="/media/emsam-logo.jpg"
          imageVariant="logo"
        />
        <article className="privacy-copy section-shell">
          <p>
            Last updated: 25 October 2026. This notice covers the Engineering and Medical Students
            Association of Mullaitivu website.
          </p>
          <h2>Information we collect and why</h2>
          <p>
            Account details include your name, email address, password hash and optional student
            profile details. Admission applications include your NIC number, school, stream, contact
            details, examination choices, additional form answers and payment information.
            Bank-transfer applicants also upload a receipt. We use these records to manage accounts,
            organise examinations, check payments and contact applicants.
          </p>
          <p>
            Messages submitted through the contact form are stored with your name and email so EMSAM
            can respond. Password-reset links expire after 30 minutes and can be used once. Request
            limits use hashed network identifiers to help prevent abuse.
          </p>
          <h2>Who can access your information</h2>
          <p>
            Authorised EMSAM administrators can access applications, receipts and contact messages
            for association work. The site uses Vercel hosting and MongoDB database storage. When
            password recovery is enabled, the configured email provider processes your email address
            and reset message.
          </p>
          <p>
            Examination results can be looked up by anyone who knows the examination year, index
            number and stream. A student login is not required for this lookup. Announcements and
            published resources are public.
          </p>
          <h2>How long records are kept</h2>
          <p>
            EMSAM retains admission details indefinitely as examination records. Uploaded payment
            receipts are scheduled for deletion one year after submission. Payment status and other
            admission details remain after the receipt file is removed. Backup copies may remain
            until the relevant backup retention period ends.
          </p>
          <p>
            Account and contact-message records do not currently have an automatic deletion
            schedule. Contact the EMSAM President to discuss correction or deletion requests.
          </p>
          <h2>Your choices and privacy requests</h2>
          <p>
            The EMSAM President handles privacy requests.{" "}
            <Link to="/contact?subject=Privacy%20request">Send a privacy request</Link> through our
            contact page. Tell us what you want to access, correct or discuss removing. Do not
            include your password, a reset link or a copy of your NIC in the initial message. EMSAM
            may need to confirm your identity before responding.
          </p>
          <h2>Browser storage and external links</h2>
          <p>
            The website stores your login token and basic account information in your browser until
            you log out or the session is cleared. Admission retries use temporary session storage.
            External social-media links are governed by those services' own privacy practices.
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
