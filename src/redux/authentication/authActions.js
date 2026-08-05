// =======================================
// Action Creators
// =======================================

import * as authTypes from "./authTypes";
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    updateProfile,
    onAuthStateChanged,
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../../firebase/config';
import { getSignInErrorMessage, getSignUpErrorMessage, getPasswordResetErrorMessage } from '../../utils/firebaseErrorMessages';
import * as usersApi from '../../features/auth/api/usersApi';
import * as authApi from '../../features/auth/api/authApi';
import * as firebaseAuthService from '../../features/auth/services/firebaseAuthService';
import { resetOrgState } from '../../features/organizations/redux/orgActions';

// Clear Errors Action
export const clearErrors = () => ({
    type: authTypes.CLEAR_ERRORS
});

// =======================================
// Thunk Action Creators
// =======================================

/**
 * Builds a minimal local user object from a Firebase user and signup form
 * data. Used only as a fallback when the backend record is not ready yet.
 *
 * @param {import('firebase/auth').User} firebaseUser
 * @param {Object} userData
 * @returns {Object}
 */
const buildLocalUser = (firebaseUser, userData) => {
    const displayName = userData.firstName && userData.lastName
        ? `${userData.firstName} ${userData.lastName}`
        : userData.name || userData.firstName || userData.lastName;

    return {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: displayName || firebaseUser.email.split('@')[0],
        displayName: displayName || null,
        photoURL: firebaseUser.photoURL || null,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        companyName: userData.companyName || '',
        isProfileComplete: true,
        emailVerified: firebaseUser.emailVerified,
        createdAt: firebaseUser.metadata.creationTime,
        platformRole: 'user',
    };
};

/**
 * Normalizes a backend /api/users/me response into the auth.user shape.
 * The server is the source of truth for platformRole, emailVerified, and name.
 *
 * @param {Object} me
 * @param {import('firebase/auth').User} firebaseUser
 * @returns {Object}
 */
const buildBackendUser = (me, firebaseUser) => ({
    id: me.uid || firebaseUser.uid,
    email: me.email || firebaseUser.email,
    name: me.displayName || firebaseUser.displayName || firebaseUser.email.split('@')[0],
    displayName: me.displayName || firebaseUser.displayName || null,
    photoURL: me.photoURL || firebaseUser.photoURL || null,
    firstName: me.firstName || '',
    lastName: me.lastName || '',
    companyName: me.companyName || '',
    isProfileComplete: true,
    emailVerified: me.emailVerified !== undefined ? me.emailVerified : firebaseUser.emailVerified,
    createdAt: me.createdAt || firebaseUser.metadata.creationTime,
    platformRole: me.platformRole || 'user',
    platformRoleUpdatedAt: me.platformRoleUpdatedAt || null,
});

// Sign Up Thunk
export const signUp = (userData, config = {}) => (dispatch) => {
    dispatch({ type: authTypes.SIGN_UP_REQUEST });

    return new Promise((resolve, reject) => {
        createUserWithEmailAndPassword(auth, userData.email, userData.password)
            .then(async (userCredential) => {
                const firebaseUser = userCredential.user;

                // Update the user's display name if provided so Firebase Auth
                // itself stores the canonical name alongside the account.
                const displayName = userData.firstName && userData.lastName
                    ? `${userData.firstName} ${userData.lastName}`
                    : userData.name || userData.firstName || userData.lastName;

                if (displayName) {
                    await updateProfile(firebaseUser, { displayName });
                }

                // The backend is the source of truth for the user record.
                // Try to fetch it; fall back to a local shape if the server
                // record isn't ready yet (e.g. auth trigger still running).
                let user;
                try {
                    await firebaseUser.getIdToken(true);
                    const me = await usersApi.fetchMe();
                    user = buildBackendUser(me, firebaseUser);
                } catch (meErr) {
                    user = buildLocalUser(firebaseUser, userData);
                }

                const transformedData = config.transformData ? config.transformData(user) : user;

                dispatch({
                    type: authTypes.SIGN_UP_SUCCESS,
                    payload: transformedData
                });

                resolve(transformedData);
            })
            .catch((error) => {
                const errorMessage = getSignUpErrorMessage(error);
                dispatch({
                    type: authTypes.SIGN_UP_FAILURE,
                    payload: errorMessage
                });
                reject(error);
            });
    });
};

