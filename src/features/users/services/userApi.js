/**
 * @fileoverview Backend /api/users client.
 *
 * Uses the shared axios instance for auth and error normalization. All
 * exported helpers return the backend's `data` payload on success or a
 * rejected error carrying { code, message, status, details, requestId }.
 *
 * @module features/users/services/userApi
 */

import client from '../../../api/client';

/**
 * GET /api/users — paginated list of every user on the platform.
 *
 * @param {{limit?: number, cursor?: string, platformRole?: string, disabled?: boolean}} [params]
 * @returns {Promise<{items: Array, nextCursor: ?string}>}
 */
export const listAllUsers = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.cursor) qs.set('startAfterCreatedAt', params.cursor);
  if (params.platformRole) qs.set('platformRole', params.platformRole);
  if (typeof params.disabled === 'boolean') qs.set('disabled', String(params.disabled));
  const suffix = qs.toString() ? `?${qs}` : '';
  return client.get(`/api/users${suffix}`);
};
