const {test, expect} = require('@playwright/test');
const {openRoute} = require('./support/navigation');

test.describe('authentication boundaries', () => {
  test('redirects signed-out visitors away from the client dashboard', async ({page}) => {
    await openRoute(page, '/dashboard/sona-targets');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('.card-title', {hasText: 'Sign In'})).toBeVisible();
  });

  test('redirects signed-out visitors away from platform administration', async ({page}) => {
    await openRoute(page, '/admin/organizations');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('.card-title', {hasText: 'Sign In'})).toBeVisible();
  });
});
