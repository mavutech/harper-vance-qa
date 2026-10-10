import {act, renderHook, waitFor} from '@testing-library/react';
import {trackEvent} from '../../../utils/analytics';
import {
  createOrganization,
  getOrganizationDetail,
  getOrganizationSubscription,
  listOrganizations,
  updateOrganizationSubscription,
} from '../services/customerOrganizationsService';
import {useCustomerOrganizations} from './useCustomerOrganizations';

jest.mock('../../../utils/analytics', () => ({trackEvent: jest.fn()}));
jest.mock('../services/customerOrganizationsService', () => ({
  createOrganization: jest.fn(),
  getOrganizationDetail: jest.fn(),
  getOrganizationSubscription: jest.fn(),
  listOrganizations: jest.fn(),
  updateOrganizationSubscription: jest.fn(),
}));

const ORGANIZATION = {
  id: 'org-alpha',
  name: 'Alpha Trading',
  slug: 'alpha-trading',
  status: 'onboarding',
};

describe('useCustomerOrganizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listOrganizations.mockResolvedValue({items: [ORGANIZATION], nextCursor: null});
    getOrganizationDetail.mockResolvedValue({
      org: ORGANIZATION,
      members: [],
      pendingInvitations: [],
      seatUsage: {used: 0, limit: 5},
    });
    getOrganizationSubscription.mockResolvedValue({
      orgId: 'org-alpha',
      subscription: null,
      entitlement: null,
    });
  });

  it('loads the governed organization list when the console opens', async () => {
    const {result} = renderHook(() => useCustomerOrganizations());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.organizations).toEqual([ORGANIZATION]);
    expect(listOrganizations).toHaveBeenCalledWith({limit: 25});
    expect(trackEvent).toHaveBeenCalledWith('admin_organizations_viewed');
  });

  it('creates an onboarding organization and opens its customer record', async () => {
    createOrganization.mockResolvedValue({orgId: 'org-alpha', org: ORGANIZATION});
    const {result} = renderHook(() => useCustomerOrganizations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createCustomer({
        name: 'Alpha Trading',
        slug: 'alpha-trading',
        emailDomains: [],
        plan: 'pilot',
      });
    });

    expect(result.current.selectedOrgId).toBe('org-alpha');
    expect(result.current.customerRecord.org).toEqual(ORGANIZATION);
    expect(result.current.operationSucceeded).toBe(true);
    expect(trackEvent).toHaveBeenCalledWith('admin_organization_created');
  });

  it('updates the canonical subscription and refreshes access data', async () => {
    updateOrganizationSubscription.mockResolvedValue({orgId: 'org-alpha', status: 'active'});
    getOrganizationSubscription.mockResolvedValue({
      orgId: 'org-alpha',
      subscription: {licenseCode: 'entity_core', status: 'active', seatLimit: 5},
      entitlement: {features: {dashboard: true}},
    });
    const {result} = renderHook(() => useCustomerOrganizations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const input = {
      licenseCode: 'entity_core',
      status: 'active',
      reason: 'provisioned',
      billingMode: 'commercial',
      seatLimit: 5,
    };
    await act(async () => {
      await result.current.saveSubscription('org-alpha', input);
    });

    expect(updateOrganizationSubscription).toHaveBeenCalledWith('org-alpha', input);
    expect(result.current.customerRecord.subscription.status).toBe('active');
    expect(result.current.operationSucceeded).toBe(true);
    expect(trackEvent).toHaveBeenCalledWith('admin_subscription_updated', {
      license_code: 'entity_core',
      subscription_status: 'active',
    });
  });
});
