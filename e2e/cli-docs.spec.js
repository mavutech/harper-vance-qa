const {test, expect}=require('@playwright/test');

test('front page introduces the CLI and links only to the public API catalog',async({page})=>{
  await page.goto('/');
  await expect(page.locator('.cli-landing').getByRole('heading',{name:'Harper Vance CLI'})).toBeVisible();
  expect(await page.locator('body').innerText()).not.toMatch(/\bsona\b|sona[-_]/i);
  await page.locator('.desktop-nav').getByRole('link',{name:'CLI documentation'}).click();
  await expect(page.getByRole('heading',{level:1,name:'CLI & API access'})).toBeVisible();
  const body=await page.locator('body').innerText();
  expect(body).toContain('/api/cli/product/daily');
  expect(body).not.toMatch(/\bsona\b|sona[-_]|hv login|HV_API_KEY|signInWithPassword|mfaSignIn|npm install/i);
  await page.reload();
  await expect(page.getByRole('heading',{level:1,name:'CLI & API access'})).toBeVisible();
  await expect(page.getByRole('link',{name:/Open CLI setup/})).toHaveAttribute('href','/dashboard/cli');
});

test('phone front-page navigation opens the API catalog without overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');
  await page.getByRole('button',{name:'Open navigation menu'}).click();
  await page.locator('#mobile-menu').getByRole('link',{name:'CLI documentation'}).click();
  await expect(page.getByRole('heading',{level:1,name:'CLI & API access'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.goto('/docs/cli/getting-started');
  await expect(page.getByRole('heading',{level:1,name:'Guide not found'})).toBeVisible();
  expect(await page.locator('body').innerText()).not.toContain('hv login');
});
