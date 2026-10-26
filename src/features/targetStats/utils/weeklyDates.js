import moment from 'moment-timezone';

/**
 * Returns the number of ISO weeks in a year, independent of today's date.
 * December 28 always belongs to that ISO year's final week.
 * @param {number} year - ISO week year.
 * @returns {number} 52 or 53 for a valid year.
 */
export const getIsoWeekCount = (year) => moment(`${year}-12-28`, 'YYYY-MM-DD', true).isoWeek();
