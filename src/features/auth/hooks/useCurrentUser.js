/**
 * @fileoverview useCurrentUser hook — convenience selector over redux auth.
 */

import {useSelector} from 'react-redux';

const EMPTY = {};

/**
 * Returns { user, isLoggedIn, loading, error }. Mirrors what the auth slice
 * already exposes so feature code does not have to know the shape.
 *
 * @returns {{
 *   user: Object|null,
 *   isLoggedIn: boolean,
 *   loading: boolean,
 *   error: string,
 * }}
 */
export const useCurrentUser = () => {
  const slice = useSelector((s) => s.auth || EMPTY);
  return {
    user: slice.user || null,
    isLoggedIn: Boolean(slice.isLoggedIn),
    loading: Boolean(slice.loading),
    error: slice.error || '',
  };
};
