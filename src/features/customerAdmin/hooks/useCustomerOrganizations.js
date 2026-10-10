/**
 * @fileoverview State and governed data loading for customer administration.
 */

import {useCallback, useEffect, useRef, useState} from 'react';
import {trackEvent} from '../../../utils/analytics';
import {
  createOrganization,
  createOrganizationCheckout,
  closeOrganization,
  getOrganizationBilling,
  getOrganizationDetail,
  getOrganizationOnboarding,
  getOrganizationSubscription,
  getOrganizationAudit,
  inviteOrganizationMember,
  listOrganizations,
  removeOrganizationMember,
  revokeOrganizationInvitation,
  updateOrganizationMemberRole,
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
      const onboardingRequest = getOrganizationOnboarding(orgId).catch((requestError) => {
        trackEvent('admin_onboarding_progress_load_failed', {
          reason: requestError?.code || 'unknown',
        });
        return null;
      });
      const [detail, subscription, billing, onboarding] = await Promise.all([
        getOrganizationDetail(orgId),
        getOrganizationSubscription(orgId),
        getOrganizationBilling(orgId),
        onboardingRequest,
      ]);
      if (detailRequestRef.current === requestNumber) {
        setCustomerRecord({...detail, ...subscription, billing, onboarding});
        trackEvent('admin_onboarding_progress_viewed', {
          onboarding_status: onboarding?.status || 'unavailable',
        });
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
   * Creates a hosted checkout link and refreshes billing status.
   *
   * @param {string} orgId - Organization ID
   * @param {Object} input - Approved billing terms
   * @return {Promise<Object>} Checkout session response
   */
  const startCheckout = useCallback(async (orgId, input) => {
    setOperationLoading(true);
    setOperationError(null);
    setOperationSucceeded(false);
    try {
      const result = await createOrganizationCheckout(orgId, input);
      await selectOrganization(orgId);
      setOperationSucceeded(true);
      trackEvent('admin_billing_checkout_created', {
        license_code: input.licenseCode,
        seat_quantity: input.seatQuantity,
      });
      return result;
    } catch (requestError) {
      setOperationError(requestError);
      trackEvent('admin_billing_checkout_failed', {
        reason: requestError && requestError.code ? requestError.code : 'unknown',
      });
      throw requestError;
    } finally {
      setOperationLoading(false);
    }
  }, [selectOrganization]);

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

  /**
   * Creates a member invitation and refreshes the selected customer record.
   *
   * @param {string} orgId - Organization ID
   * @param {{email: string, orgRole: string}} input - Invitation input
   * @return {Promise<Object>} One-time invitation response
   */
  const inviteMember = useCallback(async (orgId, input) => {
    setOperationLoading(true);
    setOperationError(null);
    setOperationSucceeded(false);
    try {
      const result = await inviteOrganizationMember(orgId, input);
      await selectOrganization(orgId);
      setOperationSucceeded(true);
      trackEvent('admin_member_invited', {organization_role: input.orgRole});
      return result;
    } catch (requestError) {
      setOperationError(requestError);
      trackEvent('admin_member_invite_failed', {
        reason: requestError && requestError.code ? requestError.code : 'unknown',
      });
      throw requestError;
    } finally {
      setOperationLoading(false);
    }
  }, [selectOrganization]);

  /**
   * Revokes a pending invitation and refreshes the customer record.
   *
   * @param {string} orgId - Organization ID
   * @param {string} invitationId - Invitation ID
   * @return {Promise<void>}
   */
  const revokeInvitation = useCallback(async (orgId, invitationId) => {
    setOperationLoading(true);
    setOperationError(null);
    setOperationSucceeded(false);
    try {
      await revokeOrganizationInvitation(orgId, invitationId);
      await selectOrganization(orgId);
      setOperationSucceeded(true);
      trackEvent('admin_invitation_revoked');
    } catch (requestError) {
      setOperationError(requestError);
      throw requestError;
    } finally {
      setOperationLoading(false);
    }
  }, [selectOrganization]);

  /**
   * Changes a member's role and refreshes the customer record.
   *
   * @param {string} orgId - Organization ID
   * @param {string} uid - Customer user ID
   * @param {string} orgRole - New organization role
   * @return {Promise<void>}
   */
  const changeMemberRole = useCallback(async (orgId, uid, orgRole) => {
    setOperationLoading(true);
    setOperationError(null);
    setOperationSucceeded(false);
    try {
      await updateOrganizationMemberRole(orgId, uid, orgRole);
      await selectOrganization(orgId);
      setOperationSucceeded(true);
      trackEvent('admin_member_role_updated', {organization_role: orgRole});
    } catch (requestError) {
      setOperationError(requestError);
      throw requestError;
    } finally {
      setOperationLoading(false);
    }
  }, [selectOrganization]);

  /**
   * Removes a member and refreshes seats and customer access.
   *
   * @param {string} orgId - Organization ID
   * @param {string} uid - Customer user ID
   * @return {Promise<void>}
   */
  const removeMember = useCallback(async (orgId, uid) => {
    setOperationLoading(true);
    setOperationError(null);
    setOperationSucceeded(false);
    try {
      await removeOrganizationMember(orgId, uid);
      await selectOrganization(orgId);
      setOperationSucceeded(true);
      trackEvent('admin_member_removed');
    } catch (requestError) {
      setOperationError(requestError);
      throw requestError;
    } finally {
      setOperationLoading(false);
    }
  }, [selectOrganization]);

  /**
   * Retrieves a customer's complete audit evidence for local download.
   *
   * @param {string} orgId - Organization ID
   * @return {Promise<Array<Object>>} Audit entries
   */
  const exportAudit = useCallback(async (orgId) => {
    setOperationLoading(true);
    setOperationError(null);
    try {
      const result = await getOrganizationAudit(orgId);
      trackEvent('admin_organization_audit_exported');
      return Array.isArray(result && result.items) ? result.items : [];
    } catch (requestError) {
      setOperationError(requestError);
      throw requestError;
    } finally {
      setOperationLoading(false);
    }
  }, []);

  /**
   * Closes an organization and refreshes its preserved record.
   *
   * @param {string} orgId - Organization ID
   * @return {Promise<void>}
   */
  const closeCustomer = useCallback(async (orgId) => {
    setOperationLoading(true);
    setOperationError(null);
    setOperationSucceeded(false);
    try {
      await closeOrganization(orgId);
      await Promise.all([
        loadOrganizations(search),
        selectOrganization(orgId),
      ]);
      setOperationSucceeded(true);
      trackEvent('admin_organization_closed');
    } catch (requestError) {
      setOperationError(requestError);
      throw requestError;
    } finally {
      setOperationLoading(false);
    }
  }, [loadOrganizations, search, selectOrganization]);

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
    startCheckout,
    clearOperationState,
    inviteMember,
    revokeInvitation,
    changeMemberRole,
    removeMember,
    exportAudit,
    closeCustomer,
  };
};
