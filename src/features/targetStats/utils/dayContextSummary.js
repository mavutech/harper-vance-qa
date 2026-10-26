/**
 * Day-context "today is a special day" summary — frontend port.
 *
 * Mirrors `functions/helpers/dayContextSummary.js` so the dashboard and
 * the live-targets API agree on threshold rules and friendly labels.
 *
 * Pure logic. The hook (`useDayContextSummary`) feeds it
 * `(eventTags, bucketsTree)` read from RTDB and renders the result.
 */

export const MIN_TARGETS = 15;
export const ACCURACY_DELTA_PP = 3;
export const TTR_DELTA_MIN = 3;

export const TAG_LABEL = Object.freeze({
  fomc_rate_decision: 'FOMC meeting day',
  fomc_press_conference: 'FOMC press conference day',
  fomc_minutes: 'FOMC minutes release day',
  cpi: 'CPI release day',
  ppi: 'PPI release day',
  nfp: 'NFP / jobs report day',
  retail_sales: 'Retail Sales release day',
  gdp: 'GDP release day',
  jobless_claims: 'Jobless Claims day',
  jolts: 'JOLTS release day',
  opex_monthly: 'Monthly opex day',
  opex_quarterly: 'Quarterly opex day',
  triple_witching: 'Triple witching day',
  futures_roll: 'Futures roll day',
});

export const SEVERITY_RANK = Object.freeze({
  fomc_rate_decision: 5,
  fomc_press_conference: 5,
  nfp: 5,
  cpi: 4,
  fomc_minutes: 4,
  triple_witching: 4,
  opex_quarterly: 4,
  gdp: 3,
  ppi: 3,
  retail_sales: 3,
  opex_monthly: 3,
  futures_roll: 3,
  jolts: 2,
  jobless_claims: 1,
});

const normalizeBucket = (b) => {
  if (!b || typeof b !== 'object') return null;
  return {
    nDays: typeof b.nDays === 'number' ? b.nDays : 0,
    nTargets: typeof b.nTargets === 'number' ? b.nTargets : 0,
    nHits: typeof b.nHits === 'number' ? b.nHits : 0,
    accuracy: typeof b.accuracy === 'number' ? b.accuracy : null,
    avgTtrMinutes: typeof b.avgTtrMinutes === 'number' ? b.avgTtrMinutes : null,
    firstDate: b.firstDate || null,
    lastDate: b.lastDate || null,
  };
};

export const classifyAccuracy = (eventAcc, baseAcc) => {
  if (eventAcc == null || baseAcc == null) return { label: 'unknown', deltaPct: null };
  const deltaPp = (eventAcc - baseAcc) * 100;
  const rounded = Math.round(deltaPp * 10) / 10;
  if (deltaPp >= ACCURACY_DELTA_PP) return { label: 'above', deltaPct: rounded };
  if (deltaPp <= -ACCURACY_DELTA_PP) return { label: 'below', deltaPct: rounded };
  return { label: 'similar', deltaPct: rounded };
};

export const classifyTtr = (eventTtr, baseTtr) => {
  if (eventTtr == null || baseTtr == null) return { label: 'unknown', deltaMin: null };
  const delta = eventTtr - baseTtr;
  const rounded = Math.round(delta * 10) / 10;
  if (delta <= -TTR_DELTA_MIN) return { label: 'faster', deltaMin: rounded };
  if (delta >= TTR_DELTA_MIN) return { label: 'slower', deltaMin: rounded };
  return { label: 'similar', deltaMin: rounded };
};

/**
 * Build the daySummary from raw RTDB inputs.
 *
 * @param {string[]} eventTags - From /calendar/specialDays/{date}.eventTags
 * @param {Object|null} bucketsTree - From /stats/nq/5m/byDayContext
 * @returns {?{ tags: Array, baseline: Object }} null if no qualifying tag
 */
export const buildDayContextSummary = (eventTags, bucketsTree) => {
  if (!Array.isArray(eventTags) || eventTags.length === 0) return null;
  if (!bucketsTree || typeof bucketsTree !== 'object') return null;

  const baseline = normalizeBucket(bucketsTree.baseline && bucketsTree.baseline._overall);

  const summaries = [];
  for (const tag of eventTags) {
    const node = bucketsTree[tag];
    if (!node || !node._overall) continue;
    const bucket = normalizeBucket(node._overall);
    if (!bucket || bucket.nTargets < MIN_TARGETS) continue;

    summaries.push({
      tag,
      label: TAG_LABEL[tag] || tag,
      severityRank: SEVERITY_RANK[tag] || 0,
      bucket,
      accuracyVsBaseline: classifyAccuracy(bucket.accuracy, baseline && baseline.accuracy),
      ttrVsBaseline: classifyTtr(bucket.avgTtrMinutes, baseline && baseline.avgTtrMinutes),
    });
  }
  if (!summaries.length) return null;

  summaries.sort((a, b) => {
    if (b.severityRank !== a.severityRank) return b.severityRank - a.severityRank;
    return b.bucket.nDays - a.bucket.nDays;
  });

  return { tags: summaries, baseline };
};
