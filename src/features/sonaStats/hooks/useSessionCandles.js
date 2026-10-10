import { useCallback, useEffect, useState } from 'react';
import { sonaStatsService } from '../services/sonaStatsService';

/**
 * Fetches the session's 5-minute candles from the raw history node for a date.
 * Candles come from `history/{ticker}/{timeframe}` — the single source of
 * truth — not from the day stats doc.
 *
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @returns {{ candles: Object[], loading: boolean, error: string|null, retry: () => void }}
 */
export const useSessionCandles = (date) => {
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!date) return undefined;

    let cancelled = false;
    setLoading(true);
    setError(null);

    sonaStatsService
      .fetchSessionCandles(date)
      .then((result) => {
        if (!cancelled) setCandles(result);
      })
      .catch(() => {
        if (!cancelled) {
          setCandles([]);
          setError('Session replay could not be loaded.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt, date]);

  /**
   * Starts a fresh session-candle request.
   *
   * @returns {void}
   */
  const retry = useCallback(() => {
    setAttempt((currentAttempt) => currentAttempt + 1);
  }, []);

  return { candles, loading, error, retry };
};
