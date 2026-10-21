const {defineConfig, devices} = require('@playwright/test');

const DEFAULT_LOCAL_PORT = 3000;
const ENTERPRISE_LOCAL_PORT = 3100;
const E2E_TEST_TIMEOUT_MS = 45_000;
const E2E_EXPECT_TIMEOUT_MS = 15_000;
const LOCAL_SERVER_TIMEOUT_MS = 120_000;
const LOCAL_WORKER_COUNT = 2;
const remoteBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const enterpriseMode = process.env.PLAYWRIGHT_ENTERPRISE_E2E === 'true';
const protectedCredentialMode = Boolean(
  process.env.E2E_BROWSER_PASSWORD || process.env.E2E_BROWSER_TOTP_SECRET,
);
const requestedLocalPort = Number.parseInt(process.env.PLAYWRIGHT_LOCAL_PORT, 10);
const publicLocalPort = Number.isInteger(requestedLocalPort) && requestedLocalPort >= 1024 &&
  requestedLocalPort <= 65535 ? requestedLocalPort : DEFAULT_LOCAL_PORT;
const localPort = enterpriseMode ? ENTERPRISE_LOCAL_PORT : publicLocalPort;
const localBaseUrl = `http://127.0.0.1:${localPort}`;

/**
 * Configures Playwright browser checks for local builds and deployed previews.
 *
 * @returns {import('@playwright/test').PlaywrightTestConfig} Playwright test configuration.
 */
function createPlaywrightConfig() {
  return defineConfig({
    testDir: './e2e',
    outputDir: 'test-results/e2e',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI && !protectedCredentialMode ? 1 : 0,
    maxFailures: protectedCredentialMode ? 1 : 0,
    workers: process.env.CI ? 1 : LOCAL_WORKER_COUNT,
    timeout: E2E_TEST_TIMEOUT_MS,
    expect: {
      timeout: E2E_EXPECT_TIMEOUT_MS,
    },
    reporter: process.env.CI
      ? [['line'], ['html', {open: 'never', outputFolder: 'playwright-report'}]]
      : [['list'], ['html', {open: 'never', outputFolder: 'playwright-report'}]],
    use: {
      baseURL: remoteBaseUrl || localBaseUrl,
      screenshot: protectedCredentialMode ? 'off' : 'only-on-failure',
      trace: protectedCredentialMode ? 'off' : 'retain-on-failure',
      video: protectedCredentialMode ? 'off' : 'retain-on-failure',
    },
    projects: [
      {
        name: 'chromium',
        use: {...devices['Desktop Chrome']},
      },
    ],
    webServer: remoteBaseUrl
      ? undefined
      : {
          command: process.env.CI ? 'yarn serve:build' : 'yarn start',
          env: {
            ...process.env,
            BROWSER: 'none',
            PORT: String(localPort),
          },
          url: localBaseUrl,
          reuseExistingServer: enterpriseMode ? false : !process.env.CI,
          timeout: LOCAL_SERVER_TIMEOUT_MS,
        },
  });
}

module.exports = createPlaywrightConfig();
