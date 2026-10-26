import {rollingChart, formatRate} from './rollingPresentation';
const report = {days: [{date: '2026-10-01', created: 10, hits: 5, accuracy: 50},
  {date: '2026-10-02', created: 0, hits: 0, accuracy: null}, {date: '2026-10-05', status: 'missing'}],
trend: [{created: 100, hits: 80, accuracy: 80}, {accuracy: 80}, {accuracy: null}]};
it('preserves actual bar heights and gaps without full-height backgrounds or distributed colors', () => {
  const {series, options} = rollingChart(report);
  expect(series[0].data).toEqual([50, null, null]);
  expect(series[1].data).toEqual([80, 80, null]);
  expect(options.colors[0]).not.toBe(options.colors[1]);
  expect(options.plotOptions.bar.distributed).toBe(false);
  expect(options.plotOptions.bar).not.toHaveProperty('colors.backgroundBarColors');
  expect(options.tooltip.y.formatter(50, {seriesIndex: 0, dataPointIndex: 0})).toBe('50% · 5/10 hits');
  expect(options.tooltip.y.formatter(null, {seriesIndex: 0, dataPointIndex: 1})).toBe('N/A');
  expect(formatRate(0)).toBe('0%');
});
it('limits visible date labels to a readable number for 40 sessions', () => {
  const days = Array.from({length: 40}, (_, i) => ({date: `session-${i}`, accuracy: 50}));
  const {options} = rollingChart({days, trend: days});
  const labels = days.map(({date}) => options.xaxis.labels.formatter(date)).filter(Boolean);
  expect(labels.length).toBeLessThanOrEqual(7);
});
