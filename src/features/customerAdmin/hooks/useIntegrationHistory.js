/** @fileoverview Delivery history and explicit duplicate-aware retry state. */
import {useEffect, useState} from 'react';
import {integrationHistory, retryIntegration} from '../services/integrationService';
import {trackEvent} from '../../../utils/analytics';
import copy from '../locales/integrations.en';

/**
 * Loads a destination's paginated history and executes confirmed retries.
 * @param {Object} item - Selected integration.
 * @returns {Object} History state and actions.
 */
export const useIntegrationHistory = (item) => {
  const [after, setAfter] = useState(null);
  const [page, setPage] = useState(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setPage(null); setError(false);
    integrationHistory(item.orgId, item.id, after).then((result) => {
      if (active) setPage(result);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [item.orgId, item.id, after, revision]);

  /** @param {string} jobId - Prior delivery. @returns {Promise<void>} */
  const retry = async (jobId) => {
    setBusy(true); setNotice('');
    try {
      const result = await retryIntegration(item.orgId, item.id, jobId);
      trackEvent('integration_retry_requested');
      setNotice(copy.outcomes[result.outcome] || copy.error);
      setRevision((value) => value + 1);
    } catch (failure) {
      setNotice(failure.code === 'RETRY_UNAVAILABLE' ? copy.retryUnavailable : copy.error);
    } finally { setBusy(false); }
  };
  return {page, error, busy, notice, retry, next: () => setAfter(page.nextCursor)};
};
