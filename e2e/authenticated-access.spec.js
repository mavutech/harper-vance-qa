const {test, expect} = require('@playwright/test');
const {openRoute} = require('./support/navigation');
const {generateTotp} = require('./support/totp');

const BROWSER_E2E_EMAIL = 'tkmavu+harper-vance-e2e@gmail.com';
const PASSWORD_ENVIRONMENT_KEY = 'E2E_BROWSER_PASSWORD';
const TOTP_SECRET_ENVIRONMENT_KEY = 'E2E_BROWSER_TOTP_SECRET';
const AUTHENTICATED_TAG = '@authenticated';
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
 * Signs in through the same customer form used by licensed users.
 *
 * @param {import('@playwright/test').Page} page - Active Playwright page
 * @param {number} [retry=0] - Playwright retry number used to avoid replaying a consumed code
 * @returns {Promise<void>}
 */
async function signInAsBrowserCustomer(page, retry = 0) {
  await openRoute(page, '/login');
  await page.getByLabel('Email address').fill(BROWSER_E2E_EMAIL);
  await page.getByLabel('Password').fill(requireBrowserPassword());
  await page.getByRole('button', {name: 'Sign In'}).click();
  const codeInput = page.getByLabel('Six-digit authenticator code');
  await expect(codeInput).toBeVisible();
  await codeInput.fill(generateTotp(requireBrowserTotpSecret(), Date.now() + (retry * 30000)));
  await page.getByRole('button', {name: 'Verify and sign in'}).click();
  await expect(page).toHaveURL(/\/dashboard\/sona-targets$/);
}

test(`${AUTHENTICATED_TAG} licensed customer access remains available and isolated`, async ({page}, testInfo) => {
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

  await openRoute(page, '/admin/organizations');
  await expect(page).toHaveURL(/\/pages\/error-505$/);
  await expect(page.getByRole('heading', {name: 'Forbidden'})).toBeVisible();
});

test(`${AUTHENTICATED_TAG} customer profile navigation remains usable on mobile`, async ({page}, testInfo) => {
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
