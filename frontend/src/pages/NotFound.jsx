import { Link } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import SiteNavbar from "../components/SiteNavbar";

function NotFound() {
  return (
    <div>
      <SiteNavbar />
      <main style={{ minHeight: "75vh", padding: "150px 20px 90px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", textAlign: "center", background: "linear-gradient(125deg,#020b17,#061a32,#0a315d)" }}>
        <div>
          <p style={{ color: "#d8a63a", fontWeight: 900, letterSpacing: "2px" }}>404</p>
          <h1 style={{ fontSize: "54px", margin: "10px 0" }}>Page Not Found</h1>
          <p style={{ color: "#c5d2df", marginBottom: "28px" }}>The page you requested does not exist.</p>
          <Link to="/" className="primary-button">Return Home</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default NotFound;
