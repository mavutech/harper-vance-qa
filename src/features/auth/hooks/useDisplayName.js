/**
 * @fileoverview Single source of truth for how the current user's display
 * name is rendered anywhere in the UI.
 *
 * All components should use this hook (or the same precedence) so the
 * backend-sourced displayName in Redux is preferred, with sane fallbacks.
 */

import {useSelector} from 'react-redux';

const DEFAULT_DISPLAY_NAME = 'User';
const GUEST_DISPLAY_NAME = 'Guest User';

/**
 * Returns the display name to render for the current user.
 *
 * Precedence:
 *   1. user.displayName (authoritative backend value)
 *   2. user.name (legacy/Firebase-derived value)
 *   3. "User" for authenticated users with no name set
 *   4. "Guest User" when not authenticated
 *
 * @returns {{ displayName: string, isGuest: boolean }}
 */
export const useDisplayName = () => {
  const {user, isLoggedIn} = useSelector((state) => state.auth || {});

  if (!isLoggedIn || !user) {
    return {displayName: GUEST_DISPLAY_NAME, isGuest: true};
  }

  return {
    displayName: user.displayName || user.name || DEFAULT_DISPLAY_NAME,
    isGuest: false,
  };
};

export default useDisplayName;
