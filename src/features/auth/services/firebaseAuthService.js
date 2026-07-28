/**
 * @fileoverview Thin wrappers over Firebase Auth client SDK calls used by
 * the credential lifecycle UI. Passwords never leave the client.
 */

import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as fbUpdatePassword,
  sendEmailVerification,
  getIdTokenResult,
} from 'firebase/auth';
import {auth} from '../../../firebase/config';

/**
 * Re-authenticates the current user with their existing email/password.
 * Required before sensitive operations (change-email, change-password).
 *
 * @param {string} currentPassword
 * @returns {Promise<void>}
 */
export const reauthenticate = async (currentPassword) => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('No authenticated user.');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
};

/**
 * Updates the caller's password against the Firebase client SDK. Caller is
 * responsible for chaining notifyPasswordChanged() server-side so the event
 * is audit-logged and all other sessions are revoked.
 *
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export const updatePassword = async (newPassword) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user.');
  await fbUpdatePassword(user, newPassword);
};

/**
 * Sends a verification email to the current user's email address.
 *
 * @returns {Promise<void>}
 */
export const resendVerificationEmail = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user.');
  await sendEmailVerification(user);
};

/**
 * Forces a fresh ID-token fetch and returns the decoded custom claims.
 * Useful after a role change so the UI reflects the new role without a
 * full sign-out.
 *
 * @returns {Promise<{role: string, rolesUpdatedAt: ?string, emailVerified: boolean}>}
 */
export const refreshClaims = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user.');
  const result = await getIdTokenResult(true);
  return {
    role: result.claims.role || 'user',
    rolesUpdatedAt: result.claims.rolesUpdatedAt || null,
    emailVerified: Boolean(user.emailVerified),
  };
};
