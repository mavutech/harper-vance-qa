const {defineConfig, devices} = require('@playwright/test');

const DEFAULT_LOCAL_BASE_URL = 'http://127.0.0.1:3000';
const E2E_TEST_TIMEOUT_MS = 45_000;
const E2E_EXPECT_TIMEOUT_MS = 15_000;
const LOCAL_SERVER_TIMEOUT_MS = 120_000;
const LOCAL_WORKER_COUNT = 2;
const remoteBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

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
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : LOCAL_WORKER_COUNT,
    timeout: E2E_TEST_TIMEOUT_MS,
    expect: {
      timeout: E2E_EXPECT_TIMEOUT_MS,
    },
    reporter: process.env.CI
      ? [['line'], ['html', {open: 'never', outputFolder: 'playwright-report'}]]
      : [['list'], ['html', {open: 'never', outputFolder: 'playwright-report'}]],
    use: {
      baseURL: remoteBaseUrl || DEFAULT_LOCAL_BASE_URL,
      screenshot: 'only-on-failure',
      trace: 'retain-on-failure',
      video: 'retain-on-failure',
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
          command: 'yarn start',
          env: {
            ...process.env,
            BROWSER: 'none',
          },
          url: DEFAULT_LOCAL_BASE_URL,
          reuseExistingServer: !process.env.CI,
          timeout: LOCAL_SERVER_TIMEOUT_MS,
        },
  });
}

module.exports = createPlaywrightConfig();
