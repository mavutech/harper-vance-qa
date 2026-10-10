/**
 * @fileoverview Governed customer organization API operations.
 */

import client from '../../../api/client';

/**
 * Lists customer organizations visible to the platform administrator.
 *
 * @param {{limit?: number, cursor?: string, search?: string}} [params] - Query filters
 * @return {Promise<{items: Array<Object>, nextCursor: string|null}>} Organization page
 */
export const listOrganizations = (params = {}) =>
  client.get('/api/organizations', {params});

/**
 * Creates a new customer organization in onboarding status.
 *
 * @param {{name: string, slug: string, emailDomains: string[], plan: string}} input - Organization input
 * @return {Promise<Object>} Created organization record
 */
export const createOrganization = (input) =>
  client.post('/api/organizations', input);

/**
 * Loads one organization's roster, invitations, and seat use.
 *
 * @param {string} orgId - Organization ID
 * @return {Promise<Object>} Organization detail
 */
export const getOrganizationDetail = (orgId) =>
  client.get(`/api/organizations/${encodeURIComponent(orgId)}/detail`);

/**
 * Loads one organization's authoritative subscription and entitlement.
 *
 * @param {string} orgId - Organization ID
 * @return {Promise<Object>} Subscription summary
 */
export const getOrganizationSubscription = (orgId) =>
  client.get(`/api/subscriptions/${encodeURIComponent(orgId)}`);

/**
 * Creates or updates the authoritative customer subscription.
 *
 * @param {string} orgId - Organization ID
 * @param {Object} input - Validated subscription decision
 * @return {Promise<Object>} Updated subscription summary
 */
export const updateOrganizationSubscription = (orgId, input) =>
  client.put(`/api/subscriptions/${encodeURIComponent(orgId)}`, input);

/**
 * Creates a customer organization invitation.
 *
 * @param {string} orgId - Organization ID
 * @param {{email: string, orgRole: string}} input - Invitation input
 * @return {Promise<{invitationId: string, rawToken: string}>} One-time invitation result
 */
export const inviteOrganizationMember = (orgId, input) =>
  client.post(`/api/organizations/${encodeURIComponent(orgId)}/invitations`, input);

/**
 * Revokes one pending customer invitation.
 *
 * @param {string} orgId - Organization ID
 * @param {string} invitationId - Invitation ID
 * @return {Promise<Object>} Revocation result
 */
export const revokeOrganizationInvitation = (orgId, invitationId) =>
  client.delete(
      `/api/organizations/${encodeURIComponent(orgId)}/invitations/${encodeURIComponent(invitationId)}`,
  );

/**
 * Changes one customer's organization role.
 *
 * @param {string} orgId - Organization ID
 * @param {string} uid - Customer user ID
 * @param {string} orgRole - New organization role
 * @return {Promise<Object>} Update result
 */
export const updateOrganizationMemberRole = (orgId, uid, orgRole) =>
  client.patch(
      `/api/organizations/${encodeURIComponent(orgId)}/members/${encodeURIComponent(uid)}`,
      {orgRole},
  );

/**
 * Removes one member's customer organization access.
 *
 * @param {string} orgId - Organization ID
 * @param {string} uid - Customer user ID
 * @return {Promise<Object>} Removal result
 */
export const removeOrganizationMember = (orgId, uid) =>
  client.delete(`/api/organizations/${encodeURIComponent(orgId)}/members/${encodeURIComponent(uid)}`);

/**
 * Loads the complete organization audit history as structured JSON.
 *
 * @param {string} orgId - Organization ID
 * @return {Promise<{items: Array<Object>}>} Audit history
 */
export const getOrganizationAudit = (orgId) =>
  client.get(`/api/organizations/${encodeURIComponent(orgId)}/audit/export`, {
    params: {format: 'json'},
  });

/**
 * Closes an organization while preserving governance evidence.
 *
 * @param {string} orgId - Organization ID
 * @return {Promise<Object>} Closure result
 */
export const closeOrganization = (orgId) =>
  client.delete(`/api/organizations/${encodeURIComponent(orgId)}`);
