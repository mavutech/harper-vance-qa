import {act, renderHook, waitFor} from '@testing-library/react';
import {trackEvent} from '../../../utils/analytics';
import {
  createOrganization,
  createOrganizationCheckout,
  getOrganizationBilling,
  getOrganizationDetail,
  getOrganizationSubscription,
  listOrganizations,
  updateOrganizationSubscription,
} from '../services/customerOrganizationsService';
import {useCustomerOrganizations} from './useCustomerOrganizations';

jest.mock('../../../utils/analytics', () => ({trackEvent: jest.fn()}));
jest.mock('../services/customerOrganizationsService', () => ({
  createOrganization: jest.fn(),
  createOrganizationCheckout: jest.fn(),
  getOrganizationBilling: jest.fn(),
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
      seatUsage: {used: 0, limit: 25},
    });
    getOrganizationSubscription.mockResolvedValue({
      orgId: 'org-alpha',
      subscription: null,
      entitlement: null,
    });
    getOrganizationBilling.mockResolvedValue({status: 'not_configured'});
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
      subscription: {licenseCode: 'entity_core', status: 'active', seatLimit: 25},
      entitlement: {features: {dashboard: true}},
    });
    const {result} = renderHook(() => useCustomerOrganizations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const input = {
      licenseCode: 'entity_core',
      status: 'active',
      reason: 'provisioned',
      billingMode: 'commercial',
      seatLimit: 25,
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

  it('creates a checkout session and refreshes billing status', async () => {
    createOrganizationCheckout.mockResolvedValue({
      checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test',
    });
    getOrganizationBilling.mockResolvedValue({status: 'checkout_pending'});
    const {result} = renderHook(() => useCustomerOrganizations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let checkout;
    await act(async () => {
      checkout = await result.current.startCheckout('org-alpha', {
        licenseCode: 'entity_core',
        seatQuantity: 25,
        customerEmail: 'billing@example.com',
      });
    });

    expect(checkout.checkoutUrl).toContain('checkout.stripe.com');
    expect(result.current.customerRecord.billing.status).toBe('checkout_pending');
    expect(trackEvent).toHaveBeenCalledWith('admin_billing_checkout_created', {
      license_code: 'entity_core',
      seat_quantity: 25,
    });
  });
});
