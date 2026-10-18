import React from "react";
import messages from "../locales/en.json";
import { getAccessRequestUrl } from "../landingPageConfig";

/**
 * Renders the primary value proposition and access-first action hierarchy.
 *
 * @param {Object} props - Component properties.
 * @param {(eventName: string) => void} props.onTrack - Records a privacy-safe link event.
 * @returns {React.ReactElement} Landing page hero.
 */
export default function LandingHero({ onTrack }) {
  const accessRequestUrl = getAccessRequestUrl();

  return (
    <section className="hero" id="top">
      <div className="hero-shade" aria-hidden="true" />
      <div className="shell hero-layout">
        <div className="hero-copy">
          <p className="eyebrow">{messages.hero.eyebrow}</p>
          <h1>{messages.hero.title}</h1>
          <p className="hero-lede">{messages.hero.description}</p>
          <div className="hero-actions">
            {accessRequestUrl && (
              <a
                className="button button-primary"
                href={accessRequestUrl}
                onClick={() => onTrack("hero_access_request")}
              >
                {messages.common.requestAccess}
              </a>
            )}
            <a className="button button-outline" href="#sample" onClick={() => onTrack("hero_latest_report_selected")}>
              {messages.common.requestSample}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
