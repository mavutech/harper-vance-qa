import { act, renderHook, waitFor } from '@testing-library/react';
import { useTodaysTargets } from './useTodaysTargets';
import liveTargetsService from '../services/liveTargetsService';
import { trackEvent } from '../../../utils/analytics';
import { TARGETS_UI_COPY } from '../utils/targetStatsConstants';
import moment from 'moment-timezone';

jest.mock('../services/liveTargetsService', () => ({
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
    liveTargetsService.subscribeToTodaysTargets.mockReturnValue(jest.fn());
  });

  it('uses the New York session date after UTC midnight', async () => {
    const clock = jest.spyOn(moment, 'now').mockReturnValue(Date.parse('2026-10-21T01:30:00Z'));
    const {unmount} = renderHook(() => useTodaysTargets());
    try {
      await waitFor(() => expect(liveTargetsService.subscribeToTodaysTargets).toHaveBeenCalledWith(
        '2026-10-20', expect.any(Function),
      ));
    } finally {
      unmount();
      clock.mockRestore();
    }
  });

  it('publishes targets after the authenticated subscription responds', async () => {
    let handleData;
    liveTargetsService.subscribeToTodaysTargets.mockImplementation((_date, onData) => {
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
    liveTargetsService.subscribeToTodaysTargets.mockImplementation((_date, onData) => {
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
      expect(liveTargetsService.subscribeToTodaysTargets).toHaveBeenCalledTimes(2);
    });
    expect(trackEvent).toHaveBeenCalledWith(
      'sona_targets_retry_requested',
      expect.objectContaining({ date: expect.any(String) })
    );
  });
});