// Sign In Thunk
export const signIn = (credentials, config = {}) => (dispatch) => {
    dispatch({ type: authTypes.SIGN_IN_REQUEST });
    
    return new Promise((resolve, reject) => {
        signInWithEmailAndPassword(auth, credentials.email, credentials.password)
            .then(async (userCredential) => {
                const firebaseUser = userCredential.user;

                // Pull platformRole + platformRoleUpdatedAt off the ID
                // token so the sidebar and route guards can render
                // correctly on the first paint after login. Without this
                // the app has to wait for a full page reload before
                // checkAuthStatus reads the claim.
                let platformRole = 'user';
                let platformRoleUpdatedAt = null;
                try {
                    const tokenResult = await firebaseUser.getIdTokenResult();
                    platformRole = tokenResult.claims.platformRole || tokenResult.claims.role || 'user';
                    platformRoleUpdatedAt = tokenResult.claims.platformRoleUpdatedAt || tokenResult.claims.rolesUpdatedAt || null;
                } catch (err) {
                    console.warn('Failed to read ID token claims on sign-in:', err && err.message);
                }

                const user = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                    isProfileComplete: true,
                    emailVerified: firebaseUser.emailVerified,
                    lastLoginAt: firebaseUser.metadata.lastSignInTime,
                    platformRole,
                    platformRoleUpdatedAt,
                };
                
                const transformedData = config.transformData ? config.transformData(user) : user;

                dispatch({
                    type: authTypes.SIGN_IN_SUCCESS,
                    payload: transformedData
                });

                resolve(transformedData);
            })
            .catch((error) => {
                const errorMessage = getSignInErrorMessage(error);
                dispatch({
                    type: authTypes.SIGN_IN_FAILURE,
                    payload: errorMessage
                });
                reject(error);
            });
    });
};

// Update Profile Thunk
export const updateUserProfile = (profileData, config = {}) => (dispatch, getState) => {
    dispatch({ type: authTypes.UPDATE_PROFILE_REQUEST });
    
    return new Promise((resolve, reject) => {
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
            const error = 'No authenticated user found';
            dispatch({
                type: authTypes.UPDATE_PROFILE_FAILURE,
                payload: error
            });
            reject(new Error(error));
            return;
        }
        
        updateProfile(currentUser, {
            displayName: profileData.name || profileData.displayName,
            photoURL: profileData.photoURL
        })
        .then(() => {
            const existingUser = getState().auth.user || {};
            const updatedUser = { 
                ...existingUser, 
                ...profileData,
                name: profileData.name || profileData.displayName || existingUser.name
            };
            
            const transformedData = config.transformData ? config.transformData(updatedUser) : updatedUser;
            
            dispatch({
                type: authTypes.UPDATE_PROFILE_SUCCESS,
                payload: transformedData
            });
            
            resolve(transformedData);
        })
        .catch((error) => {
            const errorMessage = error.message || 'Profile update failed';
            dispatch({
                type: authTypes.UPDATE_PROFILE_FAILURE,
                payload: errorMessage
            });
            reject(error);
        });
    });
};

// Logout Thunk
export const logoutUser = (config = {}) => (dispatch) => {
    return new Promise((resolve, reject) => {
        signOut(auth)
            .then(() => {
                dispatch({ type: authTypes.LOGOUT });
                
                // Clear persisted state - import persistor dynamically to avoid circular imports
                import("../store").then(({ persistor }) => {
                    persistor.purge().then(() => {
                        if (config.onComplete) {
                            config.onComplete();
                        }
                        resolve();
                    });
                });
            })
            .catch((error) => {
                console.error('Logout error:', error);
                // Even if Firebase logout fails, clear local state
                dispatch({ type: authTypes.LOGOUT });
                
                import("../store").then(({ persistor }) => {
                    persistor.purge().then(() => {
                        if (config.onComplete) {
                            config.onComplete();
                        }
                        resolve();
                    });
                });
            });
    });
};

// Forgot Password Thunk
export const forgotPassword = (email, config = {}) => (dispatch) => {
    dispatch({ type: authTypes.FORGOT_PASSWORD_REQUEST });
    
    return new Promise((resolve, reject) => {
        sendPasswordResetEmail(auth, email)
            .then(() => {
                const successMessage = 'Password reset email sent successfully';
                dispatch({
                    type: authTypes.FORGOT_PASSWORD_SUCCESS,
                    payload: successMessage
                });
                
                if (config.onSuccess) {
                    config.onSuccess(successMessage);
                }
                
                resolve(successMessage);
            })
            .catch((error) => {
                const errorMessage = getPasswordResetErrorMessage(error);
                
                dispatch({
                    type: authTypes.FORGOT_PASSWORD_FAILURE,
                    payload: errorMessage
                });
                
                if (config.onError) {
                    config.onError(errorMessage);
                }
                
                reject(error);
            });
    });
};

// Single, app-lifetime Firebase auth subscription. Registered once so
// StrictMode remounts (dev) and repeat calls never stack listeners, and
// kept alive so every auth transition (boot, login, logout) re-hydrates
// Redux from one place — no per-page fetching required.
let authInitPromise = null;

