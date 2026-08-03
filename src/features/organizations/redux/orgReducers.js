// =======================================
// Organization Reducer
// =======================================

import * as orgTypes from './orgTypes';

/** @type {import('./orgTypes')} */
export const INITIAL_STATE = {
  loading: false,
  error: null,
  /** id of the org currently selected in the UI */
  currentOrgId: null,
  /** current user's role in currentOrgId; derived from token claims, never persisted */
  currentOrgRole: null,
  /** cached { [orgId]: Organization } */
  orgs: {},
};

const reducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    // Fetch orgs the user belongs to
    case orgTypes.FETCH_ORGS_REQUEST:
      return {...state, loading: true, error: null};

    case orgTypes.FETCH_ORGS_SUCCESS: {
      // payload: { orgs: Organization[], claimsMap: { [orgId]: OrgRole } }
      const {orgs = [], claimsMap = {}} = action.payload || {};
      const orgsById = orgs.reduce((acc, org) => {
        if (org && org.id) acc[org.id] = org;
        return acc;
      }, {});

      // Pick a currentOrgId if not yet set:
      //   1. keep existing if user still has that claim
      //   2. otherwise fall back to the first org they belong to
      let nextCurrentOrgId = state.currentOrgId;
      if (!nextCurrentOrgId || !claimsMap[nextCurrentOrgId]) {
        nextCurrentOrgId = orgs.length > 0 ? orgs[0].id : null;
      }
      const nextRole = nextCurrentOrgId ? (claimsMap[nextCurrentOrgId] || null) : null;

      return {
        ...state,
        loading: false,
        error: null,
        orgs: orgsById,
        currentOrgId: nextCurrentOrgId,
        currentOrgRole: nextRole,
      };
    }

    case orgTypes.FETCH_ORGS_FAILURE:
      return {...state, loading: false, error: action.payload || 'Failed to load organizations.'};

    // A freshly created org: seat it and make it current. Avoids a Firestore
    // read that would race custom-claim propagation right after create.
    case orgTypes.CREATE_ORG_SUCCESS: {
      // payload: { org: Organization, role: OrgRole }
      const {org, role = 'owner'} = action.payload || {};
      if (!org || !org.id) return {...state, loading: false};
      return {
        ...state,
        loading: false,
        error: null,
        orgs: {...state.orgs, [org.id]: org},
        currentOrgId: org.id,
        currentOrgRole: role,
      };
    }

    // Switch org
    case orgTypes.SWITCH_ORG_REQUEST:
      return {...state, loading: true, error: null};

    case orgTypes.SWITCH_ORG_SUCCESS:
      // payload: { orgId, role }
      return {
        ...state,
        loading: false,
        error: null,
        currentOrgId: action.payload.orgId,
        currentOrgRole: action.payload.role,
      };

    case orgTypes.SWITCH_ORG_FAILURE:
      return {...state, loading: false, error: action.payload || 'Failed to switch organization.'};

    // Refresh claims (e.g. after a role change server-side)
    case orgTypes.REFRESH_ORG_CLAIMS_SUCCESS: {
      // payload: { claimsMap }
      const {claimsMap = {}} = action.payload || {};
      const nextRole = state.currentOrgId ? (claimsMap[state.currentOrgId] || null) : null;
      return {...state, currentOrgRole: nextRole};
    }

    case orgTypes.CLEAR_ORG_ERROR:
      return {...state, error: null};

    case orgTypes.RESET_ORG_STATE:
      return {...INITIAL_STATE};

    default:
      return state;
  }
};

export default reducer;
