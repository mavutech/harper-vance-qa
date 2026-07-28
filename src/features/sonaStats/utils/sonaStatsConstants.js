import moment from 'moment-timezone';

/**
 * colorHighlight value that identifies a bullish target.
 * Set by the SONA backend (ecTargets cloud function) on target creation.
 *
 * @type {number}
 */
export const BULLISH_COLOR = 7004928;

/**
 * IANA timezone string for US Eastern Time.
 * Used for all SONA session-time calculations.
 *
 * @type {string}
 */
export const EST_TIMEZONE = 'America/New_York';

/**
 * NQ trading session start — 9:30 AM EST.
 *
 * @type {{ hour: number, minute: number }}
 */
export const SESSION_START = { hour: 9, minute: 30 };

/**
 * NQ trading session end — 4:00 PM EST.
 *
 * @type {{ hour: number, minute: number }}
 */
export const SESSION_END = { hour: 16, minute: 0 };

/**
 * Intraday session periods used for accuracy breakdowns.
 * Each period is defined in EST wall-clock time.
 *
 * @type {Array<{ name: string, startHour: number, startMin: number, endHour: number, endMin: number }>}
 */
export const SESSION_PERIODS = [
  { name: 'Morning',   startHour: 9,  startMin: 30, endHour: 11, endMin: 30 },
  { name: 'Midday',    startHour: 11, startMin: 30, endHour: 14, endMin: 0  },
  { name: 'Afternoon', startHour: 14, startMin: 0,  endHour: 16, endMin: 0  },
];

/**
 * Returns true if the current moment falls within NQ regular trading hours
 * (9:30 AM – 4:00 PM EST, Monday through Friday).
 * Used by the dashboard to show a "Session Live" indicator.
 *
 * @returns {boolean}
 *
 * @example
 * if (isNQSessionLive()) { ... }
 */
export const isNQSessionLive = () => {
  const now = moment().tz(EST_TIMEZONE);
  const dayOfWeek = now.day(); // 0 = Sunday, 6 = Saturday

  if (dayOfWeek === 0 || dayOfWeek === 6) return false;

  const startOfSession = now.clone().hour(SESSION_START.hour).minute(SESSION_START.minute).second(0);
  const endOfSession   = now.clone().hour(SESSION_END.hour).minute(SESSION_END.minute).second(0);

  return now.isSameOrAfter(startOfSession) && now.isBefore(endOfSession);
};
