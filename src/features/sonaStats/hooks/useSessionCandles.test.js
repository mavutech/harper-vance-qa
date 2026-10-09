import { act, renderHook, waitFor } from '@testing-library/react';
import { useSessionCandles } from './useSessionCandles';
import { sonaStatsService } from '../services/sonaStatsService';

jest.mock('../services/sonaStatsService', () => ({
  sonaStatsService: { fetchSessionCandles: jest.fn() },
}));

describe('useSessionCandles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns safe copy and retries a failed session replay request', async () => {
    sonaStatsService.fetchSessionCandles
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
    expect(sonaStatsService.fetchSessionCandles).toHaveBeenCalledTimes(2);
  });
});
