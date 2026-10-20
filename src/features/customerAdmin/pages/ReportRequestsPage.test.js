import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import ReportRequestsPage from './ReportRequestsPage';
import {useReportRequests} from '../hooks/useReportRequests';

jest.mock('../../../layouts/Header', () => () => <div data-testid="header" />);
jest.mock('../../../layouts/Footer', () => () => <div data-testid="footer" />);
jest.mock('../hooks/useReportRequests', () => ({useReportRequests: jest.fn()}));

const loadRequests = jest.fn();
const loadMoreRequests = jest.fn();
const decideRequest = jest.fn();
const REQUEST = {
  requestId: 'rrq_1234abcd',
  status: 'under_review',
  fullName: 'Morgan Lee',
  jobTitle: 'Trading Operations Lead',
  workEmail: 'morgan@example.com',
  companyName: 'Northstar Trading',
  companyDomain: 'example.com',
  organizationType: 'proprietary_trading_firm',
  priorReportRequestCount: 2,
  priorIpRequestCount: 3,
  verifiedAt: '2026-10-18T14:00:00.000Z',
  createdAt: '2026-10-18T13:00:00.000Z',
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

describe('ReportRequestsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    decideRequest.mockResolvedValue({status: 'approved'});
    useReportRequests.mockReturnValue(hookResult());
  });

  it('shows server acceptance as unconfirmed inbox delivery with a tracking reference', () => {
    useReportRequests.mockReturnValue(hookResult({requests: [{...REQUEST,
      verificationAttemptCount: 1,
      verificationReceipt: {state: 'accepted', messageId: 'safe-reference',
        responseCode: 250, attemptedAt: '2026-10-20T04:40:00Z'},
    }]}));
    render(<MemoryRouter><ReportRequestsPage /></MemoryRouter>);
    expect(screen.getByText('Accepted by mail server. Inbox delivery is unconfirmed.')).toBeInTheDocument();
    expect(screen.getByText('safe-reference')).toBeInTheDocument();
  });

  it('shows lead context and repeat-request signals', () => {
    render(<MemoryRouter><ReportRequestsPage /></MemoryRouter>);
    expect(screen.getByRole('heading', {name: 'Leads · Report Requests'})).toBeInTheDocument();
    expect(screen.getByText('Northstar Trading')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Access applications'})).toHaveAttribute(
        'href',
        '/admin/applications',
    );
  });

  it('records an approve-and-send owner decision', async () => {
    render(<MemoryRouter><ReportRequestsPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Decision'), {
      target: {value: 'approve_and_send'},
    });
    fireEvent.change(screen.getByLabelText('Review note (required)'), {
      target: {value: 'Verified professional organization.'},
    });
    fireEvent.click(screen.getByRole('button', {name: 'Record decision'}));
    await waitFor(() => expect(decideRequest).toHaveBeenCalledWith(REQUEST.requestId, {
      decision: 'approve_and_send',
      reason: 'Verified professional organization.',
    }));
  });
});
