import { renderHook } from '@testing-library/react';

// Mocked Redux state, swapped per-test. Must be prefixed `mock` so Jest allows
// the factory below to reference it.
let mockCurrentState;

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: (selector) => selector(mockCurrentState),
}));

jest.mock('../redux/actions/sonaStatsActions', () => ({
  fetchWeeklyStats: jest.fn(() => ({ type: 'TEST' })),
  fetchWeeklyTrend: jest.fn(() => ({ type: 'TEST' })),
  fetchRangeStats: jest.fn(() => ({ type: 'TEST' })),
}));

jest.mock('../../../utils/analytics', () => ({ trackEvent: jest.fn() }));

// Imported after the mocks are registered.
// eslint-disable-next-line import/first
import { buildWeeklyFallback, useWeeklyStats } from './useWeeklyStats';

const buildState = ({ weekly = null, range = [] }) => ({
  sonaStats: {
    weekly: { data: weekly, loading: false, error: null },
    range: { data: range, loading: false },
    weeklyTrend: { data: [], loading: false },
  },
});

describe('useWeeklyStats — coverage flags', () => {
  it('flags a partial week and a small sample', () => {
    mockCurrentState = buildState({
      weekly: { targetsCreatedSum: 8 },
      range: [
        { rawPayload: { targetsCreated: 4 } },
        { rawPayload: { targetsCreated: 4 } },
        { rawPayload: { targetsCreated: 0 } },
      ],
    });
    const { result } = renderHook(() => useWeeklyStats(24, 2026));
    expect(result.current.coverage.daysCovered).toBe(3);
    expect(result.current.coverage.daysExpected).toBe(5);
    expect(result.current.coverage.totalTargets).toBe(8);
    expect(result.current.coverage.partialWeek).toBe(true);
    expect(result.current.coverage.smallSample).toBe(true);
  });

  it('raises no flags on a full, well-sampled week', () => {
    mockCurrentState = buildState({
      weekly: { targetsCreatedSum: 37 },
      range: [1, 2, 3, 4, 5].map(() => ({ rawPayload: { targetsCreated: 7 } })),
    });
    const { result } = renderHook(() => useWeeklyStats(24, 2026));
    expect(result.current.coverage.daysCovered).toBe(5);
    expect(result.current.coverage.partialWeek).toBe(false);
    expect(result.current.coverage.smallSample).toBe(false);
  });

  it('derives total targets from the daily docs when the weekly sum is absent', () => {
    mockCurrentState = buildState({
      weekly: null,
      range: [
        { rawPayload: { targetsCreated: 5 } },
        { rawPayload: { targetsCreated: 6 } },
      ],
    });
    const { result } = renderHook(() => useWeeklyStats(24, 2026));
    expect(result.current.coverage.totalTargets).toBe(11);
    expect(result.current.coverage.partialWeek).toBe(true);
  });
});

describe('buildWeeklyFallback', () => {
  it('aggregates core weekly values from daily records', () => {
    const weekly = buildWeeklyFallback([
      {
        rawPayload: {
          alertDate: '2026-07-20',
          targetsCreated: 5,
          targetsReached: 4,
          engulfingCandleList: [
            { targetReached: true, retractionPoints: 5 },
            { targetReached: true, retractionPoints: 15 },
          ],
        },
        computedStats: { resolutionTimes: { times: [2, 6] } },
      },
      {
        rawPayload: {
          alertDate: '2026-07-21',
          targetsCreated: 3,
          targetsReached: 3,
          engulfingCandleList: [
            { targetReached: true, retractionPoints: 10 },
          ],
        },
        computedStats: { resolutionTimes: { times: [4] } },
      },
    ]);

    expect(weekly).toMatchObject({
      targetsCreatedSum: 8,
      targetsReachedSum: 7,
      targetAccuracyOverall: '87.5% Accuracy',
      targetMedianTimeWeek: '4 mins',
      medianRetraction: '10 pts',
      bestDay: 'Tue, Jul 21',
      worstDay: 'Mon, Jul 20',
    });
  });

  it('returns null when no daily records are available', () => {
    expect(buildWeeklyFallback([])).toBeNull();
  });
});

describe('useWeeklyStats — missing weekly summary fallback', () => {
  it('uses daily records and flags that the backend weekly summary is missing', () => {
    mockCurrentState = {
      sonaStats: {
        weekly: { data: null, loading: false, error: 'No weekly stats found for week 30 of 2026.' },
        range: {
          data: [{
            rawPayload: {
              alertDate: '2026-07-20',
              targetsCreated: 4,
              targetsReached: 3,
              engulfingCandleList: [],
            },
            computedStats: null,
          }],
          loading: false,
        },
        weeklyTrend: { data: [], loading: false },
      },
    };

    const { result } = renderHook(() => useWeeklyStats(30, 2026));

    expect(result.current.weekly.targetsCreatedSum).toBe(4);
    expect(result.current.weekly.targetsReachedSum).toBe(3);
    expect(result.current.weeklySummaryMissing).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('replaces the fallback with a generated summary when it becomes available', () => {
    mockCurrentState = {
      sonaStats: {
        weekly: { data: null, loading: false, error: 'No weekly stats found for week 30 of 2026.' },
        range: {
          data: [{
            rawPayload: {
              alertDate: '2026-07-20',
              targetsCreated: 4,
              targetsReached: 3,
              engulfingCandleList: [],
            },
            computedStats: null,
          }],
          loading: false,
        },
        weeklyTrend: { data: [], loading: false },
      },
    };

    const { result, rerender } = renderHook(() => useWeeklyStats(30, 2026));
    expect(result.current.weeklySummaryMissing).toBe(true);

    const generatedWeekly = {
      targetsCreatedSum: 45,
      targetsReachedSum: 44,
      trailingStats: { targetAccuracyOverall: 91.3 },
      bucketStats: { groups: {} },
    };
    mockCurrentState = buildState({
      weekly: generatedWeekly,
      range: mockCurrentState.sonaStats.range.data,
    });
    rerender();

    expect(result.current.weekly).toBe(generatedWeekly);
    expect(result.current.weeklySummaryMissing).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
