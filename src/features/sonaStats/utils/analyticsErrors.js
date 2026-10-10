/**
 * Stable error codes produced by the analytics data service.
 *
 * @type {{dailyNotFound: string, weeklyNotFound: string}}
 */
export const STATS_ERROR_CODES = Object.freeze({
  dailyNotFound: 'SONA_DAILY_NOT_FOUND',
  weeklyNotFound: 'SONA_WEEKLY_NOT_FOUND',
});

/**
 * Creates a typed Error for an expected analytics data condition.
 *
 * @param {string} code - Stable application error code
 * @param {string} message - Safe customer-facing message
 * @returns {Error} Error with a stable code
 */
export const createStatsError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

/**
 * Returns whether an error represents an expected missing report.
 *
 * @param {Error|Object|null|undefined} error - Analytics service error
 * @returns {boolean} True for controlled missing daily or weekly reports
 */
export const isMissingStatsError = (error) =>
  error?.code === STATS_ERROR_CODES.dailyNotFound ||
  error?.code === STATS_ERROR_CODES.weeklyNotFound;

/**
 * Converts an analytics failure to safe customer copy.
 * Only controlled missing-report messages may pass through unchanged.
 *
 * @param {Error|Object|null|undefined} error - Analytics service error
 * @param {string} fallbackMessage - Feature-specific safe fallback
 * @returns {string} Customer-safe error message
 */
export const getSafeStatsErrorMessage = (error, fallbackMessage) => {
  if (isMissingStatsError(error) && typeof error.message === 'string') {
    return error.message;
  }
  return fallbackMessage;
};

/**
 * Returns a non-sensitive reason suitable for analytics.
 *
 * @param {Error|Object|null|undefined} error - Analytics service error
 * @returns {string} Stable error reason
 */
export const getSafeStatsErrorReason = (error) => {
  if (isMissingStatsError(error)) return error.code;
  if (error?.code === 'PERMISSION_DENIED' || error?.code === 'permission_denied') {
    return 'permission_denied';
  }
  return 'stats/load-failed';
};
