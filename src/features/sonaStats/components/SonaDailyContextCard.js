import React, { useState } from 'react';
import { Collapse } from 'react-bootstrap';
import {
  CLASSIFICATION_LABELS,
  EVENT_TAG_LABELS,
  SEVERITY_LABELS,
} from '../utils/formatDayContext';

const SEVERITY_RANK = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };

/**
 * Picks the bootstrap variant for the card based on classification + severity.
 * Drives both the summary pill color and the expanded card border/header.
 *
 * @param {string} classification
 * @param {string} severity
 * @returns {'secondary'|'warning'|'danger'|'info'}
 */
const pickVariant = (classification, severity) => {
  if (classification === 'holiday_closed') return 'secondary';
  if (classification === 'holiday_early_close') return 'warning';
  const sev = SEVERITY_RANK[severity] || 0;
  if ((classification === 'macro_event' || classification === 'expiry') && sev >= 2) {
    return 'danger';
  }
  return 'info';
};

/**
 * Builds the one-line summary shown collapsed: "<Classification> · <tags> · <severity>".
 *
 * @param {{classification:string, eventTags?:string[], severity?:string}} dc
 * @returns {string}
 */
const buildSummary = (dc) => {
  const cls = CLASSIFICATION_LABELS[dc.classification] || dc.classification;
  const tags = Array.isArray(dc.eventTags) && dc.eventTags.length
    ? dc.eventTags.map((t) => EVENT_TAG_LABELS[t] || t).join(', ')
    : null;
  const sev = dc.severity && dc.severity !== 'none'
    ? (SEVERITY_LABELS[dc.severity] || dc.severity)
    : null;
  return [cls, tags, sev].filter(Boolean).join(' · ');
};

/**
 * Computes session-hours copy for early-close days.
 *
 * @param {{open:string, close:string}|null} session
 * @returns {?{hours:string, durationHrs:number, deltaHrs:number}}
 */
const describeSession = (session) => {
  if (!session || !session.open || !session.close) return null;
  const [oh, om] = session.open.split(':').map(Number);
  const [ch, cm] = session.close.split(':').map(Number);
  const durationHrs = (ch * 60 + cm - (oh * 60 + om)) / 60;
  const regularHrs = 6.5;
  return {
    hours: `${session.open} – ${session.close} ET`,
    durationHrs,
    deltaHrs: regularHrs - durationHrs,
  };
};

/**
 * Returns the body block shown when the card is expanded. Content varies by
 * classification: closed days explain why the page is empty, early-close days
 * call out the shortened session, high-impact event days flag volatility.
 *
 * @param {{
 *   classification:string,
 *   eventTags?:string[],
 *   severity?:string,
 *   session?:{open:string, close:string}|null,
 *   note?:string|null,
 * }} dc
 * @returns {JSX.Element}
 */
const renderBody = (dc) => {
  const { classification, eventTags = [], severity, session, note } = dc;

  if (classification === 'holiday_closed') {
    return (
      <>
        <p className="mb-2">
          NYSE and CME equity-index futures observed the holiday.
          No regular trading session occurred.
        </p>
        {note && <p className="mb-0 text-secondary fs-sm"><strong>Holiday:</strong> {note}</p>}
      </>
    );
  }

  if (classification === 'holiday_early_close') {
    const sess = describeSession(session);
    return (
      <>
        <p className="mb-2">
          The session closed early for the federal holiday.
          {sess && (
            <>
              {' '}Trading hours were <strong>{sess.hours}</strong>, for approximately
              {' '}{sess.durationHrs} hours compared with a standard 6.5-hour regular session.
            </>
          )}
        </p>
        <p className="mb-0 text-secondary fs-sm">
          Interpret volume and resolution-time measures in the context of the shortened session.
          They are not directly comparable with full-session results.
        </p>
      </>
    );
  }

  if (classification === 'macro_event' || classification === 'expiry') {
    const tagList = eventTags.map((t) => EVENT_TAG_LABELS[t] || t).join(', ');
    const sevRank = SEVERITY_RANK[severity] || 0;
    return (
      <>
        {tagList && (
          <p className="mb-2">
            <strong>Scheduled events:</strong> {tagList}
            {note && note !== tagList ? ` · ${note}` : ''}
          </p>
        )}
        {sevRank >= 2 && (
          <p className="mb-0 text-secondary fs-sm">
            Scheduled events may affect volatility. Retraction and resolution-time measures
            may differ from their historical comparison values.
          </p>
        )}
      </>
    );
  }

  // Regular day with tags, late_open, or any other surfaced classification.
  return note ? <p className="mb-0">{note}</p> : <p className="mb-0">{buildSummary(dc)}</p>;
};

/**
 * Collapsible day-context card for the SONA daily page. Shows a one-line
 * summary chip by default; clicking expands an explanatory panel sized to
 * the classification. Severity drives the color scheme so a glance is enough
 * to recognise a flagged day.
 *
 * Renders nothing when `dayContext` is null/undefined, missing a
 * classification, a weekend, or a regular day with no event tags — those
 * states have nothing meaningful to say.
 *
 * @param {{dayContext: object|null|undefined}} props
 * @returns {?JSX.Element}
 */
export default function SonaDailyContextCard({ dayContext }) {
  const [open, setOpen] = useState(false);
  if (!dayContext || typeof dayContext !== 'object') return null;
  const { classification, eventTags } = dayContext;
  if (!classification || classification === 'weekend') return null;
  const tags = Array.isArray(eventTags) ? eventTags : [];
  if (classification === 'regular' && tags.length === 0) return null;

  const variant = pickVariant(classification, dayContext.severity);
  const summary = buildSummary(dayContext);
  const labelId = 'day-context-card-label';
  const panelId = 'day-context-card-panel';

  return (
    <div
      className={`alert alert-${variant} d-inline-block py-2 px-3 mt-2 mb-0`}
      data-testid="day-context-card"
      data-variant={variant}
      style={{ minWidth: 320, maxWidth: 560 }}
    >
      <button
        type="button"
        className="btn btn-link p-0 text-decoration-none d-flex align-items-center w-100 text-start"
        style={{ color: 'inherit' }}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        data-testid="day-context-card-toggle"
      >
        <i className="ri-calendar-event-line me-2" aria-hidden="true"></i>
        <span id={labelId} className="fw-medium flex-grow-1">
          Session context: {summary}
        </span>
        <i
          className={`ri-arrow-${open ? 'up' : 'down'}-s-line ms-2 fs-18`}
          aria-hidden="true"
        ></i>
      </button>
      <Collapse in={open}>
        <div id={panelId} aria-labelledby={labelId}>
          <hr className="my-2" />
          <div className="fs-sm" data-testid="day-context-card-body">
            {renderBody(dayContext)}
          </div>
        </div>
      </Collapse>
    </div>
  );
}
