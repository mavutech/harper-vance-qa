import apiClient from '../../../api/client';
import {
  createStatsError,
  isMissingStatsError,
  STATS_ERROR_CODES,
} from '../utils/analyticsErrors';

const PRODUCT_API_PATH = '/api/product';

/**
 * Reads licensed daily reports through the authenticated product API.
 * The backend applies the selected organization's history retention window.
 *
 * @param {string[]} dates - ISO dates to request
 * @returns {Promise<Array<{date: string, data: Object|null}>>} Daily records
 */
const requestDailyReports = (dates) => apiClient.get(`${PRODUCT_API_PATH}/daily`, {
  params: { dates: dates.join(',') },
});

/**
 * Reads licensed session history through the authenticated product API.
 *
 * @param {string[]} dates - ISO dates to request
 * @returns {Promise<Array<{date: string, candles: Object[]}>>} Session records
 */
const requestSessionHistory = (dates) => apiClient.get(`${PRODUCT_API_PATH}/history`, {
  params: { dates: dates.join(',') },
});

/**
 * Fetches daily SONA target stats through the licensed product API.
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
  const records = await requestDailyReports([date]);
  const record = records.find((item) => item.date === date);

  if (!record || !record.data) {
    throw createStatsError(
      STATS_ERROR_CODES.dailyNotFound,
      `No report is available for ${date}.`
    );
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
  const records = await requestDailyReports(dates);
  return records.map((record) => record.data).filter(Boolean);
};

/**
 * Fetches weekly SONA target stats through the licensed product API.
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
  const weekly = await apiClient.get(`${PRODUCT_API_PATH}/weekly`, {
    params: { year, week: weekNumber },
  });

  if (!weekly) {
    throw createStatsError(
      STATS_ERROR_CODES.weeklyNotFound,
      `No weekly report is available for Week ${weekNumber} of ${year}.`
    );
  }

  return weekly;
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
    } catch (error) {
      if (isMissingStatsError(error)) return null;
      throw error;
    }
  });

  const results = await Promise.all(requests);
  return results.filter(Boolean).reverse();
};

/**
 * Fetches the session's 5-minute candles through the licensed product API.
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
  if (ticker !== 'nq' || timeframe !== '5m') return [];
  const records = await requestSessionHistory([date]);
  const record = records.find((item) => item.date === date);
  return (record && record.candles) || [];
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
  const records = await requestDailyReports([date]);
  const record = records.find((item) => item.date === date);
  const value = record && record.data && record.data.engulfingCandleList;
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
  const records = await requestDailyReports(dates);
  return records.map(({ date, data }) => {
    const value = data && data.engulfingCandleList;
    return {
      date,
      targets: !value ? [] : (Array.isArray(value) ? value : Object.values(value)),
    };
  });
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
  if (ticker !== 'nq' || timeframe !== '5m') {
    return dates.map((date) => ({ date, candles: [] }));
  }
  return requestSessionHistory(dates);
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
