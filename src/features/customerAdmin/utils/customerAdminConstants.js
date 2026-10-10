/**
 * @fileoverview Stable customer administration display and query constants.
 */

export const CUSTOMER_PAGE_SIZE = 25;

export const LICENSE_OPTIONS = Object.freeze([
  'entity_core',
  'desk_intelligence',
  'firm_wide_enterprise',
]);

export const SUBSCRIPTION_STATUS_OPTIONS = Object.freeze([
  'pending',
  'active',
  'suspended',
  'canceled',
]);

export const BILLING_MODE_OPTIONS = Object.freeze([
  'commercial',
  'internal',
  'complimentary',
]);

export const ENTITLEMENT_REASON_OPTIONS = Object.freeze([
  'provisioned',
  'renewed',
  'upgraded',
  'downgraded',
  'corrected',
  'terminated',
]);

export const LICENSE_LABELS = Object.freeze({
  entity_core: 'Entity Core',
  desk_intelligence: 'Desk Intelligence',
  firm_wide_enterprise: 'Firm-Wide Enterprise',
  custom: 'Custom',
});

export const STATUS_LABELS = Object.freeze({
  onboarding: 'Onboarding',
  active: 'Active',
  suspended: 'Suspended',
  closed: 'Closed',
  draft: 'Draft',
  pending: 'Pending',
  expired: 'Expired',
  canceled: 'Canceled',
});

export const STATUS_VARIANTS = Object.freeze({
  onboarding: 'warning',
  active: 'success',
  suspended: 'danger',
  closed: 'secondary',
  draft: 'secondary',
  pending: 'warning',
  expired: 'secondary',
  canceled: 'secondary',
});

/**
 * Formats an internal identifier as a human-readable fallback label.
 *
 * @param {string|null|undefined} value - Internal value
 * @return {string} Readable label
 */
export const humanizeIdentifier = (value) => {
  if (!value) return '';
  return String(value)
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
};

/**
 * Returns the approved display label for a license code.
 *
 * @param {string|null|undefined} value - License code
 * @return {string} License label
 */
export const licenseLabel = (value) => LICENSE_LABELS[value] || humanizeIdentifier(value);

/**
 * Returns the approved display label for a lifecycle status.
 *
 * @param {string|null|undefined} value - Lifecycle status
 * @return {string} Status label
 */
export const statusLabel = (value) => STATUS_LABELS[value] || humanizeIdentifier(value);

/**
 * Converts an organization name into a valid URL-safe organization slug.
 *
 * @param {string} value - Organization name
 * @return {string} Lowercase organization slug
 */
export const slugifyOrganizationName = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
