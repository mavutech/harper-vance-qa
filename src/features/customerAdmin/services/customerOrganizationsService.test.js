import client from '../../../api/client';
import {
  getOrganizationDetail,
  getOrganizationSubscription,
  listOrganizations,
} from './customerOrganizationsService';

jest.mock('../../../api/client', () => ({
  get: jest.fn(),
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
});
