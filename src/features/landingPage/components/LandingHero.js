import React from "react";
import messages from "../locales/en.json";

/**
 * Renders the primary value proposition and an illustrative target record.
 *
 * @param {Object} props - Component properties.
 * @param {(eventName: string) => void} props.onTrack - Records a privacy-safe link event.
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
            <a className="button button-primary" href="#sample" onClick={() => onTrack("hero_sample_request")}>
              {messages.common.requestSample}
            </a>
            <a className="text-link" href="#pricing" onClick={() => onTrack("hero_view_pricing")}>
              {messages.common.viewPricing}
            </a>
          </div>
          <p className="approval-note"><span aria-hidden="true" />{messages.hero.reassurance}</p>
        </div>
      </div>
    </section>
  );
}
