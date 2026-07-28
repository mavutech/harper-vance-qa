import reducer, { MAX_NOTIFICATIONS } from './notificationReducers';
import {
  addTargetNotification,
  markAllNotificationsRead,
  markNotificationRead,
  clearNotifications,
  pruneStaleNotifications,
  setNotificationSoundEnabled,
  setBrowserPermission,
} from './notificationActions';
import { BULLISH_COLOR } from '../../features/sonaStats/utils/sonaStatsConstants';

const newTarget = (overrides = {}) => ({
  alertId: 'a1',
  colorHighlight: BULLISH_COLOR,
  targetPrice: '22305',
  rawTime: '2026-06-22T13:35:00Z',
  bucketContext: { hitRate: 90, medianRetraction: 8 },
  ...overrides,
});

const hitTarget = (overrides = {}) => ({
  alertId: 'a1',
  colorHighlight: BULLISH_COLOR,
  targetPrice: '22305',
  targetReached: true,
  targetReachedTimestamp: '1782106800',
  ...overrides,
});

describe('notifications reducer', () => {
  it('starts empty with sound on and default permission', () => {
    const s = reducer(undefined, { type: '@@INIT' });
    expect(s.items).toEqual([]);
    expect(s.unreadCount).toBe(0);
    expect(s.soundEnabled).toBe(true);
    expect(s.browserPermission).toBe('default');
  });

  it('adds a notification and increments unreadCount', () => {
    const s = reducer(undefined, addTargetNotification(newTarget(), 'new'));
    expect(s.items).toHaveLength(1);
    expect(s.unreadCount).toBe(1);
    expect(s.items[0].kind).toBe('new');
    expect(s.items[0].direction).toBe('Bullish');
    expect(s.items[0].read).toBe(false);
  });

  it('dedupes the same alertId+kind on second add', () => {
    let s = reducer(undefined, addTargetNotification(newTarget(), 'new'));
    s = reducer(s, addTargetNotification(newTarget(), 'new'));
    expect(s.items).toHaveLength(1);
    expect(s.unreadCount).toBe(1);
  });

  it('keeps both new and hit entries for the same alertId', () => {
    let s = reducer(undefined, addTargetNotification(newTarget(), 'new'));
    s = reducer(s, addTargetNotification(hitTarget(), 'hit'));
    expect(s.items).toHaveLength(2);
    expect(s.items[0].kind).toBe('hit'); // newest first
    expect(s.items[1].kind).toBe('new');
    expect(s.unreadCount).toBe(2);
  });

  it(`caps items at ${MAX_NOTIFICATIONS} (oldest drops)`, () => {
    let s;
    for (let i = 0; i <= MAX_NOTIFICATIONS + 5; i += 1) {
      s = reducer(s, addTargetNotification(
          newTarget({ alertId: `a${i}` }), 'new'));
    }
    expect(s.items).toHaveLength(MAX_NOTIFICATIONS);
    expect(s.items[0].alertId).toBe(`a${MAX_NOTIFICATIONS + 5}`);
  });

  it('marks all as read', () => {
    let s = reducer(undefined, addTargetNotification(newTarget(), 'new'));
    s = reducer(s, addTargetNotification(newTarget({ alertId: 'a2' }), 'new'));
    s = reducer(s, markAllNotificationsRead());
    expect(s.unreadCount).toBe(0);
    expect(s.items.every((n) => n.read)).toBe(true);
  });

  it('marks one as read', () => {
    let s = reducer(undefined, addTargetNotification(newTarget(), 'new'));
    s = reducer(s, addTargetNotification(newTarget({ alertId: 'a2' }), 'new'));
    s = reducer(s, markNotificationRead('new:a1'));
    expect(s.unreadCount).toBe(1);
    expect(s.items.find((n) => n.id === 'new:a1').read).toBe(true);
  });

  it('clears every notification', () => {
    let s = reducer(undefined, addTargetNotification(newTarget(), 'new'));
    s = reducer(s, clearNotifications());
    expect(s.items).toEqual([]);
    expect(s.unreadCount).toBe(0);
  });

  it('prunes notifications from other days', () => {
    const today = '2026-06-22';
    const oldTs = new Date('2026-06-21T15:00:00Z').getTime();
    const todayTs = new Date(`${today}T15:00:00Z`).getTime();
    const startState = {
      items: [
        { id: 'new:a1', kind: 'new', alertId: 'a1', ts: oldTs, read: false },
        { id: 'new:a2', kind: 'new', alertId: 'a2', ts: todayTs, read: false },
      ],
      unreadCount: 2,
      soundEnabled: true,
      browserPermission: 'default',
    };
    const s = reducer(startState, pruneStaleNotifications(today));
    expect(s.items).toHaveLength(1);
    expect(s.items[0].id).toBe('new:a2');
    expect(s.unreadCount).toBe(1);
  });

  it('toggles soundEnabled', () => {
    let s = reducer(undefined, setNotificationSoundEnabled(false));
    expect(s.soundEnabled).toBe(false);
    s = reducer(s, setNotificationSoundEnabled(true));
    expect(s.soundEnabled).toBe(true);
  });

  it('updates browser permission', () => {
    const s = reducer(undefined, setBrowserPermission('granted'));
    expect(s.browserPermission).toBe('granted');
  });
});
