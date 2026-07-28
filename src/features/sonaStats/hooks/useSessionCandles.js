import { useEffect, useState } from 'react';
import { sonaStatsService } from '../services/sonaStatsService';

/**
 * Fetches the session's 5-minute candles from the raw history node for a date.
 * Candles come from `history/{ticker}/{timeframe}` — the single source of
 * truth — not from the day stats doc.
 *
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @returns {{ candles: Object[], loading: boolean }}
 */
export const useSessionCandles = (date) => {
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return undefined;

    let cancelled = false;
    setLoading(true);

    sonaStatsService
      .fetchSessionCandles(date)
      .then((result) => {
        if (!cancelled) setCandles(result);
      })
      .catch(() => {
        if (!cancelled) setCandles([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  return { candles, loading };
};