// Check Auth Status (for app initialization)
export const checkAuthStatus = (config = {}) => (dispatch) => {
    // Reuse the existing subscription/promise for any subsequent call.
    if (authInitPromise) return authInitPromise;

    authInitPromise = new Promise((resolve) => {
        let bootSettled = false;
        const settleBoot = (value) => {
            if (!bootSettled) {
                bootSettled = true;
                resolve(value);
            }
        };

        onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Pull custom claims (platformRole, platformRoleUpdatedAt) from the ID token.
                let platformRole = 'user';
                let platformRoleUpdatedAt = null;
                try {
                    const tokenResult = await firebaseUser.getIdTokenResult();
                    platformRole = tokenResult.claims.platformRole || tokenResult.claims.role || 'user';
                    platformRoleUpdatedAt = tokenResult.claims.platformRoleUpdatedAt || tokenResult.claims.rolesUpdatedAt || null;
                } catch (err) {
                    console.warn('Failed to read ID token claims:', err && err.message);
                }

                const user = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                    photoURL: firebaseUser.photoURL || null,
                    isProfileComplete: true,
                    emailVerified: firebaseUser.emailVerified,
                    lastLoginAt: firebaseUser.metadata.lastSignInTime,
                    platformRole,
                    platformRoleUpdatedAt,
                };

                dispatch({
                    type: authTypes.SIGN_IN_SUCCESS,
                    payload: user
                });

                // Hydrate the authoritative profile from the backend so
                // Redux is the single source of truth. Fires on boot and on
                // every subsequent login via this persistent listener.
                dispatch(fetchMe()).catch(() => {});

                if (config.onAuthenticated) {
                    config.onAuthenticated(user);
                }

                settleBoot({ isLoggedIn: true, user });
            } else {
                // User is signed out — reconcile Redux with Firebase so
                // persisted `isLoggedIn` from a previous session doesn't
                // survive a real sign-out. Without this dispatch, the app
                // renders as "signed in" while every backend call fails
                // with "Missing Authorization header".
                dispatch({ type: authTypes.LOGOUT });
                dispatch(resetOrgState());

                if (config.onUnauthenticated) {
                    config.onUnauthenticated();
                }

                settleBoot({ isLoggedIn: false, user: null });
            }
        });
    });

    return authInitPromise;
};

// =======================================
// Phase 1 enterprise-auth thunks
// =======================================

/**
 * Fetches the current user's authoritative profile from the backend
 * (/api/users/me) and merges it into auth.user. platformRole/email/displayName
 * coming from the server overwrite the client-side values.
 */
// Collapses concurrent fetchMe calls (StrictMode double-mount, rapid
// navigation) into a single in-flight request.
let fetchMeInFlight = null;

export const fetchMe = (config = {}) => async (dispatch, getState) => {
    if (fetchMeInFlight) {
        try {
            const merged = await fetchMeInFlight;
            if (config.onSuccess) config.onSuccess(merged);
            return merged;
        } catch (err) {
            if (config.onError) config.onError(err);
            throw err;
        }
    }

    dispatch({ type: authTypes.FETCH_ME_REQUEST });
    fetchMeInFlight = (async () => {
        const me = await usersApi.fetchMe();
        const existing = getState().auth.user || {};
        // The Firebase token claim is the source of truth for platformRole
        // (set by checkAuthStatus/REFRESH_CLAIMS). Prefer the claim value
        // already in Redux so a stale Firestore doc from /me can't downgrade
        // a super_admin back to 'user'.
        const nextPlatformRole = existing.platformRole || me.platformRole || me.role || 'user';
        const nextPlatformRoleUpdatedAt = existing.platformRoleUpdatedAt || me.platformRoleUpdatedAt || me.rolesUpdatedAt || null;
        return {
            ...existing,
            id: me.uid || existing.id,
            email: me.email || existing.email,
            name: me.displayName || existing.name,
            displayName: me.displayName,
            photoURL: me.photoURL,
            emailVerified: me.emailVerified,
            platformRole: nextPlatformRole,
            platformRoleUpdatedAt: nextPlatformRoleUpdatedAt,
            disabled: me.disabled,
            updatedAt: me.updatedAt,
        };
    })();

    try {
        const merged = await fetchMeInFlight;
        dispatch({ type: authTypes.FETCH_ME_SUCCESS, payload: merged });
        if (config.onSuccess) config.onSuccess(merged);
        return merged;
    } catch (err) {
        dispatch({ type: authTypes.FETCH_ME_FAILURE, payload: err.message });
        if (config.onError) config.onError(err);
        throw err;
    } finally {
        fetchMeInFlight = null;
    }
};

/**
 * Updates the current user's mutable profile (displayName, photoURL) on
 * the server. The server is the source of truth — we trust its response.
 */
