/**
 * @fileoverview Firebase web SDK bootstrap.
 *
 * Configuration is sourced from REACT_APP_FIREBASE_* environment variables
 * which are baked in at build time by Create React App. .env.development
 * ships committed defaults so local dev "just works"; production builds
 * must inject values via CI or a gitignored .env.
 *
 * NOTE: Firebase web SDK config values are public-by-design — they identify
 * the project and ship in the JS bundle. Real security comes from Firestore
 * rules, Storage rules, and the Admin SDK on the backend.
 */

import {initializeApp} from 'firebase/app';
import {getAuth, onAuthStateChanged} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
import {getDatabase} from 'firebase/database';
import {getAnalytics} from 'firebase/analytics';

const REQUIRED_KEYS = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_DATABASE_URL',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID',
];

const missing = REQUIRED_KEYS.filter((k) => !process.env[k]);
if (missing.length > 0) {
  throw new Error(
      `Firebase config is missing required env vars: ${missing.join(', ')}. ` +
      `Copy .env.example to .env (or rely on .env.development for local dev) ` +
      `and populate before starting the app.`,
  );
}

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
// Firestore database ID — the backend writes to a named database
// (see functions/helpers/firebaseInit.js). Configurable via env so
// staging/prod can point at different named databases. Falls back to
// the (default) database when not set.
const FIRESTORE_DATABASE_ID = process.env.REACT_APP_FIRESTORE_DATABASE_ID || 'sona';
export const firestore = FIRESTORE_DATABASE_ID && FIRESTORE_DATABASE_ID !== '(default)'
  ? getFirestore(app, FIRESTORE_DATABASE_ID)
  : getFirestore(app);
export const database = getDatabase(app);

// Resolves on the first onAuthStateChanged fire, which is Firebase's signal
// that persistence restore is complete. Any code that reads auth.currentUser
// on cold start (e.g. the axios request interceptor) should await this first
// so it doesn't see a false null before the SDK has hydrated.
export const authReady = new Promise((resolve) => {
  const unsub = onAuthStateChanged(auth, () => {
    unsub();
    resolve();
  });
});

// Optional secondary database for client-side reads; defaults to primary
// when REACT_APP_FIREBASE_CLIENT_DATABASE_URL is not supplied.
const clientDbUrl = process.env.REACT_APP_FIREBASE_CLIENT_DATABASE_URL;
export const clientDatabase = clientDbUrl ? getDatabase(app, clientDbUrl) : database;

// Analytics is best-effort. Guarded so SSR / unsupported browsers don't crash
// the bundle.
let analyticsInstance = null;
try {
  if (typeof window !== 'undefined' && process.env.REACT_APP_FIREBASE_MEASUREMENT_ID) {
    analyticsInstance = getAnalytics(app);
  }
} catch (_err) {
  analyticsInstance = null;
}
export const analytics = analyticsInstance;

export default app;
