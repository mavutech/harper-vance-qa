import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRollingStats } from '../redux/actions/rollingStats';

/**
 * Loads only the selected recent-performance range, with explicit retry.
 * @param {number} sessions - Number of completed sessions.
 * @returns {Object} Report, loading/error state and retry action.
 */
export const useRecentPerformance = (sessions) => {
  const dispatch = useDispatch();
  const state = useSelector((store) => store.targetStats.rolling);
  const retry = useCallback(() => dispatch(fetchRollingStats(sessions)), [dispatch, sessions]);
  useEffect(() => { retry(); }, [retry]);
  const selected = state.sessions === sessions;
  return {report: selected ? state.data : null, loading: !selected || state.loading,
    error: selected ? state.error : null, retry};
};
