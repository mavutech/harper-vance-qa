import client from '../../../api/client';
import {
  createOrganization,
  getOrganizationDetail,
  getOrganizationSubscription,
  listOrganizations,
  updateOrganizationSubscription,
} from './customerOrganizationsService';

jest.mock('../../../api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
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

  it('loads the canonical subscription instead of the legacy plan field', () => {
    getOrganizationSubscription('org-alpha');
    expect(client.get).toHaveBeenCalledWith('/api/subscriptions/org-alpha');
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
});
