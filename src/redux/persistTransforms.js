/**
 * @fileoverview redux-persist transforms — limit what survives across reloads.
 *
 * Persisting the entire auth slice (including transient errors, loading flags,
 * and full user objects) creates a long-lived attack surface in localStorage
 * and risks rehydrating stale, privileged state. The safeFieldsTransform
 * whitelists exactly the fields needed to bootstrap the UI before the next
 * Firebase auth state callback fires: uid, email, role, emailVerified,
 * displayName, photoURL.
 *
 * Anything else (tokens, claims, lifecycle timestamps, error messages) is
 * discarded on serialize. The reducer is also reset to a sane shape on
 * rehydrate so a malicious localStorage edit can never inject extra fields.
 */

import {createTransform} from 'redux-persist';

const SAFE_USER_FIELDS = ['id', 'email', 'name', 'displayName', 'photoURL', 'emailVerified', 'role'];

const pickSafeUser = (user) => {
  if (!user || typeof user !== 'object') return null;
  return SAFE_USER_FIELDS.reduce((acc, key) => {
    if (user[key] !== undefined) acc[key] = user[key];
    return acc;
  }, {});
};

/**
 * Transform applied to the `auth` slice only. Persists nothing besides the
 * shape `{isLoggedIn, user: {<safe fields>}}`.
 */
export const safeAuthTransform = createTransform(
    // On serialize (before write to storage)
    (inboundState) => ({
      isLoggedIn: Boolean(inboundState && inboundState.isLoggedIn),
      user: pickSafeUser(inboundState && inboundState.user),
    }),
    // On rehydrate (read from storage)
    (outboundState) => ({
      loading: false,
      isLoggedIn: Boolean(outboundState && outboundState.isLoggedIn),
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
