import { get, ref } from 'firebase/database';
import { sonaStatsService } from './sonaStatsService';
import { STATS_ERROR_CODES } from '../utils/analyticsErrors';

jest.mock('firebase/database', () => ({
  get: jest.fn(),
  ref: jest.fn(),
}));

jest.mock('../../../firebase/config', () => ({
  authReady: Promise.resolve(),
  database: { name: 'test-database' },
}));

describe('sonaStatsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ref.mockImplementation((_database, path) => ({ path }));
  });

  it('throws an Error object for a missing daily report', async () => {
    get.mockResolvedValue({ exists: () => false });

    await expect(sonaStatsService.fetchDailyStats('2026-10-08')).rejects.toMatchObject({
      code: STATS_ERROR_CODES.dailyNotFound,
      message: 'No report is available for 2026-10-08.',
    });
  });

  it('skips missing dates without hiding available range data', async () => {
    get.mockImplementation(async ({ path }) => ({
      exists: () => path.endsWith('/08'),
      val: () => ({ date: '2026-10-08' }),
    }));

    await expect(sonaStatsService.fetchDateRangeStats(['2026-10-07', '2026-10-08']))
      .resolves.toEqual([{ date: '2026-10-08' }]);
  });

  it('propagates permission failures instead of presenting an empty range', async () => {
    const error = new Error('private Firebase path detail');
    error.code = 'PERMISSION_DENIED';
    get.mockRejectedValue(error);

    await expect(sonaStatsService.fetchDateRangeStats(['2026-10-08']))
      .rejects.toBe(error);
    await expect(sonaStatsService.fetchEngulfingCandleListsForDates(['2026-10-08']))
      .rejects.toBe(error);
  });
});
