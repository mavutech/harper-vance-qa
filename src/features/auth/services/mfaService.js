/**
 * @fileoverview Firebase multi-factor authentication helpers.
 * TOTP secrets are returned only to the calling component and must never be
 * persisted in Redux, browser storage, analytics, or logs.
 */

import {getMultiFactorResolver, multiFactor, TotpMultiFactorGenerator} from 'firebase/auth';
import {auth} from '../../../firebase/config';

export const TOTP_FACTOR_ID = 'totp';
export const TOTP_DISPLAY_NAME = 'Harper Vance Authenticator';
export const TOTP_ISSUER = 'Harper Vance';

const MFA_ERROR_MESSAGES = Object.freeze({
  'auth/code-expired': 'The verification code expired. Start again to create a new setup key.',
  'auth/invalid-verification-code': 'That verification code is not valid. Check the code and try again.',
  'auth/maximum-second-factor-count-exceeded': 'This account already has the maximum number of security methods.',
  'auth/mfa-info-not-found': 'The security method could not be found. Start the setup again.',
  'auth/multi-factor-session-expired': 'The sign-in session expired. Sign in with your email and password again.',
  'auth/requires-recent-login': 'For your security, sign out and sign in again before enabling two-step verification.',
  'auth/totp-challenge-timeout': 'The setup session expired. Start again to create a new setup key.',
  'auth/unverified-email': 'Verify your email address before enabling two-step verification.',
  'auth/unsupported-first-factor': 'This account requires a security method that this sign-in page does not support.',
});

/**
 * Returns the currently authenticated Firebase user.
 *
 * @returns {import('firebase/auth').User}
 * @throws {Error} When no user is authenticated.
 */
const requireCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in to manage two-step verification.');
  return user;
};

/**
 * Converts Firebase Auth errors into safe, actionable messages.
 *
 * @param {unknown} error - Firebase or application error.
 * @returns {Error} Safe error for display to the authenticated user.
 */
export const toSafeMfaError = (error) => {
  const code = error && typeof error === 'object' ? error.code : '';
  const message = MFA_ERROR_MESSAGES[code] || 'Two-step verification could not be updated. Please try again.';
  return new Error(message);
};

/**
 * Reads whether the current user has a TOTP factor enrolled.
 *
 * @returns {{enabled: boolean, factors: Array<import('firebase/auth').MultiFactorInfo>}}
 */
export const getMfaStatus = () => {
  const factors = multiFactor(requireCurrentUser()).enrolledFactors;
  return {
    enabled: factors.some((factor) => factor.factorId === TOTP_FACTOR_ID),
    factors,
  };
};

/**
 * Starts a TOTP enrollment session for the current user.
 *
 * @returns {Promise<{
 *   secret: import('firebase/auth').TotpSecret,
 *   secretKey: string,
 *   authenticatorUri: string,
 * }>} Temporary enrollment details that must remain in memory only.
 */
export const beginTotpEnrollment = async () => {
  try {
    const user = requireCurrentUser();
    if (!user.emailVerified) {
      const error = new Error('Email verification is required.');
      error.code = 'auth/unverified-email';
      throw error;
    }

    const session = await multiFactor(user).getSession();
    const secret = await TotpMultiFactorGenerator.generateSecret(session);
    return {
      secret,
      secretKey: secret.secretKey,
      authenticatorUri: secret.generateQrCodeUrl(user.email || 'account', TOTP_ISSUER),
    };
  } catch (error) {
    throw toSafeMfaError(error);
  }
};

/**
 * Completes TOTP enrollment with a six-digit authenticator code.
 *
 * @param {import('firebase/auth').TotpSecret} secret - Temporary enrollment secret.
 * @param {string} oneTimePassword - Six-digit authenticator code.
 * @returns {Promise<void>}
 */
export const completeTotpEnrollment = async (secret, oneTimePassword) => {
  try {
    if (!secret) throw new Error('Missing enrollment secret.');
    const code = String(oneTimePassword || '').replace(/\D/g, '');
    if (!/^\d{6}$/.test(code)) {
      const error = new Error('Invalid verification code.');
      error.code = 'auth/invalid-verification-code';
      throw error;
    }

    const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code);
    await multiFactor(requireCurrentUser()).enroll(assertion, TOTP_DISPLAY_NAME);
  } catch (error) {
    throw toSafeMfaError(error);
  }
};

/**
 * Creates an in-memory TOTP challenge from Firebase's MFA-required error.
 *
 * @param {import('firebase/auth').MultiFactorError} error - Firebase sign-in error.
 * @returns {{
 *   resolver: import('firebase/auth').MultiFactorResolver,
 *   enrollmentId: string,
 * }} Temporary challenge details that must remain in component memory only.
 */
export const beginTotpSignIn = (error) => {
  try {
    const resolver = getMultiFactorResolver(auth, error);
    const factor = resolver.hints.find((hint) => hint.factorId === TOTP_FACTOR_ID);
    if (!factor) {
      const unsupportedError = new Error('Unsupported security method.');
      unsupportedError.code = 'auth/unsupported-first-factor';
      throw unsupportedError;
    }
    return {resolver, enrollmentId: factor.uid};
  } catch (challengeError) {
    throw toSafeMfaError(challengeError);
  }
};

/**
 * Completes a pending TOTP sign-in challenge.
 *
 * @param {{
 *   resolver: import('firebase/auth').MultiFactorResolver,
 *   enrollmentId: string,
 * }} challenge - Temporary challenge returned by beginTotpSignIn.
 * @param {string} oneTimePassword - Six-digit authenticator code.
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export const completeTotpSignIn = async (challenge, oneTimePassword) => {
  try {
    if (!challenge || !challenge.resolver || !challenge.enrollmentId) {
      const error = new Error('Missing sign-in challenge.');
      error.code = 'auth/multi-factor-session-expired';
      throw error;
    }

    const code = String(oneTimePassword || '').replace(/\D/g, '');
    if (!/^\d{6}$/.test(code)) {
      const error = new Error('Invalid verification code.');
      error.code = 'auth/invalid-verification-code';
      throw error;
    }

    const assertion = TotpMultiFactorGenerator.assertionForSignIn(challenge.enrollmentId, code);
    return await challenge.resolver.resolveSignIn(assertion);
  } catch (error) {
    throw toSafeMfaError(error);
  }
};
