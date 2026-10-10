/**
 * @fileoverview Governed customer delivery, API, and support operations.
 */

import client from '../../../api/client';

/**
 * Lists configured delivery destinations.
 * @param {string} orgId - Organization ID
 * @return {Promise<Array<Object>>} Delivery destinations
 */
export const listDeliveryDestinations = (orgId) =>
  client.get(`/api/customer-operations/${encodeURIComponent(orgId)}/destinations`);

/**
 * Creates one delivery destination.
 * @param {string} orgId - Organization ID
 * @param {Object} input - Destination input
 * @return {Promise<Object>} Created destination
 */
export const createDeliveryDestination = (orgId, input) =>
  client.post(`/api/customer-operations/${encodeURIComponent(orgId)}/destinations`, input);

/**
 * Disables one delivery destination.
 * @param {string} orgId - Organization ID
 * @param {string} destinationId - Destination ID
 * @return {Promise<Object>} Disable result
 */
export const disableDeliveryDestination = (orgId, destinationId) =>
  client.delete(
      `/api/customer-operations/${encodeURIComponent(orgId)}/destinations/${encodeURIComponent(destinationId)}`,
  );

/**
 * Lists API clients without credential hashes or secrets.
 * @param {string} orgId - Organization ID
 * @return {Promise<Array<Object>>} Safe API client records
 */
export const listApiClients = (orgId) =>
  client.get(`/api/customer-operations/${encodeURIComponent(orgId)}/api-clients`);

/**
 * Creates one API client and returns its secret exactly once.
 * @param {string} orgId - Organization ID
 * @param {Object} input - API client input
 * @return {Promise<Object>} Created API client with one-time secret
 */
export const createApiClient = (orgId, input) =>
  client.post(`/api/customer-operations/${encodeURIComponent(orgId)}/api-clients`, input);

/**
 * Revokes one API client.
 * @param {string} orgId - Organization ID
 * @param {string} apiClientId - API client ID
 * @return {Promise<Object>} Revoke result
 */
export const revokeApiClient = (orgId, apiClientId) =>
  client.delete(
      `/api/customer-operations/${encodeURIComponent(orgId)}/api-clients/${encodeURIComponent(apiClientId)}`,
  );

/**
 * Lists support cases for one customer organization.
 * @param {string} orgId - Organization ID
 * @return {Promise<Array<Object>>} Support case records
 */
export const listSupportCases = (orgId) =>
  client.get(`/api/customer-operations/${encodeURIComponent(orgId)}/support-cases`);
