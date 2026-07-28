/**
 * @fileoverview Backend API client.
 *
 * Single axios instance that:
 *   - Resolves base URL from REACT_APP_API_BASE_URL.
 *   - Attaches the current user's Firebase ID token as a Bearer header on
 *     every outbound request (request interceptor).
 *   - On a 401 response, refreshes the ID token once and retries the request
 *     exactly one time (response interceptor) to absorb the race between
 *     near-expired tokens and the server's checkRevoked verification.
 *   - Translates the backend's standard {success,data,meta,error} envelope
 *     into either a resolved value (the `data` payload) or a rejected error
 *     carrying { code, message, status, details, requestId }.
 *
 * Always import this client from feature code — never use raw axios or
 * fetch — so every backend call participates in auth + error normalization.
 */

import axios from 'axios';
import {auth, authReady} from '../firebase/config';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

/**
 * Returns the current user's ID token. Forces a refresh when `forceRefresh`
 * is true (used by the 401 retry path).
 *
 * On cold start `auth.currentUser` is null until Firebase finishes restoring
 * persisted auth state, which races against the first API call. We await
 * `authReady` once when currentUser is missing so pages that fire fetches on
 * mount don't send unauthenticated requests immediately after a refresh.
 *
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<string|null>}
 */
export const getIdToken = async (forceRefresh = false) => {
  if (!auth.currentUser) await authReady;
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken(forceRefresh);
  } catch (_err) {
    return null;
  }
};

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {'Content-Type': 'application/json'},
});

// Attach a Bearer token on every outbound request.
instance.interceptors.request.use(async (config) => {
  const token = await getIdToken(false);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, refresh the token once and retry. Translate envelope into result/error.
instance.interceptors.response.use(
    (response) => {
      const body = response.data;
      if (body && typeof body === 'object' && 'success' in body) {
        if (body.success) return body.data;
        const err = new Error((body.error && body.error.message) || 'Request failed.');
        err.code = (body.error && body.error.code) || 'UNKNOWN';
        err.status = response.status;
        err.details = (body.error && body.error.details) || null;
        err.requestId = (body.meta && body.meta.requestId) || null;
        throw err;
      }
      return body;
    },
    async (error) => {
      const original = error.config || {};
      const status = error.response && error.response.status;

      if (status === 401 && !original.__isRetry) {
        original.__isRetry = true;
        const fresh = await getIdToken(true);
        if (fresh) {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${fresh}`;
          return instance.request(original);
        }
      }

      const body = error.response && error.response.data;
      const wrapped = new Error(
          (body && body.error && body.error.message) || error.message || 'Network error.',
      );
      wrapped.code = (body && body.error && body.error.code) || 'NETWORK_ERROR';
      wrapped.status = status || 0;
      wrapped.details = (body && body.error && body.error.details) || null;
      wrapped.requestId = (body && body.meta && body.meta.requestId) || null;
      throw wrapped;
    },
);

export default instance;
