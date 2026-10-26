/**
 * Detects which targets are newly arrived since the last poll. On the first
 * call (seenIds === null) it returns no fresh targets and just seeds the id set,
 * so the initial full load never triggers a burst of notifications.
 *
 * @param {Set<string>|null} seenIds - Ids seen on the previous call, or null on first run
 * @param {Object[]} targets - Current targets array
 * @returns {{ fresh: Object[], ids: Set<string> }} Newly arrived targets and the updated id set
 */
export const detectNewTargets = (seenIds, targets) => {
  const list = targets || [];
  const ids = new Set(list.map((t) => t.alertId));
  const fresh = seenIds ? list.filter((t) => !seenIds.has(t.alertId)) : [];
  return { fresh, ids };
};

/** Whether the browser Notification API is available. */
export const notificationsSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window;

/**
 * Requests browser notification permission.
 * @returns {Promise<'granted'|'denied'|'default'|'unsupported'>}
 */
export const requestNotificationPermission = async () => {
  if (!notificationsSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
};

/**
 * Shows a browser notification if permission has been granted. No-op otherwise.
 * @param {string} title
 * @param {string} body
 * @returns {boolean} Whether a notification was shown
 */
export const showBrowserNotification = (title, body) => {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  try {
    // eslint-disable-next-line no-new
    new Notification(title, { body });
    return true;
  } catch {
    return false;
  }
};
