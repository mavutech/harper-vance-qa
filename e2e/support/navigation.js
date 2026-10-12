/**
 * Opens an application route after its document is ready without waiting on
 * long-lived Firebase browser connections.
 *
 * @param {import('@playwright/test').Page} page - Active Playwright page.
 * @param {string} route - Internal application route to open.
 * @returns {Promise<import('@playwright/test').Response|null>} Initial document response.
 */
async function openRoute(page, route) {
  return page.goto(route, {waitUntil: 'domcontentloaded'});
}

module.exports = {openRoute};
