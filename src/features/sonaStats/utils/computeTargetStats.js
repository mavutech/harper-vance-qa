import moment from 'moment-timezone';
import { BULLISH_COLOR, EST_TIMEZONE, SESSION_PERIODS } from './sonaStatsConstants';
import { resolveGeneratedCloseTimestamp } from './closeTime';

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Returns true if a target is bullish based on its colorHighlight value.
 *
 * @param {Object} target - Single target from engulfingCandleList
 * @returns {boolean}
 */
const isBullish = (target) => target.colorHighlight === BULLISH_COLOR;

/**
 * Returns resolution time in minutes for a resolved target, using stored timestamps
 * for 1-minute precision. Returns null for unresolved targets or missing timestamp data.
 *
 * @param {Object} target - Single target from engulfingCandleList
 * @returns {number|null} Minutes from generation to resolution, or null
 */
const getResolutionMinutes = (target) => {
  if (!target.targetReached || !target.targetReachedTimestamp || !target.dateTimestamp) {
    return null;
  }
  return Math.abs(
    (parseInt(target.targetReachedTimestamp, 10) - parseInt(target.dateTimestamp, 10)) / 60
  );
};

// ─── Exported stat functions ──────────────────────────────────────────────────

/**
 * Computes bullish and bearish accuracy as separate rates.
 * Derived from colorHighlight on each target object.
 *
 * @param {Object[]} targets - engulfingCandleList array
 * @returns {{
 *   bullish: { created: number, hit: number, accuracy: number|null },
 *   bearish: { created: number, hit: number, accuracy: number|null }
 * }}
 */
export const computeDirectionSplit = (targets) => {
  const bullishTargets = targets.filter(isBullish);
  const bearishTargets = targets.filter((t) => !isBullish(t));

  const bullishHit = bullishTargets.filter((t) => t.targetReached).length;
  const bearishHit = bearishTargets.filter((t) => t.targetReached).length;

  return {
    bullish: {
      created: bullishTargets.length,
      hit: bullishHit,
      accuracy: bullishTargets.length > 0
        ? parseFloat(((bullishHit / bullishTargets.length) * 100).toFixed(1))
        : null,
    },
    bearish: {
      created: bearishTargets.length,
      hit: bearishHit,
      accuracy: bearishTargets.length > 0
        ? parseFloat(((bearishHit / bearishTargets.length) * 100).toFixed(1))
        : null,
    },
  };
};

/**
 * Computes resolution time statistics across all resolved targets.
 * All values in minutes. Uses 1-minute precision timestamps.
 *
 * @param {Object[]} targets - engulfingCandleList array
 * @returns {{
 *   avg: number|null,
 *   median: number|null,
 *   fastest: number|null,
 *   slowest: number|null,
 *   stdDev: number|null,
 *   times: number[]
 * }}
 */
export const computeResolutionTimeStats = (targets) => {
  const times = targets
    .map(getResolutionMinutes)
    .filter((t) => t !== null)
    .sort((a, b) => a - b);

  if (times.length === 0) {
    return { avg: null, median: null, fastest: null, slowest: null, stdDev: null, times: [] };
  }

  const sum = times.reduce((acc, t) => acc + t, 0);
  const avg = parseFloat((sum / times.length).toFixed(1));

  const mid = Math.floor(times.length / 2);
  const median = times.length % 2 !== 0
    ? parseFloat(times[mid].toFixed(1))
    : parseFloat(((times[mid - 1] + times[mid]) / 2).toFixed(1));

  const fastest = parseFloat(times[0].toFixed(1));
  const slowest = parseFloat(times[times.length - 1].toFixed(1));

  const variance = times.reduce((acc, t) => acc + Math.pow(t - avg, 2), 0) / times.length;
  const stdDev = parseFloat(Math.sqrt(variance).toFixed(1));

  return { avg, median, fastest, slowest, stdDev, times };
};

/**
 * Buckets resolved targets by time-to-resolution.
 * Buckets: 0–5 min, 6–15 min, 16–30 min, 31–60 min, 60+ min.
 *
 * @param {number[]} resolutionTimes - Array of resolution times in minutes
 * @returns {{ '0-5': number, '6-15': number, '16-30': number, '31-60': number, '60+': number }}
 */
