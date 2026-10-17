import { SUPPORT_CONFIG } from '../../config/supportConfig';

/**
 * Resolve the public application page served by the configured backend.
 * The function URL fallback keeps local/test builds useful while still
 * targeting the Firebase project selected for the frontend build.
 *
 * @returns {string} Public customer access request URL.
 */
export function getAccessRequestUrl() {
  const configuredApiUrl = process.env.REACT_APP_API_BASE_URL;
  const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
  const functionUrl = configuredApiUrl || (projectId
    ? `https://us-central1-${projectId}.cloudfunctions.net/sonaDashboard`
    : '');

  return functionUrl
    ? `${functionUrl.replace(/\/$/, '')}/pages/request-access`
    : '';
}

export const LANDING_PAGE_CONFIG = Object.freeze({
  contactEmail: SUPPORT_CONFIG.email,
});
