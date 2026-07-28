import * as types from './notificationTypes';

/** Maximum notifications retained in state (oldest dropped first). */
export const MAX_NOTIFICATIONS = 50;

const INITIAL_STATE = {
  /** Array of notification objects, newest first. See action docs for shape. */
  items: [],
  /** Count of items with read === false. */
  unreadCount: 0,
  /** User-controlled audio ping toggle. */
  soundEnabled: true,
  /**
   * Latest known browser-notification permission state.
   * 'default' | 'granted' | 'denied' | 'unsupported'.
   */
  browserPermission: 'default',
  /** App-level toggle: fire browser notifications when permission allows. */
  browserAlertsEnabled: true,
};

/**
 * Recomputes unreadCount from items so we never drift.
 *
 * @param {Object[]} items
 * @returns {number}
 */
const countUnread = (items) => items.reduce((n, x) => n + (x.read ? 0 : 1), 0);

/**
 * Returns an item ISO date in `YYYY-MM-DD` (UTC ms → local date). Used by the
 * stale-prune reducer.
 *
 * @param {Object} n
 * @returns {string}
 */
const itemDate = (n) => new Date(n.ts).toISOString().slice(0, 10);

const notificationsReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {

    case types.NOTIFICATION_ADD: {
      const incoming = action.payload;
      // Dedupe by id so a hit-update doesn't double-add the same kind.
      const existingIdx = state.items.findIndex(
          (n) => n.id === incoming.id && n.kind === incoming.kind);
      let items;
      if (existingIdx >= 0) {
        items = state.items.slice();
        items[existingIdx] = {...items[existingIdx], ...incoming};
      } else {
        items = [incoming, ...state.items].slice(0, MAX_NOTIFICATIONS);
      }
      return {...state, items, unreadCount: countUnread(items)};
    }

    case types.NOTIFICATION_MARK_ALL_READ: {
      if (state.unreadCount === 0) return state;
      const items = state.items.map((n) => (n.read ? n : {...n, read: true}));
      return {...state, items, unreadCount: 0};
    }

    case types.NOTIFICATION_MARK_READ: {
      const id = action.payload;
      const items = state.items.map(
          (n) => (n.id === id && !n.read ? {...n, read: true} : n));
      return {...state, items, unreadCount: countUnread(items)};
    }

    case types.NOTIFICATION_CLEAR:
      return {...state, items: [], unreadCount: 0};

    case types.NOTIFICATION_PRUNE_STALE: {
      const keepDate = action.payload; // YYYY-MM-DD
      const items = state.items.filter((n) => itemDate(n) === keepDate);
      if (items.length === state.items.length) return state;
      return {...state, items, unreadCount: countUnread(items)};
    }

    case types.NOTIFICATION_SET_SOUND_ENABLED:
      return {...state, soundEnabled: !!action.payload};

    case types.NOTIFICATION_SET_BROWSER_PERMISSION:
      return {...state, browserPermission: action.payload};

    case types.NOTIFICATION_SET_BROWSER_ALERTS_ENABLED:
      return {...state, browserAlertsEnabled: !!action.payload};

    default:
      return state;
  }
};

export default notificationsReducer;
