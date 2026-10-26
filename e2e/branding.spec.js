const {test, expect} = require('@playwright/test');
const {brand} = require('../src/config/brand.generated.json');
const {openRoute} = require('./support/navigation');

test('the production bundle renders the shared brand without browser errors', async ({page}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openRoute(page, '/');
  await expect(page.getByRole('heading', {level: 1})).toBeVisible();
  expect(await page.title()).toContain(brand.fullName);
  const wordmark = page.getByRole('img', {name: brand.fullName}).first();
  await expect(wordmark).toBeVisible();
  expect(await wordmark.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
  expect(errors).toEqual([]);
  await page.setViewportSize({width: 390, height: 844});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const manifest = await (await page.request.get('/manifest.json')).json();
  expect(manifest.name).toBe(brand.fullName);
  expect(manifest.short_name).toBe(brand.shortName);
});
