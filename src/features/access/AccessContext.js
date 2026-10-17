import React, {createContext, useCallback, useEffect, useMemo, useState} from 'react';
import {useSelector} from 'react-redux';
import {fetchMyAccess} from './api/accessApi';
import {
  organizationHasFeature,
  selectDefaultAccessOrganization,
} from './accessSelectors';

export const AccessContext = createContext(null);

/**
 * Loads the server-authoritative access contract for the signed-in customer.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Application tree
 * @returns {React.ReactElement} Access context provider
 */
export const AccessProvider = ({children}) => {
  const {isLoggedIn, user} = useSelector((state) => state.auth);
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAccess = useCallback(async () => {
    if (!isLoggedIn || user?.mfaAuthenticated !== true) return null;
    setLoading(true);
    setError(null);
    try {
      const contract = await fetchMyAccess();
      setAccess(contract);
      return contract;
    } catch (loadError) {
      setAccess(null);
      setError(loadError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, user?.mfaAuthenticated]);

  useEffect(() => {
    if (!isLoggedIn || user?.mfaAuthenticated !== true) {
      setAccess(null);
      setError(null);
      setLoading(false);
      return;
    }
    loadAccess();
  }, [isLoggedIn, user?.id, user?.mfaAuthenticated, loadAccess]);

  const organization = useMemo(
    () => selectDefaultAccessOrganization(access),
    [access],
  );
  const accessPending = isLoggedIn && user?.mfaAuthenticated === true && !access && !error;
  const hasFeature = useCallback(
    (featureKey) => organizationHasFeature(organization, featureKey),
    [organization],
  );
  const value = useMemo(() => ({
    access,
    organization,
    loading: loading || accessPending,
    error,
    hasFeature,
    refreshAccess: loadAccess,
  }), [access, organization, loading, accessPending, error, hasFeature, loadAccess]);

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
};
