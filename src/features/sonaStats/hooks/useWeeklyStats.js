import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import { fetchWeeklyStats, fetchWeeklyTrend, fetchRangeStats } from '../redux/actions/sonaStatsActions';
import { trackEvent } from '../../../utils/analytics';

const TREND_WEEKS = 8;

/**
 * Derives the five ISO trading dates (Mon–Fri) for a given week number and year.
 *
 * @param {number} year - ISO week year
 * @param {number} weekNumber - ISO week number (1–52)
 * @returns {string[]} Array of 5 ISO date strings (YYYY-MM-DD), Monday through Friday
 */
const getWeekDates = (year, weekNumber) => {
  const monday = moment().isoWeekYear(year).isoWeek(weekNumber).day(1);
  return [0, 1, 2, 3, 4].map((i) => moment(monday).add(i, 'days').format('YYYY-MM-DD'));
};

/**
 * Aggregates direction split (bullish/bearish accuracy) across multiple days
 * by summing per-target data from each day's computedStats.
 *
 * @param {Array<{ rawPayload: Object, computedStats: Object|null }>} rangeData - Daily stats for the week
 * @returns {{ bullishAcc: number|null, bearishAcc: number|null }}
 */
const aggregateWeeklyDirection = (rangeData) => {
  let bullishCreated = 0;
  let bullishHit = 0;
  let bearishCreated = 0;
  let bearishHit = 0;

  rangeData.forEach(({ computedStats }) => {
    if (!computedStats?.directionSplit) return;
    bullishCreated += computedStats.directionSplit.bullish?.created ?? 0;
    bullishHit += computedStats.directionSplit.bullish?.hit ?? 0;
    bearishCreated += computedStats.directionSplit.bearish?.created ?? 0;
    bearishHit += computedStats.directionSplit.bearish?.hit ?? 0;
  });

  return {
    bullishAcc: bullishCreated > 0 ? parseFloat(((bullishHit / bullishCreated) * 100).toFixed(1)) : null,
    bearishAcc: bearishCreated > 0 ? parseFloat(((bearishHit / bearishCreated) * 100).toFixed(1)) : null,
    bullishCreated,
    bullishHit,
    bearishCreated,
    bearishHit,
  };
};

/**
 * Calculates a percentile from an ascending numeric array using linear
 * interpolation. Returns null when no values are available.
 *
 * @param {number[]} values - Values sorted from lowest to highest
 * @param {number} percentile - Percentile expressed from 0 to 1
 * @returns {number|null} Calculated percentile
 */
const getPercentile = (values, percentile) => {
  if (values.length === 0) return null;

  const index = (values.length - 1) * percentile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return values[lower] + ((values[upper] - values[lower]) * (index - lower));
};

/**
 * Builds the core weekly summary from available daily documents when the
 * backend weekly summary has not been written yet. This keeps the page useful
 * for weeks where daily processing completed but weekly aggregation failed.
 *
 * @param {Array<{ rawPayload: Object, computedStats: Object|null }>} rangeData - Daily stats for the selected week
 * @returns {Object|null} Weekly fields supported by daily records, or null when none exist
 */
export const buildWeeklyFallback = (rangeData) => {
  if (!rangeData || rangeData.length === 0) return null;

  const dailyRows = rangeData.map(({ rawPayload, computedStats }) => {
    const created = Number(rawPayload?.targetsCreated) || 0;
    const reached = Number(rawPayload?.targetsReached) || 0;
    return { rawPayload, computedStats, created, reached };
  });
  const targetsCreatedSum = dailyRows.reduce((sum, row) => sum + row.created, 0);
  const targetsReachedSum = dailyRows.reduce((sum, row) => sum + row.reached, 0);
  const accuracy = targetsCreatedSum > 0
    ? parseFloat(((targetsReachedSum / targetsCreatedSum) * 100).toFixed(1))
    : null;
  const resolutionTimes = dailyRows
    .flatMap((row) => row.computedStats?.resolutionTimes?.times || [])
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const retractions = dailyRows
    .flatMap((row) => row.rawPayload?.engulfingCandleList || [])
    .filter((target) => target.targetReached && Number.isFinite(target.retractionPoints))
    .map((target) => target.retractionPoints)
    .sort((a, b) => a - b);
  const medianTime = getPercentile(resolutionTimes, 0.5);
  const avgTime = resolutionTimes.length > 0
    ? resolutionTimes.reduce((sum, value) => sum + value, 0) / resolutionTimes.length
    : null;
  const medianRetraction = getPercentile(retractions, 0.5);
  const p25Retraction = getPercentile(retractions, 0.25);
  const p75Retraction = getPercentile(retractions, 0.75);
  const p90Retraction = getPercentile(retractions, 0.9);
  const pctHitWithin10pts = retractions.length > 0
    ? parseFloat(((retractions.filter((value) => value <= 10).length / retractions.length) * 100).toFixed(1))
    : null;
  const rowsWithTargets = dailyRows.filter((row) => row.created > 0);
  const byAccuracy = (first, second) => (first.reached / first.created) - (second.reached / second.created);
  const bestDay = rowsWithTargets.length > 0
    ? moment([...rowsWithTargets].sort(byAccuracy).at(-1).rawPayload.alertDate).format('ddd, MMM D')
    : null;
  const worstDay = rowsWithTargets.length > 0
    ? moment([...rowsWithTargets].sort(byAccuracy)[0].rawPayload.alertDate).format('ddd, MMM D')
    : null;
  const formatPoints = (value) => value === null ? null : `${parseFloat(value.toFixed(1))} pts`;

  return {
    targetsCreatedSum,
    targetsReachedSum,
    targetAccuracyOverall: accuracy === null ? null : `${accuracy}% Accuracy`,
    targetMedianTimeWeek: medianTime === null ? null : `${parseFloat(medianTime.toFixed(1))} mins`,
    targetAvgTimeSum: avgTime === null ? null : `${parseFloat(avgTime.toFixed(1))} mins`,
    medianRetraction: formatPoints(medianRetraction),
    p25Retraction: formatPoints(p25Retraction),
    p75Retraction: formatPoints(p75Retraction),
    p90Retraction: formatPoints(p90Retraction),
    maxRetraction: retractions.length > 0 ? formatPoints(retractions.at(-1)) : null,
    pctHitWithin10pts: pctHitWithin10pts === null ? null : `${pctHitWithin10pts}%`,
    bestDay,
    worstDay,
  };
};

