const {test, expect} = require('@playwright/test');
const {openRoute} = require('./support/navigation');

const BROWSER_E2E_EMAIL = 'tkmavu+harper-vance-e2e@gmail.com';
const PASSWORD_ENVIRONMENT_KEY = 'E2E_BROWSER_PASSWORD';
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
 * Signs in through the same customer form used by licensed users.
 *
 * @param {import('@playwright/test').Page} page - Active Playwright page
 * @returns {Promise<void>}
 */
async function signInAsBrowserCustomer(page) {
  await openRoute(page, '/login');
  await page.getByLabel('Email address').fill(BROWSER_E2E_EMAIL);
  await page.getByLabel('Password').fill(requireBrowserPassword());
  await page.getByRole('button', {name: 'Sign In'}).click();
  await expect(page).toHaveURL(/\/dashboard\/sona-targets$/);
}

test(`${AUTHENTICATED_TAG} licensed customer access remains available and isolated`, async ({page}) => {
  await signInAsBrowserCustomer(page);

  for (const route of LICENSED_ROUTES) {
    await openRoute(page, route.path);
    await expect(page).toHaveURL(new RegExp(`${route.path.replaceAll('/', '\\/')}$`));
    await expect(page.getByRole('heading', {name: route.heading})).toBeVisible();
    await expect(page.getByText(/permission denied/i)).toHaveCount(0);
  }

  await openRoute(page, '/admin/organizations');
  await expect(page).toHaveURL(/\/pages\/error-505$/);
  await expect(page.getByRole('heading', {name: 'Forbidden'})).toBeVisible();
});
