import { useState } from "react";
import { FaBars, FaChevronDown, FaTimes } from "react-icons/fa";
import { Link, NavLink } from "react-router-dom";
import { getCurrentUser } from "../services/api";
import "./SiteNavbar.css";

function SiteNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const user = getCurrentUser();

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="site-header">
      <nav className="site-navbar">
        <Link to="/" className="site-brand" onClick={closeMenu}>
          <img src="/media/emsam-logo.jpg" alt="EMSAM logo" />
          <span>EMSAM</span>
        </Link>

        <button
          type="button"
          className="menu-button"
          aria-label="Open navigation menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`site-nav-links ${menuOpen ? "open" : ""}`}>
          <NavLink to="/" onClick={closeMenu}>Home</NavLink>
          <NavLink to="/about" onClick={closeMenu}>About</NavLink>
          <NavLink to="/dreamway" onClick={closeMenu}>Dreamway</NavLink>
          <NavLink to="/pathfinder" onClick={closeMenu}>Pathfinder</NavLink>
          <NavLink to="/past-papers" onClick={closeMenu}>Papers</NavLink>
          <NavLink to="/results" onClick={closeMenu}>Results</NavLink>

          <div className="more-menu">
            <button type="button">
              More <FaChevronDown />
            </button>
            <div className="more-dropdown">
              <NavLink to="/announcements" onClick={closeMenu}>Announcements</NavLink>
              <NavLink to="/contact" onClick={closeMenu}>Contact</NavLink>
            </div>
          </div>
        </div>

        <Link
          to={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/login"}
          className="nav-login"
          onClick={closeMenu}
        >
          {user ? "Dashboard" : "Login"}
        </Link>
      </nav>
    </header>
  );
}

export default SiteNavbar;
