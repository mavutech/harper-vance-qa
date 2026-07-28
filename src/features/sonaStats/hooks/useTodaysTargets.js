import { useEffect, useState } from 'react';
import moment from 'moment';
import sonaTargetsService from '../services/sonaTargetsService';
import { isNQSessionLive } from '../utils/sonaStatsConstants';
import { trackEvent } from '../../../utils/analytics';

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
 *   error: string|null
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

  useEffect(() => {
    trackEvent('sona_targets_screen_viewed', { date: today });

    const unsubscribe = sonaTargetsService.subscribeToTodaysTargets(today, (incomingTargets, err) => {
      if (err) {
        setError(err);
      } else {
        setError(null);
        setTargets(incomingTargets);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [today]);

  const isSessionLive = isNQSessionLive();

  return { targets, isSessionLive, loading, error };
};
