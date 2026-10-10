/**
 * @fileoverview State and governed data loading for customer administration.
 */

import {useCallback, useEffect, useRef, useState} from 'react';
import {trackEvent} from '../../../utils/analytics';
import {
  createOrganization,
  getOrganizationDetail,
  getOrganizationSubscription,
  listOrganizations,
  updateOrganizationSubscription,
} from '../services/customerOrganizationsService';
import {CUSTOMER_PAGE_SIZE} from '../utils/customerAdminConstants';

/**
 * Loads organization summaries and the selected customer record.
 *
 * @return {Object} Customer organization state and actions
 */
export const useCustomerOrganizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [customerRecord, setCustomerRecord] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detailError, setDetailError] = useState(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationError, setOperationError] = useState(null);
  const [operationSucceeded, setOperationSucceeded] = useState(false);
  const detailRequestRef = useRef(0);

  /**
   * Loads the current organization page using an optional search term.
   *
   * @param {string} [searchTerm=''] - Name or slug filter
   * @return {Promise<void>}
   */
  const loadOrganizations = useCallback(async (searchTerm = '') => {
    setLoading(true);
    setError(null);
    try {
      const result = await listOrganizations({
        limit: CUSTOMER_PAGE_SIZE,
        ...(searchTerm ? {search: searchTerm} : {}),
      });
      const items = Array.isArray(result && result.items) ? result.items : [];
      setOrganizations(items);
      setSelectedOrgId((current) => (
        current && items.some((item) => item.id === current) ? current : null
      ));
    } catch (requestError) {
      setOrganizations([]);
      setSelectedOrgId(null);
      setError(requestError);
      trackEvent('admin_organizations_load_failed', {
        reason: requestError && requestError.code ? requestError.code : 'unknown',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Loads the selected organization's aggregate record and subscription.
   *
   * @param {string} orgId - Organization ID
   * @return {Promise<void>}
   */
  const selectOrganization = useCallback(async (orgId) => {
    const requestNumber = detailRequestRef.current + 1;
    detailRequestRef.current = requestNumber;
    setSelectedOrgId(orgId);
    setCustomerRecord(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const [detail, subscription] = await Promise.all([
        getOrganizationDetail(orgId),
        getOrganizationSubscription(orgId),
      ]);
      if (detailRequestRef.current === requestNumber) {
        setCustomerRecord({...detail, ...subscription});
      }
    } catch (requestError) {
      if (detailRequestRef.current === requestNumber) {
        setDetailError(requestError);
      }
      trackEvent('admin_organization_detail_load_failed', {
        reason: requestError && requestError.code ? requestError.code : 'unknown',
      });
    } finally {
      if (detailRequestRef.current === requestNumber) setDetailLoading(false);
    }
  }, []);

  /**
   * Applies a new organization search.
   *
   * @param {string} searchTerm - Name or slug filter
   * @return {Promise<void>}
   */
  const applySearch = useCallback(async (searchTerm) => {
    const normalized = String(searchTerm || '').trim();
    setSearch(normalized);
    await loadOrganizations(normalized);
  }, [loadOrganizations]);

  /**
   * Creates an onboarding organization, reloads the list, and opens it.
   *
   * @param {Object} input - Validated organization input
   * @return {Promise<Object>} Created organization response
   */
  const createCustomer = useCallback(async (input) => {
    setOperationLoading(true);
    setOperationError(null);
    setOperationSucceeded(false);
    try {
      const result = await createOrganization(input);
      await loadOrganizations(search);
      await selectOrganization(result.orgId);
      setOperationSucceeded(true);
      trackEvent('admin_organization_created');
      return result;
    } catch (requestError) {
      setOperationError(requestError);
      trackEvent('admin_organization_create_failed', {
        reason: requestError && requestError.code ? requestError.code : 'unknown',
      });
      throw requestError;
    } finally {
      setOperationLoading(false);
    }
  }, [loadOrganizations, search, selectOrganization]);

  /**
   * Saves a canonical subscription decision and refreshes customer data.
   *
   * @param {string} orgId - Organization ID
   * @param {Object} input - Validated subscription decision
   * @return {Promise<Object>} Updated subscription response
   */
  const saveSubscription = useCallback(async (orgId, input) => {
    setOperationLoading(true);
    setOperationError(null);
    setOperationSucceeded(false);
    try {
      const result = await updateOrganizationSubscription(orgId, input);
      await Promise.all([
        loadOrganizations(search),
        selectOrganization(orgId),
      ]);
      setOperationSucceeded(true);
      trackEvent('admin_subscription_updated', {
        license_code: input.licenseCode,
        subscription_status: input.status,
      });
      return result;
    } catch (requestError) {
      setOperationError(requestError);
      trackEvent('admin_subscription_update_failed', {
        reason: requestError && requestError.code ? requestError.code : 'unknown',
      });
      throw requestError;
    } finally {
      setOperationLoading(false);
    }
  }, [loadOrganizations, search, selectOrganization]);

  /**
   * Clears the last customer mutation result from the page.
   *
   * @return {void}
   */
  const clearOperationState = useCallback(() => {
    setOperationError(null);
    setOperationSucceeded(false);
  }, []);

  useEffect(() => {
    trackEvent('admin_organizations_viewed');
    loadOrganizations('');
  }, [loadOrganizations]);

  return {
    organizations,
    selectedOrgId,
    customerRecord,
    search,
    loading,
    detailLoading,
    error,
    detailError,
    operationLoading,
    operationError,
    operationSucceeded,
    loadOrganizations,
    selectOrganization,
    applySearch,
    createCustomer,
    saveSubscription,
    clearOperationState,
  };
};
