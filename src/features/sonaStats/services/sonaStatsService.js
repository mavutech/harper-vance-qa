import { ref, get } from 'firebase/database';
import { database } from '../../../firebase/config';
import moment from 'moment';

/**
 * Fetches daily SONA target stats from Firebase RTDB for a given date.
 * Firebase path: stats/nq/5m/daily/YYYY-MM/DD
 *
 * Includes the full rawPayload as written by the backend, which contains
 * engulfingCandleList (per-target data) and sortedChartData (session candles).
 *
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @returns {Promise<Object>} rawPayload object from Firebase
 * @throws {{ code: string, message: string }} When no data exists for the date
 *
 * @example
 * const payload = await sonaStatsService.fetchDailyStats('2026-06-09');
 */
const fetchDailyStats = async (date) => {
  const yearMonth = moment(date).format('YYYY-MM');
  const day = moment(date).format('DD');
  const dbRef = ref(database, `stats/nq/5m/daily/${yearMonth}/${day}`);
  const snapshot = await get(dbRef);

  if (!snapshot.exists()) {
    throw { code: 'SONA_DAILY_NOT_FOUND', message: `No stats available for ${date}.` };
  }

  return snapshot.val();
};

/**
 * Fetches daily SONA stats for an array of dates in parallel.
 * Dates with no data (weekends, holidays, missing runs) resolve to null
 * and are filtered out of the returned array.
 *
 * @param {string[]} dates - Array of ISO date strings (YYYY-MM-DD)
 * @returns {Promise<Object[]>} Array of rawPayload objects, missing dates excluded
 *
 * @example
 * const results = await sonaStatsService.fetchDateRangeStats(['2026-06-05', '2026-06-06']);
 */
const fetchDateRangeStats = async (dates) => {
  const requests = dates.map(async (date) => {
    try {
      return await fetchDailyStats(date);
    } catch {
      return null;
    }
  });

  const results = await Promise.all(requests);
  return results.filter(Boolean);
};

/**
 * Fetches weekly SONA target stats from Firebase RTDB.
 * Firebase path: stats/nq/5m/weekly/YYYY/weekNumber
 *
 * @param {number} year - Full year (e.g. 2026)
 * @param {number} weekNumber - ISO week number (1–52)
 * @returns {Promise<Object>} Weekly stats rawPayload from Firebase
 * @throws {{ code: string, message: string }} When no data exists for the week
 *
 * @example
 * const payload = await sonaStatsService.fetchWeeklyStats(2026, 24);
 */
const fetchWeeklyStats = async (year, weekNumber) => {
  const dbRef = ref(database, `stats/nq/5m/weekly/${year}/${weekNumber}`);
  const snapshot = await get(dbRef);

  if (!snapshot.exists()) {
    throw { code: 'SONA_WEEKLY_NOT_FOUND', message: `No weekly stats found for week ${weekNumber} of ${year}.` };
  }

  return snapshot.val();
};

/**
 * Fetches the last N weekly SONA summaries ending at the given week (inclusive).
 * Walks backwards week by week, silently skipping weeks with no data.
 * Returns results in ascending chronological order.
 *
 * @param {number} endYear - ISO week year of the most recent week to include
 * @param {number} endWeekNumber - ISO week number of the most recent week to include
 * @param {number} count - Number of weeks to fetch
 * @returns {Promise<Object[]>} Weekly rawPayload objects in ascending order, missing weeks excluded
 *
 * @example
 * const trend = await sonaStatsService.fetchWeeklyRange(2026, 24, 8);
 */
const fetchWeeklyRange = async (endYear, endWeekNumber, count) => {
  const weeks = [];
  let year = endYear;
  let week = endWeekNumber;

  for (let i = 0; i < count; i++) {
    weeks.push({ year, weekNumber: week });
    week--;
    if (week < 1) {
      year--;
      week = 52;
    }
  }

  const requests = weeks.map(async ({ year: y, weekNumber: w }) => {
    try {
      return await fetchWeeklyStats(y, w);
    } catch {
      return null;
    }
  });

  const results = await Promise.all(requests);
  return results.filter(Boolean).reverse();
};

