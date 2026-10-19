import React from "react";
import messages from "../locales/en.json";
import { LANDING_PAGE_CONFIG } from "../landingPageConfig";
import { MARKETING_EVENTS, MARKETING_PLACEMENTS } from "../marketingAnalytics";
import TargetRecord from "./TargetRecord";

/**
 * Renders the verified, dated public report and the buyer evaluation path.
 *
 * @param {Object} props - Component properties.
 * @param {Function} props.onTrack - Centralized privacy-safe event callback.
 * @returns {React.ReactElement} Sales evidence section.
 */
export default function SalesEvidenceSection({ onTrack }) {
  const evidence = messages.evidence;

  return (
    <section className="section evidence-section" id="evidence">
      <div className="shell evidence-heading">
        <div>
          <p className="eyebrow dark">{evidence.eyebrow}</p>
          <h2>{evidence.title}</h2>
        </div>
        <p>{evidence.description}</p>
      </div>

      <div className="shell evidence-layout">
        <article className="report-preview" aria-labelledby="report-preview-title">
          <header className="report-preview-header">
            <div>
              <span>{evidence.report.brand}</span>
              <h3 id="report-preview-title">{evidence.report.title}</h3>
            </div>
            <strong>{evidence.report.badge}</strong>
          </header>
          <p className="report-preview-boundary">{evidence.report.boundary}</p>
          <div className="report-metrics">
            {evidence.report.metrics.map((metric) => (
              <div key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
          <a className="pricing-action" href={LANDING_PAGE_CONFIG.sampleReportUrl}
            target="_blank" rel="noopener noreferrer"
            onClick={() => onTrack(MARKETING_EVENTS.sampleReportOpened, {
              placement: MARKETING_PLACEMENTS.evidence
            })}>
            {evidence.report.action}
          </a>
          <details className="report-preview-boundary">
            <summary>{evidence.report.revisionLabel}</summary>
            <p>{evidence.report.revision}</p>
          </details>
          <TargetRecord />
          <footer>{evidence.report.footnote}</footer>
        </article>

        <div className="evaluation-proof">
          <div className="buyer-fit">
            <h3>{evidence.fit.title}</h3>
            <ul>{evidence.fit.items.map((item) => <li key={item}>{item}</li>)}</ul>
            <p>{evidence.fit.notFit}</p>
          </div>
          <div className="evaluation-steps">
            <h3>{evidence.process.title}</h3>
            <ol>
              {evidence.process.steps.map((step, index) => (
                <li key={step.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><strong>{step.title}</strong><p>{step.description}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
