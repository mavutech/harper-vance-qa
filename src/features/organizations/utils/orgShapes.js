/**
 * @fileoverview Shape typedefs and small validators for organization data.
 *
 * The document shapes here mirror Firestore exactly:
 *   - orgs/{orgId}                          → Organization
 *   - orgs/{orgId}/members/{uid}            → OrgMember
 *   - orgs/{orgId}/invitations/{inviteId}   → OrgInvitation
 *
 * Custom claims on the Firebase Auth token are of shape:
 *   { orgs: { [orgId]: 'owner' | 'admin' | 'member' } }
 *
 * See docs/standards/firebase.md and firestore.rules.
 */

/**
 * @typedef {'owner' | 'admin' | 'member'} OrgRole
 * @typedef {'pilot' | 'standard' | 'enterprise'} OrgPlan
 * @typedef {'pending' | 'accepted' | 'revoked' | 'expired'} OrgInvitationStatus
 */

/**
 * @typedef {Object} Organization
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {string[]} emailDomains
 * @property {OrgPlan} plan
 * @property {number} seatLimit
 * @property {string} createdBy
 */

/**
 * @typedef {Object} OrgMember
 * @property {string} uid
 * @property {OrgRole} role
 * @property {?string} invitedBy
 * @property {Date} joinedAt
 */

/**
 * @typedef {Object} OrgInvitation
 * @property {string} id
 * @property {string} email
 * @property {OrgRole} role
 * @property {string} tokenHash
 * @property {Date} expiresAt
 * @property {OrgInvitationStatus} status
 * @property {string} createdBy
 * @property {Date} createdAt
 */

export const ORG_ROLES = Object.freeze(['owner', 'admin', 'member']);
export const ORG_ADMIN_ROLES = Object.freeze(['owner', 'admin']);
export const ORG_PLANS = Object.freeze(['pilot', 'standard', 'enterprise']);

/**
 * Returns true if the given value is a valid organization role.
 *
 * @param {unknown} role
 * @returns {boolean}
 */
export const isOrgRole = (role) => ORG_ROLES.includes(role);

/**
 * Returns true if the role has admin-or-above privileges within an org.
 *
 * @param {unknown} role
 * @returns {boolean}
 */
export const isOrgAdminRole = (role) => ORG_ADMIN_ROLES.includes(role);

/**
 * Extracts the { orgId: role } map from a decoded Firebase ID token result.
 * Handles both string and object claim shapes defensively.
 *
 * @param {?{claims?: {orgs?: unknown}}} tokenResult
 * @returns {Record<string, OrgRole>}
 */
export const orgsFromToken = (tokenResult) => {
  const raw = tokenResult && tokenResult.claims && tokenResult.claims.orgs;
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  Object.keys(raw).forEach((orgId) => {
    if (isOrgRole(raw[orgId])) out[orgId] = raw[orgId];
  });
  return out;
};
