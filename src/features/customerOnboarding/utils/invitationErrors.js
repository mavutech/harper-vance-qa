/**
 * @fileoverview Safe customer-facing invitation error mapping.
 */

import copy from '../locales/en.json';

const ERROR_MESSAGES = Object.freeze({
  INVITATION_INVALID: copy.invalid,
  INVITATION_EXPIRED: copy.expired,
  INVITATION_EMAIL_MISMATCH: copy.emailMismatch,
  SEAT_LIMIT_REACHED: copy.seatLimit,
  ACCOUNT_EXISTS: copy.accountExists,
  ORG_NOT_ACTIVE: copy.organizationInactive,
  SSO_REQUIRED: copy.ssoRequired,
});

/**
 * Maps an API error to approved, non-sensitive customer copy.
 *
 * @param {Error|null|undefined} error - Normalized API error
 * @return {string} Safe message
 */
export const invitationErrorMessage = (error) =>
  ERROR_MESSAGES[error && error.code] || copy.genericError;
