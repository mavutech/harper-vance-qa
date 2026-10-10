import apiClient from '../../../api/client';
import { BULLISH_COLOR } from '../utils/sonaStatsConstants';

const PRODUCT_TARGETS_PATH = '/api/product/targets';
const TARGET_REFRESH_INTERVAL_MS = 60000;

/**
 * Returns a stable, non-sensitive reason for a failed target request.
 *
 * @param {Error|Object|null|undefined} error - Product API error
 * @returns {string} Sanitized failure reason
 */
const getRequestErrorReason = (error) => (
  error && typeof error.code === 'string' && error.code.length > 0
    ? error.code
    : 'targets/request-failed'
);

/**
 * Fetches the current target record through the authenticated product API.
 *
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @returns {Promise<Object[]>} Current targets in newest-first order
 */
const fetchTodaysTargets = async (date) => {
  const response = await apiClient.get(PRODUCT_TARGETS_PATH, {params: {date}});
  return Array.isArray(response?.targets) ? response.targets : [];
};

/**
 * Polls the governed product API for today's SONA targets.
 *
 * Calls onData immediately after the first request and once per minute after
 * that. Calls onData with an empty array and a safe error reason on failure.
 *
 * The caller is responsible for invoking the returned unsubscribe function
 * when the subscription is no longer needed (e.g. on component unmount).
 *
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @param {(targets: Object[], error?: string) => void} onData - Callback fired on every update
 * @returns {() => void} Unsubscribe function
 *
 * @example
 * const unsubscribe = sonaTargetsService.subscribeToTodaysTargets('2026-06-09', (targets, err) => {
 *   if (err) console.error(err);
 *   else setTargets(targets);
 * });
 * // later, on unmount:
 * unsubscribe();
 */
const subscribeToTodaysTargets = (date, onData) => {
  let active = true;
  let requestPending = false;

  const loadTargets = async () => {
    if (!active || requestPending) return;
    requestPending = true;
    try {
      const targets = await fetchTodaysTargets(date);
      if (active) onData(targets);
    } catch (error) {
      if (active) onData([], getRequestErrorReason(error));
    } finally {
      requestPending = false;
    }
  };

  loadTargets();
  const intervalId = window.setInterval(loadTargets, TARGET_REFRESH_INTERVAL_MS);

  return () => {
    active = false;
    window.clearInterval(intervalId);
  };
};

/**
 * @namespace sonaTargetsService
 */
const sonaTargetsService = {
  fetchTodaysTargets,
  subscribeToTodaysTargets,
  /** @deprecated — kept for reference; colorHighlight value identifying a bullish target */
  BULLISH_COLOR,
};

export default sonaTargetsService;
