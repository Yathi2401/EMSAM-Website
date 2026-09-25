import { Route, Routes } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import About from "./pages/About";
import AdminDashboard from "./pages/AdminDashboard";
import Announcements from "./pages/Announcements";
import Contact from "./pages/Contact";
import Dreamway from "./pages/Dreamway";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import PastPapers from "./pages/PastPapers";
import Pathfinder from "./pages/Pathfinder";
import Register from "./pages/Register";
import Results from "./pages/Results";
import StudentDashboard from "./pages/StudentDashboard";

import ScrollReveal from "./components/ScrollReveal";
import "./motion.css";

function App() {
  return (
    <>
      <ScrollToTop />
      <ScrollReveal />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/dreamway" element={<Dreamway />} />
        <Route path="/pathfinder" element={<Pathfinder />} />
        <Route path="/past-papers" element={<PastPapers />} />
        <Route path="/results" element={<Results />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
