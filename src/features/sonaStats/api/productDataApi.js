/**
 * @fileoverview Authenticated product-data API client.
 */

import client from '../../../api/client';
import {SELECTED_ORG_STORAGE_KEY} from '../../access/accessConstants';

/**
 * Adds the selected organization when the user belongs to more than one.
 *
 * @returns {Object} Axios request configuration
 */
const requestConfig = () => {
  const orgId = window.localStorage.getItem(SELECTED_ORG_STORAGE_KEY);
  return orgId ? {headers: {'X-Organization-Id': orgId}} : {};
};

/** @param {string[]} dates @returns {Promise<Array<Object>>} */
export const fetchDailyReports = (dates) => client.get('/api/product/daily', {
  ...requestConfig(),
  params: {dates: dates.join(',')},
});

/** @param {number} year @param {number} week @returns {Promise<Object|null>} */
export const fetchWeeklyReport = (year, week) => client.get('/api/product/weekly', {
  ...requestConfig(),
  params: {year, week},
});

/** @param {string[]} dates @returns {Promise<Array<Object>>} */
export const fetchSessionHistory = (dates) => client.get('/api/product/history', {
  ...requestConfig(),
  params: {dates: dates.join(',')},
});
