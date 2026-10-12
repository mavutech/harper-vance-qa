const {test, expect} = require('@playwright/test');
const {openRoute} = require('./support/navigation');

const PRODUCT_HEADLINE = 'NQ target intelligence your desk can evaluate.';

test.describe('public product experience', () => {
  test('explains the product and provides client access', async ({page}) => {
    await openRoute(page, '/');

    await expect(page).toHaveTitle(/Harper Vance/i);
    await expect(page.getByRole('heading', {level: 1, name: PRODUCT_HEADLINE})).toBeVisible();
    await expect(page.getByRole('heading', {name: 'Included with every license'})).toBeVisible();
    await expect(page.getByText('Secure authenticated dashboard', {exact: true})).toBeVisible();

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
