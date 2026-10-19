/**
 * @fileoverview State and owner-review actions for report requests.
 */

import {useCallback, useEffect, useState} from 'react';
import {trackEvent} from '../../../utils/analytics';
import {
  listReportRequests,
  reviewReportRequest,
} from '../services/customerOrganizationsService';

const REPORT_REQUEST_PAGE_SIZE = 25;

/**
 * Loads and reviews report requests through the owner-only API.
 *
 * @return {Object} Report-request state and actions
 */
export const useReportRequests = () => {
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
   * Loads the first request page for one status filter.
   *
   * @param {string} [status=''] - Optional status
   * @return {Promise<void>}
   */
  const loadRequests = useCallback(async (status = '') => {
    setLoading(true);
    setError(null);
    try {
      const result = await listReportRequests({
        limit: REPORT_REQUEST_PAGE_SIZE,
        ...(status ? {status} : {}),
      });
      setRequests(Array.isArray(result?.requests) ? result.requests : []);
      setNextCursor(result?.nextCursor || null);
      setStatusFilter(status);
      trackEvent('admin_report_requests_viewed', {status_filter: status || 'all'});
    } catch (requestError) {
      setRequests([]);
      setNextCursor(null);
      setError(requestError);
      trackEvent('admin_report_requests_load_failed', {
        reason: requestError?.code || 'unknown',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Loads the next page without replacing visible requests.
   *
   * @return {Promise<void>}
   */
  const loadMoreRequests = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await listReportRequests({
        limit: REPORT_REQUEST_PAGE_SIZE,
        cursor: nextCursor,
        ...(statusFilter ? {status: statusFilter} : {}),
      });
      const items = Array.isArray(result?.requests) ? result.requests : [];
      setRequests((current) => [...current, ...items.filter(
          (item) => !current.some((known) => known.requestId === item.requestId),
      )]);
      setNextCursor(result?.nextCursor || null);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor, statusFilter]);

  /**
   * Records one owner decision and refreshes the active queue.
   *
   * @param {string} requestId - Report request identifier
   * @param {Object} input - Decision and review reason
   * @return {Promise<Object>} Updated request
   */
  const decideRequest = useCallback(async (requestId, input) => {
    setOperationLoading(true);
    setOperationError(null);
    setOperationSucceeded(false);
    try {
      const updated = await reviewReportRequest(requestId, input);
      await loadRequests(statusFilter);
      setOperationSucceeded(true);
      trackEvent('report_request_reviewed', {decision: input.decision});
      return updated;
    } catch (requestError) {
      setOperationError(requestError);
      trackEvent('report_request_review_failed', {
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
