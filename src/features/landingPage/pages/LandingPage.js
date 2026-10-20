import React, { useEffect, useState } from "react";
import LandingFooter from "../components/LandingFooter";
import LandingHeader from "../components/LandingHeader";
import LandingHero from "../components/LandingHero";
import LandingSections from "../components/LandingSections";
import SampleRequestSection from "../components/SampleRequestSection";
import { updatePageSEO } from "../../../config/seoConfig";
import { trackEvent } from "../../../utils/analytics";
import messages from "../locales/en.json";
import { MARKETING_EVENTS } from "../marketingAnalytics";
import "./LandingPage.scss";

/**
 * Records a privacy-safe landing page link interaction.
 *
 * @param {string} eventName - Approved analytics event name.
 * @param {Object} [params] - Approved non-identifying event values.
 * @returns {void}
 */
function trackLandingLink(eventName, params) {
  trackEvent(eventName, params);
}

/**
 * Renders the public Harper Vance service landing page.
 *
 * @returns {React.ReactElement} Product-first service page.
 */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  useEffect(() => {
    const sectionId = window.location.hash.slice(1);
    if (!["sample", "evidence", "pricing", "product", "evaluation"].includes(sectionId)) return undefined;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    updatePageSEO("landing");
    trackEvent(MARKETING_EVENTS.homeViewed);

    const html = document.documentElement;
    const previousSkin = html.getAttribute("data-skin");
    html.removeAttribute("data-skin");

    return () => {
      const persistedSkin = localStorage.getItem("skin-mode");
      if (persistedSkin === "dark") html.setAttribute("data-skin", "dark");
      else if (previousSkin) html.setAttribute("data-skin", previousSkin);
    };
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const pricing = document.getElementById("pricing");
    if (!pricing) return undefined;
    let recorded = false;
    const observer = new IntersectionObserver((entries) => {
      if (!recorded && entries.some((entry) => entry.isIntersecting)) {
        recorded = true;
        trackEvent(MARKETING_EVENTS.planViewed, { section: "pricing" });
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(pricing);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateHeader = () => setHeaderScrolled(window.scrollY > 16);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <div className="hv-landing">
      <a className="skip-link" href="#main">{messages.common.skipToContent}</a>
      <LandingHeader
        menuOpen={menuOpen}
        scrolled={headerScrolled}
        onMenuToggle={() => setMenuOpen((open) => !open)}
        onMenuClose={() => setMenuOpen(false)}
        onTrack={trackLandingLink}
      />
      <main id="main">
        <LandingHero onTrack={trackLandingLink} />
        <LandingSections onTrack={trackLandingLink} />
        <SampleRequestSection />
      </main>
      <LandingFooter onTrack={trackLandingLink} />
    </div>
  );
}
