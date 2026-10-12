const {test, expect} = require('@playwright/test');
const {openRoute} = require('./support/navigation');

const MOBILE_VIEWPORT = Object.freeze({width: 390, height: 844});

test.use({viewport: MOBILE_VIEWPORT});

test.describe('mobile public navigation', () => {
  test('opens the menu and reaches pricing without leaving the page', async ({page}) => {
    await openRoute(page, '/');

    const menuButton = page.getByRole('button', {name: 'Open navigation menu'});
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const mobileNavigation = page.getByRole('navigation', {name: 'Mobile navigation'});
    await expect(mobileNavigation).toBeVisible();
    await mobileNavigation.getByRole('link', {name: 'Licensing'}).click();

    await expect(page).toHaveURL(/#pricing$/);
    await expect(mobileNavigation).toBeHidden();
    await expect(page.getByRole('heading', {name: 'Same intelligence. Different access.'})).toBeVisible();
  });
});
