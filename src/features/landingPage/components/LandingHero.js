import React from "react";
import messages from "../locales/en.json";
import { LANDING_PAGE_CONFIG } from "../landingPageConfig";
import { MARKETING_EVENTS, MARKETING_PLACEMENTS } from "../marketingAnalytics";

/**
 * Renders the buyer outcome with report request and immediate format exploration.
 *
 * @param {Object} props - Component properties.
 * @param {(eventName: string, params?: Object) => void} props.onTrack - Records a privacy-safe event.
 * @returns {React.ReactElement} Landing page hero.
 */
export default function LandingHero({ onTrack }) {
  return (
    <section className="hero" id="top">
      <div className="hero-shade" aria-hidden="true" />
      <div className="shell hero-layout">
        <div className="hero-copy">
          <p className="eyebrow">{messages.hero.eyebrow}</p>
          <h1>{messages.hero.title}</h1>
          <p className="hero-lede">{messages.hero.description}</p>
          <div className="hero-actions">
              <a
                className="button button-primary"
                href={LANDING_PAGE_CONFIG.sampleAnchor}
                onClick={() => onTrack(MARKETING_EVENTS.reportRequestClicked, { placement: MARKETING_PLACEMENTS.hero })}
              >
                {messages.common.requestSample}
              </a>
            <a className="button button-outline" href={LANDING_PAGE_CONFIG.evidenceAnchor} onClick={() => onTrack(MARKETING_EVENTS.reportFormatOpened, { placement: MARKETING_PLACEMENTS.hero })}>
              {messages.common.exploreSample}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
