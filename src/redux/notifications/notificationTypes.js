/**
 * Action type constants for the notifications slice.
 *
 * The notifications slice powers the header bell dropdown — a single
 * source of truth for real-time SONA target events (new targets, hits,
 * close-of-day unresolved misses) plus the user's sound/permission
 * preferences.
 */

// ── Notification lifecycle ─────────────────────────────────────────────
/** Add a notification (new target, hit, miss-at-close). */
export const NOTIFICATION_ADD = 'notifications/ADD';

/** Mark every notification as read (fired when dropdown opens). */
export const NOTIFICATION_MARK_ALL_READ = 'notifications/MARK_ALL_READ';

/** Mark a single notification as read by id. */
export const NOTIFICATION_MARK_READ = 'notifications/MARK_READ';

/** Clear every notification (manual "clear all" action). */
export const NOTIFICATION_CLEAR = 'notifications/CLEAR';

/**
 * Prune notifications from previous calendar days. Triggered by the
 * realtime bridge on date rollover.
 */
export const NOTIFICATION_PRUNE_STALE = 'notifications/PRUNE_STALE';

// ── User preferences ───────────────────────────────────────────────────
/** Toggle the audio ping on new notifications. */
export const NOTIFICATION_SET_SOUND_ENABLED = 'notifications/SET_SOUND_ENABLED';

/** Track the result of requesting browser notification permission. */
export const NOTIFICATION_SET_BROWSER_PERMISSION =
  'notifications/SET_BROWSER_PERMISSION';

/** Toggle whether the app fires browser notifications (independent of OS permission). */
export const NOTIFICATION_SET_BROWSER_ALERTS_ENABLED =
  'notifications/SET_BROWSER_ALERTS_ENABLED';
