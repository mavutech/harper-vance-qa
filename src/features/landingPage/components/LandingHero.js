import React from "react";
import messages from "../locales/en.json";
import { getAccessRequestUrl, LANDING_PAGE_CONFIG } from "../landingPageConfig";
import { MARKETING_EVENTS, MARKETING_PLACEMENTS } from "../marketingAnalytics";

/**
 * Renders the buyer outcome with access and included-product exploration actions.
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
                href={getAccessRequestUrl()}
                onClick={() => onTrack(MARKETING_EVENTS.requestAccessClicked, { placement: MARKETING_PLACEMENTS.hero })}
              >
                {messages.common.requestAccess}
              </a>
            <a className="button button-outline" href={LANDING_PAGE_CONFIG.productAnchor} onClick={() => onTrack(MARKETING_EVENTS.productExplored, { placement: MARKETING_PLACEMENTS.hero })}>
              {messages.common.exploreProduct}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
