/** @fileoverview Organization recipient assignments with scoped asynchronous state. */
import {useCallback, useEffect, useRef, useState} from 'react';
import {listEmailRecipients, addEmailRecipient, assignEmailRecipient} from '../services/integrationService';
import {trackEvent} from '../../../utils/analytics';
import copy from '../locales/integrations.en';

/** @param {string} orgId - Authorized organization. @returns {Object} Recipient management state. */
export const useEmailRecipients = (orgId) => {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const sequence = useRef(0);
  /** @returns {Promise<void>} Refreshes current organization without retaining a stale scope. */
  const reload = useCallback(async () => {
    const request = ++sequence.current;
    setLoading(true); setError('');
    try {
      const result = await listEmailRecipients(orgId);
      if (request === sequence.current) setRecord(result);
    } catch (failure) {
      if (request === sequence.current) setError(copy.errors[failure.code] || copy.error);
    } finally { if (request === sequence.current) setLoading(false); }
  }, [orgId]);
  useEffect(() => {
    setRecord(null); setBusy(false); setNotice(''); reload();
    return () => { sequence.current++; };
  }, [reload]);
  /** @param {Function} operation - Authorized request. @returns {Promise<boolean>} Saved result. */
  const run = async (operation) => {
    const request = sequence.current;
    setBusy(true); setError(''); setNotice('');
    try {
      await operation();
      if (request !== sequence.current) return false;
      setNotice(copy.recipients.saved);
      trackEvent('daily_email_assignment_changed');
      await reload();
      return true;
    } catch (failure) {
      if (request === sequence.current) setError(copy.errors[failure.code] || copy.error);
      return false;
    } finally { setBusy(false); }
  };
  return {record, loading, busy, error, notice, reload,
    add: (uid) => run(() => addEmailRecipient(orgId, uid)),
    assign: (item, assigned) => run(() => assignEmailRecipient(item, assigned))};
};
