import * as types from './notificationTypes';
import { BULLISH_COLOR } from '../../features/sonaStats/utils/sonaStatsConstants';

/**
 * Build a normalized notification record from a raw target row and a `kind`.
 *
 * @param {Object} target
 * @param {'new'|'hit'|'miss'} kind
 * @returns {Object} `{id, kind, alertId, direction, targetPrice, title, body, ts, read}`
 */
const buildNotification = (target, kind) => {
  const bullish = target.colorHighlight === BULLISH_COLOR;
  const direction = bullish ? 'Bullish' : 'Bearish';
  const targetPrice = target.targetPrice || target.high || target.low;
  const ctx = target.bucketContext;

  let title;
  let body;
  let ts;

  if (kind === 'new') {
    title = `New ${direction} target`;
    body = ctx ?
      `${targetPrice} · hit ${ctx.hitRate}%, typically retrace ~${ctx.medianRetraction} pts` :
      `${targetPrice}`;
    ts = target.rawTime ? new Date(target.rawTime).getTime() : Date.now();
  } else if (kind === 'hit') {
    title = `${direction} target hit`;
    body = `${targetPrice}`;
    ts = target.targetReachedTimestamp ?
      parseInt(target.targetReachedTimestamp, 10) * 1000 :
      Date.now();
  } else {
    // miss
    title = `${direction} target unresolved at close`;
    body = `${targetPrice}`;
    ts = Date.now();
  }

  // Compound id so the same alertId can carry both a 'new' and a 'hit' entry.
  return {
    id: `${kind}:${target.alertId}`,
    kind,
    alertId: target.alertId,
    direction,
    targetPrice,
    title,
    body,
    ts,
    read: false,
  };
};

/**
 * Add a notification derived from a target row.
 *
 * @param {Object} target
 * @param {'new'|'hit'|'miss'} kind
 */
export const addTargetNotification = (target, kind) => ({
  type: types.NOTIFICATION_ADD,
  payload: buildNotification(target, kind),
});

/** Mark every notification as read. */
export const markAllNotificationsRead = () => ({
  type: types.NOTIFICATION_MARK_ALL_READ,
});

/** Mark one notification as read by id. */
export const markNotificationRead = (id) => ({
  type: types.NOTIFICATION_MARK_READ,
  payload: id,
});

/** Clear every notification. */
export const clearNotifications = () => ({
  type: types.NOTIFICATION_CLEAR,
});

/**
 * Drop notifications from days other than `keepDate`. Called by the realtime
 * bridge on date rollover.
 *
 * @param {string} keepDate - `YYYY-MM-DD`
 */
export const pruneStaleNotifications = (keepDate) => ({
  type: types.NOTIFICATION_PRUNE_STALE,
  payload: keepDate,
});

/** Toggle the audio ping. */
export const setNotificationSoundEnabled = (enabled) => ({
  type: types.NOTIFICATION_SET_SOUND_ENABLED,
  payload: enabled,
});

/** Record the latest browser-permission status. */
export const setBrowserPermission = (permission) => ({
  type: types.NOTIFICATION_SET_BROWSER_PERMISSION,
  payload: permission,
});

/** Toggle whether the app fires browser notifications. */
export const setBrowserAlertsEnabled = (enabled) => ({
  type: types.NOTIFICATION_SET_BROWSER_ALERTS_ENABLED,
  payload: enabled,
});
