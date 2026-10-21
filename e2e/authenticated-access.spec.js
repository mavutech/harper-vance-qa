const {test, expect} = require('@playwright/test');
const {openRoute} = require('./support/navigation');
const {generateTotp} = require('./support/totp');

const BROWSER_E2E_EMAIL = 'tkmavu+harper-vance-e2e@gmail.com';
const PASSWORD_ENVIRONMENT_KEY = 'E2E_BROWSER_PASSWORD';
const TOTP_SECRET_ENVIRONMENT_KEY = 'E2E_BROWSER_TOTP_SECRET';
const AUTHENTICATED_TAG = '@authenticated';
const TOTP_PERIOD_MS = 30000;
const TOTP_MIN_REMAINING_MS = 5000;
let lastTotpCounter = -1;
const LICENSED_ROUTES = Object.freeze([
  {path: '/dashboard/sona-targets', heading: "NQ Today's Targets"},
  {path: '/dashboard/sona-daily', heading: 'NQ Daily Target Performance'},
  {path: '/dashboard/sona-weekly', heading: 'NQ Weekly Target Summary'},
  {path: '/dashboard/sona-history', heading: 'NQ Historical Target Performance'},
  {path: '/organization/team', heading: 'Team & Seats'},
]);

/**
 * Returns the protected browser password or fails without exposing its value.
 *
 * @returns {string} Protected automation password
 */
function requireBrowserPassword() {
  const password = process.env[PASSWORD_ENVIRONMENT_KEY];
  if (!password) {
    throw new Error(`${PASSWORD_ENVIRONMENT_KEY} is required for authenticated browser tests.`);
  }
  return password;
}

/**
 * Returns the protected authenticator secret without exposing its value.
 *
 * @returns {string} Protected Base32 authenticator secret
 */
function requireBrowserTotpSecret() {
  const secret = process.env[TOTP_SECRET_ENVIRONMENT_KEY];
  if (!secret) {
    throw new Error(`${TOTP_SECRET_ENVIRONMENT_KEY} is required for authenticated browser tests.`);
  }
  return secret;
}

/**
 * Returns a code from a time window not already used by this worker.
 * Firebase can reject rapid repeated MFA sessions that reuse an OTP.
 *
 * @param {boolean} forceNextWindow - Whether a retry must wait for the next window
 * @returns {Promise<string>} Fresh six-digit authenticator code
 */
async function generateFreshTotp(forceNextWindow) {
  let counter = Math.floor(Date.now() / TOTP_PERIOD_MS);
  const remaining = TOTP_PERIOD_MS - (Date.now() % TOTP_PERIOD_MS);
  if (forceNextWindow || counter <= lastTotpCounter || remaining < TOTP_MIN_REMAINING_MS) {
    const nextCounter = Math.max(counter, lastTotpCounter) + 1;
    const delay = (nextCounter * TOTP_PERIOD_MS) - Date.now() + 500;
    await new Promise((resolve) => setTimeout(resolve, Math.max(delay, 0)));
    counter = Math.floor(Date.now() / TOTP_PERIOD_MS);
  }
  lastTotpCounter = counter;
  return generateTotp(requireBrowserTotpSecret());
}

/**
 * Signs in through the same customer form used by licensed users.
 *
 * @param {import('@playwright/test').Page} page - Active Playwright page
 * @param {number} [retry=0] - Playwright retry number used to require a fresh code window
 * @param {string} [reportRoute] - Protected report deep link to preserve through sign-in
 * @returns {Promise<void>}
 */
async function signInAsBrowserCustomer(page, retry = 0, reportRoute = '') {
  await openRoute(page, reportRoute || '/login');
  await page.getByLabel('Email address').fill(BROWSER_E2E_EMAIL);
  await page.getByLabel('Password').fill(requireBrowserPassword());
  await page.getByRole('button', {name: 'Sign In'}).click();
  const codeInput = page.getByLabel('Six-digit authenticator code');
  await expect(codeInput).toBeVisible();
  await codeInput.fill(await generateFreshTotp(retry > 0));
  const verification = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.hostname === 'identitytoolkit.googleapis.com' &&
      url.pathname.endsWith('/accounts/mfaSignIn:finalize');
  });
  await page.getByRole('button', {name: 'Verify and sign in'}).click();
  const verificationResponse = await verification;
  if (!verificationResponse.ok()) {
    const body = await verificationResponse.json().catch(() => ({}));
    const rawCode = body.error?.message;
    const safeCode = typeof rawCode === 'string' && /^[A-Z_]{1,80}$/.test(rawCode)
      ? rawCode : 'UNCLASSIFIED_AUTH_ERROR';
    throw new Error(`MFA verification rejected: HTTP ${verificationResponse.status()} ${safeCode}`);
  }
  if (reportRoute) await expect(page).toHaveURL((url) => `${url.pathname}${url.search}` === reportRoute);
  else await expect(page).toHaveURL(/\/dashboard\/sona-targets$/);
}

for (const route of ['/dashboard/sona-daily?date=2026-10-20', '/dashboard/sona-weekly?week=43&year=2026']) {
  test(`${AUTHENTICATED_TAG} report link survives password and MFA sign-in: ${route}`, async ({page}, testInfo) => {
    testInfo.setTimeout(90000);
    await Promise.all([
      signInAsBrowserCustomer(page, testInfo.retry, route),
      page.waitForResponse((response) => new URL(response.url()).pathname === '/api/product/daily',
        {timeout: 75000}).then((response) => {
        expect(response.status(), 'Report data request must succeed, not only render a heading').toBe(200);
      }),
    ]);
    await expect(page.getByRole('heading', {name: route.includes('sona-daily') ?
      'NQ Daily Target Performance' : 'NQ Weekly Target Summary'})).toBeVisible();
  });
}

