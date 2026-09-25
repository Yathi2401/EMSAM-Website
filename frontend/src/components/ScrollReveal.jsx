import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const targets = [
  ".section-heading", ".home-about-copy", ".home-about-image", ".about-story-copy",
  ".programme-card", ".news-card", ".announcement-card", ".paper-card",
  ".about-value-card", ".about-impact-grid > div", ".dreamway-stream-grid > article",
  ".dreamway-service-grid > a", ".dreamway-poster-grid > figure",
  ".pathfinder-focus-grid > article", ".gallery-grid > img", ".pathfinder-photo-grid > img",
  ".result-sheet", ".form-status",
].join(",");

export default function ScrollReveal() {
  const { pathname } = useLocation();

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main || !window.IntersectionObserver || !Element.prototype.animate) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const seen = new WeakSet();
    const animations = new Set();
    const observer = new IntersectionObserver(entries => {
      let order = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (preference.matches || entry.target.contains(document.activeElement)) continue;
        const animation = entry.target.animate([
          { opacity: 0.2, translate: "0 18px" },
          { opacity: 1, translate: "0 0" },
        ], {
          duration: 550,
          delay: Math.min(order++ * 55, 165),
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "backwards",
        });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      }
    }, { threshold: 0.08 });

    function observeContent() {
      main.querySelectorAll(targets).forEach(element => {
        if (seen.has(element)) return;
        seen.add(element);
        observer.observe(element);
      });
    }
    function cancelMotion() {
      if (!preference.matches) return;
      animations.forEach(animation => animation.cancel());
      animations.clear();
    }
    // Include cards/results arriving after an API response. Content is never hidden in CSS.
    const updates = new MutationObserver(observeContent);
    updates.observe(main, { childList: true, subtree: true });
    observeContent();
    preference.addEventListener("change", cancelMotion);
    return () => {
      observer.disconnect();
      updates.disconnect();
      animations.forEach(animation => animation.cancel());
      preference.removeEventListener("change", cancelMotion);
    };
  }, [pathname]);

  return null;
}
