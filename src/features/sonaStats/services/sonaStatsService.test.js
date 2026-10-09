import apiClient from '../../../api/client';
import { sonaStatsService } from './sonaStatsService';
import { STATS_ERROR_CODES } from '../utils/analyticsErrors';

jest.mock('../../../api/client', () => ({
  get: jest.fn(),
}));

describe('sonaStatsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws an Error object for a missing daily report', async () => {
    apiClient.get.mockResolvedValue([{ date: '2026-10-08', data: null }]);

    await expect(sonaStatsService.fetchDailyStats('2026-10-08')).rejects.toMatchObject({
      code: STATS_ERROR_CODES.dailyNotFound,
      message: 'No report is available for 2026-10-08.',
    });
  });

  it('skips missing dates without hiding available range data', async () => {
    apiClient.get.mockResolvedValue([
      { date: '2026-10-07', data: null },
      { date: '2026-10-08', data: { date: '2026-10-08' } },
    ]);

    await expect(sonaStatsService.fetchDateRangeStats(['2026-10-07', '2026-10-08']))
      .resolves.toEqual([{ date: '2026-10-08' }]);
    expect(apiClient.get).toHaveBeenCalledWith('/api/product/daily', {
      params: { dates: '2026-10-07,2026-10-08' },
    });
  });

  it('propagates permission failures instead of presenting an empty range', async () => {
    const error = new Error('Your organization does not have access to this feature.');
    error.code = 'FEATURE_NOT_ENTITLED';
    apiClient.get.mockRejectedValue(error);

    await expect(sonaStatsService.fetchDateRangeStats(['2026-10-08']))
      .rejects.toBe(error);
    await expect(sonaStatsService.fetchEngulfingCandleListsForDates(['2026-10-08']))
      .rejects.toBe(error);
  });

  it('reads weekly reports and session history through the licensed API', async () => {
    apiClient.get
      .mockResolvedValueOnce({ targetsCreated: 4 })
      .mockResolvedValueOnce([{ date: '2026-10-08', candles: [{ dateTimestamp: '1' }] }]);

    await expect(sonaStatsService.fetchWeeklyStats(2026, 41))
      .resolves.toEqual({ targetsCreated: 4 });
    await expect(sonaStatsService.fetchSessionCandles('2026-10-08'))
      .resolves.toEqual([{ dateTimestamp: '1' }]);

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/api/product/weekly', {
      params: { year: 2026, week: 41 },
    });
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/api/product/history', {
      params: { dates: '2026-10-08' },
    });
  });
});
