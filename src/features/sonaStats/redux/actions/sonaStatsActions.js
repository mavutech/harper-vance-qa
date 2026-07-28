import * as types from '../sonaStatsTypes';
import { sonaStatsService } from '../../services/sonaStatsService';
import { computeAllStats } from '../../utils/computeTargetStats';
import moment from 'moment';

/**
 * Fetches daily SONA target stats for a given date and computes all derived stats.
 * Dispatches REQUEST → SUCCESS | FAILURE.
 *
 * @param {string} [date] - ISO date string (YYYY-MM-DD). Defaults to today.
 * @returns {Function} Redux thunk
 */
export const fetchDailyStats = (date) => async (dispatch) => {
  const targetDate = date || moment().format('YYYY-MM-DD');
  dispatch({ type: types.SONA_DAILY_FETCH_REQUEST, payload: targetDate });

  try {
    const rawPayload = await sonaStatsService.fetchDailyStats(targetDate);
    const computedStats = computeAllStats(rawPayload);
    dispatch({
      type: types.SONA_DAILY_FETCH_SUCCESS,
      payload: { rawPayload, computedStats, date: targetDate },
    });
  } catch (error) {
    dispatch({
      type: types.SONA_DAILY_FETCH_FAILURE,
      payload: error.message || 'Failed to load daily stats.',
    });
  }
};

/**
 * Fetches SONA stats for an array of dates in parallel and computes per-day stats.
 * Missing dates (weekends, holidays, no data) are silently excluded.
 * Dispatches REQUEST → SUCCESS | FAILURE.
 *
 * @param {string[]} dates - Array of ISO date strings (YYYY-MM-DD)
 * @returns {Function} Redux thunk
 */
export const fetchRangeStats = (dates) => async (dispatch) => {
  const requestKey = dates.join(',');
  dispatch({ type: types.SONA_RANGE_FETCH_REQUEST, meta: { requestKey } });

  try {
    const rawPayloads = await sonaStatsService.fetchDateRangeStats(dates);
    const enriched = rawPayloads.map((rawPayload) => ({
      rawPayload,
      computedStats: computeAllStats(rawPayload),
    }));
    dispatch({ type: types.SONA_RANGE_FETCH_SUCCESS, payload: enriched, meta: { requestKey } });
  } catch (error) {
    dispatch({
      type: types.SONA_RANGE_FETCH_FAILURE,
      payload: error.message || 'Failed to load historical stats.',
      meta: { requestKey },
    });
  }
};

/**
 * Fetches weekly SONA stats from Firebase RTDB.
 * Dispatches REQUEST → SUCCESS | FAILURE.
 *
 * @param {number} year - Full year (e.g. 2026)
 * @param {number} weekNumber - ISO week number (1–52)
 * @returns {Function} Redux thunk
 */
export const fetchWeeklyStats = (year, weekNumber) => async (dispatch) => {
  const requestKey = `${year}-${weekNumber}`;
  dispatch({ type: types.SONA_WEEKLY_FETCH_REQUEST, meta: { requestKey } });

  try {
    const rawPayload = await sonaStatsService.fetchWeeklyStats(year, weekNumber);
    dispatch({ type: types.SONA_WEEKLY_FETCH_SUCCESS, payload: rawPayload, meta: { requestKey } });
  } catch (error) {
    dispatch({
      type: types.SONA_WEEKLY_FETCH_FAILURE,
      payload: error.message || 'Failed to load weekly stats.',
      meta: { requestKey },
    });
  }
};

/**
 * Fetches the last N weekly summaries ending at the given week for the
 * week-over-week trend chart. Dispatches REQUEST → SUCCESS | FAILURE.
 *
 * @param {number} endYear - ISO week year of the most recent week
 * @param {number} endWeekNumber - ISO week number of the most recent week
 * @param {number} [count=8] - Number of weeks to load
 * @returns {Function} Redux thunk
 */
export const fetchWeeklyTrend = (endYear, endWeekNumber, count = 8) => async (dispatch) => {
  const requestKey = `${endYear}-${endWeekNumber}-${count}`;
  dispatch({ type: types.SONA_WEEKLY_TREND_REQUEST, meta: { requestKey } });

  try {
    const data = await sonaStatsService.fetchWeeklyRange(endYear, endWeekNumber, count);
    dispatch({ type: types.SONA_WEEKLY_TREND_SUCCESS, payload: data, meta: { requestKey } });
  } catch (error) {
    dispatch({
      type: types.SONA_WEEKLY_TREND_FAILURE,
      payload: error.message || 'Failed to load weekly trend.',
      meta: { requestKey },
    });
  }
};
