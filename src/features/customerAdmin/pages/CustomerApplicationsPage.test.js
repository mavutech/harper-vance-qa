import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import CustomerApplicationsPage from './CustomerApplicationsPage';
import {useCustomerAccessRequests} from '../hooks/useCustomerAccessRequests';

jest.mock('../../../layouts/Header', () => () => <div data-testid="header" />);
jest.mock('../../../layouts/Footer', () => () => <div data-testid="footer" />);
jest.mock('../hooks/useCustomerAccessRequests', () => ({
  useCustomerAccessRequests: jest.fn(),
}));

const loadRequests = jest.fn();
const loadMoreRequests = jest.fn();
const decideRequest = jest.fn();
const REQUEST = {
  requestId: 'car_1234abcd',
  status: 'submitted',
  applicantName: 'Morgan Lee',
  jobTitle: 'Trading Operations Lead',
  workEmail: 'morgan@example.com',
  companyName: 'Northstar Trading',
  companyWebsiteDomain: 'northstar.example',
  country: 'United States',
  requestedLicenseCode: 'desk_intelligence',
  requestedPlanName: 'Desk Intelligence',
  requestedBillingInterval: 'annual',
  expectedUsers: 5,
  intendedBusinessUse: 'Internal review by the company trading desk.',
  requestedIntegrations: ['email', 'slack'],
  verifiedAt: '2026-10-16T14:00:00.000Z',
  createdAt: '2026-10-16T13:00:00.000Z',
};

const hookResult = (overrides = {}) => ({
  requests: [REQUEST],
  statusFilter: '',
  nextCursor: null,
  loading: false,
  loadingMore: false,
  error: null,
  operationLoading: false,
  operationError: null,
  operationSucceeded: false,
  loadRequests,
  loadMoreRequests,
  decideRequest,
  ...overrides,
});

const renderPage = () => render(
    <MemoryRouter initialEntries={['/admin/applications']}>
      <CustomerApplicationsPage />
    </MemoryRouter>,
);

describe('CustomerApplicationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    decideRequest.mockResolvedValue({requestId: REQUEST.requestId, status: 'approved'});
    useCustomerAccessRequests.mockReturnValue(hookResult());
  });

  it('shows verified business applications in the admin dashboard', () => {
    renderPage();

    expect(screen.getByRole('heading', {name: 'Client Applications'})).toBeInTheDocument();
    expect(screen.getByText('Northstar Trading')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'morgan@example.com'})).toHaveAttribute(
        'href',
        'mailto:morgan@example.com',
    );
    expect(screen.getByText(/Internal review by the company trading desk/)).toBeInTheDocument();
    expect(screen.getByLabelText('Decision')).toBeInTheDocument();
  });

  it('filters requests and exposes refresh and pagination controls', () => {
    useCustomerAccessRequests.mockReturnValue(hookResult({nextCursor: REQUEST.requestId}));
    renderPage();

    fireEvent.change(screen.getByLabelText('Application status'), {
      target: {value: 'submitted'},
    });
    fireEvent.click(screen.getByRole('button', {name: 'Refresh applications'}));
    fireEvent.click(screen.getByRole('button', {name: 'Load more applications'}));

    expect(loadRequests).toHaveBeenCalledWith('submitted');
    expect(loadMoreRequests).toHaveBeenCalled();
  });

  it('records the approved plan, billing term, and required review note', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText('Decision'), {target: {value: 'approve'}});
    fireEvent.change(screen.getByLabelText('Review note (required)'), {
      target: {value: 'Qualified business request.'},
    });
    fireEvent.click(screen.getByRole('button', {name: 'Record decision'}));

    await waitFor(() => expect(decideRequest).toHaveBeenCalledWith(REQUEST.requestId, {
      decision: 'approve',
      reason: 'Qualified business request.',
      approvedLicenseCode: 'desk_intelligence',
      approvedBillingInterval: 'annual',
    }));
  });

  it('does not show review controls before work-email verification', () => {
    useCustomerAccessRequests.mockReturnValue(hookResult({
      requests: [{...REQUEST, status: 'email_verification_pending', verifiedAt: null}],
    }));
    renderPage();

    expect(screen.getByText('Work email must be verified before review.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Decision')).not.toBeInTheDocument();
  });

  it('shows onboarding state and prevents re-review of a finalized application', () => {
    useCustomerAccessRequests.mockReturnValue(hookResult({
      requests: [{...REQUEST, status: 'approved', onboardingStatus: 'invitation_sent', onboardingOrgId: 'org_alpha'}],
    }));
    renderPage();

    expect(screen.getByText('Invitation Sent')).toBeInTheDocument();
    expect(screen.getByText('org_alpha')).toBeInTheDocument();
    expect(screen.getByText('This application is not currently open for review.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Decision')).not.toBeInTheDocument();
  });
});
