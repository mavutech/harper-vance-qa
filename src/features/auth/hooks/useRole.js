/**
 * @fileoverview useRole hook — exposes the caller's role + role helpers.
 */

import {useSelector} from 'react-redux';

export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  USER: 'user',
});

const RANK = {[ROLES.USER]: 1, [ROLES.ADMIN]: 2, [ROLES.SUPER_ADMIN]: 3};

/**
 * Returns the caller's platform role and helpers to gate UI on role.
 *
 * @returns {{
 *   platformRole: string,
 *   isAdmin: boolean,
 *   isSuperAdmin: boolean,
 *   hasRole: (...allowed: string[]) => boolean,
 *   hasAtLeast: (minimum: string) => boolean,
 * }}
 */
export const useRole = () => {
  const platformRole = useSelector((s) => (s.auth && s.auth.user && s.auth.user.platformRole) || ROLES.USER);
  const rank = RANK[platformRole] || 0;
  return {
    platformRole,
    isAdmin: rank >= RANK[ROLES.ADMIN],
    isSuperAdmin: rank >= RANK[ROLES.SUPER_ADMIN],
    hasRole: (...allowed) => allowed.includes(platformRole),
    hasAtLeast: (minimum) => rank >= (RANK[minimum] || 0),
  };
};
