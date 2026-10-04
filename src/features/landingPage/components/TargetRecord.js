import React from "react";
import messages from "../locales/en.json";

/**
 * Renders an explicitly illustrative target-to-outcome record.
 *
 * @returns {React.ReactElement} Representative retained record.
 */
export default function TargetRecord() {
  const record = messages.hero.record;

  return (
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
  );
}
