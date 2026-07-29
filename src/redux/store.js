import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { thunk } from 'redux-thunk';
import { reducer as formReducer } from 'redux-form';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web

// Import reducers
import authReducer from './authentication/authReducers';
import sonaStatsReducer from '../features/sonaStats/redux/reducers/sonaStatsReducer';
import notificationsReducer from './notifications/notificationReducers';
import preferencesReducer from './preferences/preferencesReducers';
import organizationReducer from '../features/organizations/redux/orgReducers';
import { safeAuthTransform, safeOrgTransform } from './persistTransforms';

// Persist configuration
// Auth is persisted through safeAuthTransform which whitelists only the
// minimal fields needed to bootstrap the UI before Firebase reconciles auth
// state (uid, email, role, emailVerified, displayName, photoURL). Tokens,
// claims, errors, and lifecycle timestamps are deliberately not persisted.
//
// Organization is persisted through safeOrgTransform which keeps only
// currentOrgId so the org switcher remembers the last selection. The
// current role is deliberately NOT persisted — it must be re-derived from
// a fresh ID token on next boot so stale roles cannot survive a
// server-side change.
const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['auth', 'notifications', 'preferences', 'organization'],
  transforms: [safeAuthTransform, safeOrgTransform],
};

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  form: formReducer, // redux-form reducer (not persisted)
  sonaStats: sonaStatsReducer, // not persisted — fresh fetch each session
  notifications: notificationsReducer,
  preferences: preferencesReducer,
  organization: organizationReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Enhanced DevTools Configuration
const composeEnhancers = (() => {
  // Check if we're in development
  if (process.env.NODE_ENV === 'development') {
    // Browser DevTools Extension (existing)
    if (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
      return window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
    }
    // Fallback to compose with expo dev tools
    return compose;
  }
  // Production - no dev tools
  return compose;
})();

// Create store with enhanced middleware
const store = createStore(
  persistedReducer,
  composeEnhancers(
    applyMiddleware(thunk)
  )
);

// Create persistor
const persistor = persistStore(store, null, () => {
  console.log('Redux Persist: Rehydration complete');
  console.log('Current auth state:', store.getState().auth);
});

// Debug: Log when store is created
console.log('Redux store created with initial state:', store.getState());

export { store, persistor };
export default store;
