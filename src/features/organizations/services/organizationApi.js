/**
 * @fileoverview Backend /api/organizations client.
 *
 * All organization mutations go through the backend REST endpoints (see
 * golden-setups-sona-alerts/functions/features/organizations/). The client
 * axios instance handles auth (Bearer ID token) and error envelope
 * normalization, so callers get the `data` payload on success or a
 * rejected error carrying { code, message, status, details, requestId }.
 *
 * @module features/organizations/services/organizationApi
 */

import client from '../../../api/client';

/**
 * POST /api/organizations
 *
 * Returns the created org doc so the caller can seat it into state without
 * a follow-up Firestore read (which would race custom-claim propagation).
 *
 * @param {{name: string, slug: string, emailDomains?: string[], plan?: string, ownerEmail?: string}} payload
 * @returns {Promise<{orgId: string, org: object, initialInvite: ?object}>}
 */
export const createOrg = (payload) =>
  client.post('/api/organizations', payload);

/**
 * PATCH /api/organizations/:orgId
 *
 * @param {{orgId: string, name?: string, emailDomains?: string[]}} payload
 * @returns {Promise<{updated: true}>}
 */
export const updateOrg = ({orgId, ...body}) =>
  client.patch(`/api/organizations/${encodeURIComponent(orgId)}`, body);

/**
 * POST /api/organizations/:orgId/invitations
 *
 * Server-generated token is returned in the response so the frontend can
 * present a share link during testing. The email dispatch itself is
 * handled server-side (WS-C.email TODO).
 *
 * @param {{orgId: string, email: string, role: ('admin'|'member')}} payload
 * @returns {Promise<{invitationId: string, rawToken: string}>}
 */
export const inviteMember = ({orgId, ...body}) =>
  client.post(`/api/organizations/${encodeURIComponent(orgId)}/invitations`, body);

/**
 * DELETE /api/organizations/:orgId/invitations/:invitationId
 *
 * @param {{orgId: string, invitationId: string}} payload
 * @returns {Promise<{revoked: true}>}
 */
export const revokeInvitation = ({orgId, invitationId}) =>
  client.delete(`/api/organizations/${encodeURIComponent(orgId)}/invitations/${encodeURIComponent(invitationId)}`);

/**
 * POST /api/organizations/accept-invitation
 *
 * @param {{token: string}} payload
 * @returns {Promise<{orgId: string, role: ('owner'|'admin'|'member')}>}
 */
export const acceptInvitation = ({token}) =>
  client.post('/api/organizations/accept-invitation', {token});

/**
 * PATCH /api/organizations/:orgId/members/:uid
 *
 * Guardrails enforced server-side:
 *   - only owner can promote to owner
 *   - cannot demote the last owner
 *
 * @param {{orgId: string, uid: string, role: ('owner'|'admin'|'member')}} payload
 * @returns {Promise<{updated: true}>}
 */
export const changeMemberRole = ({orgId, uid, role}) =>
  client.patch(`/api/organizations/${encodeURIComponent(orgId)}/members/${encodeURIComponent(uid)}`, {role});

/**
 * DELETE /api/organizations/:orgId/members/:uid
 *
 * Guardrail: cannot remove the last owner.
 *
 * @param {{orgId: string, uid: string}} payload
 * @returns {Promise<{removed: true}>}
 */
export const removeMember = ({orgId, uid}) =>
  client.delete(`/api/organizations/${encodeURIComponent(orgId)}/members/${encodeURIComponent(uid)}`);

// ─────────────────────────────────────────────────────────────────────────────
// Platform-admin endpoints (super_admin only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/organizations — paginated list of every org on the platform.
 *
 * @param {{limit?: number, cursor?: string, search?: string}} [params]
 * @returns {Promise<{items: Array, nextCursor: ?string}>}
 */
export const listAllOrgs = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.cursor) qs.set('cursor', params.cursor);
  if (params.search) qs.set('search', params.search);
  const suffix = qs.toString() ? `?${qs}` : '';
  return client.get(`/api/organizations${suffix}`);
};

/**
 * GET /api/organizations/:orgId/detail — aggregate org + members + invitations.
 * Available to super_admin or the org's admin/owner.
 *
 * @param {string} orgId
 * @returns {Promise<{org: object, members: Array, pendingInvitations: Array, seatUsage: {used: number, limit: number}}>}
 */
export const getOrgDetail = (orgId) =>
  client.get(`/api/organizations/${encodeURIComponent(orgId)}/detail`);

/**
 * DELETE /api/organizations/:orgId — hard delete. super_admin only.
 *
 * @param {string} orgId
 * @returns {Promise<{deleted: true}>}
 */
export const deleteOrg = (orgId) =>
  client.delete(`/api/organizations/${encodeURIComponent(orgId)}`);

/**
 * PATCH /api/organizations/:orgId/plan — change plan (and seat limit).
 * super_admin only.
 *
 * @param {{orgId: string, plan: string, seatLimit?: number}} payload
 * @returns {Promise<{updated: true}>}
 */
export const changeOrgPlan = ({orgId, plan, seatLimit}) => {
  const body = seatLimit !== undefined ? {plan, seatLimit} : {plan};
  return client.patch(`/api/organizations/${encodeURIComponent(orgId)}/plan`, body);
};
