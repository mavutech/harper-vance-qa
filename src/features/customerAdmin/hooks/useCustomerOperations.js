/**
 * @fileoverview Customer integration and support operation state.
 */

import {useCallback, useEffect, useMemo, useState} from 'react';
import {trackEvent} from '../../../utils/analytics';
import {
  createApiClient,
  createDeliveryDestination,
  disableDeliveryDestination,
  listApiClients,
  listDeliveryDestinations,
  listSupportCases,
  revokeApiClient,
} from '../services/customerOperationsService';

const DELIVERY_FEATURES = Object.freeze([
  'delivery.email',
  'delivery.teamNotifications',
  'delivery.webhooks',
]);
const PRODUCT_FEATURES = Object.freeze([
  'dashboard.liveTargets',
  'dashboard.dailyReports',
  'dashboard.weeklyReports',
  'dashboard.history',
]);

/**
 * Loads and mutates entitled customer operational resources.
 *
 * @param {string|null} orgId - Selected organization ID
 * @param {Object} features - Current entitlement feature map
 * @param {boolean} active - Whether the subscription is active
 * @return {Object} Customer operation state and actions
 */
export const useCustomerOperations = (orgId, features = {}, active = false) => {
  const [destinations, setDestinations] = useState([]);
  const [apiClients, setApiClients] = useState([]);
  const [supportCases, setSupportCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [apiSecret, setApiSecret] = useState('');
  const capabilities = useMemo(() => ({
    delivery: active && DELIVERY_FEATURES.some((key) => features[key] === true),
    api: active && features['api.rest'] === true,
    support: active && PRODUCT_FEATURES.some((key) => features[key] === true),
  }), [active, features]);

  /**
   * Loads every entitled operational resource independently.
   *
   * @return {Promise<void>}
   */
  const loadOperations = useCallback(async () => {
    if (!orgId || !active) {
      setDestinations([]);
      setApiClients([]);
      setSupportCases([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [destinationResult, apiResult, supportResult] = await Promise.all([
        capabilities.delivery ? listDeliveryDestinations(orgId) : Promise.resolve([]),
        capabilities.api ? listApiClients(orgId) : Promise.resolve([]),
        capabilities.support ? listSupportCases(orgId) : Promise.resolve([]),
      ]);
      setDestinations(Array.isArray(destinationResult) ? destinationResult : []);
      setApiClients(Array.isArray(apiResult) ? apiResult : []);
      setSupportCases(Array.isArray(supportResult) ? supportResult : []);
    } catch (requestError) {
      setError(requestError);
      trackEvent('admin_customer_operations_load_failed', {
        reason: requestError && requestError.code ? requestError.code : 'unknown',
      });
    } finally {
      setLoading(false);
    }
  }, [active, capabilities.api, capabilities.delivery, capabilities.support, orgId]);

  useEffect(() => {
    loadOperations();
  }, [loadOperations]);

  /**
   * Creates a delivery destination and refreshes the list.
   *
   * @param {Object} input - Destination input
   * @return {Promise<void>}
   */
  const addDestination = useCallback(async (input) => {
    setSubmitting(true);
    setError(null);
    try {
      await createDeliveryDestination(orgId, input);
      setDestinations(await listDeliveryDestinations(orgId));
      trackEvent('admin_delivery_destination_created', {destination_type: input.type});
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setSubmitting(false);
    }
  }, [orgId]);

  /**
   * Disables a delivery destination and refreshes the list.
   *
   * @param {string} destinationId - Destination ID
   * @return {Promise<void>}
   */
  const disableDestination = useCallback(async (destinationId) => {
    setSubmitting(true);
    setError(null);
    try {
      await disableDeliveryDestination(orgId, destinationId);
      setDestinations(await listDeliveryDestinations(orgId));
      trackEvent('admin_delivery_destination_disabled');
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setSubmitting(false);
    }
  }, [orgId]);

  /**
   * Creates an API client and holds its secret only in memory.
   *
   * @param {Object} input - API client input
   * @return {Promise<void>}
   */
  const addApiClient = useCallback(async (input) => {
    setSubmitting(true);
    setError(null);
    setApiSecret('');
    try {
      const result = await createApiClient(orgId, input);
      setApiSecret(result.secret || '');
      setApiClients(await listApiClients(orgId));
      trackEvent('admin_api_client_created');
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setSubmitting(false);
    }
  }, [orgId]);

  /**
   * Revokes an API client and refreshes the list.
   *
   * @param {string} apiClientId - API client ID
   * @return {Promise<void>}
   */
  const removeApiClient = useCallback(async (apiClientId) => {
    setSubmitting(true);
    setError(null);
    try {
      await revokeApiClient(orgId, apiClientId);
      setApiClients(await listApiClients(orgId));
      trackEvent('admin_api_client_revoked');
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setSubmitting(false);
    }
  }, [orgId]);

  return {
    destinations,
    apiClients,
    supportCases,
    loading,
    submitting,
    error,
    apiSecret,
    capabilities,
    loadOperations,
    addDestination,
    disableDestination,
    addApiClient,
    removeApiClient,
    clearApiSecret: () => setApiSecret(''),
  };
};
