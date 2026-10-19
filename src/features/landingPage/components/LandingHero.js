import React from "react";
import messages from "../locales/en.json";
import { getAccessRequestUrl } from "../landingPageConfig";
import { MARKETING_EVENTS, MARKETING_PLACEMENTS } from "../marketingAnalytics";

/**
 * Renders the primary value proposition and access-first action hierarchy.
 *
 * @param {Object} props - Component properties.
 * @param {(eventName: string, params?: Object) => void} props.onTrack - Records a privacy-safe event.
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
                onClick={() => onTrack(MARKETING_EVENTS.requestAccessClicked, { placement: MARKETING_PLACEMENTS.hero })}
              >
                {messages.common.requestAccess}
              </a>
            )}
            <a className="button button-outline" href="#sample" onClick={() => onTrack(MARKETING_EVENTS.reportRequestClicked, { placement: MARKETING_PLACEMENTS.hero })}>
              {messages.common.requestSample}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
