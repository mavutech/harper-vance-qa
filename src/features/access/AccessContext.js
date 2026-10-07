import React, {createContext, useCallback, useEffect, useMemo, useState} from 'react';
import {useSelector} from 'react-redux';
import {fetchMyAccess} from './api/accessApi';
import {SELECTED_ORG_STORAGE_KEY} from './accessConstants';
import {organizationHasFeature, selectAccessOrganization} from './accessSelectors';

export const AccessContext = createContext(null);

/**
 * Loads the server-authoritative access contract for the signed-in customer.
 *
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Application tree
 * @returns {React.ReactElement} Access context provider
 */
export const AccessProvider = ({children}) => {
  const {isLoggedIn, user} = useSelector((state) => state.auth);
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrgId, setSelectedOrgIdState] = useState(
      () => window.localStorage.getItem(SELECTED_ORG_STORAGE_KEY),
  );

  const loadAccess = useCallback(async () => {
    if (!isLoggedIn) return null;
    setLoading(true);
    setError(null);
    try {
      const contract = await fetchMyAccess();
      setAccess(contract);
      const selected = selectAccessOrganization(contract, selectedOrgId);
      const nextOrgId = selected?.orgId || null;
      setSelectedOrgIdState(nextOrgId);
      if (nextOrgId) window.localStorage.setItem(SELECTED_ORG_STORAGE_KEY, nextOrgId);
      else window.localStorage.removeItem(SELECTED_ORG_STORAGE_KEY);
      return contract;
    } catch (loadError) {
      setAccess(null);
      setError(loadError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, selectedOrgId]);

  useEffect(() => {
    if (!isLoggedIn) {
      setAccess(null);
      setError(null);
      setLoading(false);
      return;
    }
    loadAccess();
  }, [isLoggedIn, user?.id, loadAccess]);

  const selectOrganization = useCallback((orgId) => {
    const selected = selectAccessOrganization(access, orgId);
    if (!selected) return;
    setSelectedOrgIdState(selected.orgId);
    window.localStorage.setItem(SELECTED_ORG_STORAGE_KEY, selected.orgId);
  }, [access]);

  const organization = useMemo(
      () => selectAccessOrganization(access, selectedOrgId),
      [access, selectedOrgId],
  );
  const accessPending = isLoggedIn && !access && !error;
  const hasFeature = useCallback(
      (featureKey) => organizationHasFeature(organization, featureKey),
      [organization],
  );
  const value = useMemo(() => ({
    access,
    organization,
    selectedOrgId: organization?.orgId || null,
    loading: loading || accessPending,
    error,
    hasFeature,
    selectOrganization,
    refreshAccess: loadAccess,
  }), [access, organization, loading, accessPending, error, hasFeature, selectOrganization, loadAccess]);

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
};
