/**
 * @fileoverview dayContext label formatter for the SONA dashboard.
 *
 * Mirrors the backend formatter at
 *   functions/helpers/formatDayContext.js (golden-setups-sona-alerts repo).
 *
 * The classification + event-tag + severity enum values are the stable
 * contract: they're written into RTDB at `stats/nq/5m/daily/*​/dayContext`
 * by the calendar pipeline (Phase 2B in the backend repo) and read here
 * verbatim. If the backend renames a label, both repos must update.
 *
 * The formatter returns `null` as a render guard — callers should omit the
 * badge/column when it returns null, not render an empty string.
 *
 * @module features/sonaStats/utils/formatDayContext
 */

/**
 * Display copy for each classification enum value.
 * @type {Readonly<Object<string, string>>}
 */
const CLASSIFICATION_LABELS = Object.freeze({
  regular: 'Regular',
  weekend: 'Weekend',
  holiday_closed: 'Holiday Closed',
  holiday_early_close: 'Early Close',
  late_open: 'Late Open',
  macro_event: 'Macro Event',
  expiry: 'Expiry',
});

/**
 * Display copy for each event-tag enum value.
 * @type {Readonly<Object<string, string>>}
 */
const EVENT_TAG_LABELS = Object.freeze({
  fomc_rate_decision: 'FOMC Rate Decision',
  fomc_press_conference: 'FOMC Press Conference',
  fomc_minutes: 'FOMC Minutes',
  cpi: 'CPI',
  ppi: 'PPI',
  nfp: 'NFP',
  retail_sales: 'Retail Sales',
  gdp: 'GDP',
  jobless_claims: 'Jobless Claims',
  jolts: 'JOLTS',
  opex_monthly: 'Monthly OpEx',
  opex_quarterly: 'Quarterly OpEx',
  triple_witching: 'Triple Witching',
  futures_roll: 'Futures Roll',
});

/**
 * Display copy for each severity tier above `none`.
 * @type {Readonly<Object<string, string>>}
 */
const SEVERITY_LABELS = Object.freeze({
  low: 'low severity',
  medium: 'medium severity',
  high: 'high severity',
  critical: 'critical severity',
});

/**
 * Format a stamped dayContext into a human-readable single-line label.
 *
 * Returns `null` when nothing meaningful should render (null input, missing
 * classification, weekend, or a regular day with no event tags). When
 * non-null, the format is:
 *
 *   "<Classification> · <Tag1>, <Tag2> · <severity> severity"
 *
 * Segments are omitted when empty: e.g. a holiday with no tags returns
 * "Holiday Closed · high severity"; a regular day with one tag returns
 * "Regular · CPI · medium severity".
 *
 * @param {?{
 *   classification?: string,
 *   eventTags?: Array<string>,
 *   severity?: string,
 * }} dayContext - The stamped dayContext from the daily stats doc.
 * @returns {?string} The formatted label, or `null` to skip rendering.
 */
export const formatDayContextLabel = (dayContext) => {
  if (!dayContext || typeof dayContext !== 'object') return null;

  const { classification, eventTags, severity } = dayContext;
  if (!classification) return null;
  if (classification === 'weekend') return null;

  const tags = Array.isArray(eventTags) ? eventTags : [];
  if (classification === 'regular' && tags.length === 0) return null;

  const classificationLabel = CLASSIFICATION_LABELS[classification] || classification;
  const tagLabel = tags.length
    ? tags.map((t) => EVENT_TAG_LABELS[t] || t).join(', ')
    : null;
  const severityLabel = severity && severity !== 'none'
    ? (SEVERITY_LABELS[severity] || severity)
    : null;

  return [classificationLabel, tagLabel, severityLabel].filter(Boolean).join(' · ');
};

export { CLASSIFICATION_LABELS, EVENT_TAG_LABELS, SEVERITY_LABELS };
