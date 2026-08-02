/**
 * @fileoverview Auth-ready gate used by every code path that talks to the
 * backend or reads Firebase claims.
 *
 * The Firebase SDK exposes `auth.currentUser` synchronously, but on cold
 * start (browser reopen, hard refresh) it's null until the SDK finishes
 * restoring the persisted session — typically 100–300 ms. During that
 * window Redux's persisted `isLoggedIn` says the user is authenticated,
 * so any thunk that checks `auth.currentUser` directly will race and
 * throw "Not authenticated."
 *
 * `waitForAuthUser()` centralises the race resolution: it returns the
 * current user, awaiting `authReady` (resolved on the first
 * onAuthStateChanged fire) if necessary, and throws a well-typed
 * AUTH_SESSION_EXPIRED error if the user is genuinely gone.
 *
 * @module features/auth/services/authGate
 */

import {auth, authReady} from '../../../firebase/config';

/** @type {string} Machine-readable code for a resolved-but-gone session. */
export const AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED';

/**
 * Returns the Firebase Auth user, awaiting rehydration if necessary.
 * Never returns null — either resolves to a user or throws.
 *
 * @param {number} [timeoutMs=5000] - Max wait for rehydration
 * @returns {Promise<import('firebase/auth').User>}
 * @throws {Error} with `code === AUTH_SESSION_EXPIRED` when no user is
 *   present after rehydration (or before the timeout expires).
 */
export const waitForAuthUser = async (timeoutMs = 5000) => {
  if (auth.currentUser) return auth.currentUser;

  let timeoutId;
  const timeoutPromise = new Promise((_resolve, reject) => {
    timeoutId = setTimeout(
        () => reject(new Error('Auth hydration timeout')),
        timeoutMs,
    );
  });

  try {
    await Promise.race([authReady, timeoutPromise]);
  } catch (_err) {
    // Fall through — we'll check currentUser below and throw the
    // canonical AUTH_SESSION_EXPIRED error either way.
  } finally {
    clearTimeout(timeoutId);
  }

  if (!auth.currentUser) {
    const err = new Error('Your session has expired. Please sign in again.');
    err.code = AUTH_SESSION_EXPIRED;
    throw err;
  }
  return auth.currentUser;
};

/**
 * Convenience helper: true when the given error is an
 * AUTH_SESSION_EXPIRED thrown from `waitForAuthUser`.
 *
 * @param {*} err
 * @returns {boolean}
 */
export const isAuthSessionExpired = (err) =>
  Boolean(err && err.code === AUTH_SESSION_EXPIRED);
