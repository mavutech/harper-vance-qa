import React from "react";
import messages from "../locales/en.json";

/**
 * Renders the three intelligence artifacts included with every license.
 *
 * @returns {React.ReactElement} Product overview section.
 */
function ProductSection() {
  return (
    <section className="product-section" id="product">
      <div className="shell artifact-grid">
        {messages.included.artifacts.map((artifact) => (
          <article className="artifact-card" key={artifact.number}>
            <span className="artifact-number">{artifact.number}</span>
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
        <p>{messages.included.description}</p>
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
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Shows how the service fits existing operations and can be evaluated safely.
 *
 * @returns {React.ReactElement} Operations and evaluation section.
 */
function EvaluationSection() {
  return (
    <section className="section evaluation-section" id="evaluation">
      <div className="shell operations-layout">
        <div className="operations-copy">
          <p className="eyebrow light">{messages.operations.eyebrow}</p>
          <h2>{messages.operations.title}</h2>
          <p>{messages.operations.description}</p>
          <p className="delivery-line"><strong>{messages.operations.deliveryLabel}</strong>{messages.operations.delivery}</p>
        </div>
        <ul className="operations-list">
          {messages.operations.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
      <div className="shell plan-block">
        <div className="plan-heading">
          <p className="eyebrow light">{messages.plan.eyebrow}</p>
          <h2>{messages.plan.title}</h2>
          <p>{messages.plan.description}</p>
        </div>
        <div className="plan-steps">
          {messages.plan.steps.map((step) => (
            <article className="plan-step" key={step.number}>
              <span>{step.number}</span>
              <div><h3>{step.title}</h3><p>{step.description}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Renders license options without changing the underlying intelligence offer.
 *
 * @param {Object} props - Component properties.
 * @param {(eventName: string) => void} props.onTrack - Records a privacy-safe link event.
 * @returns {React.ReactElement} Licensing section.
 */
function PricingSection({ onTrack }) {
  return (
    <section className="section pricing-section" id="pricing">
      <div className="shell pricing-heading">
        <div><p className="eyebrow dark">{messages.pricing.eyebrow}</p><h2>{messages.pricing.title}</h2></div>
        <p>{messages.pricing.description}</p>
      </div>
      <div className="shell pricing-grid">
        {messages.pricing.plans.map((plan) => (
          <article className={`pricing-card${plan.featured ? " featured" : ""}`} key={plan.name}>
            {plan.featured && <span className="featured-label">{messages.pricing.featuredLabel}</span>}
            <span className="plan-tag">{plan.tag}</span>
            <h3>{plan.name}</h3>
            <div className="plan-price"><strong>{plan.price}</strong><span>{plan.period}</span></div>
            <p className="plan-annual">{plan.annual}</p>
            <p className="plan-summary">{plan.summary}</p>
            <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            <a className="pricing-action" href="#sample" onClick={() => onTrack(`pricing_${plan.analyticsKey}`)}>
              {plan.action}<span aria-hidden="true">→</span>
            </a>
          </article>
        ))}
      </div>
      <p className="shell pricing-note">{messages.pricing.note}</p>
    </section>
  );
}

/**
 * Renders the informational sections between the hero and sample request.
 *
 * @param {Object} props - Component properties.
 * @param {(eventName: string) => void} props.onTrack - Records a privacy-safe link event.
 * @returns {React.ReactElement} Landing page body sections.
 */
export default function LandingSections({ onTrack }) {
  return (
    <>
      <ProductSection />
      <ProblemSection />
      <EvaluationSection />
      <PricingSection onTrack={onTrack} />
    </>
  );
}
