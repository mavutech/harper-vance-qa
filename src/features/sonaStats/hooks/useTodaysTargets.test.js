import { act, renderHook, waitFor } from '@testing-library/react';
import { useTodaysTargets } from './useTodaysTargets';
import sonaTargetsService from '../services/sonaTargetsService';
import { trackEvent } from '../../../utils/analytics';
import { TARGETS_UI_COPY } from '../utils/sonaStatsConstants';

jest.mock('../services/sonaTargetsService', () => ({
  __esModule: true,
  default: { subscribeToTodaysTargets: jest.fn() },
}));

jest.mock('../../../firebase/config', () => ({
  authReady: Promise.resolve(),
}));

jest.mock('../../../utils/analytics', () => ({
  trackEvent: jest.fn(),
}));

describe('useTodaysTargets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sonaTargetsService.subscribeToTodaysTargets.mockReturnValue(jest.fn());
  });

  it('publishes targets after the authenticated subscription responds', async () => {
    let handleData;
    sonaTargetsService.subscribeToTodaysTargets.mockImplementation((_date, onData) => {
      handleData = onData;
      return jest.fn();
    });

    const { result } = renderHook(() => useTodaysTargets());
    await waitFor(() => expect(handleData).toEqual(expect.any(Function)));

    act(() => handleData([{ alertId: 'target-1' }]));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.targets).toEqual([{ alertId: 'target-1' }]);
  });

  it('replaces Firebase details with safe copy and supports retry', async () => {
    let handleData;
    sonaTargetsService.subscribeToTodaysTargets.mockImplementation((_date, onData) => {
      handleData = onData;
      return jest.fn();
    });

    const { result } = renderHook(() => useTodaysTargets());
    await waitFor(() => expect(handleData).toEqual(expect.any(Function)));

    act(() => handleData([], 'PERMISSION_DENIED'));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(TARGETS_UI_COPY.loadError);
    expect(trackEvent).toHaveBeenCalledWith('sona_targets_load_failed', {
      reason: 'PERMISSION_DENIED',
    });

    act(() => result.current.retryTargets());

    await waitFor(() => {
      expect(sonaTargetsService.subscribeToTodaysTargets).toHaveBeenCalledTimes(2);
    });
    expect(trackEvent).toHaveBeenCalledWith(
      'sona_targets_retry_requested',
      expect.objectContaining({ date: expect.any(String) })
    );
  });
});
