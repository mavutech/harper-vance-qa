// =======================================
// Reducer
// =======================================

import * as authTypes from "./authTypes";

const INITIAL_STATE = {
    loading: false,
    isLoggedIn: false,
    user: null,
    error: '',
    isProfileComplete: false,
};

const reducer = (state = INITIAL_STATE, action) => {

    switch (action.type) {
        // Sign Up Cases
        case authTypes.SIGN_UP_REQUEST:
            return {
                ...state,
                loading: true,
                error: ''
            };
        case authTypes.SIGN_UP_SUCCESS:
            return {
                ...state,
                loading: false,
                user: action.payload,
                isLoggedIn: true,
                error: ''
            };
        case authTypes.SIGN_UP_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
                isLoggedIn: false,
                user: null
            };

        // Sign In Cases
        case authTypes.SIGN_IN_REQUEST:
            return {
                ...state,
                loading: true,
                error: ''
            };
        case authTypes.SIGN_IN_SUCCESS:
            return {
                ...state,
                loading: false,
                user: action.payload,
                isLoggedIn: true,
                error: ''
            };
        case authTypes.SIGN_IN_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
                isLoggedIn: false,
                user: null
            };

        // Logout Case
        case authTypes.LOGOUT:
            return {
                ...INITIAL_STATE
            };

        // Clear Errors Case
        case authTypes.CLEAR_ERRORS:
            return {
                ...state,
                error: ''
            };

        // Update Profile Cases
    case authTypes.UPDATE_PROFILE_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case authTypes.UPDATE_PROFILE_SUCCESS:
      return {
        ...state,
        loading: false,
        user: action.payload,
        error: null
      };
    case authTypes.UPDATE_PROFILE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Forgot Password
    case authTypes.FORGOT_PASSWORD_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        forgotPasswordMessage: null
      };
    case authTypes.FORGOT_PASSWORD_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        forgotPasswordMessage: action.payload
      };
    case authTypes.FORGOT_PASSWORD_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        forgotPasswordMessage: null
      };

    // Fetch Me / Update Me (server is source of truth)
    case authTypes.FETCH_ME_REQUEST:
    case authTypes.UPDATE_ME_REQUEST:
      return { ...state, loading: true, error: '' };
    case authTypes.FETCH_ME_SUCCESS:
    case authTypes.UPDATE_ME_SUCCESS:
      return { ...state, loading: false, user: action.payload, error: '' };
    case authTypes.FETCH_ME_FAILURE:
    case authTypes.UPDATE_ME_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // Change Email
    case authTypes.CHANGE_EMAIL_REQUEST:
      return { ...state, loading: true, error: '' };
    case authTypes.CHANGE_EMAIL_SUCCESS:
      return { ...state, loading: false, user: action.payload, error: '' };
    case authTypes.CHANGE_EMAIL_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // Change Password
    case authTypes.CHANGE_PASSWORD_REQUEST:
      return { ...state, loading: true, error: '' };
    case authTypes.CHANGE_PASSWORD_SUCCESS:
      return { ...state, loading: false, error: '' };
    case authTypes.CHANGE_PASSWORD_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // Revoke Sessions
    case authTypes.REVOKE_SESSIONS_REQUEST:
      return { ...state, loading: true, error: '' };
    case authTypes.REVOKE_SESSIONS_SUCCESS:
      return { ...state, loading: false, error: '' };
    case authTypes.REVOKE_SESSIONS_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // Refresh Claims
    case authTypes.REFRESH_CLAIMS_SUCCESS:
      return { ...state, user: action.payload };

    // Resend Verification
    case authTypes.RESEND_VERIFICATION_REQUEST:
      return { ...state, loading: true, error: '' };
    case authTypes.RESEND_VERIFICATION_SUCCESS:
      return { ...state, loading: false, error: '' };
    case authTypes.RESEND_VERIFICATION_FAILURE:
      return { ...state, loading: false, error: action.payload };

        default:
            return state;
    }
}

export default reducer;