/**
 * Fetches the session's 5-minute candles from the raw history node.
 * Candles are the single source of truth at `history/{ticker}/{timeframe}` —
 * day stats docs no longer need their embedded copy.
 *
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @param {string} [ticker='nq'] - Lowercase ticker key in the history path
 * @param {string} [timeframe='5m'] - Timeframe key in the history path
 * @returns {Promise<Object[]>} Candles sorted ascending by timestamp; empty array when none
 *
 * @example
 * const candles = await sonaStatsService.fetchSessionCandles('2026-06-11');
 */
const fetchSessionCandles = async (date, ticker = 'nq', timeframe = '5m') => {
  const yearMonth = moment(date).format('YYYY-MM');
  const day = moment(date).format('DD');
  const dbRef = ref(database, `history/${ticker}/${timeframe}/${yearMonth}/${day}`);
  const snapshot = await get(dbRef);

  if (!snapshot.exists()) return [];

  return Object.values(snapshot.val()).sort(
    (a, b) => parseInt(a.dateTimestamp, 10) - parseInt(b.dateTimestamp, 10)
  );
};

/**
 * Fetches the engulfingCandleList sub-node for a single date. Lighter than
 * fetchDailyStats when only per-target data is needed (e.g. stale-levels
 * panel). Missing days resolve to an empty array so callers can Promise.all
 * without special-casing.
 *
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @returns {Promise<Object[]>} engulfingCandleList array or empty
 *
 * @example
 * const targets = await sonaStatsService.fetchEngulfingCandleList('2026-06-09');
 */
const fetchEngulfingCandleList = async (date) => {
  const yearMonth = moment(date).format('YYYY-MM');
  const day = moment(date).format('DD');
  const dbRef = ref(database, `stats/nq/5m/daily/${yearMonth}/${day}/engulfingCandleList`);
  const snapshot = await get(dbRef);

  if (!snapshot.exists()) return [];

  const value = snapshot.val();
  // Backend serializes as either a JSON array or an object keyed by index —
  // normalize to array for callers.
  return Array.isArray(value) ? value : Object.values(value);
};

/**
 * Fetches engulfingCandleList arrays for multiple dates in parallel and
 * returns an array of `{ date, targets }` entries in the input order.
 * Missing days resolve to `targets: []`.
 *
 * @param {string[]} dates - ISO date strings (YYYY-MM-DD)
 * @returns {Promise<Array<{ date: string, targets: Object[] }>>}
 *
 * @example
 * const window = await sonaStatsService.fetchEngulfingCandleListsForDates([
 *   '2026-06-05', '2026-06-06', '2026-06-09',
 * ]);
 */
const fetchEngulfingCandleListsForDates = async (dates) => {
  const requests = dates.map(async (date) => {
    try {
      const targets = await fetchEngulfingCandleList(date);
      return { date, targets };
    } catch {
      return { date, targets: [] };
    }
  });

  return Promise.all(requests);
};

/**
 * Fetches 5-minute candles for multiple dates in parallel and returns an
 * array of `{ date, candles }` entries in the input order. Missing days
 * resolve to `candles: []` so callers can Promise.all without special-casing.
 *
 * @param {string[]} dates - ISO date strings (YYYY-MM-DD)
 * @param {string} [ticker='nq']
 * @param {string} [timeframe='5m']
 * @returns {Promise<Array<{ date: string, candles: Object[] }>>}
 *
 * @example
 * const window = await sonaStatsService.fetchSessionCandlesForDates([
 *   '2026-06-05', '2026-06-06', '2026-06-09',
 * ]);
 */
const fetchSessionCandlesForDates = async (dates, ticker = 'nq', timeframe = '5m') => {
  const requests = dates.map(async (date) => {
    try {
      const candles = await fetchSessionCandles(date, ticker, timeframe);
      return { date, candles };
    } catch {
      return { date, candles: [] };
    }
  });

  return Promise.all(requests);
};

export const sonaStatsService = {
  fetchDailyStats,
  fetchSessionCandles,
  fetchSessionCandlesForDates,
  fetchDateRangeStats,
  fetchWeeklyStats,
  fetchWeeklyRange,
  fetchEngulfingCandleList,
  fetchEngulfingCandleListsForDates,
};
