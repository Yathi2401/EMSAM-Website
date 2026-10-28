import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { sitePages, siteOrigin } from "../../../shared/sitePages.js";

export default function PageMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const path = pathname.replace(/\/$/, "") || "/";
    const [title, description, index = true] = sitePages[path] || [
      "Page Not Found | EMSAM",
      "This page could not be found.",
      false,
    ];
    const canonical = siteOrigin(import.meta.env.VITE_SITE_URL) + (path === "/" ? "/" : path);
    document.title = title;
    function meta(attribute, name, content) {
      let tag = document.head.querySelector(`meta[${attribute}="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attribute, name);
        document.head.appendChild(tag);
      }
      tag.content = content;
    }
    meta("name", "description", description);
    meta("name", "robots", index ? "index,follow" : "noindex,nofollow");
    meta(
      "name",
      "referrer",
      path === "/reset-password" ? "no-referrer" : "strict-origin-when-cross-origin",
    );
    for (const [name, value] of Object.entries({
      "og:title": title,
      "og:description": description,
      "og:url": canonical,
    }))
      meta("property", name, value);
    meta("name", "twitter:title", title);
    meta("name", "twitter:description", description);
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;
  }, [pathname]);
  return null;
}