export const computeTimeBuckets = (resolutionTimes) => {
  const buckets = { '0-5': 0, '6-15': 0, '16-30': 0, '31-60': 0, '60+': 0 };

  resolutionTimes.forEach((mins) => {
    if (mins <= 5) buckets['0-5']++;
    else if (mins <= 15) buckets['6-15']++;
    else if (mins <= 30) buckets['16-30']++;
    else if (mins <= 60) buckets['31-60']++;
    else buckets['60+']++;
  });

  return buckets;
};

/**
 * Computes accuracy, hit count, and median resolution time per session period.
 * Periods: Morning (9:30–11:30), Midday (11:30–14:00), Afternoon (14:00–16:00).
 * Each target is classified by its dateTimestamp converted to EST.
 *
 * @param {Object[]} targets - engulfingCandleList array
 * @returns {Array<{
 *   period: string,
 *   created: number,
 *   hit: number,
 *   accuracy: number|null,
 *   medianTime: number|null
 * }>}
 */
export const computeSessionPeriodAccuracy = (targets) => {
  return SESSION_PERIODS.map((period) => {
    const periodTargets = targets.filter((target) => {
      // Classify by close time: a 5m target with open 11:25 closes at 11:30,
      // which puts it in Midday rather than Morning.
      const closeTs = resolveGeneratedCloseTimestamp(target);
      if (!closeTs) return false;
      const t = moment.unix(parseInt(closeTs, 10)).tz(EST_TIMEZONE);
      const totalMins = t.hour() * 60 + t.minute();
      const startMins = period.startHour * 60 + period.startMin;
      const endMins = period.endHour * 60 + period.endMin;
      return totalMins >= startMins && totalMins < endMins;
    });

    const hit = periodTargets.filter((t) => t.targetReached).length;
    const accuracy = periodTargets.length > 0
      ? parseFloat(((hit / periodTargets.length) * 100).toFixed(1))
      : null;

    const times = periodTargets
      .map(getResolutionMinutes)
      .filter((t) => t !== null)
      .sort((a, b) => a - b);

    let medianTime = null;
    if (times.length > 0) {
      const mid = Math.floor(times.length / 2);
      medianTime = times.length % 2 !== 0
        ? parseFloat(times[mid].toFixed(1))
        : parseFloat(((times[mid - 1] + times[mid]) / 2).toFixed(1));
    }

    return { period: period.name, created: periodTargets.length, hit, accuracy, medianTime };
  });
};

/**
 * Computes the longest and current intraday consecutive hit streak.
 * Targets must be in chronological order (by dateTimestamp ascending).
 *
 * @param {Object[]} targets - engulfingCandleList in chronological order
 * @returns {{ longest: number, current: number }}
 */
export const computeConsecutiveStreak = (targets) => {
  let longest = 0;
  let current = 0;

  targets.forEach((target) => {
    if (target.targetReached) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 0;
    }
  });

  return { longest, current };
};

/**
 * Analyzes unreached targets to determine how close price came to each one.
 * For each miss, scans sortedChartData candles after the target was generated
 * and computes the minimum distance between price and the target level.
 *
 * @param {Object[]} targets - engulfingCandleList array
 * @param {Object[]} sortedChartData - Full session candle data with high, low, dateTimestamp
 * @returns {{
 *   count: number,
 *   closestMiss: string|null,
 *   avgDistance: string|null,
 *   detailedLog: Array<{ index: number, price: string, direction: string, closestReached: string|null, distance: string }>
 * }}
 */
