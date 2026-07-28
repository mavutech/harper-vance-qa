import { useEffect, useState } from 'react';
import moment from 'moment-timezone';
import { sonaStatsService } from '../services/sonaStatsService';
import { EST_TIMEZONE } from '../utils/sonaStatsConstants';
import { filterLateTargets } from '../utils/filterLateTargets';

/**
 * Builds an array of the last N trading-session dates ending today (inclusive)
 * and walking backwards. Weekends skipped; holidays not (missing days resolve
 * to empty in the fetch layer).
 *
 * @param {number} nSessions
 * @returns {string[]} ISO date strings, most recent first
 */
const getRecentSessionDates = (nSessions) => {
  const dates = [];
  const cursor = moment().tz(EST_TIMEZONE);

  while (dates.length < nSessions) {
    const dow = cursor.day();
    if (dow !== 0 && dow !== 6) {
      dates.push(cursor.format('YYYY-MM-DD'));
    }
    cursor.subtract(1, 'day');
  }

  return dates;
};

/**
 * Fetches the last N trading sessions of engulfingCandleList data and returns
 * the flat, decorated list of targets matching the requested mode.
 *
 * Modes:
 *   - 'missedOnly' (default): targetReached !== true. True misses — targets
 *     that never filled. This is the subset most users expect when they hear
 *     "missed targets."
 *   - 'allLate': targets that took > thresholdMin to first resolve OR never
 *     resolved. Mirrors the pool aggregated in the backend's lateResolverStats.
 *
 * @param {number} nSessions - Number of trading sessions to include
 * @param {number} thresholdMin - "Late" threshold in minutes (used in 'allLate')
 * @param {'missedOnly'|'allLate'} [mode='missedOnly']
 * @returns {{ targets: Object[], loading: boolean, error: string|null }}
 */
export const useLateTargetsWindow = (nSessions, thresholdMin, mode = 'missedOnly') => {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!nSessions || nSessions <= 0) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const dates = getRecentSessionDates(nSessions);

    sonaStatsService
      .fetchEngulfingCandleListsForDates(dates)
      .then((results) => {
        if (cancelled) return;
        const flat = [];
        results.forEach(({ date, targets: dailyTargets }) => {
          dailyTargets.forEach((t) => flat.push({ ...t, originDate: date }));
        });
        const decorated = filterLateTargets(flat, thresholdMin ?? 5);
        const filtered = mode === 'missedOnly'
          ? decorated.filter((t) => t.targetReached !== true)
          : decorated;
        setTargets(filtered);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to load late targets.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [nSessions, thresholdMin, mode]);

  return { targets, loading, error };
};
