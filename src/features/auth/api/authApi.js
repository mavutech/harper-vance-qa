/**
 * @fileoverview Backend /api/auth client — credential lifecycle.
 *
 * Passwords are never sent to the server. The change-password flow runs
 * entirely against the Firebase client SDK, after which the client calls
 * `notifyPasswordChanged()` so the server can audit-log the event and revoke
 * refresh tokens.
 */

import client from '../../../api/client';

/**
 * POST /api/auth/change-email — Admin SDK updates the caller's email and
 * forces re-verification. Requires recent auth (the server returns 401
 * REAUTH_REQUIRED otherwise).
 *
 * @param {string} newEmail
 * @returns {Promise<{email: string, emailVerified: boolean}>}
 */
export const changeEmail = (newEmail) =>
  client.post('/api/auth/change-email', {newEmail});

/**
 * POST /api/auth/password-changed — audit + session-revoke hook the client
 * calls AFTER a successful Firebase updatePassword().
 *
 * @returns {Promise<{acknowledged: true}>}
 */
export const notifyPasswordChanged = () =>
  client.post('/api/auth/password-changed', {acknowledge: true});

/**
 * POST /api/auth/revoke-sessions — sign out of every device. Admin callers
 * may pass a targetUid to revoke another user's sessions.
 *
 * @param {string} [targetUid]
 * @returns {Promise<{revokedAt: string}>}
 */
export const revokeSessions = (targetUid) =>
  client.post('/api/auth/revoke-sessions', targetUid ? {targetUid} : {});

/**
 * POST /api/auth/bootstrap-super-admin — idempotent self-elevation.
 * Server verifies that the caller's authenticated email matches the
 * SUPER_ADMIN_EMAIL env var, then sets the `super_admin` custom claim.
 * Fails with 403 if the caller isn't the configured super admin.
 *
 * The caller must force a token refresh after this returns to pick up
 * the new claim (see firebaseAuthService.refreshClaims).
 *
 * @returns {Promise<{elevated: boolean}>}
 */
export const bootstrapSuperAdmin = () =>
  client.post('/api/auth/bootstrap-super-admin', {});
