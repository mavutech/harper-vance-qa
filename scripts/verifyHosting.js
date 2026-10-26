/** @fileoverview Verifies application availability and the deployed shared identity. */
const {brand, escapeHtml} = require('./brand.runtime.generated.cjs');
const REQUEST_TIMEOUT_MS = 20000;

/**
 * Checks Hosting without tying provider availability to a previous company name.
 * @param {string} origin - Approved Hosting origin.
 * @param {boolean} availabilityOnly - Allow the previous application during rollout.
 * @returns {Promise<void>} Rejects provider pages, HTTP errors and stale identity.
 */
async function verifyHosting(origin, availabilityOnly = false) {
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Provide an HTTPS Hosting origin without credentials or a path.');
  }
  const response = await fetch(url, {signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)});
  if (!response.ok) throw new Error(`Hosting returned HTTP ${response.status}.`);
  const html = await response.text();
  if (!html.includes('<div id="root"></div>') || !/\/static\/js\/main\.[a-f0-9]+\.js/.test(html)) {
    throw new Error('Hosting did not return the compiled application.');
  }
  if (!availabilityOnly) {
    if (!html.includes(escapeHtml(brand.fullName))) throw new Error('Hosted HTML has stale branding.');
    const manifestResponse = await fetch(new URL('/manifest.json', url), {signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)});
    if (!manifestResponse.ok) throw new Error('Hosted manifest is unavailable.');
    const manifest = await manifestResponse.json();
    if (manifest.name !== brand.fullName || manifest.short_name !== brand.shortName) {
      throw new Error('Hosted manifest has stale branding.');
    }
  }
  console.log(`Hosting ${availabilityOnly ? 'availability' : 'identity'} verified: ${url.origin}`);
}

if (require.main === module) {
  verifyHosting(process.argv[2], process.argv.includes('--availability')).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
module.exports = {verifyHosting};
