/**
 * @fileoverview redux-persist transforms — limit what survives across reloads.
 *
 * Persisting the entire auth slice (including transient errors, loading flags,
 * and full user objects) creates a long-lived attack surface in localStorage
 * and risks rehydrating stale, privileged state. The safeFieldsTransform
 * whitelists exactly the fields needed to bootstrap the UI before the next
 * Firebase auth state callback fires: uid, email, platformRole, emailVerified,
 * displayName, photoURL.
 *
 * Anything else (tokens, claims, lifecycle timestamps, error messages) is
 * discarded on serialize. The reducer is also reset to a sane shape on
 * rehydrate so a malicious localStorage edit can never inject extra fields.
 */

import {createTransform} from 'redux-persist';

const SAFE_USER_FIELDS = ['id', 'email', 'name', 'displayName', 'photoURL', 'emailVerified', 'platformRole'];

const pickSafeUser = (user) => {
  if (!user || typeof user !== 'object') return null;
  return SAFE_USER_FIELDS.reduce((acc, key) => {
    if (user[key] !== undefined) acc[key] = user[key];
    return acc;
  }, {});
};

/**
 * Transform applied to the `auth` slice only.
 *
 * IMPORTANT: `isLoggedIn` is deliberately NOT persisted. That flag is
 * the single source of truth for "is the user authenticated?", and
 * Firebase Auth is the authority. Reading it from localStorage produces
 * the classic "Redux says signed-in but Firebase disagrees" bug —
 * every backend call fails with "Missing Authorization header" while
 * the UI keeps rendering as signed-in.
 *
 * On boot: `isLoggedIn` starts `false`. `checkAuthStatus` then either
 * dispatches SIGN_IN_SUCCESS (Firebase confirms a session) or LOGOUT
 * (Firebase confirms no session). This makes the two systems agree.
 *
 * The safe user fields are still persisted so the shell (avatar,
 * display name) can render instantly on cold start without waiting
 * for Firebase to rehydrate.
 */
export const safeAuthTransform = createTransform(
    // On serialize (before write to storage)
    (inboundState) => ({
      user: pickSafeUser(inboundState && inboundState.user),
    }),
    // On rehydrate (read from storage) — isLoggedIn always false.
    (outboundState) => ({
      loading: false,
      isLoggedIn: false,
      user: pickSafeUser(outboundState && outboundState.user),
      error: '',
      isProfileComplete: false,
    }),
    {whitelist: ['auth']},
);

/**
 * Transform applied to the `organization` slice only.
 *
 * Persists only `currentOrgId` so the org switcher remembers the last
 * selection across reloads. The role, the orgs cache, and any error /
 * loading state are deliberately discarded — role must be re-derived from
 * a fresh ID token on boot so a stale role never survives a server-side
 * change (revocation, demotion, org removal).
 */
export const safeOrgTransform = createTransform(
    // On serialize
    (inboundState) => ({
      currentOrgId: inboundState && typeof inboundState.currentOrgId === 'string'
        ? inboundState.currentOrgId
        : null,
    }),
    // On rehydrate — reset the rest of the shape to sane defaults
    (outboundState) => ({
      loading: false,
      error: null,
      currentOrgId: outboundState && typeof outboundState.currentOrgId === 'string'
        ? outboundState.currentOrgId
        : null,
      currentOrgRole: null,
      orgs: {},
    }),
    {whitelist: ['organization']},
);
