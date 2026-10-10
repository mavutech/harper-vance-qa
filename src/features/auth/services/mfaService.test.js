import {getMultiFactorResolver, multiFactor, TotpMultiFactorGenerator} from 'firebase/auth';

import {auth} from '../../../firebase/config';
import {
  beginTotpEnrollment,
  completeTotpEnrollment,
  beginTotpSignIn,
  completeTotpSignIn,
  getMfaStatus,
  toSafeMfaError,
} from './mfaService';

jest.mock('firebase/auth', () => ({
  getMultiFactorResolver: jest.fn(),
  multiFactor: jest.fn(),
  TotpMultiFactorGenerator: {
    generateSecret: jest.fn(),
    assertionForEnrollment: jest.fn(),
    assertionForSignIn: jest.fn(),
  },
}));

jest.mock('../../../firebase/config', () => ({
  auth: {currentUser: null},
}));

describe('mfaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.currentUser = {
      email: 'owner@example.com',
      emailVerified: true,
    };
  });

  it('reports whether a TOTP factor is enrolled', () => {
    multiFactor.mockReturnValue({enrolledFactors: [{factorId: 'totp'}]});

    expect(getMfaStatus()).toEqual({
      enabled: true,
      factors: [{factorId: 'totp'}],
    });
  });

  it('creates an in-memory enrollment secret and authenticator URI', async () => {
    const getSession = jest.fn().mockResolvedValue({id: 'session'});
    const secret = {
      secretKey: 'TEMPORARY-KEY',
      generateQrCodeUrl: jest.fn().mockReturnValue('otpauth://totp/example'),
    };
    multiFactor.mockReturnValue({getSession});
    TotpMultiFactorGenerator.generateSecret.mockResolvedValue(secret);

    await expect(beginTotpEnrollment()).resolves.toEqual({
      secret,
      secretKey: 'TEMPORARY-KEY',
      authenticatorUri: 'otpauth://totp/example',
    });
    expect(secret.generateQrCodeUrl).toHaveBeenCalledWith('owner@example.com', 'Harper Vance');
  });

  it('rejects enrollment until the email is verified', async () => {
    auth.currentUser.emailVerified = false;

    await expect(beginTotpEnrollment()).rejects.toThrow(
      'Verify your email address before enabling two-step verification.',
    );
  });

  it('enrolls a valid six-digit authenticator code', async () => {
    const enroll = jest.fn().mockResolvedValue(undefined);
    const secret = {secretKey: 'TEMPORARY-KEY'};
    const assertion = {providerId: 'totp'};
    multiFactor.mockReturnValue({enroll});
    TotpMultiFactorGenerator.assertionForEnrollment.mockReturnValue(assertion);

    await completeTotpEnrollment(secret, '123456');

    expect(TotpMultiFactorGenerator.assertionForEnrollment).toHaveBeenCalledWith(secret, '123456');
    expect(enroll).toHaveBeenCalledWith(assertion, 'Harper Vance Authenticator');
  });

  it('rejects malformed authenticator codes before calling Firebase', async () => {
    await expect(completeTotpEnrollment({}, '12ab')).rejects.toThrow(
      'That verification code is not valid. Check the code and try again.',
    );
    expect(TotpMultiFactorGenerator.assertionForEnrollment).not.toHaveBeenCalled();
  });

  it('converts unknown provider errors to a safe generic message', () => {
    expect(toSafeMfaError(new Error('internal provider detail')).message).toBe(
      'Two-step verification could not be updated. Please try again.',
    );
  });

  it('creates an in-memory TOTP sign-in challenge', () => {
    const resolver = {
      hints: [{factorId: 'totp', uid: 'factor-id'}],
      resolveSignIn: jest.fn(),
    };
    getMultiFactorResolver.mockReturnValue(resolver);

    expect(beginTotpSignIn({code: 'auth/multi-factor-auth-required'})).toEqual({
      resolver,
      enrollmentId: 'factor-id',
    });
  });

  it('resolves a pending TOTP sign-in challenge', async () => {
    const credential = {user: {uid: 'owner'}};
    const resolver = {resolveSignIn: jest.fn().mockResolvedValue(credential)};
    const assertion = {providerId: 'totp'};
    TotpMultiFactorGenerator.assertionForSignIn.mockReturnValue(assertion);

    await expect(completeTotpSignIn({resolver, enrollmentId: 'factor-id'}, '654321'))
      .resolves.toBe(credential);
    expect(TotpMultiFactorGenerator.assertionForSignIn).toHaveBeenCalledWith('factor-id', '654321');
  });
});
