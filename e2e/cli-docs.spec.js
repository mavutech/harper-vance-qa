const {test, expect} = require('@playwright/test');

test('landing navigation opens a public, directly addressable CLI guide', async ({page}) => {
  await page.goto('/');
  await page.locator('.desktop-nav').getByRole('link', {name:'CLI documentation'}).click();
  await expect(page).toHaveURL(/\/docs\/cli$/);
  await expect(page.getByRole('heading', {level:1, name:'SONA CLI'})).toBeVisible();
  await page.getByRole('navigation', {name:'CLI documentation'}).getByRole('link', {name:'Installation and authentication'}).click();
  await expect(page.getByText(/Desk Intelligence and Firm Wide Enterprise/).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', {level:1, name:'Installation and authentication'})).toBeVisible();
  await expect(page.getByRole('link', {name:/Open CLI setup/})).toHaveAttribute('href','/dashboard/cli');
});

test('phone navigation and every published CLI reference remain readable while signed out', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button', {name:'Open navigation menu'}).click();
  await page.locator('#mobile-menu').getByRole('link', {name:'CLI documentation'}).click();
  for (const slug of require('../src/features/cli/docs.generated.json').map(page => page.slug)) {
    const response = await page.goto('/docs/cli/' + slug);
    expect(response.status()).toBe(200);
    await expect(page.getByRole('heading', {level:1})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  }
});