test(`${AUTHENTICATED_TAG} licensed customer access remains available and isolated`, async ({page}, testInfo) => {
  testInfo.setTimeout(90000);
  await signInAsBrowserCustomer(page, testInfo.retry);

  for (const route of LICENSED_ROUTES) {
    await openRoute(page, route.path);
    await expect(page).toHaveURL(new RegExp(`${route.path.replaceAll('/', '\\/')}$`));
    await expect(page.getByRole('heading', {name: route.heading})).toBeVisible();
    await expect(page.getByText(/permission denied/i)).toHaveCount(0);
  }

  await expect(page.getByText('Active seats', {exact: true})).toBeVisible();
  await expect(page.getByText('Seats allocated', {exact: true})).toBeVisible();
  await expect(page.getByText('Seats available', {exact: true})).toBeVisible();
  await expect(page.getByRole('progressbar', {name: 'Customer onboarding progress'})).toBeVisible();

  await openRoute(page, '/organization/integrations');
  await expect(page.getByRole('heading', {name: 'Integrations', exact: true})).toBeVisible();
  await expect(page.getByLabel('Organization', {exact: true})).toBeVisible();
  await expect(page.getByText('We could not complete this integration request. Please try again.')).toHaveCount(0);
  await openRoute(page, '/admin/integrations');
  await expect(page).toHaveURL(/\/pages\/error-505$/);
  await expect(page.getByRole('heading', {name: 'Forbidden'})).toBeVisible();

  await openRoute(page, '/admin/organizations');
  await expect(page).toHaveURL(/\/pages\/error-505$/);
  await expect(page.getByRole('heading', {name: 'Forbidden'})).toBeVisible();
});

test(`${AUTHENTICATED_TAG} customer profile navigation remains usable on mobile`, async ({page}, testInfo) => {
  testInfo.setTimeout(90000);
  await page.setViewportSize({width: 390, height: 844});
  await signInAsBrowserCustomer(page, testInfo.retry);
  await openRoute(page, '/pages/profile');

  await expect(page.getByRole('heading', {name: 'Profile'})).toBeVisible();
  const profileNavigation = page.getByRole('tablist', {name: 'Profile sections'});
  await expect(profileNavigation).toBeVisible();
  await expect(profileNavigation).toHaveCSS('overflow-x', 'auto');
  await expect(profileNavigation.getByRole('tab')).toHaveCount(5);

  await profileNavigation.getByRole('tab', {name: 'Security'}).click();
  await expect(profileNavigation.getByRole('tab', {name: 'Security'})).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', {name: 'Two-step verification'})).toBeVisible();
});

test(`${AUTHENTICATED_TAG} @integrationAcceptance synthetic webhook lifecycle`, async ({page}, testInfo) => {
  test.skip(!process.env.E2E_INTEGRATION_RECEIVER, 'Controlled synthetic receiver required.');
  testInfo.setTimeout(120000);
  await signInAsBrowserCustomer(page, testInfo.retry);
  await openRoute(page, '/organization/integrations');
  const name = `TEST ONLY browser acceptance ${Date.now()}`;
  await page.locator('#integration-name').fill(name);
  await page.getByLabel('HTTPS webhook address', {exact: true}).fill(process.env.E2E_INTEGRATION_RECEIVER);
  await page.locator('#integration-owner').selectOption({label: 'Harper Vance Browser Certification'});
  await page.getByLabel('Weekly statistics', {exact: true}).check();
  await page.getByRole('button', {name: 'Add paused integration', exact: true}).click();
  const card = page.locator('.card').filter({has: page.getByRole('heading', {name, exact: true})});
  await expect(card).toBeVisible();
  try {
    await expect(card.getByRole('button', {name: 'Activate', exact: true})).toBeDisabled();
    await card.getByRole('button', {name: 'Send sample test', exact: true}).click();
    await page.getByRole('dialog').getByRole('button', {name: 'Confirm', exact: true}).click();
    await expect(page.getByText('Accepted by destination', {exact: true})).toBeVisible();
    await card.getByRole('button', {name: 'Activate', exact: true}).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', {name: 'Confirm', exact: true})).toBeDisabled();
    await dialog.getByRole('checkbox').check();
    await dialog.getByRole('button', {name: 'Confirm', exact: true}).click();
    await expect(card.getByText('Active', {exact: true})).toBeVisible();
    await card.getByRole('button', {name: 'Pause', exact: true}).click();
    await page.getByRole('dialog').getByRole('button', {name: 'Confirm', exact: true}).click();
    await expect(card.getByText('Paused', {exact: true})).toBeVisible();
    await card.getByRole('button', {name: 'Delivery history', exact: true}).click();
    await expect(page.getByRole('dialog').getByText('Sample test', {exact: true})).toBeVisible();
    await expect(page.getByRole('dialog').getByText('Accepted by destination', {exact: true})).toBeVisible();
    await page.getByRole('dialog').getByRole('button', {name: 'Close', exact: true}).click();
  } finally {
    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible()) await dialog.getByRole('button', {name: /Close|Cancel/}).first().click();
    await card.getByRole('button', {name: 'Remove', exact: true}).click();
    await page.getByRole('dialog').getByRole('button', {name: 'Confirm', exact: true}).click();
    await expect(card.getByText('Removed', {exact: true})).toBeVisible();
  }
});
