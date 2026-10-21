import React from "react";
import copy from "../locales/buyerOverview.en.json";
import { LANDING_PAGE_CONFIG } from "../landingPageConfig";
import { MARKETING_EVENTS, MARKETING_PLACEMENTS } from "../marketingAnalytics";

/**
 * Explains assisted purchase and provides the shareable buyer overview.
 * @param {Object} props - Component properties.
 * @param {Function} props.onTrack - Centralized privacy-safe event callback.
 * @returns {React.ReactElement} Purchase expectations and buyer download.
 */
export default function PurchaseHandoff({ onTrack }) {
  return (
    <div className="shell buyer-handoff">
      <h3>{copy.handoffTitle}</h3>
      <div className="methodology-grid">
        {copy.steps.map((step) => (
          <article key={step.title}><h4>{step.title}</h4><p>{step.body}</p></article>
        ))}
      </div>
      <a className="pricing-action" href={LANDING_PAGE_CONFIG.buyerOverviewUrl}
        target="_blank" rel="noopener noreferrer"
        onClick={() => onTrack(MARKETING_EVENTS.buyerOverviewOpened, { placement: MARKETING_PLACEMENTS.pricing })}>
        {copy.downloadLabel}
      </a>
      <p className="buyer-overview-note">{copy.terms}</p>
    </div>
  );
}
