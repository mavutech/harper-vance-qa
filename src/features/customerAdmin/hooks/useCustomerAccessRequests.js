/**
 * @fileoverview State and governed operations for platform access requests.
 */

import {useCallback, useEffect, useState} from 'react';
import {trackEvent} from '../../../utils/analytics';
import {
  listAccessRequests,
  reviewAccessRequest,
} from '../services/customerOrganizationsService';

const ACCESS_REQUEST_PAGE_SIZE = 25;

/**
 * Loads and reviews customer access requests through the authenticated admin API.
 *
 * @return {Object} Access-request state and actions
 */
export const useCustomerAccessRequests = () => {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationError, setOperationError] = useState(null);
  const [operationSucceeded, setOperationSucceeded] = useState(false);

  /**
   * Loads the first page for a selected status.
   *
   * @param {string} [status=''] - Optional request status filter
   * @return {Promise<void>}
   */
  const loadRequests = useCallback(async (status = '') => {
    setLoading(true);
    setError(null);
    try {
      const result = await listAccessRequests({
        limit: ACCESS_REQUEST_PAGE_SIZE,
        ...(status ? {status} : {}),
      });
      const items = Array.isArray(result?.requests) ? result.requests : [];
      setRequests(items);
      setNextCursor(result?.nextCursor || null);
      setStatusFilter(status);
      trackEvent('admin_access_requests_viewed', {status_filter: status || 'all'});
    } catch (requestError) {
      setRequests([]);
      setNextCursor(null);
      setError(requestError);
      trackEvent('admin_access_requests_load_failed', {
        reason: requestError?.code || 'unknown',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Loads the next page without replacing requests already shown.
   *
   * @return {Promise<void>}
   */
  const loadMoreRequests = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const result = await listAccessRequests({
        limit: ACCESS_REQUEST_PAGE_SIZE,
        cursor: nextCursor,
        ...(statusFilter ? {status: statusFilter} : {}),
      });
      const items = Array.isArray(result?.requests) ? result.requests : [];
      setRequests((current) => {
        const knownIds = new Set(current.map((request) => request.requestId));
        return [...current, ...items.filter((request) => !knownIds.has(request.requestId))];
      });
      setNextCursor(result?.nextCursor || null);
    } catch (requestError) {
      setError(requestError);
      trackEvent('admin_access_requests_load_failed', {
        reason: requestError?.code || 'unknown',
      });
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor, statusFilter]);

  /**
   * Records a review decision, then refreshes the visible request list.
   *
   * @param {string} requestId - Request identifier
   * @param {Object} input - Decision and required review reason
   * @return {Promise<Object>} Updated request
   */
  const decideRequest = useCallback(async (requestId, input) => {
    setOperationLoading(true);
    setOperationError(null);
    setOperationSucceeded(false);
    try {
      const updated = await reviewAccessRequest(requestId, input);
      await loadRequests(statusFilter);
      setOperationSucceeded(true);
      trackEvent('admin_access_request_reviewed', {
        decision: input.decision,
        resulting_status: updated?.status || 'unknown',
      });
      return updated;
    } catch (requestError) {
      setOperationError(requestError);
      trackEvent('admin_access_request_review_failed', {
        decision: input.decision,
        reason: requestError?.code || 'unknown',
      });
      throw requestError;
    } finally {
      setOperationLoading(false);
    }
  }, [loadRequests, statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  return {
    requests,
    statusFilter,
    nextCursor,
    loading,
    loadingMore,
    error,
    operationLoading,
    operationError,
    operationSucceeded,
    loadRequests,
    loadMoreRequests,
    decideRequest,
  };
};
