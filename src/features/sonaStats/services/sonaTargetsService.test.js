import apiClient from '../../../api/client';
import sonaTargetsService from './sonaTargetsService';

jest.mock('../../../api/client', () => ({
  get: jest.fn(),
}));

const flushRequests = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

describe('sonaTargetsService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => jest.useRealTimers());

  it('requests current targets through the authenticated product API', async () => {
    apiClient.get.mockResolvedValue({
      targets: [{alertId: 'target-1'}],
    });
    const onData = jest.fn();

    const unsubscribe = sonaTargetsService.subscribeToTodaysTargets('2026-10-08', onData);
    await flushRequests();

    expect(apiClient.get).toHaveBeenCalledWith('/api/product/targets', {
      params: {date: '2026-10-08'},
    });
    expect(onData).toHaveBeenCalledWith([{alertId: 'target-1'}]);

    unsubscribe();
  });

  it('refreshes the target record once per minute', async () => {
    apiClient.get.mockResolvedValue({targets: []});
    const onData = jest.fn();

    const unsubscribe = sonaTargetsService.subscribeToTodaysTargets('2026-10-08', onData);
    await flushRequests();
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(60000);
    await flushRequests();
    expect(apiClient.get).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it('returns a sanitized product API reason when access is denied', async () => {
    apiClient.get.mockRejectedValue({
      code: 'ENTITLEMENT_REQUIRED',
      message: 'Sensitive backend details',
    });
    const onData = jest.fn();

    const unsubscribe = sonaTargetsService.subscribeToTodaysTargets('2026-10-08', onData);
    await flushRequests();

    expect(onData).toHaveBeenCalledWith([], 'ENTITLEMENT_REQUIRED');
    expect(onData).not.toHaveBeenCalledWith([], expect.stringContaining('Sensitive'));

    unsubscribe();
  });

  it('stops refreshing after unsubscribe', async () => {
    apiClient.get.mockResolvedValue({targets: []});
    const onData = jest.fn();

    const unsubscribe = sonaTargetsService.subscribeToTodaysTargets('2026-10-08', onData);
    await flushRequests();
    unsubscribe();
    jest.advanceTimersByTime(60000);
    await flushRequests();

    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });
});
