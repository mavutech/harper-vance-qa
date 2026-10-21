const {test, expect} = require('@playwright/test');
const {openRoute} = require('./support/navigation');

test.describe('authentication boundaries', () => {
  for (const route of ['/organization/integrations', '/admin/integrations',
    '/dashboard/sona-daily?date=2026-10-20', '/dashboard/sona-weekly?week=43&year=2026']) {
    test(`protects integration management at ${route}`, async ({page}) => {
      await openRoute(page, route);
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.locator('.card-title', {hasText: 'Sign In'})).toBeVisible();
    });
  }
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

  test('redirects signed-out visitors away from the client application inbox', async ({page}) => {
    await openRoute(page, '/admin/applications');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('.card-title', {hasText: 'Sign In'})).toBeVisible();
  });
});
