/**
 * Selects the server-designated default organization from an access contract.
 *
 * @param {Object|null} access - Access contract
 * @returns {Object|null} Default organization or null
 */
export const selectDefaultAccessOrganization = (access) => {
  const organizations = Array.isArray(access?.organizations) ? access.organizations : [];
  return organizations.find((organization) => organization.orgId === access?.defaultOrgId)
    || organizations[0]
    || null;
};

/**
 * Returns whether the selected organization grants a product feature.
 *
 * @param {Object|null} organization - Selected organization access
 * @param {string} featureKey - Canonical feature key
 * @returns {boolean} True only for an active entitlement grant
 */
export const organizationHasFeature = (organization, featureKey) => (
  Boolean(organization?.entitlementVersionId && organization?.features?.[featureKey] === true)
);
