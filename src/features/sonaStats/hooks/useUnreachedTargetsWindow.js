import { useEffect, useState } from 'react';
import moment from 'moment-timezone';
import { sonaStatsService } from '../services/sonaStatsService';
import { EST_TIMEZONE } from '../utils/sonaStatsConstants';
import { STALE_LEVELS_WINDOW_SESSIONS } from '../utils/staleLevels';

/**
 * Builds an array of prior-session ISO dates ending yesterday (in EST) and
 * walking backwards. Weekends are skipped; holidays are NOT — a holiday day
 * will simply resolve to an empty engulfingCandleList in the fetch layer.
 *
 * Today is deliberately excluded — today's targets are not "stale" until the
 * session closes.
 *
 * @param {number} nSessions - Count of prior sessions to include
 * @returns {string[]} ISO date strings (YYYY-MM-DD), most recent first
 */
const getPriorSessionDates = (nSessions) => {
  const dates = [];
  const cursor = moment().tz(EST_TIMEZONE).subtract(1, 'day');

  while (dates.length < nSessions) {
    const dayOfWeek = cursor.day(); // 0 = Sun, 6 = Sat
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(cursor.format('YYYY-MM-DD'));
    }
    cursor.subtract(1, 'day');
  }

  return dates;
};

/**
 * Loads unreached targets from the last N trading sessions (excluding today).
 * One-shot fetch on mount and whenever `nSessions` changes — no live
 * subscription, since stale levels change on a session-boundary cadence, not
 * an intraday one.
 *
 * Returned targets are flat (concatenated across sessions), with each target
 * annotated with its origination `originDate` so the panel can label age.
 *
 * @param {number} [nSessions=STALE_LEVELS_WINDOW_SESSIONS]
 * @returns {{ targets: Object[], loading: boolean, error: string|null }}
 *
 * @example
 * const { targets, loading } = useUnreachedTargetsWindow();
 */
export const useUnreachedTargetsWindow = (nSessions = STALE_LEVELS_WINDOW_SESSIONS) => {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const dates = getPriorSessionDates(nSessions);

    sonaStatsService
      .fetchEngulfingCandleListsForDates(dates)
      .then((results) => {
        if (cancelled) return;
        const unreached = [];
        results.forEach(({ date, targets: dailyTargets }) => {
          dailyTargets
            .filter((t) => t && t.targetReached !== true)
            .forEach((t) => unreached.push({ ...t, originDate: date }));
        });
        setTargets(unreached);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to load stale levels.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [nSessions]);

  return { targets, loading, error };
};
