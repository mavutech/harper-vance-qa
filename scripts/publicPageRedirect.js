/** Public backend page routing for the frontend-only local preview. */
const PUBLIC_ORIGIN = 'https://harpervanceqa-dev.web.app';
const PUBLIC_PATHS = new Set(['/pages/client-access', '/pages/request-access']);
const PLAN_CODES = new Set(['entity_core', 'desk_intelligence', 'firm_wide_enterprise']);

/**
 * Resolves only public application pages to the deployed backend.
 * Never forwards bodies, cookies, tokens, arbitrary query parameters or hosts.
 * @param {string} requestUrl - Local incoming URL.
 * @param {string} method - HTTP request method.
 * @returns {string|null} Fixed-origin public destination, or no redirect.
 */
function publicPageRedirect(requestUrl, method) {
  if (!['GET', 'HEAD'].includes(method)) return null;
  const incoming = new URL(requestUrl, 'http://127.0.0.1');
  if (!PUBLIC_PATHS.has(incoming.pathname)) return null;
  const destination = new URL(incoming.pathname, PUBLIC_ORIGIN);
  const plan = incoming.searchParams.get('plan');
  if (PLAN_CODES.has(plan)) destination.searchParams.set('plan', plan);
  return destination.href;
}

module.exports = {publicPageRedirect};
