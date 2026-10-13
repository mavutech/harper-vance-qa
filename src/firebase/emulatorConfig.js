/**
 * @fileoverview Fail-closed Firebase emulator wiring for local enterprise browser tests.
 */

import {connectAuthEmulator} from 'firebase/auth';
import {connectFirestoreEmulator} from 'firebase/firestore';
import {connectDatabaseEmulator} from 'firebase/database';

const DEFAULT_EMULATOR_HOST = '127.0.0.1';
const DEFAULT_AUTH_PORT = 9099;
const DEFAULT_FIRESTORE_PORT = 8080;
const DEFAULT_DATABASE_PORT = 9000;

/**
 * Returns a validated integer port from the local environment.
 *
 * @param {string|undefined} value - Optional environment value
 * @param {number} fallback - Approved default port
 * @returns {number} Validated port
 */
export const resolveEmulatorPort = (value, fallback) => {
  const port = Number(value || fallback);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error('Firebase emulator ports must be valid non-privileged ports.');
  }
  return port;
};

/**
 * Validates that emulator mode cannot be enabled for a production build or
 * a real Firebase project.
 *
 * @param {NodeJS.ProcessEnv} environment - Build-time environment
 * @returns {boolean} Whether isolated emulator mode is enabled
 */
export const shouldUseFirebaseEmulators = (environment) => {
  if (environment.REACT_APP_USE_FIREBASE_EMULATORS !== 'true') return false;
  const projectId = environment.REACT_APP_FIREBASE_PROJECT_ID || '';
  const apiBaseUrl = environment.REACT_APP_API_BASE_URL || '';
  const isLocalApi = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?(?:\/|$)/.test(apiBaseUrl);
  if (environment.NODE_ENV === 'production' || !projectId.startsWith('demo-') || !isLocalApi) {
    throw new Error('Firebase emulator mode requires a non-production demo project and local API.');
  }
  return true;
};

/**
 * Connects every browser Firebase surface to local emulators before auth
 * persistence is restored.
 *
 * @param {Object} services - Initialized Firebase browser services
 * @param {import('firebase/auth').Auth} services.auth - Auth service
 * @param {import('firebase/firestore').Firestore} services.firestore - Firestore service
 * @param {import('firebase/database').Database[]} services.databases - Realtime Database services
 * @param {NodeJS.ProcessEnv} environment - Build-time environment
 * @returns {boolean} Whether emulator connections were installed
 */
export const configureFirebaseEmulators = ({auth, firestore, databases}, environment) => {
  if (!shouldUseFirebaseEmulators(environment)) return false;
  const host = environment.REACT_APP_FIREBASE_EMULATOR_HOST || DEFAULT_EMULATOR_HOST;
  const authPort = resolveEmulatorPort(
      environment.REACT_APP_FIREBASE_AUTH_EMULATOR_PORT,
      DEFAULT_AUTH_PORT,
  );
  const firestorePort = resolveEmulatorPort(
      environment.REACT_APP_FIRESTORE_EMULATOR_PORT,
      DEFAULT_FIRESTORE_PORT,
  );
  const databasePort = resolveEmulatorPort(
      environment.REACT_APP_FIREBASE_DATABASE_EMULATOR_PORT,
      DEFAULT_DATABASE_PORT,
  );

  connectAuthEmulator(auth, `http://${host}:${authPort}`, {disableWarnings: true});
  connectFirestoreEmulator(firestore, host, firestorePort);
  [...new Set(databases)].forEach((database) => {
    connectDatabaseEmulator(database, host, databasePort);
  });
  return true;
};

