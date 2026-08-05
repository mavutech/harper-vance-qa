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
import {waitForAuthUser} from './authGate';

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
 * Useful after a platformRole change (global) or an org-scoped role change
 * so the UI reflects the new claim without a full sign-out.
 *
 * The returned `orgs` map is filtered to only include valid roles
 * ('owner' | 'admin' | 'member'); malformed entries are dropped.
 *
 * @returns {Promise<{platformRole: string, platformRoleUpdatedAt: ?string, emailVerified: boolean, orgs: Record<string, ('owner'|'admin'|'member')>}>}
 */
export const refreshClaims = async () => {
  // Await Firebase hydration if the SDK hasn't restored the session yet.
  // Throws AUTH_SESSION_EXPIRED if there is genuinely no signed-in user.
  const user = await waitForAuthUser();
  const result = await getIdTokenResult(user, true);
  const rawOrgs = (result.claims && result.claims.orgs) || {};
  const validRoles = ['owner', 'admin', 'member'];
  const orgs = {};
  if (rawOrgs && typeof rawOrgs === 'object') {
    Object.keys(rawOrgs).forEach((orgId) => {
      if (validRoles.includes(rawOrgs[orgId])) orgs[orgId] = rawOrgs[orgId];
    });
  }
  return {
    platformRole: result.claims.platformRole || result.claims.role || 'user',
    platformRoleUpdatedAt: result.claims.platformRoleUpdatedAt || result.claims.rolesUpdatedAt || null,
    emailVerified: Boolean(user.emailVerified),
    orgs,
  };
};
