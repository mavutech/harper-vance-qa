import client from '../../../api/client';
import {
  createApiClient,
  createDeliveryDestination,
  disableDeliveryDestination,
  listApiClients,
  listDeliveryDestinations,
  listSupportCases,
  revokeApiClient,
} from './customerOperationsService';

jest.mock('../../../api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
}));

describe('customerOperationsService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses governed organization-scoped read endpoints', () => {
    listDeliveryDestinations('org-alpha');
    listApiClients('org-alpha');
    listSupportCases('org-alpha');

    expect(client.get).toHaveBeenCalledWith('/api/customer-operations/org-alpha/destinations');
    expect(client.get).toHaveBeenCalledWith('/api/customer-operations/org-alpha/api-clients');
    expect(client.get).toHaveBeenCalledWith('/api/customer-operations/org-alpha/support-cases');
  });

  it('creates and disables delivery destinations', () => {
    const input = {type: 'email', label: 'Daily report', address: 'ops@example.com'};
    createDeliveryDestination('org-alpha', input);
    disableDeliveryDestination('org-alpha', 'dest-1');

    expect(client.post).toHaveBeenCalledWith('/api/customer-operations/org-alpha/destinations', input);
    expect(client.delete).toHaveBeenCalledWith('/api/customer-operations/org-alpha/destinations/dest-1');
  });

  it('creates and revokes API clients', () => {
    const input = {label: 'Internal research', expiresAt: null};
    createApiClient('org-alpha', input);
    revokeApiClient('org-alpha', 'api-1');

    expect(client.post).toHaveBeenCalledWith('/api/customer-operations/org-alpha/api-clients', input);
    expect(client.delete).toHaveBeenCalledWith('/api/customer-operations/org-alpha/api-clients/api-1');
  });
});
