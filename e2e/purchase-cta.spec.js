const {test, expect} = require('@playwright/test');
const {openRoute} = require('./support/navigation');

/**
 * Follows the optional public entry and verifies the real application, without submission.
 * @param {import('@playwright/test').Page} page - Browser page.
 * @returns {Promise<void>} Application is visibly available.
 */
async function expectApplication(page) {
  await expect(page).toHaveURL(/\/pages\/(client-access|request-access)(\?|$)/);
  if (new URL(page.url()).pathname === '/pages/client-access') {
    await page.getByRole('link', {name: 'Request Access', exact: true}).click();
  }
  await expect(page.getByRole('heading', {name: 'Request Access', exact: true})).toBeVisible();
  await expect(page.getByLabel('Work email', {exact: true})).toBeVisible();
  await expect(page.getByText(/no payment is collected here/)).toBeVisible();
  await expect(page.getByRole('button', {name: 'Submit access request'})).toBeVisible();
}

test.describe('purchase CTA destinations', () => {
  for (const selector of ['.header-cta', '.hero-actions .button-primary', '.footer-access']) {
    test(`opens the actual application from ${selector}`, async ({page}) => {
      await openRoute(page, '/');
      await page.locator(selector).click();
      await expectApplication(page);
    });
  }
  for (const [index, plan] of ['entity_core', 'desk_intelligence', 'firm_wide_enterprise'].entries()) {
    test(`preserves ${plan} when opening the actual application`, async ({page}) => {
      await openRoute(page, '/');
      await page.locator('.pricing-card .pricing-action').nth(index).click();
      await expectApplication(page);
      await expect(page.getByLabel('Requested plan')).toHaveValue(plan);
    });
  }
  test('mobile purchase button opens the actual application', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await openRoute(page, '/');
    await page.getByRole('button', {name: 'Open navigation menu'}).click();
    await page.locator('.mobile-access').click();
    await expectApplication(page);
  });
});
