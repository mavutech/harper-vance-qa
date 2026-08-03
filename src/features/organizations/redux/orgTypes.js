// =======================================
// Organization Action Types
// =======================================

// Fetch orgs the current user belongs to (from custom claims + Firestore).
export const FETCH_ORGS_REQUEST = 'FETCH_ORGS_REQUEST';
export const FETCH_ORGS_SUCCESS = 'FETCH_ORGS_SUCCESS';
export const FETCH_ORGS_FAILURE = 'FETCH_ORGS_FAILURE';

// A freshly created org (returned by the create API) is seated into state
// and selected directly, without a racing Firestore read.
export const CREATE_ORG_SUCCESS = 'CREATE_ORG_SUCCESS';

// Switch which org is the "current" one in the UI.
export const SWITCH_ORG_REQUEST = 'SWITCH_ORG_REQUEST';
export const SWITCH_ORG_SUCCESS = 'SWITCH_ORG_SUCCESS';
export const SWITCH_ORG_FAILURE = 'SWITCH_ORG_FAILURE';

// Refresh the current org role from a freshly minted ID token.
export const REFRESH_ORG_CLAIMS_SUCCESS = 'REFRESH_ORG_CLAIMS_SUCCESS';

// Reset (on logout) or clear transient error.
export const CLEAR_ORG_ERROR = 'CLEAR_ORG_ERROR';
export const RESET_ORG_STATE = 'RESET_ORG_STATE';
