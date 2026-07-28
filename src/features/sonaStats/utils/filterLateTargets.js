import moment from 'moment-timezone';
import { EST_TIMEZONE, SESSION_PERIODS, BULLISH_COLOR } from './sonaStatsConstants';

/**
 * Computes minutes from target creation to first resolution. Returns null for
 * unresolved targets or when timestamps are missing.
 *
 * @param {Object} target - engulfingCandleList entry
 * @returns {number|null}
 */
const getResolutionMinutes = (target) => {
  if (!target.targetReached || !target.targetReachedTimestamp || !target.dateTimestamp) {
    return null;
  }
  return Math.abs(
    (parseInt(target.targetReachedTimestamp, 10) - parseInt(target.dateTimestamp, 10)) / 60
  );
};

/**
 * Classifies a unix timestamp into a session period name based on EST clock.
 * Returns null when the timestamp falls outside the defined periods.
 *
 * @param {string|number} unixSeconds
 * @returns {string|null} 'Morning' | 'Midday' | 'Afternoon' | null
 */
const classifySession = (unixSeconds) => {
  if (unixSeconds === undefined || unixSeconds === null) return null;
  const t = moment.unix(parseInt(unixSeconds, 10)).tz(EST_TIMEZONE);
  const totalMins = t.hour() * 60 + t.minute();
  for (const period of SESSION_PERIODS) {
    const start = period.startHour * 60 + period.startMin;
    const end = period.endHour * 60 + period.endMin;
    if (totalMins >= start && totalMins < end) return period.name;
  }
  return null;
};

/**
 * Decorates a raw engulfingCandleList target with the display fields needed
 * by the LateTargetsLog table.
 *
 * @param {Object} target
 * @returns {Object}
 */
const decorateLateTarget = (target) => {
  const generatedMoment = target.dateTimestamp
    ? moment.unix(parseInt(target.dateTimestamp, 10)).tz(EST_TIMEZONE)
    : null;
  const resolvedMoment = target.targetReachedTimestamp
    ? moment.unix(parseInt(target.targetReachedTimestamp, 10)).tz(EST_TIMEZONE)
    : null;

  return {
    ...target,
    direction: target.colorHighlight === BULLISH_COLOR ? 'bullish' : 'bearish',
    session: classifySession(target.dateTimestamp),
    generatedAt: generatedMoment ? generatedMoment.format('YYYY-MM-DD HH:mm') : null,
    generatedAtEpoch: generatedMoment ? generatedMoment.unix() : null,
    resolvedAt: resolvedMoment ? resolvedMoment.format('YYYY-MM-DD HH:mm') : null,
    resolvedAtEpoch: resolvedMoment ? resolvedMoment.unix() : null,
    timeToResolveMin: getResolutionMinutes(target),
    entryPriceNum: parseFloat(target.entryPrice),
    targetPriceNum: parseFloat(target.targetPrice),
  };
};

/**
 * Filters a pool of engulfingCandleList targets down to those the backend
 * would classify as "late" — targets that took more than `thresholdMin`
 * minutes to first resolve, plus targets that never resolved at all.
 *
 * Each surviving target is decorated with display-ready derived fields.
 * Results are sorted by generation time descending (newest first).
 *
 * @param {Object[]} targets - Raw engulfingCandleList entries (any dates)
 * @param {number} [thresholdMin=5] - "Late" threshold in minutes
 * @returns {Object[]}
 */
export const filterLateTargets = (targets, thresholdMin = 5) => {
  if (!Array.isArray(targets)) return [];

  const late = [];

  for (const target of targets) {
    if (!target) continue;
    // Never resolved → always late
    if (target.targetReached !== true) {
      late.push(decorateLateTarget(target));
      continue;
    }
    // Resolved slowly → late
    const mins = getResolutionMinutes(target);
    if (mins !== null && mins > thresholdMin) {
      late.push(decorateLateTarget(target));
    }
  }

  late.sort((a, b) => {
    const at = a.generatedAtEpoch ?? 0;
    const bt = b.generatedAtEpoch ?? 0;
    return bt - at;
  });

  return late;
};
