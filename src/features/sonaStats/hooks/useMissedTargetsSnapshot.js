import { useEffect, useMemo, useState } from 'react';
import moment from 'moment-timezone';
import { sonaStatsService } from '../services/sonaStatsService';
import { EST_TIMEZONE } from '../utils/sonaStatsConstants';
import { reconcileMissedTargets } from '../utils/reconcileMissedTargets';

/**
 * Default backward lookback matching the backend's lateResolverStats
 * windowSessions cap.
 *
 * @type {number}
 */
export const MISSED_SNAPSHOT_WINDOW_SESSIONS = 20;

/**
 * Builds an array of trading-session dates ending on `anchorIso` (inclusive)
 * and walking backwards. Weekends are skipped; holidays are not — a holiday
 * resolves to an empty result in the fetch layer.
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
 * Compare two YYYY-MM-DD strings lexicographically.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
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
 * Loads the last `windowSessions` trading sessions of unreached targets
 * ending at the earlier of the selected week's end or today, and reconciles
 * each against that same window's 5-minute candle history to produce a
 * point-in-time snapshot.
 *
 * The reconciliation is deliberately capped at the anchor date so a fill
 * that happened after the selected week does NOT flip an earlier week's
 * target to "filled" — the table reports the status the trader would have
 * seen at that Friday's close.
 *
 * Partitions the result into:
 *   - `filledByEndOfWeek`: targets resolved within the window on or before
 *     the anchor date, newest fill first.
 *   - `openAtEndOfWeek`: everything else, newest origin first.
 *
 * @param {string} weekEndIso - Selected week's Friday (YYYY-MM-DD)
 * @param {number} [windowSessions=MISSED_SNAPSHOT_WINDOW_SESSIONS]
 * @returns {{
 *   filledByEndOfWeek: Object[],
 *   openAtEndOfWeek: Object[],
 *   loading: boolean,
 *   error: string|null,
 *   windowSessions: number,
 *   windowStartDate: string|null,
 *   windowEndDate: string|null,
 *   asOfDate: string|null,
 * }}
 */
export const useMissedTargetsSnapshot = (
  weekEndIso,
  windowSessions = MISSED_SNAPSHOT_WINDOW_SESSIONS
) => {
  const [state, setState] = useState({
    filledByEndOfWeek: [],
    openAtEndOfWeek: [],
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

  useEffect(() => {
    if (!weekEndIso || sessionDates.length === 0) {
      setState({
        filledByEndOfWeek: [],
        openAtEndOfWeek: [],
        loading: false,
        error: null,
      });
      return undefined;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    Promise.all([
      sonaStatsService.fetchEngulfingCandleListsForDates(sessionDates),
      sonaStatsService.fetchSessionCandlesForDates(sessionDates),
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

        const filledByEndOfWeek = [];
        const openAtEndOfWeek = [];

        reconciled.forEach((row) => {
          // Cap the "filled" verdict at the anchor. A reconciled fill whose
          // resolvedOnDate exceeds the anchor is invisible in this snapshot
          // by design and should read as "still open at that point".
          if (
            row.resolved &&
            row.resolvedOnDate &&
            compareIso(row.resolvedOnDate, anchorIso) <= 0
          ) {
            filledByEndOfWeek.push(row);
          } else {
            openAtEndOfWeek.push(row);
          }
        });

        // Both sub-sections sort by origin date descending so the visible
        // rule is the same and users can scan the two tables side-by-side.
        filledByEndOfWeek.sort((a, b) => compareIso(b.originDate, a.originDate));
        openAtEndOfWeek.sort((a, b) => compareIso(b.originDate, a.originDate));

        setState({
          filledByEndOfWeek,
          openAtEndOfWeek,
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          filledByEndOfWeek: [],
          openAtEndOfWeek: [],
          loading: false,
          error: err?.message || 'Failed to load missed targets snapshot.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [weekEndIso, sessionDates, anchorIso]);

  return {
    ...state,
    windowSessions,
    windowStartDate: sessionDates[0] ?? null,
    windowEndDate: sessionDates[sessionDates.length - 1] ?? null,
    asOfDate: anchorIso,
  };
};
