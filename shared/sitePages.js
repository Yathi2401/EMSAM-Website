export const sitePages = {
  "/": [
    "EMSAM | Engineering & Medical Students Association",
    "Student services, Dreamway examinations and Pathfinder guidance from EMSAM, Mullaitivu.",
  ],
  "/about": [
    "About EMSAM",
    "Meet the Engineering and Medical Students Association of Mullaitivu and learn about our work.",
  ],
  "/dreamway": [
    "Dreamway Examinations | EMSAM",
    "Examination programmes, seminars and learning resources for A/L students.",
  ],
  "/pathfinder": [
    "Pathfinder Career Guidance | EMSAM",
    "Explore EMSAM career guidance, university pathways and student programmes.",
  ],
  "/past-papers": [
    "Past Papers | EMSAM",
    "Find Dreamway past papers by subject, stream, year and paper type.",
  ],
  "/results": [
    "Examination Results | EMSAM",
    "Look up a Dreamway result using the examination year, stream and index number.",
  ],
  "/announcements": [
    "News & Announcements | EMSAM",
    "Read the latest EMSAM programme announcements and examination notices.",
  ],
  "/admissions": [
    "Examination Admissions | EMSAM",
    "View the current Dreamway intake and apply for an examination.",
  ],
  "/contact": [
    "Contact EMSAM",
    "Contact EMSAM about examinations, student services or a privacy request.",
  ],
  "/privacy": [
    "Privacy & Your Data | EMSAM",
    "Learn how EMSAM uses account, admission and payment information and contact us about your data.",
  ],
  "/login": ["Log In | EMSAM", "Log in to your EMSAM account.", false],
  "/register": ["Create an Account | EMSAM", "Create your EMSAM student account.", false],
  "/forgot-password": [
    "Password Recovery | EMSAM",
    "Request a password reset for your EMSAM account.",
    false,
  ],
  "/reset-password": [
    "Reset Password | EMSAM",
    "Choose a new password for your EMSAM account.",
    false,
  ],
  "/dashboard": ["Student Dashboard | EMSAM", "Manage your EMSAM profile.", false],
  "/admin": ["Administration | EMSAM", "EMSAM administration workspace.", false],
  "/admin/admissions": [
    "Manage Admissions | EMSAM",
    "EMSAM examination admissions workspace.",
    false,
  ],
};
export function siteOrigin(value = "https://emsam-website.vercel.app") {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("Site URL must be an HTTPS origin.");
  return url.origin;
}
