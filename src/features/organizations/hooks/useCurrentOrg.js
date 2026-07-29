/**
 * @fileoverview Hook exposing the current org selection and role.
 *
 * Reads from the `organization` Redux slice populated by fetchOrgs() /
 * switchOrg(). Returns `null` fields when no org is selected yet.
 */

import {useSelector} from 'react-redux';
import {isOrgAdminRole} from '../utils/orgShapes';

/**
 * @typedef {Object} UseCurrentOrgResult
 * @property {?string} currentOrgId
 * @property {?import('../utils/orgShapes').Organization} currentOrg
 * @property {?import('../utils/orgShapes').OrgRole} currentOrgRole
 * @property {boolean} isAdmin      true when role is 'owner' or 'admin'
 * @property {boolean} isOwner      true when role is 'owner'
 * @property {boolean} isMember     true when any role is set
 */

/**
 * @returns {UseCurrentOrgResult}
 */
export const useCurrentOrg = () => {
  const currentOrgId = useSelector((s) => s.organization && s.organization.currentOrgId);
  const currentOrgRole = useSelector((s) => s.organization && s.organization.currentOrgRole);
  const currentOrg = useSelector((s) => {
    if (!s.organization || !s.organization.currentOrgId) return null;
    return s.organization.orgs[s.organization.currentOrgId] || null;
  });

  return {
    currentOrgId: currentOrgId || null,
    currentOrg: currentOrg || null,
    currentOrgRole: currentOrgRole || null,
    isAdmin: isOrgAdminRole(currentOrgRole),
    isOwner: currentOrgRole === 'owner',
    isMember: Boolean(currentOrgRole),
  };
};

export default useCurrentOrg;
