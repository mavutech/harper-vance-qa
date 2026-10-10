import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import CustomerOrganizationsPage from './CustomerOrganizationsPage';
import {useCustomerOrganizations} from '../hooks/useCustomerOrganizations';

jest.mock('../../../layouts/Header', () => () => <div data-testid="header" />);
jest.mock('../../../layouts/Footer', () => () => <div data-testid="footer" />);
jest.mock('../components/CustomerOperationsPanel', () => () => <div data-testid="customer-operations" />);
jest.mock('../components/OrganizationGovernanceActions', () => () => <div data-testid="governance-actions" />);
jest.mock('../hooks/useCustomerOrganizations', () => ({
  useCustomerOrganizations: jest.fn(),
}));

const mockSelectOrganization = jest.fn();
const mockApplySearch = jest.fn();
const mockCreateCustomer = jest.fn();
const mockSaveSubscription = jest.fn();
const mockClearOperationState = jest.fn();
const mockInviteMember = jest.fn();
const mockRevokeInvitation = jest.fn();
const mockChangeMemberRole = jest.fn();
const mockRemoveMember = jest.fn();
const mockExportAudit = jest.fn();
const mockCloseCustomer = jest.fn();

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
    members: [{
      uid: 'user-1',
      email: 'analyst@example.com',
      displayName: 'Desk Analyst',
      orgRole: 'member',
      accessStatus: 'active',
    }],
    pendingInvitations: [],
    seatUsage: {used: 1, limit: 5},
    subscription: {
      licenseCode: 'desk_intelligence',
      status: 'active',
      billingMode: 'commercial',
      seatLimit: 5,
    },
    entitlement: {features: {dashboard: true, webhooks: false}},
    agreement: {
      status: 'executed',
      documentVersion: 'MSA-2026-01',
      externalReference: 'docusign-envelope-123',
      effectiveAt: '2026-10-10',
    },
    onboarding: {
      status: 'ready',
      progress: {completed: 6, total: 6, percent: 100},
      steps: [
        {code: 'organization_record', complete: true},
        {code: 'license_assigned', complete: true},
        {code: 'agreement_ready', complete: true},
        {code: 'payment_confirmed', complete: true},
        {code: 'customer_admin_ready', complete: true},
        {code: 'product_access_active', complete: true},
      ],
      nextAction: 'complete',
    },
  },
  loading: false,
  detailLoading: false,
  error: null,
  detailError: null,
  operationLoading: false,
  operationError: null,
  operationSucceeded: false,
  loadOrganizations: jest.fn(),
  selectOrganization: mockSelectOrganization,
  applySearch: mockApplySearch,
  createCustomer: mockCreateCustomer,
  saveSubscription: mockSaveSubscription,
  saveAgreement: jest.fn(),
  clearOperationState: mockClearOperationState,
  inviteMember: mockInviteMember,
  revokeInvitation: mockRevokeInvitation,
  changeMemberRole: mockChangeMemberRole,
  removeMember: mockRemoveMember,
  exportAudit: mockExportAudit,
  closeCustomer: mockCloseCustomer,
  ...overrides,
});

describe('CustomerOrganizationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateCustomer.mockResolvedValue({orgId: 'org-new'});
    mockSaveSubscription.mockResolvedValue({orgId: 'org-alpha'});
    useCustomerOrganizations.mockReturnValue(buildHookResult());
  });

  it('shows the authoritative license, seats, and enabled capabilities', () => {
    render(<MemoryRouter><CustomerOrganizationsPage /></MemoryRouter>);

    expect(screen.getAllByText('Alpha Trading').length).toBeGreaterThan(0);
    expect(screen.getByText('Desk Intelligence')).toBeInTheDocument();
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Webhooks')).not.toBeInTheDocument();
    expect(screen.getByText('6 of 6 steps complete')).toBeInTheDocument();
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

  it('creates a staged onboarding organization', async () => {
    render(<MemoryRouter><CustomerOrganizationsPage /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', {name: /add customer/i}));
    fireEvent.change(screen.getByLabelText('Organization name'), {
      target: {value: 'Beta Capital'},
    });
    expect(screen.getByLabelText('Organization slug')).toHaveValue('beta-capital');
    fireEvent.click(screen.getByRole('button', {name: 'Create organization'}));

    expect(mockCreateCustomer).toHaveBeenCalledWith({
      name: 'Beta Capital',
      slug: 'beta-capital',
      emailDomains: [],
      plan: 'pilot',
    });
    await waitFor(() => expect(screen.queryByText('Add customer organization')).not.toBeInTheDocument());
  });

  it('submits an authoritative subscription decision', async () => {
    render(<MemoryRouter><CustomerOrganizationsPage /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', {name: 'Manage license'}));
    fireEvent.change(screen.getByLabelText('Seat limit'), {target: {value: '12'}});
    fireEvent.click(screen.getByRole('button', {name: 'Save license'}));

    expect(mockSaveSubscription).toHaveBeenCalledWith('org-alpha', expect.objectContaining({
      licenseCode: 'desk_intelligence',
      status: 'active',
      seatLimit: 12,
      billingMode: 'commercial',
      reason: 'corrected',
    }));
    await waitFor(() => expect(screen.queryByText('Manage customer license')).not.toBeInTheDocument());
  });
});
