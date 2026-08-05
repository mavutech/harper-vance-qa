// =======================================
// Organization Action Creators + Thunks
// =======================================

import {auth} from '../../../firebase/config';
import * as firebaseAuthService from '../../auth/services/firebaseAuthService';
import {waitForAuthUser, isAuthSessionExpired} from '../../auth/services/authGate';
import * as organizationApi from '../services/organizationApi';
import * as organizationService from '../services/organizationService';
import {orgsFromToken} from '../utils/orgShapes';
import * as orgTypes from './orgTypes';

// -----------------------------------------------------------------------
// Sync action creators
// -----------------------------------------------------------------------

export const clearOrgError = () => ({type: orgTypes.CLEAR_ORG_ERROR});
export const resetOrgState = () => ({type: orgTypes.RESET_ORG_STATE});

// -----------------------------------------------------------------------
// Thunks
// -----------------------------------------------------------------------

/**
 * Fetches the orgs the current user belongs to.
 *
 * Reads the org id + role map from the fresh Firebase ID token (custom
 * claims), then loads the org root doc for each id. No user-scoped
 * Firestore read is required for discovery — the token is the source of
 * truth for membership.
 *
 * Dispatches:
 *   FETCH_ORGS_REQUEST → FETCH_ORGS_SUCCESS { orgs, claimsMap }
 *   FETCH_ORGS_REQUEST → FETCH_ORGS_FAILURE (error message)
 *
 * @returns {Function} thunk
 */
export const fetchOrgs = () => async (dispatch) => {
  dispatch({type: orgTypes.FETCH_ORGS_REQUEST});
  try {
    // Wait for Firebase to finish restoring the session before reading
    // claims. Throws AUTH_SESSION_EXPIRED if there's genuinely no user.
    await waitForAuthUser();
    const {orgs: claimsMap} = await firebaseAuthService.refreshClaims();
    const orgIds = Object.keys(claimsMap);
    const orgs = await organizationService.getOrganizations(orgIds);
    dispatch({
      type: orgTypes.FETCH_ORGS_SUCCESS,
      payload: {orgs, claimsMap},
    });
    return {orgs, claimsMap};
  } catch (error) {
    // Session-expired isn't a real error to surface — the auth reducer
    // will land in the signed-out state via checkAuthStatus and the user
    // gets redirected to /login. Just no-op the org slice.
    if (isAuthSessionExpired(error)) {
      dispatch({type: orgTypes.RESET_ORG_STATE});
      throw error;
    }
    const message = (error && error.message) || 'Failed to load organizations.';
    dispatch({type: orgTypes.FETCH_ORGS_FAILURE, payload: message});
    throw error;
  }
};

/**
 * Switches the current org selection. Also forces a token refresh so the
 * role for the new org reflects the latest server-side state.
 *
 * @param {string} orgId
 * @returns {Function} thunk
 */
export const switchOrg = (orgId) => async (dispatch, getState) => {
  dispatch({type: orgTypes.SWITCH_ORG_REQUEST});
  try {
    if (!orgId || typeof orgId !== 'string') {
      throw new Error('switchOrg: orgId is required.');
    }
    const {orgs: claimsMap} = await firebaseAuthService.refreshClaims();
    const orgRole = claimsMap[orgId];
    if (!orgRole) {
      throw new Error('You are not a member of this organization.');
    }
    dispatch({
      type: orgTypes.SWITCH_ORG_SUCCESS,
      payload: {orgId, orgRole},
    });
    return {orgId, orgRole};
  } catch (error) {
    const message = (error && error.message) || 'Failed to switch organization.';
    dispatch({type: orgTypes.SWITCH_ORG_FAILURE, payload: message});
    throw error;
  }
};

/**
 * Forces a token refresh and re-reads the org claims. Intended for use
 * after a server-side role change (e.g. member.role_changed via callable)
 * so the UI updates without a full sign-out.
 *
 * @returns {Function} thunk
 */
export const refreshOrgClaims = () => async (dispatch) => {
  try {
    if (!auth.currentUser) return {};
    const {orgs: claimsMap} = await firebaseAuthService.refreshClaims();
    dispatch({
      type: orgTypes.REFRESH_ORG_CLAIMS_SUCCESS,
      payload: {claimsMap},
    });
    return {claimsMap};
  } catch (error) {
    if (isAuthSessionExpired(error)) return {};
    // Refresh failures are non-fatal for the UI — surface via error state
    // only if the caller wants it. Reuse FETCH_ORGS_FAILURE to keep the
    // slice's error field the single source of truth.
    const message = (error && error.message) || 'Failed to refresh org claims.';
    dispatch({type: orgTypes.FETCH_ORGS_FAILURE, payload: message});
    throw error;
  }
};

// Re-export the tokenClaims helper so tests and hooks share one code path.
export {orgsFromToken};

/**
 * Creates a new org (owner = caller), refreshes the org list + claims,
 * and switches to the freshly created org.
 *
 * When the backend returns an `initialInvite` (because the payload
 * included an ownerEmail), it is passed back to the caller so the UI
 * can display the accept-invite link. The link is not persisted.
 *
 * @param {{name: string, slug: string, emailDomains?: string[], plan?: string, ownerEmail?: string}} payload
 * @returns {Function} thunk resolving to { orgId, initialInvite: ?{invitationId, rawToken, email} }
 */
export const createOrgThunk = (payload) => async (dispatch) => {
  dispatch({type: orgTypes.FETCH_ORGS_REQUEST});
  try {
    // The API returns the created org doc so we can seat it directly. We do
    // NOT read orgs/{orgId} back from Firestore here — that read would race
    // the custom-claim propagation and be denied by security rules
    // ("Missing or insufficient permissions") even though creation succeeded.
    const result = await organizationApi.createOrg(payload);
    const {orgId, org, initialInvite} = result || {};

    // Seat the returned org into state and select it immediately.
    if (org && org.id) {
      dispatch({
        type: orgTypes.CREATE_ORG_SUCCESS,
        payload: {org, orgRole: 'owner'},
      });
    }

    // Best-effort: refresh claims + reload the full list so the token and
    // any other memberships catch up. These are non-fatal — the org already
    // exists and is already in state, so a transient failure (claim not yet
    // propagated) must never surface as a "create failed" error.
    try {
      await firebaseAuthService.refreshClaims();
      await dispatch(fetchOrgs());
      await dispatch(switchOrg(orgId));
    } catch (_e) {
      // Swallow: the CREATE_ORG_SUCCESS dispatch above already put the user
      // in a good state. The next natural claim refresh will reconcile.
    }

    return {orgId, org: org || null, initialInvite: initialInvite || null};
  } catch (error) {
    const message = (error && error.message) || 'Failed to create organization.';
    dispatch({type: orgTypes.FETCH_ORGS_FAILURE, payload: message});
    throw error;
  }
};
