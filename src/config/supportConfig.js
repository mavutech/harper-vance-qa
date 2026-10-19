const HARPER_VANCE_EMAIL_DOMAIN = 'harpervanceqa.com';

/** Customer-facing role addresses used across public and authenticated pages. */
export const CONTACT_CONFIG = Object.freeze({
  supportEmail: process.env.REACT_APP_SUPPORT_EMAIL || `support@${HARPER_VANCE_EMAIL_DOMAIN}`,
  legalEmail: process.env.REACT_APP_LEGAL_EMAIL || `legal@${HARPER_VANCE_EMAIL_DOMAIN}`,
  privacyEmail: process.env.REACT_APP_PRIVACY_EMAIL || `privacy@${HARPER_VANCE_EMAIL_DOMAIN}`,
  reportsEmail: process.env.REACT_APP_REPORTS_EMAIL || `reports@${HARPER_VANCE_EMAIL_DOMAIN}`,
});

/** Backwards-compatible support destination for existing components. */
export const SUPPORT_CONFIG = Object.freeze({
  email: CONTACT_CONFIG.supportEmail,
});
