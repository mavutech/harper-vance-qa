import { renderHook, waitFor } from '@testing-library/react';
import { useMissedTargetsSnapshot } from './useMissedTargetsSnapshot';
import { sonaStatsService } from '../services/sonaStatsService';

jest.mock('../services/sonaStatsService', () => ({
  sonaStatsService: {
    fetchEngulfingCandleListsForDates: jest.fn(),
    fetchSessionCandlesForDates: jest.fn(),
  },
}));

const BEARISH = 16711680;

const unreached = (targetPrice, overrides = {}) => ({
  alertId: `t-${targetPrice}`,
  title: 'NQ1! 5m Bearish Target',
  colorHighlight: BEARISH,
  targetReached: false,
  entryPrice: '21500',
  targetPrice: String(targetPrice),
  dateTimestamp: '1000000000',
  ...overrides,
});

const bar = (dateIso, hhmm, { high, low }) => {
  const dt = new Date(`${dateIso}T${hhmm}:00-04:00`);
  return {
    high: String(high),
    low: String(low),
    dateTimestamp: String(Math.floor(dt.getTime() / 1000)),
  };
};

describe('useMissedTargetsSnapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns empty state when weekEnd is missing', async () => {
    const { result } = renderHook(() => useMissedTargetsSnapshot(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.filledByEndOfWeek).toEqual([]);
    expect(result.current.openAtEndOfWeek).toEqual([]);
    expect(sonaStatsService.fetchEngulfingCandleListsForDates).not.toHaveBeenCalled();
  });

  test('partitions targets into filled vs open as of the anchor date', async () => {
    // Two unreached targets, both from within the window.
    // Target A resolved on 06-16 (before weekEnd 06-19) → filled by end of week.
    // Target B never touched → open at end of week.
    sonaStatsService.fetchEngulfingCandleListsForDates.mockResolvedValue([
      { date: '2026-06-15', targets: [unreached(21400, { alertId: 'A' })] },
      { date: '2026-06-16', targets: [unreached(21300, { alertId: 'B' })] },
    ]);
    sonaStatsService.fetchSessionCandlesForDates.mockResolvedValue([
      { date: '2026-06-15', candles: [] },
      { date: '2026-06-16', candles: [bar('2026-06-16', '10:00', { high: 21500, low: 21395 })] },
      { date: '2026-06-17', candles: [bar('2026-06-17', '10:00', { high: 21500, low: 21390 })] },
      { date: '2026-06-18', candles: [bar('2026-06-18', '10:00', { high: 21500, low: 21395 })] },
      { date: '2026-06-19', candles: [bar('2026-06-19', '10:00', { high: 21500, low: 21395 })] },
    ]);

    const { result } = renderHook(() => useMissedTargetsSnapshot('2026-06-19', 5));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.filledByEndOfWeek).toHaveLength(1);
    expect(result.current.filledByEndOfWeek[0].alertId).toBe('A');
    expect(result.current.filledByEndOfWeek[0].resolvedOnDate).toBe('2026-06-16');

    expect(result.current.openAtEndOfWeek).toHaveLength(1);
    expect(result.current.openAtEndOfWeek[0].alertId).toBe('B');
    expect(result.current.openAtEndOfWeek[0].resolved).toBe(false);
  });

  test('caps the "filled" verdict at the anchor date', async () => {
    // Historical week ends 06-19. Fill would happen 06-22 based on candles —
    // but candles only cover the 5-session window ending 06-19, so no fill
    // gets detected within the snapshot. Target reads as open.
    sonaStatsService.fetchEngulfingCandleListsForDates.mockResolvedValue([
      { date: '2026-06-15', targets: [unreached(21400, { alertId: 'A' })] },
    ]);
    sonaStatsService.fetchSessionCandlesForDates.mockResolvedValue([
      { date: '2026-06-15', candles: [] },
      { date: '2026-06-16', candles: [] },
      { date: '2026-06-17', candles: [] },
      { date: '2026-06-18', candles: [] },
      { date: '2026-06-19', candles: [] },
    ]);

    const { result } = renderHook(() => useMissedTargetsSnapshot('2026-06-19', 5));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.filledByEndOfWeek).toEqual([]);
    expect(result.current.openAtEndOfWeek).toHaveLength(1);
    expect(result.current.openAtEndOfWeek[0].alertId).toBe('A');
  });

  test('sorts both sub-sections by origin date descending', async () => {
    sonaStatsService.fetchEngulfingCandleListsForDates.mockResolvedValue([
      { date: '2026-06-15', targets: [unreached(21400, { alertId: 'earlyOrigin' })] },
      { date: '2026-06-17', targets: [unreached(21400, { alertId: 'laterOrigin' })] },
    ]);
    sonaStatsService.fetchSessionCandlesForDates.mockResolvedValue([
      { date: '2026-06-15', candles: [] },
      { date: '2026-06-16', candles: [bar('2026-06-16', '10:00', { high: 21500, low: 21395 })] },
      { date: '2026-06-17', candles: [] },
      { date: '2026-06-18', candles: [bar('2026-06-18', '10:00', { high: 21500, low: 21395 })] },
      { date: '2026-06-19', candles: [] },
    ]);

    const { result } = renderHook(() => useMissedTargetsSnapshot('2026-06-19', 5));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Both filled; sorted by origin date descending → laterOrigin (06-17) first.
    expect(result.current.filledByEndOfWeek.map((r) => r.alertId)).toEqual([
      'laterOrigin',
      'earlyOrigin',
    ]);
  });

  test('reports error state when the service rejects', async () => {
    sonaStatsService.fetchEngulfingCandleListsForDates.mockRejectedValue(new Error('boom'));
    sonaStatsService.fetchSessionCandlesForDates.mockResolvedValue([]);

    const { result } = renderHook(() => useMissedTargetsSnapshot('2026-06-19', 5));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('boom');
    expect(result.current.filledByEndOfWeek).toEqual([]);
    expect(result.current.openAtEndOfWeek).toEqual([]);
  });

  test('exposes the resolved window boundaries and as-of date', async () => {
    sonaStatsService.fetchEngulfingCandleListsForDates.mockResolvedValue([]);
    sonaStatsService.fetchSessionCandlesForDates.mockResolvedValue([]);

    const { result } = renderHook(() => useMissedTargetsSnapshot('2026-06-19', 5));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.windowSessions).toBe(5);
    expect(result.current.windowStartDate).toBe('2026-06-15');
    expect(result.current.windowEndDate).toBe('2026-06-19');
    expect(result.current.asOfDate).toBe('2026-06-19');
  });

  test('clamps asOfDate to today when the selected week ends in the future', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-17T15:00:00Z'));

    sonaStatsService.fetchEngulfingCandleListsForDates.mockResolvedValue([]);
    sonaStatsService.fetchSessionCandlesForDates.mockResolvedValue([]);

    const { result } = renderHook(() => useMissedTargetsSnapshot('2026-06-19', 5));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.asOfDate).toBe('2026-06-17');

    jest.useRealTimers();
  });
});
