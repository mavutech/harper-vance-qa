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
