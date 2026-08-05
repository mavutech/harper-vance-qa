/**
 * @fileoverview Backend /api/users client.
 */

import client from '../../../api/client';

/**
 * GET /api/users/me — returns the caller's public profile.
 * @returns {Promise<Object>}
 */
export const fetchMe = () => client.get('/api/users/me');

/**
 * PATCH /api/users/me — update mutable profile fields on the caller.
 * @param {{displayName?: string, photoURL?: string}} patch
 * @returns {Promise<Object>}
 */
export const updateMe = (patch) => client.patch('/api/users/me', patch);

/**
 * Admin: list users.
 * @param {Object} [params] - { limit, startAfterCreatedAt, platformRole, disabled }
 * @returns {Promise<{items: Array<Object>, nextCursor: (string|null)}>}
 */
export const listUsers = (params) => client.get('/api/users', {params});

/**
 * Admin: get a single user.
 * @param {string} uid
 * @returns {Promise<Object>}
 */
export const getUser = (uid) => client.get(`/api/users/${encodeURIComponent(uid)}`);

/**
 * Admin: update a user's mutable profile fields.
 * @param {string} uid
 * @param {{displayName?: string, photoURL?: string}} patch
 * @returns {Promise<Object>}
 */
export const adminUpdateUser = (uid, patch) =>
  client.patch(`/api/users/${encodeURIComponent(uid)}`, patch);

/**
 * Admin: disable / enable a user.
 * @param {string} uid
 * @returns {Promise<Object>}
 */
export const disableUser = (uid) =>
  client.post(`/api/users/${encodeURIComponent(uid)}/disable`);
export const enableUser = (uid) =>
  client.post(`/api/users/${encodeURIComponent(uid)}/enable`);

/**
 * Super-admin: set platform role.
 * @param {string} uid
 * @param {string} platformRole - 'super_admin' | 'admin' | 'user'
 * @returns {Promise<Object>}
 */
export const setUserPlatformRole = (uid, platformRole) =>
  client.post(`/api/users/${encodeURIComponent(uid)}/platform-role`, {platformRole});

/**
 * Super-admin: delete a user.
 * @param {string} uid
 * @returns {Promise<Object>}
 */
export const deleteUser = (uid) =>
  client.delete(`/api/users/${encodeURIComponent(uid)}`);
