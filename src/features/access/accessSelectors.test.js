import {organizationHasFeature, selectAccessOrganization} from './accessSelectors';

const contract = {
  defaultOrgId: 'orgA',
  organizations: [
    {orgId: 'orgA', entitlementVersionId: 'entA', features: {'dashboard.history': true}},
    {orgId: 'orgB', entitlementVersionId: null, features: {'dashboard.history': true}},
  ],
};

describe('accessSelectors', () => {
  it('selects a requested organization or the contract default', () => {
    expect(selectAccessOrganization(contract, 'orgB').orgId).toBe('orgB');
    expect(selectAccessOrganization(contract, null).orgId).toBe('orgA');
  });

  it('requires both an active entitlement version and a feature grant', () => {
    expect(organizationHasFeature(contract.organizations[0], 'dashboard.history')).toBe(true);
    expect(organizationHasFeature(contract.organizations[1], 'dashboard.history')).toBe(false);
    expect(organizationHasFeature(contract.organizations[0], 'dashboard.weeklyReports')).toBe(false);
  });
});
