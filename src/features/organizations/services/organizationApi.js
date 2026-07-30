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
 * @param {{name: string, slug: string, emailDomains?: string[], plan?: string}} payload
 * @returns {Promise<{orgId: string}>}
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
