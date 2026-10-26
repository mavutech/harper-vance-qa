import { monthlyDisplayDays, monthlyChartData } from './monthlyCharts';
import fixture from '../components/__fixtures__/monthlyReport.json';

it('omits weekends and closed holidays without hiding missing or inconsistent weekdays', () => {
  const days = [
    {date: '2026-10-02', status: 'included'},
    {date: '2026-10-03', status: 'invalid'},
    {date: '2026-10-04', status: 'closed'},
    {date: '2026-10-05', status: 'closed'},
    {date: '2026-10-06', status: 'missing'},
    {date: '2026-10-07', status: 'invalid'},
    {date: '2026-10-08', status: 'zero_targets'},
  ];
  expect(monthlyDisplayDays(days).map(day => day.date)).toEqual(['2026-10-02', '2026-10-06', '2026-10-07', '2026-10-08']);
});
it('plots zero-target days as zero volume but not zero accuracy, and missing reports as gaps', () => {
  const data = monthlyChartData(fixture);
  expect(data.dates.slice(0, 3)).toEqual(['10/01', '10/02', '10/05']);
  expect(data.accuracy.slice(0, 3)).toEqual([66.7, null, null]);
  expect(data.hits.slice(0, 3)).toEqual([2, 0, null]);
  expect(data.misses.slice(0, 3)).toEqual([1, 0, null]);
  expect(data.dates).not.toContain('10/22');
  expect(data.dates).not.toContain('10/03');
  expect(data.timingCounts.reduce((a, b) => a + b, 0)).toBe(fixture.timing.samples);
  expect(data.pullbackCounts.reduce((a, b) => a + b, 0)).toBe(fixture.pullbacks.samples);
});
it('counts pullback boundary values once, omits missing measurements, and excludes misses', () => {
  const targets = [0, 10, 10.25, 25, 25.25, 50, 50.25, 100, 100.25, null, -1, NaN].map(pullback => ({hit: true, pullback}));
  targets.push({hit: false, pullback: 5});
  const data = monthlyChartData({...fixture, targets});
  expect(data.pullbackCounts).toEqual([2, 2, 2, 2, 1]);
  expect(data.pullbackSamples).toBe(9);
});
