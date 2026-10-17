import {act, renderHook, waitFor} from '@testing-library/react';
import {trackEvent} from '../../../utils/analytics';
import {
  listAccessRequests,
  reviewAccessRequest,
} from '../services/customerOrganizationsService';
import {useCustomerAccessRequests} from './useCustomerAccessRequests';

jest.mock('../../../utils/analytics', () => ({trackEvent: jest.fn()}));
jest.mock('../services/customerOrganizationsService', () => ({
  listAccessRequests: jest.fn(),
  reviewAccessRequest: jest.fn(),
}));

const REQUEST = {
  requestId: 'car_1234abcd',
  status: 'submitted',
  applicantName: 'Test Applicant',
  companyName: 'Test Firm',
};

describe('useCustomerAccessRequests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listAccessRequests.mockResolvedValue({requests: [REQUEST], nextCursor: null});
  });

  it('loads requests on entry using the bounded default page size', async () => {
    const {result} = renderHook(() => useCustomerAccessRequests());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(listAccessRequests).toHaveBeenCalledWith({limit: 25});
    expect(result.current.requests).toEqual([REQUEST]);
    expect(trackEvent).toHaveBeenCalledWith('admin_access_requests_viewed', {
      status_filter: 'all',
    });
  });

  it('loads a selected status and appends subsequent pages without duplicates', async () => {
    const secondRequest = {...REQUEST, requestId: 'car_abcd1234'};
    const {result} = renderHook(() => useCustomerAccessRequests());
    await waitFor(() => expect(result.current.loading).toBe(false));
    listAccessRequests
        .mockResolvedValueOnce({requests: [REQUEST], nextCursor: REQUEST.requestId})
        .mockResolvedValueOnce({requests: [REQUEST, secondRequest], nextCursor: null});

    await act(async () => result.current.loadRequests('submitted'));
    await act(async () => result.current.loadMoreRequests());

    expect(listAccessRequests).toHaveBeenLastCalledWith({
      limit: 25,
      cursor: REQUEST.requestId,
      status: 'submitted',
    });
    expect(result.current.requests).toEqual([REQUEST, secondRequest]);
    expect(result.current.nextCursor).toBeNull();
  });

  it('records a review decision and refreshes the request list', async () => {
    reviewAccessRequest.mockResolvedValue({...REQUEST, status: 'approved'});
    const {result} = renderHook(() => useCustomerAccessRequests());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const decision = {decision: 'approve', reason: 'Qualified business request.'};

    await act(async () => result.current.decideRequest(REQUEST.requestId, decision));

    expect(reviewAccessRequest).toHaveBeenCalledWith(REQUEST.requestId, decision);
    expect(listAccessRequests).toHaveBeenCalledTimes(2);
    expect(result.current.operationSucceeded).toBe(true);
    expect(trackEvent).toHaveBeenCalledWith('admin_access_request_reviewed', {
      decision: 'approve',
      resulting_status: 'approved',
    });
  });

  it('keeps the request list empty and exposes a safe error when loading fails', async () => {
    listAccessRequests.mockRejectedValueOnce(Object.assign(new Error('No access'), {code: 'FORBIDDEN'}));
    const {result} = renderHook(() => useCustomerAccessRequests());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.requests).toEqual([]);
    expect(result.current.error.code).toBe('FORBIDDEN');
    expect(trackEvent).toHaveBeenCalledWith('admin_access_requests_load_failed', {
      reason: 'FORBIDDEN',
    });
  });
});
