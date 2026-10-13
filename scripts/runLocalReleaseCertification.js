#!/usr/bin/env node
/**
 * @fileoverview Runs the complete paired local release certification without
 * pushing, deploying, or contacting production services.
 */

const path = require('path');
const {spawnSync} = require('child_process');
const {resolveBackendDirectory} = require('./runEnterpriseE2E');

const MINIMUM_NODE_MAJOR = 22;
const DEFAULT_PUBLIC_BROWSER_PORT = 3200;

/**
 * Returns a validated loopback port for the public browser suite.
 *
 * @returns {number} Local TCP port
 */
const resolvePublicBrowserPort = () => {
  const requested = Number.parseInt(process.env.CERTIFICATION_PUBLIC_PORT, 10);
  if (!process.env.CERTIFICATION_PUBLIC_PORT) return DEFAULT_PUBLIC_BROWSER_PORT;
  if (!Number.isInteger(requested) || requested < 1024 || requested > 65535) {
    throw new Error('CERTIFICATION_PUBLIC_PORT must be an integer from 1024 through 65535.');
  }
  return requested;
};

/**
 * Requires the same supported Node major used by the backend runtime.
 *
 * @returns {void}
 */
const assertSupportedNode = () => {
  const major = Number.parseInt(process.versions.node.split('.')[0], 10);
  if (major < MINIMUM_NODE_MAJOR) {
    throw new Error(`Local certification requires Node.js ${MINIMUM_NODE_MAJOR} or newer.`);
  }
};

/**
 * Runs one fixed command and stops immediately if it fails.
 *
 * @param {Object} step - Certification step
 * @param {string} step.label - Human-readable step label
 * @param {string} step.command - Fixed executable
 * @param {string[]} step.args - Fixed command arguments
 * @param {string} step.cwd - Working directory
 * @param {NodeJS.ProcessEnv} [step.env] - Safe child environment
 * @returns {void}
 */
const runStep = ({label, command, args, cwd, env = process.env}) => {
  console.log(`\n[certification] ${label}`);
  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}.`);
  }
};

/**
 * Runs all local release gates in dependency-safe order.
 *
 * @returns {void}
 */
const run = () => {
  assertSupportedNode();
  const frontendDirectory = path.resolve(__dirname, '..');
  const backendDirectory = resolveBackendDirectory();
  const functionsDirectory = path.join(backendDirectory, 'functions');
  const publicPort = resolvePublicBrowserPort();
  const browserEnvironment = {
    ...process.env,
    CI: 'true',
    PLAYWRIGHT_LOCAL_PORT: String(publicPort),
  };

  const steps = [
    {label: 'Backend lint', command: 'npm', args: ['run', 'lint'], cwd: functionsDirectory},
    {
      label: 'Backend service tests',
      command: 'npm',
      args: ['test', '--', '--runInBand', '--watchman=false'],
      cwd: functionsDirectory,
    },
    {
      label: 'Firebase security rules',
      command: 'npm',
      args: ['run', 'test:rules'],
      cwd: functionsDirectory,
    },
    {
      label: 'Frontend unit and component tests',
      command: 'yarn',
      args: ['test', '--runInBand', '--watchAll=false', '--watchman=false'],
      cwd: frontendDirectory,
    },
    {label: 'Frontend production build', command: 'yarn', args: ['build'], cwd: frontendDirectory},
    {label: 'Frontend bundle budget', command: 'yarn', args: ['check:bundle'], cwd: frontendDirectory},
    {
      label: 'Public and signed-out browser journeys',
      command: 'yarn',
      args: ['test:e2e'],
      cwd: frontendDirectory,
      env: browserEnvironment,
    },
    {
      label: 'Isolated enterprise browser lifecycle',
      command: 'yarn',
      args: ['test:e2e:enterprise'],
      cwd: frontendDirectory,
    },
  ];

  steps.forEach(runStep);
  console.log('\n[certification] All local release gates passed. No push or deployment was performed.');
};

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error(`[certification] ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  MINIMUM_NODE_MAJOR,
  DEFAULT_PUBLIC_BROWSER_PORT,
  resolvePublicBrowserPort,
  assertSupportedNode,
  runStep,
  run,
};

