import { useEffect, useMemo, useState } from 'react';
import moment from 'moment-timezone';
import { sonaStatsService } from '../services/sonaStatsService';
import { EST_TIMEZONE } from '../utils/sonaStatsConstants';
import { reconcileMissedTargets } from '../utils/reconcileMissedTargets';

/**
 * Default lookback window matching the backend's lateResolverStats
 * windowSessions cap. Kept exported so callers and tests can reference it.
 *
 * @type {number}
 */
export const MISSED_RESOLUTION_WINDOW_SESSIONS = 20;

/**
 * Builds an array of trading-session dates ending on `anchorIso` (inclusive)
 * and walking backwards. Weekends are skipped; holidays are not — a holiday
 * day resolves to an empty result in the fetch layer.
 *
 * @param {string} anchorIso - YYYY-MM-DD, most recent date to include
 * @param {number} nSessions - Total sessions to collect
 * @returns {string[]} ISO date strings, ascending (oldest → newest)
 */
const getSessionDatesEndingAt = (anchorIso, nSessions) => {
  const dates = [];
  const cursor = moment.tz(anchorIso, EST_TIMEZONE);

  while (dates.length < nSessions) {
    const dow = cursor.day();
    if (dow !== 0 && dow !== 6) {
      dates.push(cursor.format('YYYY-MM-DD'));
    }
    cursor.subtract(1, 'day');
  }

  return dates.reverse();
};

/**
 * Builds trading-session dates strictly after `fromIso` up to and including
 * `toIso`. Empty when `fromIso >= toIso`. Weekends skipped.
 *
 * @param {string} fromIso - YYYY-MM-DD, exclusive lower bound
 * @param {string} toIso   - YYYY-MM-DD, inclusive upper bound
 * @returns {string[]} ISO date strings, ascending
 */
const getForwardSessionDates = (fromIso, toIso) => {
  const dates = [];
  const cursor = moment.tz(fromIso, EST_TIMEZONE).add(1, 'day');
  const end = moment.tz(toIso, EST_TIMEZONE);
  while (cursor.isSameOrBefore(end, 'day')) {
    const dow = cursor.day();
    if (dow !== 0 && dow !== 6) {
      dates.push(cursor.format('YYYY-MM-DD'));
    }
    cursor.add(1, 'day');
  }
  return dates;
};

/**
 * Compare two YYYY-MM-DD strings lexicographically. Both must be same format.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number} negative, zero, or positive
 */
const compareIso = (a, b) => a.localeCompare(b);

/**
 * Returns the earlier of two YYYY-MM-DD strings.
 *
 * @param {string} a
 * @param {string} b
 * @returns {string}
 */
const minIso = (a, b) => (compareIso(a, b) <= 0 ? a : b);

/**
 * Loads unreached targets originating within the last `windowSessions`
 * trading sessions ending on `weekEndIso` (clamped to today) and reconciles
 * each against subsequent sessions' 5-minute candle history to detect
 * cross-day fills.
 *
 * Partitions the results relative to the selected week:
 *   - `missedThisWeek`: targets whose origin date falls within
 *     [weekStartIso, weekEndIso]. Each row is annotated with either its
 *     later resolution or its still-open status.
 *   - `resolvedThisWeek`: targets originated before the selected week
 *     that resolved during it.
 *
 * @param {string} weekStartIso - Selected week's Monday (YYYY-MM-DD)
 * @param {string} weekEndIso   - Selected week's Sunday (YYYY-MM-DD)
 * @param {number} [windowSessions=MISSED_RESOLUTION_WINDOW_SESSIONS]
 * @returns {{
 *   missedThisWeek: Object[],
 *   resolvedThisWeek: Object[],
 *   loading: boolean,
 *   error: string|null,
 *   windowSessions: number,
 *   windowStartDate: string|null,
 *   windowEndDate: string|null,
 * }}
 */
export const useMissedTargetsResolution = (
  weekStartIso,
  weekEndIso,
  windowSessions = MISSED_RESOLUTION_WINDOW_SESSIONS
) => {
  const [state, setState] = useState({
    missedThisWeek: [],
    resolvedThisWeek: [],
    loading: false,
    error: null,
  });

  const anchorIso = useMemo(() => {
    if (!weekEndIso) return null;
    const todayIso = moment().tz(EST_TIMEZONE).format('YYYY-MM-DD');
    return minIso(weekEndIso, todayIso);
  }, [weekEndIso]);

  const sessionDates = useMemo(() => {
    if (!anchorIso || !windowSessions || windowSessions <= 0) return [];
    return getSessionDatesEndingAt(anchorIso, windowSessions);
  }, [anchorIso, windowSessions]);

  // Forward-scan days: strictly after the selected week's end through today.
  // Empty when the selected week ends today or in the future (nothing to add).
  // Ensures a historical week's late-week origins can still be reconciled
  // against candles from subsequent weeks up to the present.
  const forwardCandleDates = useMemo(() => {
    if (!weekEndIso) return [];
    const todayIso = moment().tz(EST_TIMEZONE).format('YYYY-MM-DD');
    if (compareIso(weekEndIso, todayIso) >= 0) return [];
    return getForwardSessionDates(weekEndIso, todayIso);
  }, [weekEndIso]);

  const candleDates = useMemo(
    () => [...sessionDates, ...forwardCandleDates],
    [sessionDates, forwardCandleDates]
  );

  useEffect(() => {
    if (!weekStartIso || !weekEndIso || sessionDates.length === 0) {
      setState({
        missedThisWeek: [],
        resolvedThisWeek: [],
        loading: false,
        error: null,
      });
      return undefined;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    Promise.all([
      sonaStatsService.fetchEngulfingCandleListsForDates(sessionDates),
      sonaStatsService.fetchSessionCandlesForDates(candleDates),
    ])
      .then(([targetsByDate, candlesByDate]) => {
        if (cancelled) return;

        const unreached = [];
        targetsByDate.forEach(({ date, targets }) => {
          (targets || []).forEach((target) => {
            if (target && target.targetReached !== true) {
              unreached.push({ ...target, originDate: date });
            }
          });
        });

        const reconciled = reconcileMissedTargets(unreached, candlesByDate);

        const missedThisWeek = [];
        const resolvedThisWeek = [];

        reconciled.forEach((row) => {
          const origin = row.originDate;
          if (!origin) return;

          if (compareIso(origin, weekStartIso) >= 0 && compareIso(origin, weekEndIso) <= 0) {
            missedThisWeek.push(row);
            return;
          }

          if (
            row.resolved &&
            row.resolvedOnDate &&
            compareIso(row.resolvedOnDate, weekStartIso) >= 0 &&
            compareIso(row.resolvedOnDate, weekEndIso) <= 0 &&
            compareIso(origin, weekStartIso) < 0
          ) {
            resolvedThisWeek.push(row);
          }
        });

        // Panel A — newest origin first.
        missedThisWeek.sort((a, b) => compareIso(b.originDate, a.originDate));
        // Panel B — newest resolution first.
        resolvedThisWeek.sort((a, b) => (b.resolvedAtEpoch ?? 0) - (a.resolvedAtEpoch ?? 0));

        setState({
          missedThisWeek,
          resolvedThisWeek,
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          missedThisWeek: [],
          resolvedThisWeek: [],
          loading: false,
          error: err?.message || 'Failed to load missed target resolution.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [weekStartIso, weekEndIso, sessionDates, candleDates]);

  return {
    ...state,
    windowSessions,
    windowStartDate: sessionDates[0] ?? null,
    windowEndDate: sessionDates[sessionDates.length - 1] ?? null,
  };
};
