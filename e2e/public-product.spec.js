const {test, expect} = require('@playwright/test');
const {openRoute} = require('./support/navigation');

const PRODUCT_HEADLINE = "NQ target research for your desk\'s trading process.";

test.describe('public product experience', () => {
  test('opens report-request and evidence deep links at their sections', async ({page}) => {
    await openRoute(page, '/#sample');
    await expect(page.getByRole('heading', {name: 'Request the full session report.'})).toBeInViewport();
    await openRoute(page, '/#evidence');
    await expect(page.getByRole('heading', {name: 'See the record, then decide if it fits your desk.'})).toBeInViewport();
  });

  test('explains the product and provides client access', async ({page}) => {
    await openRoute(page, '/');

    await expect(page).toHaveTitle(/Harper Vance/i);
    await expect(page.getByRole('heading', {level: 1, name: PRODUCT_HEADLINE})).toBeVisible();
    await expect(page.getByRole('heading', {name: 'Included with every license'})).toBeVisible();
    await expect(page.getByText('Secure authenticated dashboard', {exact: true})).toBeVisible();

    const accessRequest = page.locator('a.header-cta');
    await expect(accessRequest).toBeVisible();
    await expect(accessRequest).toHaveText('Request Access');
    await expect(accessRequest).toHaveAttribute('href', '/pages/client-access');

    await page.locator('#evidence').scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', {name: 'October 12, 2026 report preview'})).toBeVisible();
    await expect(page.getByRole('heading', {name: 'Unreached target excerpt'})).toBeVisible();
    await page.getByRole('link', {name: 'Request the Full Report', exact: true}).click();
    await expect(page).toHaveURL(/#sample$/);
    await expect(page.getByRole('button', {name: 'Request the Full Report'})).toBeVisible();
    const reportResponse = await page.request.get('/reports/Harper-Vance-Daily-Report-2026-10-12-corrected.pdf');
    expect(reportResponse.headers()['content-type'] || '').not.toContain('application/pdf');
    expect((await reportResponse.body()).subarray(0, 5).toString()).not.toBe('%PDF-');
    const overview = page.getByRole('link', {name: /Download Buyer Overview/});
    const overviewResponse = await page.request.get(await overview.getAttribute('href'));
    expect(overviewResponse.ok()).toBeTruthy();
    expect(overviewResponse.headers()['content-type']).toContain('application/pdf');
    expect((await overviewResponse.body()).subarray(0, 5).toString()).toBe('%PDF-');
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