export const computeMissAnalysis = (targets, sortedChartData) => {
  const unreached = targets.filter((t) => !t.targetReached);

  if (unreached.length === 0) {
    return { count: 0, closestMiss: null, avgDistance: null, detailedLog: [] };
  }

  if (!sortedChartData || sortedChartData.length === 0) {
    return { count: unreached.length, closestMiss: null, avgDistance: null, detailedLog: [] };
  }

  const distances = [];
  const detailedLog = [];

  unreached.forEach((target, index) => {
    const bullish = isBullish(target);
    const targetPrice = parseFloat(bullish ? target.high : target.low);
    // Lower bound is the alert candle's close — candles before that
    // existed before the target was generated.
    const closeTsStr = resolveGeneratedCloseTimestamp(target);
    const targetTimestamp = closeTsStr ?
      parseInt(closeTsStr, 10) :
      parseInt(target.dateTimestamp, 10);

    const futureCandles = sortedChartData.filter(
      (candle) => parseInt(candle.dateTimestamp, 10) > targetTimestamp
    );

    let closestDistance = null;
    let closestPrice = null;

    futureCandles.forEach((candle) => {
      const dist = bullish
        ? targetPrice - parseFloat(candle.high)
        : parseFloat(candle.low) - targetPrice;

      if (dist > 0 && (closestDistance === null || dist < closestDistance)) {
        closestDistance = dist;
        closestPrice = bullish ? parseFloat(candle.high) : parseFloat(candle.low);
      }
    });

    if (closestDistance !== null) {
      distances.push(closestDistance);
      detailedLog.push({
        index: index + 1,
        price: target.targetPrice || (bullish ? target.high : target.low),
        direction: bullish ? 'Up' : 'Down',
        closestReached: closestPrice !== null ? closestPrice.toFixed(2) : null,
        distance: `${closestDistance.toFixed(2)} pts`,
      });
    }
  });

  const closestMiss = distances.length > 0
    ? `${Math.min(...distances).toFixed(2)} pts`
    : null;
  const avgDistance = distances.length > 0
    ? `${(distances.reduce((a, b) => a + b, 0) / distances.length).toFixed(2)} pts`
    : null;

  return { count: unreached.length, closestMiss, avgDistance, detailedLog };
};

/**
 * Entry point. Runs all stat computations against a single day's rawPayload.
 * Returns a structured stats object grouping all derived metrics by category.
 * Returns null if engulfingCandleList is empty or absent.
 *
 * @param {Object} rawPayload - Daily rawPayload as stored in Firebase RTDB
 * @param {Object[]} rawPayload.engulfingCandleList - Per-target data array
 * @param {Object[]} rawPayload.sortedChartData - Full session candle data
 * @returns {{
 *   directionSplit: Object,
 *   resolutionTimes: Object,
 *   timeBuckets: Object,
 *   sessionPeriods: Object[],
 *   consecutiveStreak: Object,
 *   missAnalysis: Object,
 *   firstTargetHit: boolean|null
 * }|null}
 */
export const computeAllStats = (rawPayload) => {
  const { engulfingCandleList = [], sortedChartData = [] } = rawPayload;

  if (engulfingCandleList.length === 0) return null;

  // Server-side fields are the single source of truth when present (written by
  // the stats generator since Phase 6). Local computation remains as fallback
  // so historic day docs that predate the migration still render.
  const resolutionTimes = rawPayload.resolutionTimes
    ?? computeResolutionTimeStats(engulfingCandleList);

  // Doc sessionPeriods may omit medianTime on periods with no hits — normalize
  // to null so components don't render "undefined".
  const sessionPeriods = Array.isArray(rawPayload.sessionPeriods)
    ? rawPayload.sessionPeriods.map((p) => ({ ...p, medianTime: p.medianTime ?? null, accuracy: p.accuracy ?? null }))
    : computeSessionPeriodAccuracy(engulfingCandleList);

  const docMiss = rawPayload.missAnalysis;
  const missAnalysis = docMiss && Array.isArray(docMiss.detailedLog)
    ? docMiss
    : computeMissAnalysis(engulfingCandleList, sortedChartData);

  return {
    directionSplit: rawPayload.directionSplit ?? computeDirectionSplit(engulfingCandleList),
    resolutionTimes,
    timeBuckets: rawPayload.timeBuckets ?? computeTimeBuckets(resolutionTimes.times),
    sessionPeriods,
    consecutiveStreak: rawPayload.consecutiveStreak ?? computeConsecutiveStreak(engulfingCandleList),
    missAnalysis,
    retractionStats: computeRetractionStats(engulfingCandleList),
    distanceVsHitRate: rawPayload.distanceVsHitRate ?? computeDistanceVsHitRate(engulfingCandleList),
    askComparison: computeAskComparison(engulfingCandleList),
    firstTargetHit: rawPayload.firstTargetHit ?? engulfingCandleList[0]?.targetReached ?? null,
  };
};

