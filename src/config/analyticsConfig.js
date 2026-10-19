/**
 * Returns whether measurement is explicitly enabled for this build.
 *
 * @param {Object} [environment=process.env] - Environment-like configuration.
 * @returns {boolean} Whether Firebase Analytics may initialize.
 */
export function isAnalyticsEnabled(environment = process.env) {
  return environment.REACT_APP_ANALYTICS_ENABLED === "true" &&
    Boolean(environment.REACT_APP_FIREBASE_MEASUREMENT_ID);
}
