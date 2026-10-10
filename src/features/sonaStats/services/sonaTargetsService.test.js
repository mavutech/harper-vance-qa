import { onValue, ref } from 'firebase/database';
import sonaTargetsService from './sonaTargetsService';

jest.mock('firebase/database', () => ({
  onValue: jest.fn(),
  ref: jest.fn(),
}));

jest.mock('../../../firebase/config', () => ({
  database: { name: 'test-database' },
}));

describe('sonaTargetsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the exact Firebase unsubscribe function', () => {
    const unsubscribe = jest.fn();
    ref.mockReturnValue({ key: 'targets-ref' });
    onValue.mockReturnValue(unsubscribe);

    const result = sonaTargetsService.subscribeToTodaysTargets('2026-10-08', jest.fn());

    expect(ref).toHaveBeenCalledWith(
      { name: 'test-database' },
      'targets/nq/5m/2026-10/08'
    );
    expect(result).toBe(unsubscribe);
  });

  it('sorts target snapshots with the newest record first', () => {
    let handleSnapshot;
    const onData = jest.fn();
    onValue.mockImplementation((_dbRef, onSnapshot) => {
      handleSnapshot = onSnapshot;
      return jest.fn();
    });

    sonaTargetsService.subscribeToTodaysTargets('2026-10-08', onData);
    handleSnapshot({
      exists: () => true,
      val: () => ({
        older: { alertId: 'older', rawTime: '2026-10-08T14:00:00.000Z' },
        newer: { alertId: 'newer', rawTime: '2026-10-08T15:00:00.000Z' },
      }),
    });

    expect(onData.mock.calls[0][0].map((target) => target.alertId))
      .toEqual(['newer', 'older']);
  });

  it('returns a sanitized Firebase reason when access is denied', () => {
    let handleError;
    const onData = jest.fn();
    onValue.mockImplementation((_dbRef, _onSnapshot, onError) => {
      handleError = onError;
      return jest.fn();
    });

    sonaTargetsService.subscribeToTodaysTargets('2026-10-08', onData);
    handleError({ code: 'PERMISSION_DENIED', message: 'Sensitive Firebase path details' });

    expect(onData).toHaveBeenCalledWith([], 'PERMISSION_DENIED');
    expect(onData).not.toHaveBeenCalledWith([], expect.stringContaining('Sensitive'));
  });

  it('turns synchronous setup failures into a recoverable result', () => {
    const onData = jest.fn();
    ref.mockImplementation(() => {
      throw new Error('setup failed');
    });

    const unsubscribe = sonaTargetsService.subscribeToTodaysTargets('2026-10-08', onData);

    expect(onData).toHaveBeenCalledWith([], 'targets/subscription-failed');
    expect(() => unsubscribe()).not.toThrow();
  });
});
