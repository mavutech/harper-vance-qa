const {expect} = require('@playwright/test');

/**
 * Verifies real authenticated monthly navigation and compact rolling report rendering.
 * @param {import('@playwright/test').Page} page - Signed-in History page.
 * @returns {Promise<void>} Completed checks.
 */
async function verifyRecentPerformance(page) {
  await expect(page.getByRole('button', {name: 'Calendar month', exact: true})).toHaveAttribute('aria-pressed', 'true');
  const originalMonth = await page.getByLabel('Report month', {exact: true}).inputValue();
  const previousResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === '/api/product/monthly' && url.searchParams.get('month') !== originalMonth;
  });
  await page.getByRole('button', {name: 'Previous month', exact: true}).click();
  expect((await previousResponse).status()).toBe(200);
  await expect(page.getByRole('group', {name: 'Daily target accuracy', exact: true})).toBeVisible();
  const nextResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === '/api/product/monthly' && url.searchParams.get('month') === originalMonth;
  });
  await page.getByRole('button', {name: 'Next month', exact: true}).click();
  expect((await nextResponse).status()).toBe(200);
  await page.setViewportSize({width: 390, height: 844});
  for (const sessions of [20, 10, 40]) {
    const responsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname === '/api/product/rolling' && url.searchParams.get('sessions') === String(sessions);
    });
    await page.getByRole('button', {name: sessions === 20 ? 'Recent performance' : `${sessions} sessions`, exact: true}).click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    const {data: report} = await response.json();
    expect(report.period.sessions).toBe(sessions);
    expect(report.days).toHaveLength(sessions);
    expect(report.summary.hits).toBe(report.days.reduce((total, day) => total + (day.hits || 0), 0));
    expect(report.summary.created).toBe(report.days.reduce((total, day) => total + (day.created || 0), 0));
    expect(report.trend.at(-1).accuracy).toBe(report.latest20.accuracy);
    await expect(page.getByTestId('rolling-Target accuracy')).toHaveText(report.summary.accuracy === null ? 'N/A' : `${report.summary.accuracy}%`);
    await expect(page.getByRole('group', {name: 'Daily accuracy and 20-session trend'})).toBeVisible();
    await expect(page.locator('.apexcharts-backgroundBar')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(JSON.stringify(report)).not.toMatch(/sortedChartData|engulfingCandleList/);
  }
  await page.getByRole('button', {name: 'Calendar month', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Calendar month', exact: true})).toHaveAttribute('aria-pressed', 'true');
  await page.setViewportSize({width: 1280, height: 800});
}
module.exports = {verifyRecentPerformance};
