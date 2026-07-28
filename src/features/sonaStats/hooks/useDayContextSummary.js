import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import moment from 'moment';
import { database } from '../../../firebase/config';
import { buildDayContextSummary } from '../utils/dayContextSummary';

/**
 * Builds the "today is a special day" summary by subscribing to:
 *   - /calendar/specialDays/{YYYY-MM-DD}.eventTags
 *   - /stats/nq/5m/byDayContext
 *
 * Returns null on regular days, days without qualifying tags, or before
 * data has loaded. Re-fires whenever either path changes.
 *
 * @returns {?Object} `{ tags, baseline }` or null
 */
export const useDayContextSummary = () => {
  const today = moment().format('YYYY-MM-DD');
  const [eventTags, setEventTags] = useState([]);
  const [buckets, setBuckets] = useState(null);

  useEffect(() => {
    const tagsRef = ref(database, `calendar/specialDays/${today}/eventTags`);
    const unsubTags = onValue(tagsRef, (snap) => {
      const val = snap.val();
      setEventTags(Array.isArray(val) ? val : []);
    }, () => setEventTags([]));

    const bucketsRef = ref(database, 'stats/nq/5m/byDayContext');
    const unsubBuckets = onValue(bucketsRef, (snap) => {
      setBuckets(snap.val() || null);
    }, () => setBuckets(null));

    return () => {
      unsubTags();
      unsubBuckets();
    };
  }, [today]);

  return buildDayContextSummary(eventTags, buckets);
};
