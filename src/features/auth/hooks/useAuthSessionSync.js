/**
 * @fileoverview Keeps the Redux auth user in sync with Firebase Auth for
 * long-lived browser sessions.
 *
 * Firebase ID tokens expire after one hour and custom claims can change
 * server-side at any time (role changes, org membership changes, email
 * verification). This hook refreshes the ID token and re-reads claims on
 * a fixed interval while the user is signed in, then dispatches the
 * updated role/emailVerified into the auth slice.
 *
 * The interval runs only when `isLoggedIn` is true and is cleaned up on
 * unmount or sign-out. No tokens are persisted.
 */

import {useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import * as firebaseAuthService from '../services/firebaseAuthService';
import {REFRESH_CLAIMS_SUCCESS} from '../../../redux/authentication/authTypes';

/** Token/claims refresh interval in milliseconds (50 minutes). */
const CLAIMS_SYNC_INTERVAL_MS = 50 * 60 * 1000;

/**
 * Refreshes the current user's Firebase claims and updates the auth slice.
 *
 * @param {import('redux').Dispatch} dispatch
 * @returns {Promise<void>}
 */
const syncClaims = async (dispatch) => {
  try {
    const claims = await firebaseAuthService.refreshClaims();
    dispatch({
      type: REFRESH_CLAIMS_SUCCESS,
      payload: {
        platformRole: claims.platformRole,
        platformRoleUpdatedAt: claims.platformRoleUpdatedAt,
        emailVerified: claims.emailVerified,
      },
    });
  } catch (err) {
    // Silent failure — the next boot or explicit refresh will reconcile.
    // Surfacing this could spam users with transient network errors.
  }
};

/**
 * Triggers periodic auth-claims sync while the user is logged in.
 *
 * @returns {void}
 */
export const useAuthSessionSync = () => {
  const dispatch = useDispatch();
  const {isLoggedIn} = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isLoggedIn) return undefined;

    // Sync immediately on mount/login, then on the interval.
    syncClaims(dispatch);
    const intervalId = setInterval(() => syncClaims(dispatch), CLAIMS_SYNC_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isLoggedIn, dispatch]);
};

export default useAuthSessionSync;
