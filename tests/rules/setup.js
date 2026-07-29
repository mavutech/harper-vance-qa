/**
 * @fileoverview Shared harness for Firestore Rules unit tests.
 *
 * Wraps `@firebase/rules-unit-testing` with helpers for the two contexts
 * we care about:
 *   - authenticatedContext(uid, claims) — a signed-in user with optional
 *     custom claims (used to simulate org roles via `token.orgs`).
 *   - unauthenticatedContext() — anonymous client.
 *
 * Also exposes `seed(callback)` which runs a Firestore mutation with
 * security rules bypassed, so tests can pre-populate documents that the
 * rules would otherwise block.
 */

/**
 * @fileoverview Shared harness for Firestore Rules unit tests.
 *
 * Uses Node's built-in test runner (`node:test`) instead of Jest to avoid
 * version conflicts with react-scripts@5's bundled Jest 27. Node 20 has
 * full web APIs (fetch, ReadableStream, etc.) needed by
 * @firebase/rules-unit-testing.
 *
 * Exposed helpers:
 *   - setupTestEnv(): call from `before(...)`
 *   - teardownTestEnv(): call from `after(...)`
 *   - clearFirestore(): call from `beforeEach(...)`
 *   - authed(uid, claims), anon(), seed(cb)
 *   - assertFails, assertSucceeds (re-exported from rules-unit-testing)
 */

const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');

const RULES_PATH = path.resolve(__dirname, '..', '..', 'firestore.rules');
const PROJECT_ID = 'demo-harper-vance-rules';

let testEnv;

/**
 * Initialises the shared test environment. Call from `before(...)`.
 *
 * @returns {Promise<void>}
 */
async function setupTestEnv() {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(RULES_PATH, 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
}

/**
 * Clears all Firestore data between tests. Call from `beforeEach(...)`.
 *
 * @returns {Promise<void>}
 */
async function clearFirestore() {
  await testEnv.clearFirestore();
}

/**
 * Tears down the test environment. Call from `after(...)`.
 *
 * @returns {Promise<void>}
 */
async function teardownTestEnv() {
  await testEnv.cleanup();
}

/**
 * Returns a Firestore client for a signed-in user with optional custom
 * claims. Use `claims.orgs` to simulate org membership.
 *
 * @example
 *   const db = authed('alice', { orgs: { orgA: 'owner' } }).firestore();
 *
 * @param {string} uid
 * @param {object} [claims]
 * @returns {import('@firebase/rules-unit-testing').RulesTestContext}
 */
function authed(uid, claims) {
  return testEnv.authenticatedContext(uid, claims);
}

/**
 * Returns a Firestore client for an unauthenticated caller.
 *
 * @returns {import('@firebase/rules-unit-testing').RulesTestContext}
 */
function anon() {
  return testEnv.unauthenticatedContext();
}

/**
 * Runs the callback with rules disabled, useful for seeding test data.
 *
 * @param {(ctx: import('@firebase/rules-unit-testing').RulesTestContext) => Promise<void>} cb
 * @returns {Promise<void>}
 */
async function seed(cb) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await cb(ctx);
  });
}

module.exports = {
  setupTestEnv,
  clearFirestore,
  teardownTestEnv,
  authed,
  anon,
  seed,
  assertFails,
  assertSucceeds,
  PROJECT_ID,
};
