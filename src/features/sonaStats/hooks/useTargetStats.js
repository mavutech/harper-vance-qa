import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDailyStats } from '../redux/actions/sonaStatsActions';
import { trackEvent } from '../../../utils/analytics';
import moment from 'moment';

/**
 * Provides daily SONA target stats and all derived computations for a given date.
 * Dispatches the Firebase fetch on mount and whenever date changes.
 * Fires the sona_daily_screen_viewed analytics event.
 *
 * @param {string} [date] - ISO date string (YYYY-MM-DD). Defaults to today.
 * @returns {{
 *   data: Object|null,
 *   computedStats: Object|null,
 *   selectedDate: string|null,
 *   loading: boolean,
 *   error: string|null
 * }}
 *
 * @example
 * const { data, computedStats, loading, error } = useTargetStats('2026-06-09');
 */
export const useTargetStats = (date) => {
  const dispatch = useDispatch();
  const { data, computedStats, loading, error, selectedDate } = useSelector(
    (state) => state.sonaStats.daily
  );

  const targetDate = date || moment().format('YYYY-MM-DD');

  useEffect(() => {
    dispatch(fetchDailyStats(targetDate));
    trackEvent('sona_daily_screen_viewed', { date: targetDate });
  }, [dispatch, targetDate]);

  return { data, computedStats, loading, error, selectedDate };
};
