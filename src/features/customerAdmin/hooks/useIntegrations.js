/** @fileoverview Scoped integration list and mutation state. */
import {useCallback, useEffect, useRef, useState} from 'react';
import {listIntegrations, createIntegration, updateIntegration, testIntegration} from '../services/integrationService';
import {trackEvent} from '../../../utils/analytics';
import copy from '../locales/integrations.en.json';

/**
 * Loads a scoped page and exposes safe mutation outcomes.
 * @param {Object} filters - Explicit organization, user and status scope.
 * @param {boolean} enabled - Whether a valid scope is selected.
 * @returns {Object} Integration state/actions.
 */
export const useIntegrations = (filters, enabled) => {
  const [items, setItems] = useState([]);
  const [allowance, setAllowance] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const sequence = useRef(0);
  const invalidate = useCallback(() => { sequence.current++; }, []);
  const scope = JSON.stringify(filters);
  const reload = useCallback(async () => {
    const request = ++sequence.current;
    setAllowance(null);
    if (!enabled) { setItems([]); setNextCursor(null); setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const page = await listIntegrations({...JSON.parse(scope), ...(cursor ? {after: cursor} : {})});
      if (request !== sequence.current) return;
      setItems(page.items || []);
      setAllowance(page.allowance || null);
      setNextCursor(page.nextCursor || null);
    } catch (failure) {
      if (request === sequence.current) {
        setItems([]);
        setError(copy.errors[failure.code] || copy.error);
      }
    } finally {
      if (request === sequence.current) setLoading(false);
    }
  }, [scope, enabled, cursor]);
  useEffect(() => { setCursor(null); setNotice(''); }, [scope]);
  useEffect(() => {
    reload();
    return invalidate;
  }, [reload, invalidate]);
  useEffect(() => { trackEvent('integrations_viewed'); }, []);

  /** @param {Function} operation - Request. @param {string} event - Analytics. @returns {Promise<Object>} Result. */
  const run = async (operation, event) => {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await operation();
      trackEvent(event);
      await reload();
      setNotice(result.outcome ? copy.outcomes[result.outcome] || copy.changed : copy.changed);
      return result;
    } catch (failure) {
      setError(copy.errors[failure.code] || copy.error);
      throw failure;
    } finally { setBusy(false); }
  };
  return {items, allowance, loading, busy, error, notice, nextCursor, reload,
    next: () => setCursor(nextCursor), first: () => setCursor(null),
    create: (orgId, input) => run(() => createIntegration(orgId, input), 'integration_created'),
    change: (item, input) => run(() => updateIntegration(item.orgId, item.id, input), 'integration_status_changed'),
    test: (item) => run(() => testIntegration(item.orgId, item.id), 'integration_test_requested')};
};
