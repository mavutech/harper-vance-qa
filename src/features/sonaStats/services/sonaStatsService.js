import * as productDataApi from '../api/productDataApi';

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
  const [record] = await productDataApi.fetchDailyReports([date]);
  if (!record?.data) {
    throw Object.assign(new Error(`No stats available for ${date}.`), {code: 'SONA_DAILY_NOT_FOUND'});
  }
  return record.data;
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
  const records = await productDataApi.fetchDailyReports(dates);
  return records.map((record) => record.data).filter(Boolean);
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
  const payload = await productDataApi.fetchWeeklyReport(year, weekNumber);
  if (!payload) {
    throw Object.assign(
      new Error(`No weekly stats found for week ${weekNumber} of ${year}.`),
      {code: 'SONA_WEEKLY_NOT_FOUND'}
    );
  }
  return payload;
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
 * @returns {Promise<Object[]>} Candles sorted ascending by timestamp; empty array when none
 *
 * @example
 * const candles = await sonaStatsService.fetchSessionCandles('2026-06-11');
 */
const fetchSessionCandles = async (date) => {
  const [record] = await productDataApi.fetchSessionHistory([date]);
  return record?.candles || [];
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
  const [record] = await productDataApi.fetchDailyReports([date]);
  const value = record?.data?.engulfingCandleList;
  if (!value) return [];
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
  const records = await productDataApi.fetchDailyReports(dates);
  return records.map(({date, data}) => {
    const value = data?.engulfingCandleList;
    return {date, targets: value ? (Array.isArray(value) ? value : Object.values(value)) : []};
  });
};

/**
 * Fetches 5-minute candles for multiple dates in parallel and returns an
 * array of `{ date, candles }` entries in the input order. Missing days
 * resolve to `candles: []` so callers can Promise.all without special-casing.
 *
 * @param {string[]} dates - ISO date strings (YYYY-MM-DD)
 * @returns {Promise<Array<{ date: string, candles: Object[] }>>}
 *
 * @example
 * const window = await sonaStatsService.fetchSessionCandlesForDates([
 *   '2026-06-05', '2026-06-06', '2026-06-09',
 * ]);
 */
const fetchSessionCandlesForDates = async (dates) => {
  return productDataApi.fetchSessionHistory(dates);
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