/**
 * Fallback distance-vs-hit-rate bucketing for day docs that predate the
 * server-side field. Mirrors the generator's bucket boundaries and shape.
 *
 * @param {Object[]} targets - engulfingCandleList array
 * @returns {{ avgDistance: string, medianDistance: string, buckets: Object[] }|null}
 */
export const computeDistanceVsHitRate = (targets) => {
  const rows = targets.filter((t) => Number.isFinite(t.targetDistancePoints));
  if (rows.length === 0) return null;

  const defs = [
    { range: '0-5 pts', min: 0, max: 5 },
    { range: '5-10 pts', min: 5, max: 10 },
    { range: '10-20 pts', min: 10, max: 20 },
    { range: '20+ pts', min: 20, max: Infinity },
  ];

  const buckets = defs
    .map(({ range, min, max }) => {
      const inBucket = rows.filter((t) => t.targetDistancePoints >= min && t.targetDistancePoints < max);
      const hit = inBucket.filter((t) => t.targetReached).length;
      return {
        range,
        created: inBucket.length,
        hit,
        hitRate: inBucket.length > 0 ? `${((hit / inBucket.length) * 100).toFixed(1)}%` : null,
      };
    })
    .filter((b) => b.created > 0);

  const distances = rows.map((t) => t.targetDistancePoints).sort((a, b) => a - b);
  const avg = distances.reduce((a, b) => a + b, 0) / distances.length;
  const mid = Math.floor(distances.length / 2);
  const median = distances.length % 2 !== 0 ? distances[mid] : (distances[mid - 1] + distances[mid]) / 2;

  return {
    avgDistance: `${avg.toFixed(1)} pts`,
    medianDistance: `${median.toFixed(1)} pts`,
    buckets,
  };
};

/**
 * Compares average target distance at generation between misses and hits.
 * Larger asks carry lower resolution odds — surfacing the gap explains misses.
 *
 * @param {Object[]} targets - engulfingCandleList array
 * @returns {{ missedAvg: number, hitAvg: number }|null} Nulls when either side is empty
 */
export const computeAskComparison = (targets) => {
  const sideAvg = (reached) => {
    const vals = targets
      .filter((t) => t.targetReached === reached && Number.isFinite(t.targetDistancePoints))
      .map((t) => t.targetDistancePoints);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const missedAvg = sideAvg(false);
  const hitAvg = sideAvg(true);
  if (missedAvg === null || hitAvg === null) return null;
  return {
    missedAvg: parseFloat(missedAvg.toFixed(2)),
    hitAvg: parseFloat(hitAvg.toFixed(2)),
  };
};

/**
 * Computes session-level retraction statistics from the engulfingCandleList.
 * Reads retractionPoints stored on each target object — no candle data required.
 * Returns null fields when no hit targets have retraction data.
 *
 * @param {Object[]} targets - engulfingCandleList array
 * @returns {{
 *   avg: number|null,
 *   max: number|null,
 *   pctWithin10pts: number|null,
 *   count: number
 * }}
 */
export const computeRetractionStats = (targets) => {
  const hitWithRetraction = targets.filter(
    (t) => t.targetReached && t.retractionPoints !== null && t.retractionPoints !== undefined
  );

  if (hitWithRetraction.length === 0) {
    return { avg: null, median: null, max: null, pctWithin10pts: null, band: null, count: 0 };
  }

  const points = hitWithRetraction.map((t) => t.retractionPoints).sort((a, b) => a - b);
  const avg = parseFloat((points.reduce((a, b) => a + b, 0) / points.length).toFixed(1));
  const max = parseFloat(Math.max(...points).toFixed(1));
  const within10 = points.filter((p) => p <= 10).length;
  const pctWithin10pts = parseFloat(((within10 / points.length) * 100).toFixed(1));

  // p25 / median / p75 band — the typical retraction zone among hits
  const percentile = (arr, p) => {
    const idx = (arr.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return arr[lo] + (arr[hi] - arr[lo]) * (idx - lo);
  };
  const median = parseFloat(percentile(points, 0.5).toFixed(2));
  const band = points.length >= 3
    ? {
        p25: parseFloat(percentile(points, 0.25).toFixed(2)),
        median,
        p75: parseFloat(percentile(points, 0.75).toFixed(2)),
      }
    : null;

  return { avg, median, max, pctWithin10pts, band, count: hitWithRetraction.length };
};
