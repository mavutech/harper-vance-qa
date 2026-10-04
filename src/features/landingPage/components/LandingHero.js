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
  const record = messages.hero.record;

  return (
    <section className="hero" id="top">
      <div className="hero-grid" aria-hidden="true" />
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

        <aside className="target-record" aria-label={record.label}>
          <div className="record-header">
            <div><span className="record-kicker">{record.label}</span><strong>{record.instrument}</strong></div>
            <span className="record-badge">{record.sample}</span>
          </div>
          <div className="record-flow">
            <div><span>{record.issuedLabel}</span><strong>{record.issued}</strong></div>
            <span className="flow-rule" aria-hidden="true"><i /><i /><i /></span>
            <div><span>{record.targetLabel}</span><strong>{record.target}</strong></div>
            <div><span>{record.outcomeLabel}</span><strong>{record.outcome}</strong></div>
          </div>
          <div className="record-status"><span>{record.classification}</span><strong><i aria-hidden="true" />{record.status}</strong></div>
          <dl className="record-details">
            <div><dt>{record.issuedLabel}</dt><dd>{record.issued}</dd></div>
            <div><dt>{record.directionLabel}</dt><dd>{record.direction}</dd></div>
            <div><dt>{record.targetLabel}</dt><dd>{record.target}</dd></div>
          </dl>
          <p className="record-footnote">{record.footnote}</p>
        </aside>
      </div>
    </section>
  );
}
