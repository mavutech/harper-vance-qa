/**
 * @fileoverview Customer access-contract API.
 */

import client from '../../../api/client';

/**
 * Returns the current user's organizations, license, features, and limits.
 *
 * @returns {Promise<Object>} Safe access contract
 */
export const fetchMyAccess = () => client.get('/api/access/me');
