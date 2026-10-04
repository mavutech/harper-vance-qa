import React, { useEffect, useState } from "react";
import LandingFooter from "../components/LandingFooter";
import LandingHeader from "../components/LandingHeader";
import LandingHero from "../components/LandingHero";
import LandingSections from "../components/LandingSections";
import SampleRequestSection from "../components/SampleRequestSection";
import { updatePageSEO } from "../../../config/seoConfig";
import { trackEvent } from "../../../utils/analytics";
import messages from "../locales/en.json";
import "./LandingPage.scss";

/**
 * Records a privacy-safe landing page link interaction.
 *
 * @param {string} eventName - Approved analytics event name.
 * @returns {void}
 */
function trackLandingLink(eventName) {
  trackEvent(eventName);
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
    updatePageSEO("landing");
    trackEvent("landing_page_viewed");

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
