/** @fileoverview Exports only the public API catalog; client instructions are served after authorization. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(process.env.HARPER_VANCE_BACKEND_DIR || path.join(__dirname, '../../../../golden-setups-sona-alerts'), 'docs/cli');
const markdown = fs.readFileSync(path.join(root, 'api-overview.md'), 'utf8');
const pages = [{slug:'overview', title:markdown.split('\n')[0].slice(2), markdown,
  sha256:crypto.createHash('sha256').update(markdown).digest('hex')}];
fs.writeFileSync(path.join(__dirname, '../src/features/cli/docs.generated.json'), JSON.stringify(pages,null,2)+'\n');
// Old public exports must not survive a rebuild or a Hosting preview update.
fs.rmSync(path.join(__dirname, '../public/docs/cli/assets'), {recursive:true,force:true});
console.log('Prepared public CLI API catalog. Full client guide requires authenticated API access.');
