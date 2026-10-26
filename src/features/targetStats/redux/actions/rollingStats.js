import * as types from '../targetStatsTypes';
import { targetStatsService } from '../../services/targetStatsService';
import { getSafeStatsErrorMessage, getSafeStatsErrorReason } from '../../utils/analyticsErrors';
import { ROLLING_COPY } from '../../utils/rollingCopy';
import { trackEvent } from '../../../../utils/analytics';

let sequence = 0;

/**
 * Loads a selected range; unique request identities protect retries and A-B-A switching.
 * @param {number} sessions - Completed sessions to display.
 * @returns {Function} Redux thunk.
 */
export const fetchRollingStats = (sessions) => async (dispatch) => {
  const meta = {sessions, requestKey: ++sequence};
  dispatch({type: types.TARGET_ROLLING_REQUEST, meta});
  try {
    const report = await targetStatsService.fetchRollingStats(sessions);
    dispatch({type: types.TARGET_ROLLING_SUCCESS, payload: report, meta});
  } catch (error) {
    trackEvent('sona_history_load_failed', {reason: getSafeStatsErrorReason(error)});
    dispatch({type: types.TARGET_ROLLING_FAILURE, payload: getSafeStatsErrorMessage(error, ROLLING_COPY.loadError), meta});
  }
};
