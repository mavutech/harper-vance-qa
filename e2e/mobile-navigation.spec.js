const {test, expect} = require('@playwright/test');
const {openRoute} = require('./support/navigation');

const MOBILE_VIEWPORT = Object.freeze({width: 390, height: 844});

test.use({viewport: MOBILE_VIEWPORT});

test.describe('mobile public navigation', () => {
  test('keeps access primary and the latest report secondary on the phone layout', async ({page}) => {
    await openRoute(page, '/');

    const heroActions = page.locator('.hero-actions');
    const accessRequest = heroActions.getByRole('link', {name: 'Request Access'});
    const reportRequest = heroActions.getByRole('link', {name: 'Get the Latest Report'});

    await expect(accessRequest).toBeVisible();
    await expect(accessRequest).toHaveAttribute('href', /\/pages\/request-access$/);
    await expect(accessRequest).toHaveClass(/button-primary/);
    await expect(reportRequest).toBeVisible();
    await expect(reportRequest).toHaveAttribute('href', '#sample');
    await expect(reportRequest).toHaveClass(/button-outline/);

    const accessBounds = await accessRequest.boundingBox();
    expect(accessBounds.x + accessBounds.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
  });

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
