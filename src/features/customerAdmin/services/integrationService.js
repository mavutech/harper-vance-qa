/** @fileoverview Integration API operations using the shared authenticated client. */
import client from '../../../api/client';
const BASE = '/api/integrations';
const TIMEOUT = 10000;
/** @param {string} orgId - Organization. @param {string} id - Integration. @returns {string} Path. */
const path = (orgId, id) => `${BASE}/${encodeURIComponent(orgId)}/${encodeURIComponent(id)}`;
/** @param {Object} params - Filters. @returns {Promise<Object>} Page. */
export const listIntegrations = (params) => client.get(BASE, {params, timeout: TIMEOUT});
/** @param {string} orgId - Organization. @param {Object} input - Details. @returns {Promise<Object>} Record. */
export const createIntegration = (orgId, input) =>
  client.post(`${BASE}/${encodeURIComponent(orgId)}`, input, {timeout: TIMEOUT});
/** @param {string} orgId - Organization. @param {string} id - Integration. @param {Object} input - Update. @returns {Promise<Object>} Record. */
export const updateIntegration = (orgId, id, input) =>
  client.patch(path(orgId, id), input, {timeout: TIMEOUT});
/** @param {string} orgId - Organization. @param {string} id - Integration. @returns {Promise<Object>} Outcome. */
export const testIntegration = (orgId, id) =>
  client.post(`${path(orgId, id)}/test`, {confirmed: true}, {timeout: TIMEOUT});
/** @param {string} orgId - Organization. @param {string} id - Integration. @param {string} after - Cursor. @returns {Promise<Object>} History. */
export const integrationHistory = (orgId, id, after) =>
  client.get(`${path(orgId, id)}/history`, {params: {after: after || undefined}, timeout: TIMEOUT});
