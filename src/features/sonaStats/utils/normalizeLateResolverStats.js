/**
 * @fileoverview Shape normalizer for the backend-written `lateResolverStats`
 * field found on `stats/nq/5m/daily/{YYYY-MM}/{DD}` and
 * `stats/nq/5m/weekly/{YYYY}/{week}` documents.
 *
 * The backend serializes two group shapes:
 *   • hits > 0   — full retraction and time percentile block present
 *   • hits === 0 — only { eventualHitRate, hits, n, neverResolved } present
 *
 * Rather than push that branching into every component, this utility fills
 * absent percentile fields with `null` and adds a `hasSample` flag driven by
 * the doc-supplied `minSample` threshold.
 *
 * See docs/missed-targets-contract.md for the source schema.
 */

const PERCENTILE_FIELDS = [
  'maxRetraction',
  'meanRetraction',
  'medianRetraction',
  'p25Retraction',
  'p75Retraction',
  'p90Retraction',
  'maxTimeMin',
  'meanTimeMin',
  'medianTimeMin',
  'p90TimeMin',
];

/**
 * Returns a group object with all percentile fields present (null when the
 * backend omitted them) plus a `hasSample` flag indicating whether the group
 * meets the minimum sample size to be shown with a headline number.
 *
 * @param {Object} group - Raw group object from `lateResolverStats.groups[key]`
 * @param {number} minSample - Minimum sample size threshold from parent doc
 * @returns {Object} Normalized group
 */
const normalizeGroup = (group, minSample) => {
  const normalized = {
    eventualHitRate: group.eventualHitRate ?? 0,
    hits: group.hits ?? 0,
    n: group.n ?? 0,
    neverResolved: group.neverResolved ?? 0,
    hasSample: (group.n ?? 0) >= minSample,
  };

  PERCENTILE_FIELDS.forEach((field) => {
    normalized[field] = group[field] ?? null;
  });

  return normalized;
};

/**
 * Normalizes the top-level `lateResolverStats` field into a consistent shape
 * for UI consumption. Returns `null` if input is missing or malformed so
 * components can guard with a single truthy check.
 *
 * @param {Object|null|undefined} rawStats - Raw `lateResolverStats` field
 * @returns {{
 *   groups: Object,
 *   minSample: number,
 *   thresholdMin: number,
 *   share: number,
 *   totalLate: number,
 *   totalTargets: number,
 *   windowSessions: number
 * }|null}
 *
 * @example
 * const stats = normalizeLateResolverStats(dailyDoc.lateResolverStats);
 * if (!stats) return <EmptyState />;
 * const bullish = stats.groups.bullish;
 * if (bullish.hasSample) render(<HitRate value={bullish.eventualHitRate} />);
 */
export const normalizeLateResolverStats = (rawStats) => {
  if (!rawStats || typeof rawStats !== 'object' || !rawStats.groups) {
    return null;
  }

  const minSample = rawStats.minSample ?? 0;
  const normalizedGroups = {};

  Object.entries(rawStats.groups).forEach(([key, group]) => {
    normalizedGroups[key] = normalizeGroup(group, minSample);
  });

  return {
    groups: normalizedGroups,
    minSample,
    thresholdMin: rawStats.thresholdMin ?? null,
    share: rawStats.share ?? null,
    totalLate: rawStats.totalLate ?? 0,
    totalTargets: rawStats.totalTargets ?? 0,
    windowSessions: rawStats.windowSessions ?? 0,
  };
};
