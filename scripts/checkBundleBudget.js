/**
 * @fileoverview Enforces the production entry-bundle size budget.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const MAX_GZIP_BYTES = 400 * 1024;
const assetDirectory = path.resolve(__dirname, '..', 'build', 'static', 'js');
const entryFiles = fs.readdirSync(assetDirectory)
    .filter((name) => /^main\.[a-f0-9]+\.js$/.test(name));

if (entryFiles.length !== 1) {
  throw new Error(`Expected one production entry bundle, found ${entryFiles.length}.`);
}

const entryPath = path.join(assetDirectory, entryFiles[0]);
const gzipBytes = zlib.gzipSync(fs.readFileSync(entryPath)).length;
const gzipKilobytes = (gzipBytes / 1024).toFixed(2);

if (gzipBytes > MAX_GZIP_BYTES) {
  throw new Error(
      `Production entry bundle is ${gzipKilobytes} KiB gzip; budget is 400 KiB.`,
  );
}

console.log(`Production entry bundle: ${gzipKilobytes} KiB gzip (budget: 400 KiB).`);
