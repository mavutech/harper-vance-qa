import React from "react";
import { getAccessRequestUrl } from "../landingPageConfig";
import messages from "../locales/en";
import SalesEvidenceSection from "./SalesEvidenceSection";
import TargetRecord from "./TargetRecord";
import MethodologySection from "./MethodologySection";
import BuyerQuestions from "./BuyerQuestions";
import PurchaseHandoff from "./PurchaseHandoff";
import ReportGallery from "./ReportGallery";
import WalkthroughSection from "./WalkthroughSection";
import { MARKETING_EVENTS, MARKETING_PLACEMENTS } from "../marketingAnalytics";

const ARTIFACT_ICONS = ["ri-focus-3-line", "ri-file-list-3-line", "ri-calendar-check-line"];
const PRINCIPLE_ICONS = ["ri-time-line", "ri-checkbox-circle-line", "ri-stack-line"];

/**
 * Renders the three intelligence artifacts included with every license.
 *
 * @returns {React.ReactElement} Product overview section.
 */
function ProductSection() {
  return (
    <section className="product-section" id="product">
      <div className="shell artifact-grid">
        {messages.included.artifacts.map((artifact, index) => (
          <article className="artifact-card" key={artifact.number}>
            <span className="artifact-icon"><i className={ARTIFACT_ICONS[index]} aria-hidden="true" /></span>
            <h3>{artifact.title}</h3>
            <p>{artifact.description}</p>
          </article>
        ))}
      </div>
      <div className="shell product-intro">
        <div>
          <p className="eyebrow dark">{messages.included.eyebrow}</p>
          <h2>{messages.included.title}</h2>
        </div>
        <div className="product-intro-copy">
          <p>{messages.included.description}</p>
          <p className="product-qualification">{messages.included.qualification}</p>
        </div>
      </div>
    </section>
  );
}

/**
 * Explains why a preserved target record matters to an evaluating desk.
 *
 * @returns {React.ReactElement} Buyer problem section.
 */
function ProblemSection() {
  return (
    <section className="section problem-section">
      <div className="shell problem-layout">
        <TargetRecord />
        <div className="problem-copy">
          <p className="eyebrow dark">{messages.problem.eyebrow}</p>
          <h2>{messages.problem.title}</h2>
          <p>{messages.problem.description}</p>
          <strong className="belief">{messages.problem.belief}</strong>
        </div>
        <div className="record-principles">
          <span className="principles-label">{messages.hero.record.label}</span>
          {messages.problem.items.map((item, index) => (
            <div className="principle" key={item}>
              <span className="principle-icon"><i className={PRINCIPLE_ICONS[index]} aria-hidden="true" /></span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Shows how the service fits existing operations.
 *
 * @returns {React.ReactElement} Operations and evaluation section.
 */
function EvaluationSection() {
  return (
    <section className="section evaluation-section" id="evaluation">
      <div className="shell operations-intro">
        <div>
          <p className="eyebrow light">{messages.operations.eyebrow}</p>
          <h2>{messages.operations.title}</h2>
        </div>
        <p>{messages.operations.description}</p>
      </div>
      <ReportGallery />
      <div className="shell operations-layout">
        <div className="operations-copy">
          <p className="delivery-line"><strong>{messages.operations.deliveryLabel}</strong>{messages.operations.delivery}</p>
          <p className="operations-integrity">{messages.operations.integrity}</p>
          <p className="operations-boundary">{messages.operations.boundary}</p>
        </div>
        <ul className="operations-list">
          {messages.operations.items.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Renders license options without changing the underlying intelligence offer.
 *
 * @param {Object} props - Component properties.
 * @param {(eventName: string, params?: Object) => void} props.onTrack - Records a privacy-safe event.
 * @returns {React.ReactElement} Licensing section.
 */
function PricingSection({ onTrack }) {
  return (
    <section className="section pricing-section" id="pricing">
      <div className="shell pricing-heading">
        <div><p className="eyebrow dark">{messages.pricing.eyebrow}</p><h2>{messages.pricing.title}</h2></div>
        <p>{messages.pricing.description}</p>
      </div>
      <div className="shell pricing-included">
        <h3>{messages.pricing.includedTitle}</h3>
        <div>
          <ul>{messages.pricing.included.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          <p>{messages.pricing.includedNote}</p>
        </div>
      </div>
      <div className="shell pricing-grid">
        {messages.pricing.plans.map((plan) => {
          const accessRequestUrl = getAccessRequestUrl(plan.licenseCode);

          return (
            <article className={`pricing-card${plan.featured ? " featured" : ""}`} key={plan.name}>
              {plan.featured && <span className="featured-label">{messages.pricing.featuredLabel}</span>}
              <span className="plan-tag">{plan.tag}</span>
              <h3>{plan.name}</h3>
              <div className="plan-price"><strong>{plan.price}</strong><span>{plan.period}</span></div>
              <p className="plan-annual">{plan.annual}</p>
              <p className="plan-summary">{plan.summary}</p>
              <p className="plan-inheritance">{plan.inheritance}</p>
              <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
              {accessRequestUrl && (
                <a
                  aria-label={`${plan.action}: ${plan.name}`}
                  className="pricing-action"
                  href={accessRequestUrl}
                  onClick={() => onTrack(MARKETING_EVENTS.requestAccessClicked, {
                    placement: MARKETING_PLACEMENTS.pricing,
                    plan: plan.licenseCode
                  })}
                >
                  {plan.action}
                </a>
              )}
            </article>
          );
        })}
      </div>
      <p className="shell pricing-note">{messages.pricing.note}</p>
      <PurchaseHandoff onTrack={onTrack} />
    </section>
  );
}

/**
 * Renders the informational sections between the hero and sample request.
 *
 * @param {Object} props - Component properties.
 * @param {(eventName: string, params?: Object) => void} props.onTrack - Records a privacy-safe event.
 * @returns {React.ReactElement} Landing page body sections.
 */
export default function LandingSections({ onTrack }) {
  return (
    <>
      <ProblemSection />
      <ProductSection />
      <WalkthroughSection onTrack={onTrack} />
      <EvaluationSection />
      <SalesEvidenceSection onTrack={onTrack} />
      <MethodologySection />
      <PricingSection onTrack={onTrack} />
      <BuyerQuestions onTrack={onTrack} />
    </>
  );
}
