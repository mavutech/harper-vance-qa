import moment from 'moment-timezone';
import { BULLISH_COLOR, EST_TIMEZONE } from './sonaStatsConstants';

/**
 * Direction inferred from the target's colorHighlight, with a title-string
 * fallback so partially-populated records still classify.
 *
 * @param {Object} target - engulfingCandleList entry
 * @returns {'bullish'|'bearish'|null}
 */
const inferDirection = (target) => {
  if (target.colorHighlight === BULLISH_COLOR) return 'bullish';
  if (Number.isFinite(target.colorHighlight)) return 'bearish';
  if (typeof target.title === 'string') {
    if (target.title.toLowerCase().includes('bullish')) return 'bullish';
    if (target.title.toLowerCase().includes('bearish')) return 'bearish';
  }
  return null;
};

/**
 * Coerces a numeric-or-string field to a finite number, returning null when
 * the value is missing or unparseable.
 *
 * @param {string|number|null|undefined} value
 * @returns {number|null}
 */
const toFiniteNumber = (value) => {
  if (value === null || value === undefined) return null;
  const num = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(num) ? num : null;
};

/**
 * Returns true if a candle bar touches the target price in the direction the
 * target expects. Bullish targets fill when price rises to the level from
 * below; bearish fill when price falls to the level from above.
 *
 * @param {{ high: string|number, low: string|number }} bar
 * @param {number} targetPrice
 * @param {'bullish'|'bearish'} direction
 * @returns {boolean}
 */
const barTouchesTarget = (bar, targetPrice, direction) => {
  const high = toFiniteNumber(bar.high);
  const low = toFiniteNumber(bar.low);
  if (high === null || low === null) return false;
  return direction === 'bullish' ? high >= targetPrice : low <= targetPrice;
};

/**
 * ISO date (YYYY-MM-DD) for a unix timestamp interpreted in EST.
 *
 * @param {number} unixSeconds
 * @returns {string|null}
 */
const estDateIsoFromEpoch = (unixSeconds) => {
  if (!Number.isFinite(unixSeconds)) return null;
  return moment.unix(unixSeconds).tz(EST_TIMEZONE).format('YYYY-MM-DD');
};

/**
 * Reconciles a single unreached target against subsequent trading days'
 * candle series to detect a cross-day fill. Pure function — no I/O.
 *
 * Bar shape expected: `{ high, low, dateTimestamp }` (strings or numbers).
 * Days are consumed in the order provided; the first bar that touches wins.
 *
 * @param {Object} target - engulfingCandleList entry from origin day, unreached at close
 * @param {Array<{ date: string, candles: Array<Object> }>} subsequentDays -
 *   Ordered ascending by date. `candles` empty is fine.
 * @returns {Object} Original target extended with:
 *   - `direction` — 'bullish' | 'bearish' | null
 *   - `targetPriceNum` — parsed target price
 *   - `resolved` — boolean
 *   - When resolved: `resolvedAtEpoch`, `resolvedOnDate`, `resolvedByBar`,
 *     `sessionsToResolve`, `minutesToResolve`, `resolvedPreMarket` (true when
 *     the touching bar is the day's first bar — typically the 09:25 ET
 *     pre-market opening auction bar).
 *   - When unresolved: `sessionsElapsed` — count of provided subsequentDays.
 */
export const reconcileMissedTarget = (target, subsequentDays = []) => {
  const direction = inferDirection(target);
  const targetPriceNum = toFiniteNumber(target.targetPrice);
  const originEpoch = toFiniteNumber(target.dateTimestamp);

  const base = {
    ...target,
    direction,
    targetPriceNum,
  };

  if (direction === null || targetPriceNum === null) {
    return { ...base, resolved: false, sessionsElapsed: subsequentDays.length };
  }

  for (let i = 0; i < subsequentDays.length; i += 1) {
    const day = subsequentDays[i];
    const candles = Array.isArray(day?.candles) ? day.candles : [];
    for (let barIdx = 0; barIdx < candles.length; barIdx += 1) {
      const bar = candles[barIdx];
      if (!barTouchesTarget(bar, targetPriceNum, direction)) continue;

      const barEpoch = toFiniteNumber(bar.dateTimestamp);
      const minutesToResolve = originEpoch !== null && barEpoch !== null
        ? Math.max(0, Math.round((barEpoch - originEpoch) / 60))
        : null;

      return {
        ...base,
        resolved: true,
        resolvedAtEpoch: barEpoch,
        resolvedOnDate: day.date ?? estDateIsoFromEpoch(barEpoch),
        resolvedByBar: bar,
        resolvedPreMarket: barIdx === 0,
        sessionsToResolve: i + 1,
        minutesToResolve,
      };
    }
  }

  return { ...base, resolved: false, sessionsElapsed: subsequentDays.length };
};

/**
 * Batch wrapper. Given an array of unreached targets and a chronologically
 * ordered array of daily candle bundles, reconciles each target against the
 * days strictly after its `originDate`.
 *
 * @param {Object[]} targets - Unreached targets, each carrying an `originDate`
 *   (YYYY-MM-DD) field added by the caller.
 * @param {Array<{ date: string, candles: Object[] }>} dailyCandles - Ordered
 *   ascending by date. Days with no candles are permitted.
 * @returns {Object[]} Annotated targets in the input order.
 */
export const reconcileMissedTargets = (targets, dailyCandles = []) => {
  if (!Array.isArray(targets)) return [];
  const orderedDays = [...dailyCandles].sort((a, b) =>
    (a?.date ?? '').localeCompare(b?.date ?? '')
  );

  return targets.map((target) => {
    const originDate = target?.originDate ?? null;
    const subsequent = originDate === null
      ? orderedDays
      : orderedDays.filter((d) => (d?.date ?? '') > originDate);
    return reconcileMissedTarget(target, subsequent);
  });
};
