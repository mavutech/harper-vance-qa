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
import { ref, set, serverTimestamp } from 'firebase/database';
import { auth, database, clientDatabase } from '../../firebase/config';
import { getSignInErrorMessage, getSignUpErrorMessage, getPasswordResetErrorMessage } from '../../utils/firebaseErrorMessages';
import * as usersApi from '../../features/auth/api/usersApi';
import * as authApi from '../../features/auth/api/authApi';
import * as firebaseAuthService from '../../features/auth/services/firebaseAuthService';

// Clear Errors Action
export const clearErrors = () => ({
    type: authTypes.CLEAR_ERRORS
});

// =======================================
// Thunk Action Creators
// =======================================

// Sign Up Thunk
export const signUp = (userData, config = {}) => (dispatch) => {
    dispatch({ type: authTypes.SIGN_UP_REQUEST });
    
    return new Promise((resolve, reject) => {
        createUserWithEmailAndPassword(auth, userData.email, userData.password)
            .then(async (userCredential) => {
                const firebaseUser = userCredential.user;
                
                // Update the user's display name if provided
                const displayName = userData.firstName && userData.lastName 
                    ? `${userData.firstName} ${userData.lastName}`
                    : userData.name || userData.firstName || userData.lastName;
                
                if (displayName) {
                    await updateProfile(firebaseUser, {
                        displayName: displayName
                    });
                }
                
                // Wait for auth state to be established before writing to database
                // This ensures the user is authenticated when writing to Realtime Database
                const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
                    if (authenticatedUser && authenticatedUser.uid === firebaseUser.uid) {
                        try {
                            // Create user record in Realtime Database (now authenticated)
                            const userRecord = {
                                firebaseId: firebaseUser.uid,
                                email: firebaseUser.email,
                                firstName: userData.firstName || '',
                                lastName: userData.lastName || '',
                                companyName: userData.companyName || '',
                                emailVerified: firebaseUser.emailVerified,
                                dateCreated: serverTimestamp(),
                                dateUpdated: serverTimestamp()
                            };
                            
                            // Save to Client Database (user is now authenticated)
                            await set(ref(clientDatabase, `users/${firebaseUser.uid}`), userRecord);
                            
                            const user = {
                                id: firebaseUser.uid,
                                email: firebaseUser.email,
                                name: displayName || firebaseUser.email.split('@')[0],
                                firstName: userData.firstName || '',
                                lastName: userData.lastName || '',
                                companyName: userData.companyName || '',
                                isProfileComplete: true,
                                emailVerified: firebaseUser.emailVerified,
                                createdAt: firebaseUser.metadata.creationTime
                            };
                            
                            const transformedData = config.transformData ? config.transformData(user) : user;
                            
                            dispatch({
                                type: authTypes.SIGN_UP_SUCCESS,
                                payload: transformedData
                            });
                            
                            unsubscribe(); // Clean up listener
                            resolve(transformedData);
                        } catch (dbError) {
                            console.error('Database write error:', dbError);
                            // Still resolve with user data even if database write fails
                            const user = {
                                id: firebaseUser.uid,
                                email: firebaseUser.email,
                                name: displayName || firebaseUser.email.split('@')[0],
                                firstName: userData.firstName || '',
                                lastName: userData.lastName || '',
                                companyName: userData.companyName || '',
                                isProfileComplete: true,
                                emailVerified: firebaseUser.emailVerified,
                                createdAt: firebaseUser.metadata.creationTime
                            };
                            
                            const transformedData = config.transformData ? config.transformData(user) : user;
                            
                            dispatch({
                                type: authTypes.SIGN_UP_SUCCESS,
                                payload: transformedData
                            });
                            
                            unsubscribe(); // Clean up listener
                            resolve(transformedData);
                        }
                    }
                });
                
                // Set a timeout to prevent hanging
                setTimeout(() => {
                    unsubscribe();
                    // If auth state doesn't change within 5 seconds, still resolve
                    const user = {
                        id: firebaseUser.uid,
                        email: firebaseUser.email,
                        name: displayName || firebaseUser.email.split('@')[0],
                        firstName: userData.firstName || '',
                        lastName: userData.lastName || '',
                        companyName: userData.companyName || '',
                        isProfileComplete: true,
                        emailVerified: firebaseUser.emailVerified,
                        createdAt: firebaseUser.metadata.creationTime
                    };
                    
                    const transformedData = config.transformData ? config.transformData(user) : user;
                    
                    dispatch({
                        type: authTypes.SIGN_UP_SUCCESS,
                        payload: transformedData
                    });
                    
                    resolve(transformedData);
                }, 5000);
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
            .then((userCredential) => {
                const firebaseUser = userCredential.user;
                
                const user = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                    isProfileComplete: true,
                    emailVerified: firebaseUser.emailVerified,
                    lastLoginAt: firebaseUser.metadata.lastSignInTime
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

// Check Auth Status (for app initialization)
export const checkAuthStatus = (config = {}) => (dispatch) => {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Pull custom claims (role, rolesUpdatedAt) from the ID token.
                let role = 'user';
                let rolesUpdatedAt = null;
                try {
                    const tokenResult = await firebaseUser.getIdTokenResult();
                    role = tokenResult.claims.role || 'user';
                    rolesUpdatedAt = tokenResult.claims.rolesUpdatedAt || null;
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
                    role,
                    rolesUpdatedAt,
                };

                dispatch({
                    type: authTypes.SIGN_IN_SUCCESS,
                    payload: user
                });

                console.log('Firebase user authenticated:', user.email, 'role:', role);

                if (config.onAuthenticated) {
                    config.onAuthenticated(user);
                }

                resolve({ isLoggedIn: true, user });
            } else {
                // User is signed out
                console.log('No Firebase user found');
                
                if (config.onUnauthenticated) {
                    config.onUnauthenticated();
                }
                
                resolve({ isLoggedIn: false, user: null });
            }
            
            // Unsubscribe after first check
            unsubscribe();
        });
    });
};

// =======================================
// Phase 1 enterprise-auth thunks
// =======================================

/**
 * Fetches the current user's authoritative profile from the backend
 * (/api/users/me) and merges it into auth.user. Role/email/displayName
 * coming from the server overwrite the client-side values.
 */
export const fetchMe = (config = {}) => async (dispatch, getState) => {
    dispatch({ type: authTypes.FETCH_ME_REQUEST });
    try {
        const me = await usersApi.fetchMe();
        const existing = getState().auth.user || {};
        const merged = {
            ...existing,
            id: me.uid || existing.id,
            email: me.email || existing.email,
            name: me.displayName || existing.name,
            displayName: me.displayName,
            photoURL: me.photoURL,
            emailVerified: me.emailVerified,
            role: me.role,
            disabled: me.disabled,
            updatedAt: me.updatedAt,
        };
        dispatch({ type: authTypes.FETCH_ME_SUCCESS, payload: merged });
        if (config.onSuccess) config.onSuccess(merged);
        return merged;
    } catch (err) {
        dispatch({ type: authTypes.FETCH_ME_FAILURE, payload: err.message });
        if (config.onError) config.onError(err);
        throw err;
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
 * Forces an ID-token refresh and pulls fresh claims (role, emailVerified)
 * into the auth slice. Call after a server-side role change.
 */
export const refreshClaims = () => async (dispatch, getState) => {
    const claims = await firebaseAuthService.refreshClaims();
    const existing = getState().auth.user || {};
    const merged = {
        ...existing,
        role: claims.role,
        rolesUpdatedAt: claims.rolesUpdatedAt,
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
