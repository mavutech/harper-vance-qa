import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import CustomerOrganizationsPage from './CustomerOrganizationsPage';
import {useCustomerOrganizations} from '../hooks/useCustomerOrganizations';

jest.mock('../../../layouts/Header', () => () => <div data-testid="header" />);
jest.mock('../../../layouts/Footer', () => () => <div data-testid="footer" />);
jest.mock('../hooks/useCustomerOrganizations', () => ({
  useCustomerOrganizations: jest.fn(),
}));

const mockSelectOrganization = jest.fn();
const mockApplySearch = jest.fn();

/**
 * Builds the default hook result for customer administration page tests.
 *
 * @param {Object} [overrides] - Per-test state overrides
 * @return {Object} Hook state
 */
const buildHookResult = (overrides = {}) => ({
  organizations: [{
    id: 'org-alpha',
    name: 'Alpha Trading',
    slug: 'alpha-trading',
    status: 'active',
    seatLimit: 5,
  }],
  selectedOrgId: 'org-alpha',
  customerRecord: {
    org: {id: 'org-alpha', name: 'Alpha Trading', slug: 'alpha-trading', status: 'active'},
    members: [{uid: 'user-1'}],
    pendingInvitations: [],
    seatUsage: {used: 1, limit: 5},
    subscription: {
      licenseCode: 'desk_intelligence',
      status: 'active',
      billingMode: 'commercial',
      seatLimit: 5,
    },
    entitlement: {features: {dashboard: true, webhooks: false}},
  },
  loading: false,
  detailLoading: false,
  error: null,
  detailError: null,
  loadOrganizations: jest.fn(),
  selectOrganization: mockSelectOrganization,
  applySearch: mockApplySearch,
  ...overrides,
});

describe('CustomerOrganizationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCustomerOrganizations.mockReturnValue(buildHookResult());
  });

  it('shows the authoritative license, seats, and enabled capabilities', () => {
    render(<MemoryRouter><CustomerOrganizationsPage /></MemoryRouter>);

    expect(screen.getAllByText('Alpha Trading').length).toBeGreaterThan(0);
    expect(screen.getByText('Desk Intelligence')).toBeInTheDocument();
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Webhooks')).not.toBeInTheDocument();
  });

  it('selects an organization for review', () => {
    render(<MemoryRouter><CustomerOrganizationsPage /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', {name: 'Review'}));
    expect(mockSelectOrganization).toHaveBeenCalledWith('org-alpha');
  });

  it('submits a normalized search through the customer hook', () => {
    render(<MemoryRouter><CustomerOrganizationsPage /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText('Search customers'), {
      target: {value: 'Alpha'},
    });
    fireEvent.click(screen.getByRole('button', {name: 'Search'}));
    expect(mockApplySearch).toHaveBeenCalledWith('Alpha');
  });
});
