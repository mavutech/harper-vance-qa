import {act, renderHook, waitFor} from '@testing-library/react';
import {
  createApiClient,
  createDeliveryDestination,
  listApiClients,
  listDeliveryDestinations,
  listSupportCases,
} from '../services/customerOperationsService';
import {useCustomerOperations} from './useCustomerOperations';

jest.mock('../../../utils/analytics', () => ({trackEvent: jest.fn()}));
jest.mock('../services/customerOperationsService', () => ({
  createApiClient: jest.fn(),
  createDeliveryDestination: jest.fn(),
  disableDeliveryDestination: jest.fn(),
  listApiClients: jest.fn(),
  listDeliveryDestinations: jest.fn(),
  listSupportCases: jest.fn(),
  revokeApiClient: jest.fn(),
}));

const FEATURES = {
  'dashboard.liveTargets': true,
  'delivery.email': true,
  'api.rest': true,
};

describe('useCustomerOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listDeliveryDestinations.mockResolvedValue([{id: 'dest-1', status: 'active'}]);
    listApiClients.mockResolvedValue([{id: 'api-1', status: 'active'}]);
    listSupportCases.mockResolvedValue([]);
  });

  it('loads only entitled operations for an active customer', async () => {
    const {result} = renderHook(() => useCustomerOperations('org-alpha', FEATURES, true));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.destinations).toHaveLength(1);
    expect(result.current.apiClients).toHaveLength(1);
    expect(listSupportCases).toHaveBeenCalledWith('org-alpha');
  });

  it('does not request operations for an inactive subscription', async () => {
    const {result} = renderHook(() => useCustomerOperations('org-alpha', FEATURES, false));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(listDeliveryDestinations).not.toHaveBeenCalled();
    expect(listApiClients).not.toHaveBeenCalled();
    expect(listSupportCases).not.toHaveBeenCalled();
  });

  it('preserves a new API secret only in hook memory', async () => {
    createApiClient.mockResolvedValue({id: 'api-2', secret: 'hv_live_once'});
    const {result} = renderHook(() => useCustomerOperations('org-alpha', FEATURES, true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addApiClient({label: 'Research', expiresAt: null});
    });

    expect(result.current.apiSecret).toBe('hv_live_once');
  });

  it('refreshes delivery destinations after creating one', async () => {
    createDeliveryDestination.mockResolvedValue({id: 'dest-2'});
    const {result} = renderHook(() => useCustomerOperations('org-alpha', FEATURES, true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addDestination({
        type: 'email',
        label: 'Daily reports',
        address: 'ops@example.com',
      });
    });

    expect(createDeliveryDestination).toHaveBeenCalledWith('org-alpha', {
      type: 'email',
      label: 'Daily reports',
      address: 'ops@example.com',
    });
    expect(listDeliveryDestinations).toHaveBeenCalledTimes(2);
  });
});
