import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMonthlyStats } from '../redux/actions/sonaStatsActions';
import { trackEvent } from '../../../utils/analytics';

/**
 * Loads a monthly report with retry and protection against stale navigation data.
 * @param {string|null} month - Valid month, or null for invalid navigation input.
 * @returns {Object} Report, loading/error state and retry handler.
 */
export const useMonthlyStats = (month) => {
  const dispatch = useDispatch();
  const state = useSelector((store) => store.sonaStats.monthly);
  const retry = useCallback(() => {
    if (!month) return;
    trackEvent('sona_monthly_retry_requested', { month });
    dispatch(fetchMonthlyStats(month));
  }, [dispatch, month]);
  useEffect(() => {
    if (!month) return;
    dispatch(fetchMonthlyStats(month));
    trackEvent('sona_monthly_screen_viewed', { month });
  }, [dispatch, month]);
  const selected = state.month === month;
  return { report: selected ? state.data : null, loading: Boolean(month) && (!selected || state.loading),
    error: selected ? state.error : null, retry };
};
