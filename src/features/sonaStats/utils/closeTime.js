import moment from 'moment-timezone';
import { EST_TIMEZONE } from './sonaStatsConstants';

/**
 * Maps a timeframe string to its duration in minutes.
 * Mirrors the server-side helper at functions/helpers/closeTime.js.
 *
 * @type {Object<string, number>}
 */
export const TIMEFRAME_MINUTES = {
  '1m': 1,
  '5m': 5,
  '15m': 15,
  '30m': 30,
  '1h': 60,
};

const ONE_MINUTE_SECONDS = 60;

/**
 * Returns the duration in minutes for a given timeframe string,
 * or null if the timeframe is unrecognized.
 *
 * @param {string} timeframe - e.g. '5m', '15m', '1h'
 * @returns {number|null}
 */
export const getTimeframeMinutes = (timeframe) => {
  if (!timeframe) return null;
  const minutes = TIMEFRAME_MINUTES[timeframe];
  return typeof minutes === 'number' ? minutes : null;
};

/**
 * Pure math: computes the unix timestamp (seconds, as string) for the close
 * of the alert candle, given its open time and timeframe.
 * Returns null when inputs are missing or timeframe is unrecognized.
 *
 * @param {Object} params
 * @param {string} params.rawTime - ISO timestamp of the candle open
 * @param {string} params.timeframe - Timeframe string, e.g. '5m'
 * @returns {string|null}
 */
export const computeGeneratedCloseTimestamp = ({ rawTime, timeframe }) => {
  if (!rawTime) return null;
  const minutes = getTimeframeMinutes(timeframe);
  if (minutes === null) return null;
  const openMs = moment(rawTime).valueOf();
  if (!Number.isFinite(openMs)) return null;
  const closeMs = openMs + minutes * 60 * 1000;
  return String(Math.floor(closeMs / 1000));
};

/**
 * Pure math: computes the unix timestamp (seconds, as string) for the close
 * of the 1m hit candle, given its open timestamp.
 *
 * @param {string|number} targetReachedTime - Unix timestamp (seconds) of the 1m hit candle's open
 * @returns {string|null}
 */
export const computeReachedCloseTimestamp = (targetReachedTime) => {
  if (targetReachedTime === null || targetReachedTime === undefined || targetReachedTime === '') {
    return null;
  }
  const openTs = parseInt(targetReachedTime, 10);
  if (!Number.isFinite(openTs)) return null;
  return String(openTs + ONE_MINUTE_SECONDS);
};

// Treats a value as a usable unix-seconds open timestamp only when it parses
// cleanly to an integer. Stats records reuse `targetReachedTime` for a
// formatted clock string like "7:30 PM" — parseInt would silently return 7
// and render as 1969-12-31 19:01 EST.
const parseUnixSecondsOpen = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const str = String(value).trim();
  if (!/^-?\d+$/.test(str)) return null;
  const n = parseInt(str, 10);
  return Number.isFinite(n) ? n : null;
};

/**
 * Reader-side: prefers the stored `closeTimestamp` on a target and falls back
 * to computing it from `rawTime` + `timeframe`. Returns null if neither path
 * yields a value (e.g. legacy record missing both).
 *
 * @param {Object} target - Target or engulfingCandleList entry from Firebase
 * @returns {string|null} Unix timestamp in seconds as a string, or null
 */
export const resolveGeneratedCloseTimestamp = (target) => {
  if (!target) return null;
  if (target.closeTimestamp) return String(target.closeTimestamp);
  return computeGeneratedCloseTimestamp({
    rawTime: target.rawTime,
    timeframe: target.timeframe,
  });
};

/**
 * Reader-side: prefers the stored `targetReachedCloseTime` on a target and
 * falls back to computing it from `targetReachedTime` (1m hit candle open).
 * Returns null if neither is available or the target was never reached.
 *
 * @param {Object} target - Target or engulfingCandleList entry from Firebase
 * @returns {string|null} Unix timestamp in seconds as a string, or null
 */
export const resolveReachedCloseTimestamp = (target) => {
  if (!target) return null;
  if (target.targetReachedCloseTime) return String(target.targetReachedCloseTime);
  // Stats records expose `targetReachedTimestamp` (unix sec) and reuse
  // `targetReachedTime` as a formatted clock string. Live target records use
  // `targetReachedTime` as a unix-sec string. Pick whichever parses cleanly.
  const openTs = parseUnixSecondsOpen(target.targetReachedTimestamp) ??
    parseUnixSecondsOpen(target.targetReachedTime);
  if (openTs === null) return null;
  return computeReachedCloseTimestamp(openTs);
};

/**
 * Formats a unix timestamp (seconds) as an EST clock string like "9:35 AM EST".
 * Returns null when the input is missing or invalid so callers can render '—'.
 *
 * @param {string|number|null} timestampSeconds
 * @param {Object} [options]
 * @param {boolean} [options.includeSeconds=false]
 * @returns {string|null}
 */
export const formatCloseTimeEst = (timestampSeconds, options = {}) => {
  if (timestampSeconds === null || timestampSeconds === undefined || timestampSeconds === '') {
    return null;
  }
  const ts = parseInt(timestampSeconds, 10);
  if (!Number.isFinite(ts)) return null;
  const fmt = options.includeSeconds ? 'h:mm:ss A' : 'h:mm A';
  return `${moment.unix(ts).tz(EST_TIMEZONE).format(fmt)} EST`;
};
