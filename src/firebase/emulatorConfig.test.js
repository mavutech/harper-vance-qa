/**
 * @fileoverview Tests for fail-closed Firebase emulator wiring.
 */

import {resolveEmulatorPort, shouldUseFirebaseEmulators} from './emulatorConfig';

describe('Firebase emulator configuration', () => {
  const isolatedEnvironment = {
    NODE_ENV: 'test',
    REACT_APP_USE_FIREBASE_EMULATORS: 'true',
    REACT_APP_FIREBASE_PROJECT_ID: 'demo-harper-vance-e2e',
    REACT_APP_API_BASE_URL: 'http://127.0.0.1:5002',
  };

  it('allows only a local API and demo project outside production', () => {
    expect(shouldUseFirebaseEmulators(isolatedEnvironment)).toBe(true);
  });

  it('fails closed for production and real projects', () => {
    expect(() => shouldUseFirebaseEmulators({...isolatedEnvironment, NODE_ENV: 'production'}))
        .toThrow('non-production demo project');
    expect(() => shouldUseFirebaseEmulators({
      ...isolatedEnvironment,
      REACT_APP_FIREBASE_PROJECT_ID: 'goldensetups-dev',
    })).toThrow('non-production demo project');
    expect(() => shouldUseFirebaseEmulators({
      ...isolatedEnvironment,
      REACT_APP_API_BASE_URL: 'https://example.test',
    })).toThrow('non-production demo project');
  });

  it('uses approved ports and rejects invalid values', () => {
    expect(resolveEmulatorPort(undefined, 9099)).toBe(9099);
    expect(resolveEmulatorPort('9199', 9099)).toBe(9199);
    expect(() => resolveEmulatorPort('80', 9099)).toThrow('valid non-privileged ports');
  });
});

