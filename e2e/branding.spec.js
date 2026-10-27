const {test, expect} = require('@playwright/test');
const {brand} = require('../src/config/brand.generated.json');
const {openRoute} = require('./support/navigation');
const {createHash} = require('crypto');
const integrity = require('../src/config/brand.integrity.generated.json');

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

test('mobile pages request fingerprinted original artwork instead of the old logo URL', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  for (const [route, asset] of [['/', 'wordmark-dark.svg'], ['/login', 'wordmark.svg']]) {
    const digest = integrity[`public/brand/${asset}`];
    const expected = `/brand/${asset}?v=${digest}`;
    const responsePromise = page.waitForResponse((response) => new URL(response.url()).pathname === `/brand/${asset}` &&
      new URL(response.url()).searchParams.get('v') === digest);
    await openRoute(page, route);
    const logo = page.getByRole('img', {name: brand.fullName}).first();
    await expect(logo).toHaveAttribute('src', expected);
    const response = await responsePromise;
    expect(response.ok()).toBe(true);
    expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(digest);
    expect(await logo.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
  }
});
