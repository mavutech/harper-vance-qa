/**
 * Selects an organization from an access contract.
 *
 * @param {Object|null} access Access contract
 * @param {string|null} selectedOrgId Preferred organization
 * @returns {Object|null} Selected organization or null
 */
export const selectAccessOrganization = (access, selectedOrgId) => {
  const organizations = Array.isArray(access?.organizations) ? access.organizations : [];
  const requested = selectedOrgId || access?.defaultOrgId;
  return organizations.find((organization) => organization.orgId === requested) || organizations[0] || null;
};

/**
 * Returns whether the selected organization grants a feature.
 *
 * @param {Object|null} organization Selected organization access
 * @param {string} featureKey Canonical feature key
 * @returns {boolean} True only for an active entitlement grant
 */
export const organizationHasFeature = (organization, featureKey) =>
  Boolean(organization?.entitlementVersionId && organization?.features?.[featureKey] === true);
