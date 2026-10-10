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