export const updateMe = (patch, config = {}) => async (dispatch, getState) => {
    dispatch({ type: authTypes.UPDATE_ME_REQUEST });
    try {
        const me = await usersApi.updateMe(patch);
        const existing = getState().auth.user || {};
        const merged = {
            ...existing,
            name: me.displayName || existing.name,
            displayName: me.displayName,
            photoURL: me.photoURL,
            updatedAt: me.updatedAt,
        };
        dispatch({ type: authTypes.UPDATE_ME_SUCCESS, payload: merged });
        if (config.onSuccess) config.onSuccess(merged);
        return merged;
    } catch (err) {
        dispatch({ type: authTypes.UPDATE_ME_FAILURE, payload: err.message });
        if (config.onError) config.onError(err);
        throw err;
    }
};

/**
 * Changes the caller's email address.
 *
 * Flow:
 *   1) Reauthenticate locally (currentPassword).
 *   2) Server-side updateUser via /api/auth/change-email (Admin SDK).
 *   3) Refresh local ID token + claims so the new email + emailVerified=false
 *      propagate immediately.
 */
export const changeEmail = ({ newEmail, currentPassword }, config = {}) => async (dispatch, getState) => {
    dispatch({ type: authTypes.CHANGE_EMAIL_REQUEST });
    try {
        if (currentPassword) {
            await firebaseAuthService.reauthenticate(currentPassword);
        }
        const result = await authApi.changeEmail(newEmail);
        await firebaseAuthService.refreshClaims();
        const existing = getState().auth.user || {};
        const merged = {
            ...existing,
            email: result.email,
            emailVerified: result.emailVerified,
        };
        dispatch({ type: authTypes.CHANGE_EMAIL_SUCCESS, payload: merged });
        if (config.onSuccess) config.onSuccess(merged);
        return merged;
    } catch (err) {
        dispatch({ type: authTypes.CHANGE_EMAIL_FAILURE, payload: err.message });
        if (config.onError) config.onError(err);
        throw err;
    }
};

/**
 * Changes the caller's password.
 *
 * Flow:
 *   1) Reauthenticate locally with currentPassword (required by Firebase).
 *   2) Update password via the Firebase client SDK (never sent to server).
 *   3) Notify server so the change is audit-logged and other sessions revoked.
 */
export const changePassword = ({ currentPassword, newPassword }, config = {}) => async (dispatch) => {
    dispatch({ type: authTypes.CHANGE_PASSWORD_REQUEST });
    try {
        await firebaseAuthService.reauthenticate(currentPassword);
        await firebaseAuthService.updatePassword(newPassword);
        await authApi.notifyPasswordChanged();
        dispatch({ type: authTypes.CHANGE_PASSWORD_SUCCESS });
        if (config.onSuccess) config.onSuccess();
    } catch (err) {
        dispatch({ type: authTypes.CHANGE_PASSWORD_FAILURE, payload: err.message });
        if (config.onError) config.onError(err);
        throw err;
    }
};

/**
 * Revokes all of the caller's refresh tokens (signs out everywhere). The
 * current session is then logged out locally so the UI matches server state.
 */
export const revokeAllSessions = (config = {}) => async (dispatch) => {
    dispatch({ type: authTypes.REVOKE_SESSIONS_REQUEST });
    try {
        await authApi.revokeSessions();
        dispatch({ type: authTypes.REVOKE_SESSIONS_SUCCESS });
        await dispatch(logoutUser({ onComplete: config.onComplete }));
    } catch (err) {
        dispatch({ type: authTypes.REVOKE_SESSIONS_FAILURE, payload: err.message });
        if (config.onError) config.onError(err);
        throw err;
    }
};

/**
 * Forces an ID-token refresh and pulls fresh claims (platformRole, emailVerified)
 * into the auth slice. Call after a server-side platform-role change.
 */
export const refreshClaims = () => async (dispatch, getState) => {
    const claims = await firebaseAuthService.refreshClaims();
    const existing = getState().auth.user || {};
    const merged = {
        ...existing,
        platformRole: claims.platformRole,
        platformRoleUpdatedAt: claims.platformRoleUpdatedAt,
        emailVerified: claims.emailVerified,
    };
    dispatch({ type: authTypes.REFRESH_CLAIMS_SUCCESS, payload: merged });
    return merged;
};

/**
 * Sends (or re-sends) the email-verification mail to the caller.
 */
export const resendVerificationEmail = (config = {}) => async (dispatch) => {
    dispatch({ type: authTypes.RESEND_VERIFICATION_REQUEST });
    try {
        await firebaseAuthService.resendVerificationEmail();
        dispatch({ type: authTypes.RESEND_VERIFICATION_SUCCESS });
        if (config.onSuccess) config.onSuccess();
    } catch (err) {
        dispatch({ type: authTypes.RESEND_VERIFICATION_FAILURE, payload: err.message });
        if (config.onError) config.onError(err);
        throw err;
    }
};
