const {test, afterEach} = require('node:test');
const assert = require('node:assert/strict');
const {verifyHosting} = require('./verifyHosting');
const {brand, escapeHtml} = require('./brand.runtime.generated.cjs');
const originalFetch = global.fetch;
const appHtml = '<div id="root"></div><script src="/static/js/main.abc123.js"></script>';
afterEach(() => { global.fetch = originalFetch; });

test('availability rejects a provider page even when HTTP succeeds', async () => {
  global.fetch = async () => ({ok: true, text: async () => '<h1>Site Not Found</h1>'});
  await assert.rejects(verifyHosting('https://example.test', true), /compiled application/);
});

test('availability permits the previous application during the paired rollout', async () => {
  global.fetch = async () => ({ok: true, text: async () => appHtml});
  await verifyHosting('https://example.test', true);
});

test('post-deployment verification requires both current HTML and manifest identity', async () => {
  global.fetch = async (url) => url.pathname === '/manifest.json'
    ? {ok: true, json: async () => ({name: 'Previous owner', short_name: 'OLD'})}
    : {ok: true, text: async () => appHtml + escapeHtml(brand.fullName)};
  await assert.rejects(verifyHosting('https://example.test'), /stale branding/);
  global.fetch = async (url) => url.pathname === '/manifest.json'
    ? {ok: true, json: async () => ({name: brand.fullName, short_name: brand.shortName})}
    : {ok: true, text: async () => appHtml + escapeHtml(brand.fullName)};
  await verifyHosting('https://example.test');
});
