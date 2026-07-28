import { renderHook, waitFor } from '@testing-library/react';
import { useMissedTargetsResolution } from './useMissedTargetsResolution';
import { sonaStatsService } from '../services/sonaStatsService';

jest.mock('../services/sonaStatsService', () => ({
  sonaStatsService: {
    fetchEngulfingCandleListsForDates: jest.fn(),
    fetchSessionCandlesForDates: jest.fn(),
  },
}));

const BEARISH = 16711680;

const unreached = (originDate, targetPrice, overrides = {}) => ({
  alertId: `${originDate}-${targetPrice}`,
  title: 'NQ1! 5m Bearish Target',
  colorHighlight: BEARISH,
  targetReached: false,
  entryPrice: '21500',
  targetPrice: String(targetPrice),
  dateTimestamp: '1000000000',
  ...overrides,
});

const reached = (originDate, targetPrice) => ({
  ...unreached(originDate, targetPrice),
  targetReached: true,
});

const bar = (dateIso, hhmm, { high, low }) => {
  const dt = new Date(`${dateIso}T${hhmm}:00-04:00`);
  return {
    high: String(high),
    low: String(low),
    dateTimestamp: String(Math.floor(dt.getTime() / 1000)),
  };
};

describe('useMissedTargetsResolution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns empty state when week boundaries are missing', async () => {
    const { result } = renderHook(() => useMissedTargetsResolution(null, null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.missedThisWeek).toEqual([]);
    expect(result.current.resolvedThisWeek).toEqual([]);
    expect(sonaStatsService.fetchEngulfingCandleListsForDates).not.toHaveBeenCalled();
  });

  test('partitions results into missed-this-week and resolved-this-week', async () => {
    // Selected week: 2026-06-15..2026-06-21 (Mon-Sun).
    // Prior-week miss (2026-06-10, bearish 21490) that fills on 2026-06-15.
    // In-week miss (2026-06-16, bearish 21400) still open.
    sonaStatsService.fetchEngulfingCandleListsForDates.mockResolvedValue([
      { date: '2026-06-10', targets: [unreached('2026-06-10', 21490)] },
      { date: '2026-06-15', targets: [reached('2026-06-15', 21600)] },
      { date: '2026-06-16', targets: [unreached('2026-06-16', 21400)] },
      { date: '2026-06-17', targets: [] },
    ]);
    sonaStatsService.fetchSessionCandlesForDates.mockResolvedValue([
      { date: '2026-06-10', candles: [] },
      { date: '2026-06-15', candles: [bar('2026-06-15', '09:30', { high: 21500, low: 21489 })] },
      { date: '2026-06-16', candles: [bar('2026-06-16', '10:00', { high: 21495, low: 21470 })] },
      { date: '2026-06-17', candles: [bar('2026-06-17', '10:00', { high: 21500, low: 21450 })] },
    ]);

    const { result } = renderHook(() =>
      useMissedTargetsResolution('2026-06-15', '2026-06-21', 20)
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Prior-week origin resolved during the week.
    expect(result.current.resolvedThisWeek).toHaveLength(1);
    expect(result.current.resolvedThisWeek[0].originDate).toBe('2026-06-10');
    expect(result.current.resolvedThisWeek[0].resolvedOnDate).toBe('2026-06-15');

    // In-week origin — 21400 target never touched by any bar shown.
    expect(result.current.missedThisWeek).toHaveLength(1);
    expect(result.current.missedThisWeek[0].originDate).toBe('2026-06-16');
    expect(result.current.missedThisWeek[0].resolved).toBe(false);
  });

  test('reports error state when the service rejects', async () => {
    sonaStatsService.fetchEngulfingCandleListsForDates.mockRejectedValue(new Error('boom'));
    sonaStatsService.fetchSessionCandlesForDates.mockResolvedValue([]);

    const { result } = renderHook(() =>
      useMissedTargetsResolution('2026-06-15', '2026-06-21', 5)
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('boom');
    expect(result.current.missedThisWeek).toEqual([]);
    expect(result.current.resolvedThisWeek).toEqual([]);
  });

  test('sorts panels newest-first', async () => {
    // Two in-week misses on different days; both still open.
    sonaStatsService.fetchEngulfingCandleListsForDates.mockResolvedValue([
      { date: '2026-06-15', targets: [unreached('2026-06-15', 21400)] },
      { date: '2026-06-17', targets: [unreached('2026-06-17', 21400)] },
    ]);
    sonaStatsService.fetchSessionCandlesForDates.mockResolvedValue([
      { date: '2026-06-15', candles: [] },
      { date: '2026-06-17', candles: [] },
    ]);

    const { result } = renderHook(() =>
      useMissedTargetsResolution('2026-06-15', '2026-06-21', 5)
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.missedThisWeek.map((r) => r.originDate)).toEqual([
      '2026-06-17',
      '2026-06-15',
    ]);
  });

  test('exposes the resolved window boundaries', async () => {
    sonaStatsService.fetchEngulfingCandleListsForDates.mockResolvedValue([]);
    sonaStatsService.fetchSessionCandlesForDates.mockResolvedValue([]);

    const { result } = renderHook(() =>
      useMissedTargetsResolution('2026-06-15', '2026-06-21', 5)
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.windowEndDate).toBe('2026-06-19'); // Friday of the selected week
    expect(result.current.windowSessions).toBe(5);
    // 5 trading sessions ending on Friday 06-19 → Mon 06-15..Fri 06-19.
    expect(result.current.windowStartDate).toBe('2026-06-15');
  });

  test('fetches forward candles from historical week end through today for cross-week reconciliation', async () => {
    // Freeze time so the forward window is deterministic.
    jest.useFakeTimers().setSystemTime(new Date('2026-07-28T15:00:00Z'));

    sonaStatsService.fetchEngulfingCandleListsForDates.mockResolvedValue([]);
    sonaStatsService.fetchSessionCandlesForDates.mockResolvedValue([]);

    const { result } = renderHook(() =>
      // Selected week: 2026-07-20..2026-07-24 (Mon-Fri). Today is 2026-07-28.
      useMissedTargetsResolution('2026-07-20', '2026-07-24', 5)
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Origin fetch: 5 sessions ending Friday 07-24 → Mon 07-20..Fri 07-24.
    expect(sonaStatsService.fetchEngulfingCandleListsForDates).toHaveBeenCalledWith([
      '2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24',
    ]);
    // Candle fetch: origin dates PLUS forward days through today (skipping weekend).
    expect(sonaStatsService.fetchSessionCandlesForDates).toHaveBeenCalledWith([
      '2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24',
      '2026-07-27', '2026-07-28',
    ]);

    jest.useRealTimers();
  });
});

