import {
  createStatsError,
  getSafeStatsErrorMessage,
  getSafeStatsErrorReason,
  isMissingStatsError,
  STATS_ERROR_CODES,
} from './analyticsErrors';

describe('analyticsErrors', () => {
  it('preserves controlled missing-report messages', () => {
    const error = createStatsError(
      STATS_ERROR_CODES.dailyNotFound,
      'No report is available for this date.'
    );

    expect(error).toBeInstanceOf(Error);
    expect(isMissingStatsError(error)).toBe(true);
    expect(getSafeStatsErrorMessage(error, 'Fallback')).toBe(
      'No report is available for this date.'
    );
  });

  it('replaces infrastructure details with safe feature copy', () => {
    const error = new Error('permission_denied at /stats/nq/5m/daily/private-path');
    error.code = 'PERMISSION_DENIED';

    expect(getSafeStatsErrorMessage(error, 'Daily results could not be loaded.'))
      .toBe('Daily results could not be loaded.');
    expect(getSafeStatsErrorReason(error)).toBe('permission_denied');
  });
});