/**
 * Provides all data needed by the SonaWeekly page.
 * Dispatches three parallel fetches:
 *   1. Weekly summary (headline KPIs from weekly rawPayload)
 *   2. 5 daily stats for the selected week (direction split, day-by-day chart)
 *   3. Last 8 weekly summaries (week-over-week trend chart)
 *
 * Fires sona_weekly_screen_viewed analytics event on mount and week change.
 *
 * @param {number} weekNumber - ISO week number (1–52)
 * @param {number} year - ISO week year (e.g. 2026)
 * @returns {{
 *   weekly: Object|null,
 *   weekDates: string[],
 *   rangeData: Array,
 *   weeklyDirection: Object,
 *   trendData: Object[],
 *   loading: boolean,
 *   error: string|null
 * }}
 *
 * @example
 * const { weekly, rangeData, trendData, loading } = useWeeklyStats(24, 2026);
 */
export const useWeeklyStats = (weekNumber, year) => {
  const dispatch = useDispatch();

  const { data: weekly, loading: weeklyLoading, error: weeklyError } = useSelector(
    (state) => state.sonaStats.weekly
  );
  const { data: rangeData, loading: rangeLoading } = useSelector(
    (state) => state.sonaStats.range
  );
  const { data: trendData, loading: trendLoading } = useSelector(
    (state) => state.sonaStats.weeklyTrend
  );

  const weekDates = useMemo(() => getWeekDates(year, weekNumber), [year, weekNumber]);

  useEffect(() => {
    dispatch(fetchWeeklyStats(year, weekNumber));
    dispatch(fetchRangeStats(weekDates));
    dispatch(fetchWeeklyTrend(year, weekNumber, TREND_WEEKS));
    trackEvent('sona_weekly_screen_viewed', { weekNumber, year });
  }, [dispatch, year, weekNumber, weekDates]);

  const weeklyFallback = useMemo(() => buildWeeklyFallback(rangeData), [rangeData]);
  const displayedWeekly = weekly || weeklyFallback;

  const weeklyDirection = useMemo(
    () => aggregateWeeklyDirection(rangeData),
    [rangeData]
  );

  // Coverage / honesty flags. A "week" silently built from only a few daily
  // docs (holiday, missing run) or from very few targets should not read with
  // full authority — surface how much it's actually based on.
  const coverage = useMemo(() => {
    const daysCovered = rangeData?.length ?? 0;
    const totalTargets = Number(displayedWeekly?.targetsCreatedSum) ||
      (rangeData || []).reduce((sum, d) => sum + (Number(d?.rawPayload?.targetsCreated) || 0), 0);
    return {
      daysCovered,
      daysExpected: weekDates.length,
      totalTargets,
      partialWeek: daysCovered > 0 && daysCovered < weekDates.length,
      smallSample: totalTargets > 0 && totalTargets < 10,
    };
  }, [rangeData, displayedWeekly, weekDates]);

  const loading = weeklyLoading || rangeLoading || trendLoading;
  const weeklySummaryMissing = Boolean(!weekly && weeklyError && weeklyFallback);
  const error = weeklyFallback ? null : weeklyError;

  return {
    weekly: displayedWeekly,
    weekDates,
    rangeData,
    weeklyDirection,
    trendData,
    coverage,
    loading,
    error,
    weeklySummaryMissing,
  };
};
