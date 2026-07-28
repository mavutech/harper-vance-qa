import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRangeStats } from '../redux/actions/sonaStatsActions';
import { trackEvent } from '../../../utils/analytics';
import moment from 'moment';

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Generates an array of N trading day date strings ending at toDate (inclusive).
 * Skips Saturday (6) and Sunday (0).
 *
 * @param {string} toDate - ISO end date (YYYY-MM-DD)
 * @param {number} count - Number of trading days to include
 * @returns {string[]} ISO date strings in ascending chronological order
 */
const getTradingDays = (toDate, count) => {
  const dates = [];
  const cursor = moment(toDate);

  while (dates.length < count) {
    const dow = cursor.day();
    if (dow !== 0 && dow !== 6) {
      dates.unshift(cursor.format('YYYY-MM-DD'));
    }
    cursor.subtract(1, 'day');
  }

  return dates;
};

/**
 * Computes N-day rolling accuracy from enriched daily stat objects.
 * Takes the last N items in the array (most recent dates).
 *
 * @param {Array<{ rawPayload: Object }>} rangeData - Enriched daily stats in ascending order
 * @param {number} n - Rolling window size in days
 * @returns {number|null} Rolling average accuracy percentage, or null if insufficient data
 */
const computeRollingAccuracy = (rangeData, n) => {
  const window = rangeData.slice(-n);
  if (window.length === 0) return null;

  const accuracies = window
    .map(({ rawPayload }) => {
      const created = parseInt(rawPayload.targetsCreated, 10);
      const reached = parseInt(rawPayload.targetsReached, 10);
      return created > 0 ? (reached / created) * 100 : null;
    })
    .filter((a) => a !== null);

  if (accuracies.length === 0) return null;
  return parseFloat((accuracies.reduce((a, b) => a + b, 0) / accuracies.length).toFixed(1));
};

/**
 * Computes the current consecutive win or loss streak.
 * Reads from the end of rangeData (most recent day first).
 * A "win day" is any day where accuracy >= threshold.
 *
 * @param {Array<{ rawPayload: Object }>} rangeData - Enriched daily stats in ascending order
 * @param {number} [threshold=70] - Accuracy % required for a win day
 * @returns {{ type: 'win'|'loss'|null, count: number }}
 */
const computeDayStreak = (rangeData, threshold = 70) => {
  if (rangeData.length === 0) return { type: null, count: 0 };

  let count = 0;
  let streakType = null;

  for (let i = rangeData.length - 1; i >= 0; i--) {
    const { rawPayload } = rangeData[i];
    const created = parseInt(rawPayload.targetsCreated, 10);
    const reached = parseInt(rawPayload.targetsReached, 10);
    const accuracy = created > 0 ? (reached / created) * 100 : 0;
    const isWin = accuracy >= threshold;

    if (i === rangeData.length - 1) {
      streakType = isWin ? 'win' : 'loss';
    }

    const continuesStreak = streakType === 'win' ? isWin : !isWin;
    if (continuesStreak) {
      count++;
    } else {
      break;
    }
  }

  return { type: streakType, count };
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Provides rolling and historical SONA stats across a range of trading days.
 * Fetches up to `days` trading days of daily stat data ending at `toDate`,
 * then derives rolling averages and current streak client-side.
 *
 * Fires the sona_history_screen_viewed analytics event on mount and when
 * the date range changes.
 *
 * @param {string} [toDate] - ISO end date (YYYY-MM-DD). Defaults to today.
 * @param {number} [days=20] - Trading days to load (20 recommended maximum)
 * @returns {{
 *   rangeData: Array<{ rawPayload: Object, computedStats: Object|null }>,
 *   rolling5Day: number|null,
 *   rolling20Day: number|null,
 *   streak: { type: 'win'|'loss'|null, count: number },
 *   loading: boolean,
 *   error: string|null
 * }}
 *
 * @example
 * const { rangeData, rolling5Day, streak, loading } = useRollingStats('2026-06-09', 20);
 */
export const useRollingStats = (toDate, days = 20) => {
  const dispatch = useDispatch();
  const { data: rangeData, loading, error } = useSelector(
    (state) => state.sonaStats.range
  );

  const endDate = toDate || moment().format('YYYY-MM-DD');

  const targetDates = useMemo(
    () => getTradingDays(endDate, days),
    [endDate, days]
  );

  useEffect(() => {
    dispatch(fetchRangeStats(targetDates));
    trackEvent('sona_history_screen_viewed', { days, toDate: endDate });
  }, [dispatch, targetDates, days, endDate]);

  const rolling5Day = useMemo(() => computeRollingAccuracy(rangeData, 5), [rangeData]);
  const rolling20Day = useMemo(() => computeRollingAccuracy(rangeData, 20), [rangeData]);
  const streak = useMemo(() => computeDayStreak(rangeData), [rangeData]);

  return { rangeData, rolling5Day, rolling20Day, streak, loading, error };
};
