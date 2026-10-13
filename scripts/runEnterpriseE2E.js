#!/usr/bin/env node
/**
 * @fileoverview Orchestrates isolated Firebase, API, frontend, and browser lifecycle tests.
 */

const {randomBytes} = require('crypto');
const {existsSync} = require('fs');
const net = require('net');
const path = require('path');
const {spawn} = require('child_process');

const DEMO_PROJECT_ID = 'demo-harper-vance-e2e';
const AUTH_PORT = 9099;
const FIRESTORE_PORT = 8080;
const DATABASE_PORT = 9000;
const API_PORT = 5002;
const FRONTEND_PORT = 3000;
const STARTUP_TIMEOUT_MS = 120_000;
const PASSWORD_BYTES = 32;
const DEFAULT_BACKEND_DIRECTORY = path.resolve(__dirname, '../../../golden-setups-sona-alerts');

/**
 * Resolves and validates the paired backend checkout.
 *
 * @returns {string} Absolute backend repository path
 */
const resolveBackendDirectory = () => {
  const directory = path.resolve(process.env.HARPER_VANCE_BACKEND_DIR || DEFAULT_BACKEND_DIRECTORY);
  const requiredFiles = ['firebase.json', 'functions/package.json'];
  if (!requiredFiles.every((file) => existsSync(path.join(directory, file)))) {
    throw new Error('HARPER_VANCE_BACKEND_DIR must point to the paired backend repository.');
  }
  return directory;
};

/**
 * Generates a run-scoped emulator credential that is never persisted.
 *
 * @returns {string} Random password
 */
const createPassword = () => randomBytes(PASSWORD_BYTES).toString('base64url');

/**
 * Spawns one controlled local process.
 *
 * @param {string} command - Fixed executable
 * @param {string[]} args - Fixed command arguments
 * @param {Object} options - Child process options
 * @returns {import('child_process').ChildProcess} Spawned process
 */
const startProcess = (command, args, options) => spawn(command, args, {
  ...options,
  stdio: 'inherit',
});

/**
 * Waits until a loopback port accepts connections.
 *
 * @param {number} port - Local port
 * @param {number} [timeoutMs=STARTUP_TIMEOUT_MS] - Maximum wait
 * @returns {Promise<void>}
 */
const waitForPort = (port, timeoutMs = STARTUP_TIMEOUT_MS) => new Promise((resolve, reject) => {
  const startedAt = Date.now();
  const attempt = () => {
    const socket = net.createConnection({host: '127.0.0.1', port});
    socket.once('connect', () => {
      socket.destroy();
      resolve();
    });
    socket.once('error', () => {
      socket.destroy();
      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error(`Local service on port ${port} did not start in time.`));
        return;
      }
      setTimeout(attempt, 250);
    });
  };
  attempt();
});

/**
 * Waits for a child command and rejects on non-zero exit.
 *
 * @param {import('child_process').ChildProcess} child - Active child process
 * @param {string} label - Safe command label
 * @returns {Promise<void>}
 */
const waitForExit = (child, label) => new Promise((resolve, reject) => {
  child.once('error', reject);
  child.once('exit', (code, signal) => {
    if (code === 0) {
      resolve();
      return;
    }
    reject(new Error(`${label} failed (${signal || code}).`));
  });
});

/**
 * Stops a long-running child process without escalating to destructive signals.
 *
 * @param {import('child_process').ChildProcess|undefined} child - Child to stop
 * @param {NodeJS.Signals} signal - Graceful shutdown signal
 * @returns {void}
 */
const stopProcess = (child, signal) => {
  if (child && child.exitCode === null && !child.killed) child.kill(signal);
};

/**
 * Builds the shared isolated environment for all lifecycle services.
 *
 * @param {string} ownerPassword - Run-scoped owner password
 * @param {string} existingPassword - Run-scoped existing-user password
 * @returns {NodeJS.ProcessEnv} Child environment
 */
