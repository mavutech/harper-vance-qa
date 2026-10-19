import client from '../../../api/client';
import {
  createOrganization,
  createOrganizationCheckout,
  closeOrganization,
  getOrganizationDetail,
  getOrganizationOnboarding,
  getOrganizationBilling,
  getOrganizationAgreement,
  getOrganizationSubscription,
  getOrganizationAudit,
  inviteOrganizationMember,
  listOrganizations,
  listAccessRequests,
  listReportRequests,
  reviewAccessRequest,
  reviewReportRequest,
  removeOrganizationMember,
  revokeOrganizationInvitation,
  stageOrganizationContractBilling,
  updateOrganizationMemberRole,
  updateOrganizationAgreement,
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

  it('lists access requests through the authenticated shared client', () => {
    listAccessRequests({status: 'submitted', limit: 25});
    expect(client.get).toHaveBeenCalledWith('/api/organizations/access-requests', {
      params: {status: 'submitted', limit: 25},
    });
  });

  it('records an access-request decision through the protected review endpoint', () => {
    const input = {decision: 'approve', reason: 'Qualified business request.'};
    reviewAccessRequest('car_1234abcd', input);
    expect(client.patch).toHaveBeenCalledWith(
        '/api/organizations/access-requests/car_1234abcd/review',
        input,
    );
  });

  it('lists and reviews report requests through owner-only endpoints', () => {
    const input = {decision: 'decline', reason: 'Unable to verify professional use.'};
    listReportRequests({status: 'under_review', limit: 25});
    reviewReportRequest('rrq_1234abcd', input);
    expect(client.get).toHaveBeenCalledWith('/api/organizations/report-requests', {
      params: {status: 'under_review', limit: 25},
    });
    expect(client.patch).toHaveBeenCalledWith(
        '/api/organizations/report-requests/rrq_1234abcd/review',
        input,
    );
  });

  it('encodes organization identifiers in detail requests', () => {
    getOrganizationDetail('org/alpha');
    expect(client.get).toHaveBeenCalledWith('/api/organizations/org%2Falpha/detail');
  });

  it('loads role-appropriate onboarding progress', () => {
    getOrganizationOnboarding('org/alpha');
    expect(client.get).toHaveBeenCalledWith('/api/organizations/org%2Falpha/onboarding');
  });

  it('loads and updates customer agreement status through governed endpoints', () => {
    const input = {
      status: 'executed',
      documentVersion: 'MSA-2026-01',
      externalReference: 'docusign-123',
      effectiveAt: '2026-10-10',
    };
    getOrganizationAgreement('org-alpha');
    updateOrganizationAgreement('org-alpha', input);
    expect(client.get).toHaveBeenCalledWith('/api/agreements/org-alpha');
    expect(client.put).toHaveBeenCalledWith('/api/agreements/org-alpha', input);
  });

  it('loads the canonical subscription instead of the legacy plan field', () => {
    getOrganizationSubscription('org-alpha');
    expect(client.get).toHaveBeenCalledWith('/api/subscriptions/org-alpha');
  });

  it('loads billing and creates checkout through governed endpoints', () => {
    getOrganizationBilling('org-alpha');
    createOrganizationCheckout('org-alpha', {
      licenseCode: 'entity_core',
      billingInterval: 'monthly',
      seatQuantity: 25,
      customerEmail: 'billing@example.com',
    });

    expect(client.get).toHaveBeenCalledWith('/api/billing/org-alpha');
    expect(client.post).toHaveBeenCalledWith('/api/billing/org-alpha/checkout-session', {
      licenseCode: 'entity_core',
      billingInterval: 'monthly',
      seatQuantity: 25,
      customerEmail: 'billing@example.com',
    });
  });

  it('stages contract billing without accepting a browser price', () => {
    stageOrganizationContractBilling('org-alpha', {customerEmail: 'billing@example.com'});
    expect(client.post).toHaveBeenCalledWith('/api/billing/org-alpha/contract-account', {
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
