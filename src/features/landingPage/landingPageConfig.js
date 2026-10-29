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
  productAnchor: '#product',
  evidenceAnchor: '#evidence',
  walkthroughAnchor: '#walkthrough',
  walkthrough: Object.freeze({
    sectionId: 'walkthrough',
    videoUrl: '/media/harper-vance-walkthrough-v6.mp4',
    posterUrl: '/media/harper-vance-walkthrough-v6-poster.jpg',
    captionsUrl: '/media/harper-vance-walkthrough-v6.en.vtt',
    width: 1440,
    height: 1182,
    chapters: Object.freeze([
      { id: 'targets', seconds: 21, time: '0:21' },
      { id: 'daily', seconds: 120, time: '2:00' },
      { id: 'weekly', seconds: 206, time: '3:26' },
      { id: 'history', seconds: 289, time: '4:49' },
    ]),
  }),
  buyerOverviewUrl: '/reports/buyer-overview.pdf',
  requestTimeoutMs: 10000,
  minimumTextLength: 2,
  fieldLimits: Object.freeze({ name: 80, email: 254, company: 120, role: 100 }),
});
