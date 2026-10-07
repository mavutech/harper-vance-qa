import {sonaStatsService} from './sonaStatsService';
import * as productDataApi from '../api/productDataApi';

jest.mock('../api/productDataApi');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('sonaStatsService backend reads', () => {
  it('returns one daily report from the authenticated product API', async () => {
    productDataApi.fetchDailyReports.mockResolvedValue([
      {date: '2026-10-07', data: {targetCount: 4}},
    ]);

    await expect(sonaStatsService.fetchDailyStats('2026-10-07')).resolves.toEqual({targetCount: 4});
    expect(productDataApi.fetchDailyReports).toHaveBeenCalledWith(['2026-10-07']);
  });

  it('filters missing days from a range without direct database reads', async () => {
    productDataApi.fetchDailyReports.mockResolvedValue([
      {date: '2026-10-06', data: null},
      {date: '2026-10-07', data: {targetCount: 4}},
    ]);

    await expect(sonaStatsService.fetchDateRangeStats(['2026-10-06', '2026-10-07']))
      .resolves.toEqual([{targetCount: 4}]);
  });

  it('uses the authenticated history endpoint and preserves date association', async () => {
    productDataApi.fetchSessionHistory.mockResolvedValue([
      {date: '2026-10-07', candles: [{dateTimestamp: '1'}]},
    ]);

    await expect(sonaStatsService.fetchSessionCandlesForDates(['2026-10-07']))
      .resolves.toEqual([{date: '2026-10-07', candles: [{dateTimestamp: '1'}]}]);
  });
});
