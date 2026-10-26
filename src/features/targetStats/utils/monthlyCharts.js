import moment from 'moment-timezone';

/**
 * Keeps trading weekdays visible, including reports needing attention.
 * Closed dates remain in coverage metadata but do not occupy table rows.
 * @param {Object[]} days - Calendar-month day records.
 * @returns {Object[]} Open weekday rows in their original order.
 */
export const monthlyDisplayDays = (days) => days.filter((day) =>
  day.status !== 'closed' && moment(day.date, 'YYYY-MM-DD', true).isoWeekday() <= 5
);

/**
 * Maps report measurements to graphs without changing monthly calculations.
 * Missing reports remain gaps; zero-target days have no accuracy value.
 * Pullback intervals are nonoverlapping and include valid zero measurements.
 * @param {Object} report - Calculated monthly report.
 * @returns {Object} Chart dates, daily series and distribution counts.
 */
export const monthlyChartData = (report) => {
  const days = monthlyDisplayDays(report.days).filter((day) => day.status !== 'pending');
  const measured = (day) => ['included', 'zero_targets'].includes(day.status);
  const pullbacks = report.targets.filter((target) => target.hit && Number.isFinite(target.pullback) && target.pullback >= 0);
  const pullbackCounts = [0, 0, 0, 0, 0];
  pullbacks.forEach(({pullback}) => {
    const index = pullback <= 10 ? 0 : pullback <= 25 ? 1 : pullback <= 50 ? 2 : pullback <= 100 ? 3 : 4;
    pullbackCounts[index] += 1;
  });
  return {
    dates: days.map((day) => moment(day.date, 'YYYY-MM-DD', true).format('MM/DD')),
    accuracy: days.map((day) => measured(day) && day.created > 0 && Number.isFinite(day.accuracy) ? day.accuracy : null),
    hits: days.map((day) => measured(day) ? day.hits : null),
    misses: days.map((day) => measured(day) ? day.created - day.hits : null),
    timingCounts: ['0-5', '6-15', '16-30', '31-60', '60+'].map((key) => report.timing.buckets[key]),
    pullbackCounts,
    pullbackSamples: pullbacks.length,
    hasDailyReports: days.some(measured),
  };
};
