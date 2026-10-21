/** @fileoverview Scoped daily email settings with stale-response protection. */
import {useCallback, useEffect, useRef, useState} from 'react';
import {initializeEmailPreferences, updateEmailPreference} from '../services/integrationService';
import {trackEvent} from '../../../utils/analytics';
import copy from '../locales/integrations.en.json';

/** @param {string} orgId - Current organization. @returns {Object} Preference state and actions. */
export const useDailyEmailPreferences = (orgId) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const sequence = useRef(0);
  const reload = useCallback(async () => {
    const request = ++sequence.current;
    setLoading(true); setError(''); setItems([]);
    try {
      const result = await initializeEmailPreferences(orgId);
      if (request === sequence.current) setItems(result);
    } catch (failure) {
      if (request === sequence.current) setError(copy.errors[failure.code] || copy.error);
    } finally { if (request === sequence.current) setLoading(false); }
  }, [orgId]);
  useEffect(() => { reload(); return () => { sequence.current++; }; }, [reload]);
  /** @param {Object} item - Owned record. @param {boolean} enabled - Opt-in. @returns {Promise<void>} */
  const change = async (item, enabled) => {
    const request = sequence.current;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await updateEmailPreference(item, enabled);
      if (request !== sequence.current) return;
      setItems((current) => current.map((entry) => entry.id === result.id ? result : entry));
      setNotice(copy.emailSaved);
      trackEvent('daily_email_preference_changed', {enabled});
    } catch (failure) {
      if (request === sequence.current) setError(copy.errors[failure.code] || copy.error);
    } finally { if (request === sequence.current) setBusy(false); }
  };
  return {items, loading, busy, error, notice, reload, change};
};
