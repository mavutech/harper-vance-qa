const {test, expect} = require('@playwright/test');
const {openRoute} = require('./support/navigation');

const PRODUCT_HEADLINE = 'Evaluate NQ target research with the original record in view.';

test.describe('public product experience', () => {
  test('explains the product and provides client access', async ({page}) => {
    await openRoute(page, '/');

    await expect(page).toHaveTitle(/Harper Vance/i);
    await expect(page.getByRole('heading', {level: 1, name: PRODUCT_HEADLINE})).toBeVisible();
    await expect(page.getByRole('heading', {name: 'Included with every license'})).toBeVisible();
    await expect(page.getByText('Secure authenticated dashboard', {exact: true})).toBeVisible();

    const accessRequest = page.locator('a.header-cta');
    await expect(accessRequest).toBeVisible();
    await expect(accessRequest).toHaveText('Request a Sample Report');
    await expect(accessRequest).toHaveAttribute('href', '#sample');

    await page.getByRole('link', {name: 'Explore the Report Format'}).click();
    await expect(page).toHaveURL(/#evidence$/);
    await expect(page.getByRole('heading', {name: 'Representative completed-session report'})).toBeVisible();
    const question = page.getByText('Does this monitor our trades or place orders?', {exact: true});
    await question.click();
    await expect(page.getByText(/It does not ingest your desk's trading results/)).toBeVisible();

    const clientLogin = page.getByRole('link', {name: 'Client Login'}).first();
    await expect(clientLogin).toHaveAttribute('href', '/login');
    await clientLogin.click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('.card-title', {hasText: 'Sign In'})).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('publishes the current legal documents', async ({page}) => {
    await openRoute(page, '/terms');

    await expect(page.getByRole('heading', {level: 1, name: 'Terms of Service'})).toBeVisible();
    await expect(page.getByRole('link', {name: 'Privacy Policy'}).first()).toHaveAttribute('href', '/privacy');

    await openRoute(page, '/privacy');

    await expect(page.getByRole('heading', {level: 1, name: 'Privacy Policy'})).toBeVisible();
    await expect(page.getByRole('link', {name: 'Client Login'}).first()).toHaveAttribute('href', '/login');
  });
});
