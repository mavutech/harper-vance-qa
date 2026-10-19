import { SUPPORT_CONFIG } from '../../config/supportConfig';

const PUBLIC_ACCESS_PATH = '/pages/client-access';
const REQUEST_ACCESS_PATH = '/pages/request-access';

/**
 * Resolves the branded public entry or plan-specific application page.
 * Hosting rewrites keep these pages on the public Harper Vance hostname while
 * the existing backend remains authoritative for the intake workflow.
 *
 * @param {string} [licenseCode] - Optional license identifier to preselect.
 * @returns {string} Public customer access request URL.
 */
export function getAccessRequestUrl(licenseCode) {
  const publicEntryUrl = process.env.REACT_APP_PUBLIC_ACCESS_URL || PUBLIC_ACCESS_PATH;
  if (!licenseCode) return publicEntryUrl;

  const requestAccessUrl = process.env.REACT_APP_REQUEST_ACCESS_URL || REQUEST_ACCESS_PATH;
  const separator = requestAccessUrl.includes('?') ? '&' : '?';
  return `${requestAccessUrl}${separator}plan=${encodeURIComponent(licenseCode)}`;
}

export const LANDING_PAGE_CONFIG = Object.freeze({
  contactEmail: SUPPORT_CONFIG.email,
  sampleAnchor: '#sample',
  evidenceAnchor: '#evidence',
  requestTimeoutMs: 10000,
  minimumTextLength: 2,
  fieldLimits: Object.freeze({ name: 80, email: 254, company: 120, role: 100 }),
});
