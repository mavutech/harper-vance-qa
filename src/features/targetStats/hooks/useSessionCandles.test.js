import { act, renderHook, waitFor } from '@testing-library/react';
import { useSessionCandles } from './useSessionCandles';
import { targetStatsService } from '../services/targetStatsService';

jest.mock('../services/targetStatsService', () => ({
  targetStatsService: { fetchSessionCandles: jest.fn() },
}));

describe('useSessionCandles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns safe copy and retries a failed session replay request', async () => {
    targetStatsService.fetchSessionCandles
      .mockRejectedValueOnce(new Error('private Firebase path detail'))
      .mockResolvedValueOnce([{ dateTimestamp: 1 }]);

    const { result } = renderHook(() => useSessionCandles('2026-10-08'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Session replay could not be loaded.');
    expect(result.current.candles).toEqual([]);

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.candles).toEqual([{ dateTimestamp: 1 }]);
    expect(targetStatsService.fetchSessionCandles).toHaveBeenCalledTimes(2);
  });
});
