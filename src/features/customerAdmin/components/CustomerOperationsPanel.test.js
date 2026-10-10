import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import CustomerOperationsPanel from './CustomerOperationsPanel';
import {useCustomerOperations} from '../hooks/useCustomerOperations';

jest.mock('../hooks/useCustomerOperations', () => ({useCustomerOperations: jest.fn()}));

const mockAddDestination = jest.fn();
const mockDisableDestination = jest.fn();
const mockAddApiClient = jest.fn();
const mockRemoveApiClient = jest.fn();

const ACTIVE_FEATURES = {
  'dashboard.liveTargets': true,
  'delivery.email': true,
  'api.rest': true,
};

/**
 * Builds the operations hook result for panel tests.
 *
 * @param {Object} [overrides] - Per-test overrides
 * @return {Object} Operations state
 */
const hookResult = (overrides = {}) => ({
  destinations: [{id: 'dest-1', label: 'Daily reports', type: 'email', status: 'active'}],
  apiClients: [{id: 'api-1', label: 'Research', credentialPrefix: 'hv_live_abc', status: 'active'}],
  supportCases: [],
  loading: false,
  submitting: false,
  error: null,
  apiSecret: '',
  capabilities: {delivery: true, api: true, support: true},
  addDestination: mockAddDestination,
  disableDestination: mockDisableDestination,
  addApiClient: mockAddApiClient,
  removeApiClient: mockRemoveApiClient,
  ...overrides,
});

describe('CustomerOperationsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddDestination.mockResolvedValue(undefined);
    mockAddApiClient.mockResolvedValue(undefined);
    useCustomerOperations.mockReturnValue(hookResult());
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {writeText: jest.fn().mockResolvedValue(undefined)},
    });
  });

  it('requires an active subscription before configuration', () => {
    render(<CustomerOperationsPanel orgId="org-alpha" features={ACTIVE_FEATURES} active={false} />);
    expect(screen.getByText(/activate a customer license/i)).toBeInTheDocument();
  });

  it('creates an entitled email delivery destination', async () => {
    render(<CustomerOperationsPanel orgId="org-alpha" features={ACTIVE_FEATURES} active />);

    fireEvent.change(screen.getByLabelText('Label'), {target: {value: 'Desk email'}});
    fireEvent.change(screen.getByLabelText('Delivery email'), {target: {value: 'OPS@EXAMPLE.COM'}});
    fireEvent.click(screen.getByRole('button', {name: 'Add destination'}));

    await waitFor(() => {
      expect(mockAddDestination).toHaveBeenCalledWith({
        type: 'email',
        label: 'Desk email',
        address: 'ops@example.com',
      });
      expect(screen.getByLabelText('Delivery email')).toHaveValue('');
    });
  });

  it('creates an API client without persisting its secret in the component', async () => {
    render(<CustomerOperationsPanel orgId="org-alpha" features={ACTIVE_FEATURES} active />);

    fireEvent.change(screen.getByLabelText('API client label'), {target: {value: 'Risk system'}});
    fireEvent.click(screen.getByRole('button', {name: 'Create API client'}));

    await waitFor(() => {
      expect(mockAddApiClient).toHaveBeenCalledWith({
        label: 'Risk system',
        expiresAt: null,
      });
      expect(screen.getByLabelText('API client label')).toHaveValue('');
    });
  });
});
