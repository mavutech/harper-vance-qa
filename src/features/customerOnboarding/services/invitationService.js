/**
 * @fileoverview Customer invitation preview and acceptance API operations.
 */

import client from '../../../api/client';

/**
 * Loads the safe public invitation envelope.
 *
 * @param {string} token - Raw invitation token
 * @return {Promise<Object>} Invitation preview
 */
export const previewInvitation = (token) =>
  client.get('/api/organizations/invitations/preview', {params: {token}});

/**
 * Accepts an invitation for the authenticated user.
 *
 * @param {string} token - Raw invitation token
 * @return {Promise<Object>} Accepted membership
 */
export const acceptInvitation = (token) =>
  client.post('/api/organizations/accept-invitation', {token});

/**
 * Creates an invited user and accepts the invitation in one server flow.
 *
 * @param {string} token - Raw invitation token
 * @param {string} password - New account password
 * @return {Promise<Object>} Accepted membership
 */
export const acceptInvitationWithSignup = (token, password) =>
  client.post('/api/organizations/invitations/accept-with-signup', {token, password});
