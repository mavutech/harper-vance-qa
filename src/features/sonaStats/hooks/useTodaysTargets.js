import { useCallback, useEffect, useState } from 'react';
import moment from 'moment';
import sonaTargetsService from '../services/sonaTargetsService';
import {
  isNQSessionLive,
  TARGETS_LOAD_TIMEOUT_MS,
  TARGETS_UI_COPY,
} from '../utils/sonaStatsConstants';
import { trackEvent } from '../../../utils/analytics';
import { authReady } from '../../../firebase/config';

/**
 * Provides real-time today's SONA target data for the SonaTargets page.
 *
 * Opens a Firebase onValue subscription for today's targets path and
 * tears it down automatically on unmount. The targets array updates in
 * real time as new targets are generated or hit during the session.
 *
 * Session live status is evaluated on each render using the current
 * wall-clock time against NQ trading hours (9:30 AM – 4:00 PM EST,
 * weekdays only).
 *
 * Fires sona_targets_screen_viewed analytics event on mount.
 *
 * @returns {{
 *   targets: Object[],
 *   isSessionLive: boolean,
 *   loading: boolean,
 *   error: string|null,
 *   retryTargets: () => void
 * }}
 *
 * @example
 * const { targets, isSessionLive, loading, error } = useTodaysTargets();
 */
export const useTodaysTargets = () => {
  const today = moment().format('YYYY-MM-DD');

  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    trackEvent('sona_targets_screen_viewed', { date: today });
  }, [today]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};

    setLoading(true);
    setError(null);

    /**
     * Completes the current loading attempt with a safe user-facing error.
     *
     * @param {string} reason - Sanitized internal failure reason
     * @returns {void}
     */
    const failLoading = (reason) => {
      if (cancelled) return;
      setTargets([]);
      setError(TARGETS_UI_COPY.loadError);
      setLoading(false);
      trackEvent('sona_targets_load_failed', { reason });
    };

    const timeoutId = window.setTimeout(() => {
      unsubscribe();
      failLoading('timeout');
    }, TARGETS_LOAD_TIMEOUT_MS);

    /**
     * Waits for Firebase Auth persistence before starting the protected feed.
     *
     * @returns {Promise<void>}
     */
    const startSubscription = async () => {
      try {
        await authReady;
        if (cancelled) return;

        unsubscribe = sonaTargetsService.subscribeToTodaysTargets(
          today,
          (incomingTargets, failureReason) => {
            window.clearTimeout(timeoutId);
            if (cancelled) return;
            if (failureReason) {
              failLoading(failureReason);
              return;
            }
            setError(null);
            setTargets(incomingTargets);
            setLoading(false);
          }
        );
      } catch (_error) {
        window.clearTimeout(timeoutId);
        failLoading('subscription-setup-failed');
      }
    };

    startSubscription();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [attempt, today]);

  /**
   * Starts a fresh authenticated subscription after a recoverable failure.
   *
   * @returns {void}
   */
  const retryTargets = useCallback(() => {
    trackEvent('sona_targets_retry_requested', { date: today });
    setAttempt((currentAttempt) => currentAttempt + 1);
  }, [today]);

  const isSessionLive = isNQSessionLive();

  return { targets, isSessionLive, loading, error, retryTargets };
};
