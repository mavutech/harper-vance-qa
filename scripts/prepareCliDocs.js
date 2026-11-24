/** @fileoverview Exports maintained CLI Markdown into a safe build-time content snapshot. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const source = path.resolve(process.env.HARPER_VANCE_BACKEND_DIR || path.join(__dirname, '../../../../golden-setups-sona-alerts'), 'docs/cli');
const files = ['README.md', 'getting-started.md', 'commands.md', 'understanding-results.md', 'live-watch.md', 'exports.md', 'troubleshooting.md', 'development.md', 'postman/README.md', 'verification.md', 'release-acceptance.md', 'customer-launch.md', '../stats.md', '../time-to-resolution.md', '../retraction.md', '../day-context.md'];
const pages = files.map(file => {
  const markdown = fs.readFileSync(path.join(source, file), 'utf8');
  return {slug: file === 'README.md' ? 'overview' : file.replace('/README', '').replace('../', '').replace('.md', ''), source: file,
    title: markdown.split('\n').find(line => line.startsWith('# ')).slice(2), markdown,
    sha256: crypto.createHash('sha256').update(markdown).digest('hex')};
});
fs.writeFileSync(path.join(__dirname, '../src/features/cli/docs.generated.json'), JSON.stringify(pages, null, 2) + '\n');
console.log(`Prepared ${pages.length} maintained CLI guide pages.`);

const assets = path.join(__dirname, '../public/docs/cli/assets');
fs.mkdirSync(assets, {recursive: true});
for (const file of ['sona-cli.postman_collection.json', 'sona-cli.local.postman_environment.json', 'sona-cli.live.postman_environment.json']) {
  fs.copyFileSync(path.join(source, 'postman', file), path.join(assets, file));
}
