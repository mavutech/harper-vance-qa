import React from "react";
import messages from "../locales/en.json";

/**
 * Renders a clearly labeled illustrative report and the buyer evaluation path.
 *
 * @returns {React.ReactElement} Sales evidence section.
 */
export default function SalesEvidenceSection() {
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
          <div className="report-timeline" aria-label={evidence.report.timelineLabel}>
            {evidence.report.targets.map((target) => (
              <div className="report-target" key={target.label}>
                <span>{target.time}</span>
                <strong>{target.label}</strong>
                <em className={target.status === "Reached" ? "reached" : "unreached"}>
                  {target.status}
                </em>
              </div>
            ))}
          </div>
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
