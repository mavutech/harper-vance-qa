// =======================================
// Organization Action Creators + Thunks
// =======================================

import {auth} from '../../../firebase/config';
import * as firebaseAuthService from '../../auth/services/firebaseAuthService';
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
    if (!auth.currentUser) {
      throw new Error('Not authenticated.');
    }
    const {orgs: claimsMap} = await firebaseAuthService.refreshClaims();
    const orgIds = Object.keys(claimsMap);
    const orgs = await organizationService.getOrganizations(orgIds);
    dispatch({
      type: orgTypes.FETCH_ORGS_SUCCESS,
      payload: {orgs, claimsMap},
    });
    return {orgs, claimsMap};
  } catch (error) {
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
    const role = claimsMap[orgId];
    if (!role) {
      throw new Error('You are not a member of this organization.');
    }
    dispatch({
      type: orgTypes.SWITCH_ORG_SUCCESS,
      payload: {orgId, role},
    });
    return {orgId, role};
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
 * Uses FETCH_ORGS_REQUEST/FAILURE for loading + error so we don't need
 * a new action type just for the create path.
 *
 * @param {{name: string, slug: string, emailDomains?: string[], plan?: string}} payload
 * @returns {Function} thunk resolving to { orgId }
 */
export const createOrgThunk = (payload) => async (dispatch) => {
  dispatch({type: orgTypes.FETCH_ORGS_REQUEST});
  try {
    const {orgId} = await organizationApi.createOrg(payload);
    // Give the server a moment to propagate the claim, then refresh.
    await firebaseAuthService.refreshClaims();
    await dispatch(fetchOrgs());
    try {
      await dispatch(switchOrg(orgId));
    } catch (_e) {
      // If switch fails (rare race), the fetchOrgs succeeded and the
      // switcher will still show the new org; user can pick it manually.
    }
    return {orgId};
  } catch (error) {
    const message = (error && error.message) || 'Failed to create organization.';
    dispatch({type: orgTypes.FETCH_ORGS_FAILURE, payload: message});
    throw error;
  }
};
