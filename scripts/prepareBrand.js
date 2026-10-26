/** @fileoverview Verifies the exported brand package and prepares static metadata. */
const fs = require('fs');
const path = require('path');
const {createHash} = require('crypto');
const root = path.resolve(__dirname, '..');
const integrity = require('../src/config/brand.integrity.generated.json');

for (const [file, digest] of Object.entries(integrity)) {
  const content = fs.readFileSync(path.join(root, file));
  if (createHash('sha256').update(content).digest('hex') !== digest) {
    throw new Error(`Generated branding was edited: ${file}. Re-export from the backend brand source.`);
  }
}
const {brand, escapeHtml} = require('../src/config/brand.generated.cjs');
const snapshot = require('../src/config/brand.generated.json');
if (createHash('sha256').update(JSON.stringify(brand)).digest('hex') !== snapshot.sha256) {
  throw new Error('Brand snapshot fingerprint does not match.');
}

/**
 * Resolves known static brand tokens with context-appropriate escaping.
 * @param {string} input - Metadata template.
 * @param {boolean} html - Escape HTML attribute/text context.
 * @returns {string} Compiled metadata.
 */
function render(input, html) {
  const values = {
    fullName: brand.fullName, shortName: brand.shortName, websiteUrl: brand.websiteUrl,
    'colors.accent': brand.colors.accent, favicon: brand.assets.faviconUrl || '/favicon.svg',
  };
  return input.replace(/\{brand\.([\w.]+)\}/g, (_token, key) => {
    if (!Object.hasOwn(values, key)) throw new Error(`Unknown metadata token: ${key}`);
    return html ? escapeHtml(values[key]) : JSON.stringify(values[key]).slice(1, -1);
  });
}
for (const name of ['index.html', 'manifest.json']) {
  const template = fs.readFileSync(path.join(__dirname, 'templates', name), 'utf8');
  const output = render(template, name.endsWith('.html'));
  const destination = path.join(root, 'public', name);
  if (process.argv.includes('--check')) {
    if (fs.readFileSync(destination, 'utf8') !== output) throw new Error(`Stale brand metadata: ${name}`);
  } else fs.writeFileSync(destination, output);
}
console.log(`Brand artifacts verified: ${snapshot.sha256.slice(0, 12)}`);
