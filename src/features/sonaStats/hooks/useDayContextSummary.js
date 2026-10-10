import { useEffect, useState } from 'react';
import moment from 'moment';
import apiClient from '../../../api/client';
import { buildDayContextSummary } from '../utils/dayContextSummary';

/**
 * Builds the "today is a special day" summary from the authenticated product
 * API response for the current session.
 *
 * Returns null on regular days, days without qualifying tags, or before
 * data has loaded.
 *
 * @returns {?Object} `{ tags, baseline }` or null
 */
export const useDayContextSummary = () => {
  const today = moment().format('YYYY-MM-DD');
  const [eventTags, setEventTags] = useState([]);
  const [buckets, setBuckets] = useState(null);

  useEffect(() => {
    let active = true;

    const loadDayContext = async () => {
      try {
        const response = await apiClient.get('/api/product/day-context', {
          params: {date: today},
        });
        if (!active) return;
        setEventTags(Array.isArray(response?.eventTags) ? response.eventTags : []);
        setBuckets(response?.buckets || null);
      } catch (_error) {
        if (!active) return;
        setEventTags([]);
        setBuckets(null);
      }
    };

    loadDayContext();
    return () => { active = false; };
  }, [today]);

  return buildDayContextSummary(eventTags, buckets);
};