const buildEnvironment = (ownerPassword, existingPassword) => ({
  ...process.env,
  NODE_ENV: 'test',
  BROWSER: 'none',
  GCLOUD_PROJECT: DEMO_PROJECT_ID,
  GOOGLE_CLOUD_PROJECT: DEMO_PROJECT_ID,
  FIREBASE_AUTH_EMULATOR_HOST: `127.0.0.1:${AUTH_PORT}`,
  FIRESTORE_EMULATOR_HOST: `127.0.0.1:${FIRESTORE_PORT}`,
  FIREBASE_DATABASE_EMULATOR_HOST: `127.0.0.1:${DATABASE_PORT}`,
  E2E_API_PORT: String(API_PORT),
  E2E_OWNER_PASSWORD: ownerPassword,
  E2E_EXISTING_CUSTOMER_PASSWORD: existingPassword,
  PLAYWRIGHT_ENTERPRISE_E2E: 'true',
  REACT_APP_USE_FIREBASE_EMULATORS: 'true',
  REACT_APP_FIREBASE_EMULATOR_HOST: '127.0.0.1',
  REACT_APP_FIREBASE_AUTH_EMULATOR_PORT: String(AUTH_PORT),
  REACT_APP_FIRESTORE_EMULATOR_PORT: String(FIRESTORE_PORT),
  REACT_APP_FIREBASE_DATABASE_EMULATOR_PORT: String(DATABASE_PORT),
  REACT_APP_FIREBASE_API_KEY: 'demo-api-key',
  REACT_APP_FIREBASE_AUTH_DOMAIN: `${DEMO_PROJECT_ID}.firebaseapp.com`,
  REACT_APP_FIREBASE_DATABASE_URL: `http://127.0.0.1:${DATABASE_PORT}?ns=${DEMO_PROJECT_ID}`,
  REACT_APP_FIREBASE_CLIENT_DATABASE_URL: `http://127.0.0.1:${DATABASE_PORT}?ns=${DEMO_PROJECT_ID}-client-data`,
  REACT_APP_FIREBASE_PROJECT_ID: DEMO_PROJECT_ID,
  REACT_APP_FIREBASE_STORAGE_BUCKET: `${DEMO_PROJECT_ID}.appspot.com`,
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  REACT_APP_FIREBASE_APP_ID: '1:123456789:web:enterprise-e2e',
  REACT_APP_API_BASE_URL: `http://127.0.0.1:${API_PORT}`,
  ALLOWED_ORIGINS: `http://127.0.0.1:${FRONTEND_PORT}`,
});

/**
 * Runs the isolated enterprise lifecycle certification.
 *
 * @returns {Promise<void>}
 */
const run = async () => {
  const backendDirectory = resolveBackendDirectory();
  const ownerPassword = createPassword();
  const existingPassword = createPassword();
  const environment = buildEnvironment(ownerPassword, existingPassword);
  let emulators;
  let api;

  try {
    emulators = startProcess('firebase', [
      'emulators:start',
      '--only', 'auth,firestore,database',
      '--project', DEMO_PROJECT_ID,
      '--config', path.join(backendDirectory, 'firebase.json'),
    ], {cwd: backendDirectory, env: environment});
    await Promise.all([
      waitForPort(AUTH_PORT),
      waitForPort(FIRESTORE_PORT),
      waitForPort(DATABASE_PORT),
    ]);

    api = startProcess('node', ['functions/scripts/serveEnterpriseE2E.js'], {
      cwd: backendDirectory,
      env: environment,
    });
    await waitForPort(API_PORT);

    const seed = startProcess('node', ['functions/scripts/seedEnterpriseE2E.js'], {
      cwd: backendDirectory,
      env: environment,
    });
    await waitForExit(seed, 'Enterprise E2E seed');

    const browser = startProcess('node', [
      'node_modules/@playwright/test/cli.js',
      'test',
      'e2e/enterprise-lifecycle.spec.js',
    ], {cwd: path.resolve(__dirname, '..'), env: environment});
    await waitForExit(browser, 'Enterprise browser suite');
  } finally {
    stopProcess(api, 'SIGTERM');
    stopProcess(emulators, 'SIGINT');
  }
};

if (require.main === module) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  DEMO_PROJECT_ID,
  resolveBackendDirectory,
  createPassword,
  waitForPort,
  buildEnvironment,
  run,
};

