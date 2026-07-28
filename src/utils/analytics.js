import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebase/config';

/**
 * Logs a Firebase Analytics event with optional parameters.
 * All analytics calls in the app must route through this utility.
 * Never call logEvent directly from components, hooks, or thunks.
 *
 * @param {string} eventName - Snake_case event identifier (e.g. 'sona_daily_screen_viewed')
 * @param {Object} [params] - Optional key/value event parameters
 * @returns {void}
 *
 * @example
 * trackEvent('sona_daily_date_changed', { date: '2026-06-09' });
 */
export const trackEvent = (eventName, params) => {
  if (!analytics) return;
  try {
    logEvent(analytics, eventName, params);
  } catch (error) {
    // Analytics failures must never affect user experience
    console.warn('[Analytics] Event failed:', eventName, error);
  }
};
