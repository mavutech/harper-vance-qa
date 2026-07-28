import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import { useTodaysTargets } from '../sonaStats/hooks/useTodaysTargets';
import {
  addTargetNotification,
  pruneStaleNotifications,
  setBrowserPermission,
} from '../../redux/notifications/notificationActions';
import {
  showBrowserNotification,
  notificationsSupported,
} from '../sonaStats/utils/targetNotifications';
import { playNotificationPing } from './playNotificationPing';

/**
 * Mountable side-effect component that bridges the live SONA target feed into
 * the Redux notifications slice. Designed to live once in the protected route
 * shell so navigating between pages does not re-open the subscription.
 *
 * Behavior:
 *   - First batch (initial RTDB load) seeds the seen sets — no notifications.
 *   - New target rows  -> dispatch `addTargetNotification(target, 'new')`.
 *   - Existing rows whose `targetReached` flips true -> dispatch `'hit'`.
 *   - Existing rows that are still unresolved when the session closes ->
 *     dispatch `'miss'` once.
 *   - Audio ping + browser notification fire when `soundEnabled` /
 *     permission allow.
 *   - On calendar-day rollover, dispatch `pruneStaleNotifications(today)`.
 *
 * Renders nothing.
 */
const NotificationsRealtimeBridge = () => {
  const dispatch = useDispatch();
  const soundEnabled = useSelector((s) => s.notifications.soundEnabled);
  const browserPermission = useSelector((s) => s.notifications.browserPermission);
  const browserAlertsEnabled = useSelector((s) => s.notifications.browserAlertsEnabled);
  const items = useSelector((s) => s.notifications.items);
  const { targets } = useTodaysTargets();

  const seenIdsRef = useRef(null);
  const hitIdsRef = useRef(new Set());
  const missIdsRef = useRef(new Set());
  const dayRef = useRef(moment().format('YYYY-MM-DD'));
  // Always-current snapshot of alertIds already represented in Redux.
  // Read by the targets effect so we never re-emit something we've already
  // recorded (handles redux-persist rehydration races + accidental re-seeds).
  const persistedIdsRef = useRef(new Set());
  useEffect(() => {
    persistedIdsRef.current = new Set((items || []).map((n) => n.alertId));
  }, [items]);

  // Sync the persisted permission state with the actual browser state on
  // mount. The user may have granted/revoked permission outside the app,
  // and our Redux value (loaded from localStorage) could be stale.
  useEffect(() => {
    if (!notificationsSupported()) {
      dispatch(setBrowserPermission('unsupported'));
      return;
    }
    dispatch(setBrowserPermission(Notification.permission));
  }, [dispatch]);

  // Prune state from previous days on mount + on date rollover. We poll once
  // a minute — cheap and avoids depending on tab-focus events.
  useEffect(() => {
    const tick = () => {
      const today = moment().format('YYYY-MM-DD');
      if (today !== dayRef.current) {
        dayRef.current = today;
        seenIdsRef.current = null;
        hitIdsRef.current = new Set();
        missIdsRef.current = new Set();
        dispatch(pruneStaleNotifications(today));
      }
    };
    tick();
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, [dispatch]);

  useEffect(() => {
    const list = targets || [];
    const ids = new Set(list.map((t) => t.alertId));

    // First non-empty batch — seed only, do not fire anything.
    // We deliberately skip empty arrays: they represent "data not loaded yet",
    // not "session has zero targets". Seeding on [] would re-emit every
    // target as `new` on the next render.
    if (seenIdsRef.current === null) {
      if (list.length === 0) return;
      seenIdsRef.current = ids;
      list.forEach((t) => {
        if (t.targetReached) hitIdsRef.current.add(t.alertId);
      });
      return;
    }

    // Dedupe against both this session's seen set AND anything already in
    // the persisted Redux store, so a remount never re-fires.
    const persisted = persistedIdsRef.current;
    const fresh = list.filter(
        (t) => !seenIdsRef.current.has(t.alertId) && !persisted.has(t.alertId));
    const newlyHit = list.filter(
        (t) => t.targetReached && !hitIdsRef.current.has(t.alertId));

    fresh.forEach((t) => {
      dispatch(addTargetNotification(t, 'new'));
      if (soundEnabled) playNotificationPing();
      if (browserAlertsEnabled && browserPermission === 'granted' && notificationsSupported()) {
        const dir = t.colorHighlight ? `New ${t.colorHighlight}` : 'New target';
        showBrowserNotification(`New ${dir} target`, `${t.targetPrice || ''}`);
      }
    });

    newlyHit.forEach((t) => {
      dispatch(addTargetNotification(t, 'hit'));
      hitIdsRef.current.add(t.alertId);
      if (soundEnabled) playNotificationPing();
      if (browserAlertsEnabled && browserPermission === 'granted' && notificationsSupported()) {
        showBrowserNotification('Target hit', `${t.targetPrice || ''}`);
      }
    });

    seenIdsRef.current = ids;
  }, [targets, dispatch, soundEnabled, browserPermission, browserAlertsEnabled]);

  return null;
};

export default NotificationsRealtimeBridge;
