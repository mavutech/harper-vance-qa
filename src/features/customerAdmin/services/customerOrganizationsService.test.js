import client from '../../../api/client';
import {
  createOrganization,
  createOrganizationCheckout,
  closeOrganization,
  getOrganizationDetail,
  getOrganizationOnboarding,
  getOrganizationBilling,
  getOrganizationSubscription,
  getOrganizationAudit,
  inviteOrganizationMember,
  listOrganizations,
  removeOrganizationMember,
  revokeOrganizationInvitation,
  updateOrganizationMemberRole,
  updateOrganizationSubscription,
} from './customerOrganizationsService';

jest.mock('../../../api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

describe('customerOrganizationsService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists organizations through the authenticated shared client', () => {
    listOrganizations({limit: 25, search: 'alpha'});
    expect(client.get).toHaveBeenCalledWith('/api/organizations', {
      params: {limit: 25, search: 'alpha'},
    });
  });

  it('encodes organization identifiers in detail requests', () => {
    getOrganizationDetail('org/alpha');
    expect(client.get).toHaveBeenCalledWith('/api/organizations/org%2Falpha/detail');
  });

  it('loads role-appropriate onboarding progress', () => {
    getOrganizationOnboarding('org/alpha');
    expect(client.get).toHaveBeenCalledWith('/api/organizations/org%2Falpha/onboarding');
  });

  it('loads the canonical subscription instead of the legacy plan field', () => {
    getOrganizationSubscription('org-alpha');
    expect(client.get).toHaveBeenCalledWith('/api/subscriptions/org-alpha');
  });

  it('loads billing and creates checkout through governed endpoints', () => {
    getOrganizationBilling('org-alpha');
    createOrganizationCheckout('org-alpha', {
      licenseCode: 'entity_core',
      seatQuantity: 25,
      customerEmail: 'billing@example.com',
    });

    expect(client.get).toHaveBeenCalledWith('/api/billing/org-alpha');
    expect(client.post).toHaveBeenCalledWith('/api/billing/org-alpha/checkout-session', {
      licenseCode: 'entity_core',
      seatQuantity: 25,
      customerEmail: 'billing@example.com',
    });
  });

  it('creates organizations through the governed backend endpoint', () => {
    const input = {name: 'Alpha', slug: 'alpha', emailDomains: [], plan: 'pilot'};
    createOrganization(input);
    expect(client.post).toHaveBeenCalledWith('/api/organizations', input);
  });

  it('updates the canonical subscription endpoint', () => {
    const input = {licenseCode: 'entity_core', status: 'active', reason: 'provisioned'};
    updateOrganizationSubscription('org-alpha', input);
    expect(client.put).toHaveBeenCalledWith('/api/subscriptions/org-alpha', input);
  });

  it('manages members only through organization endpoints', () => {
    inviteOrganizationMember('org-alpha', {email: 'user@example.com', orgRole: 'member'});
    updateOrganizationMemberRole('org-alpha', 'user-1', 'admin');
    removeOrganizationMember('org-alpha', 'user-1');
    revokeOrganizationInvitation('org-alpha', 'invite-1');

    expect(client.post).toHaveBeenCalledWith('/api/organizations/org-alpha/invitations', {
      email: 'user@example.com',
      orgRole: 'member',
    });
    expect(client.patch).toHaveBeenCalledWith('/api/organizations/org-alpha/members/user-1', {
      orgRole: 'admin',
    });
    expect(client.delete).toHaveBeenCalledWith('/api/organizations/org-alpha/members/user-1');
    expect(client.delete).toHaveBeenCalledWith('/api/organizations/org-alpha/invitations/invite-1');
  });

  it('exports evidence and closes organizations through governed endpoints', () => {
    getOrganizationAudit('org-alpha');
    closeOrganization('org-alpha');

    expect(client.get).toHaveBeenCalledWith('/api/organizations/org-alpha/audit/export', {
      params: {format: 'json'},
    });
    expect(client.delete).toHaveBeenCalledWith('/api/organizations/org-alpha');
  });
});
