/**
 * @fileoverview Selects a candidate API in the ephemeral preview checkout only.
 * The production hosting configuration remains committed to sonaDashboard.
 */
const fs = require('fs');
const path = require('path');

/**
 * Retargets existing function rewrites without changing static or SPA routing.
 * @param {Object} config - Parsed Firebase Hosting configuration
 * @param {string} candidate - Explicit candidate function name
 * @returns {Object} Copy of the configuration with candidate rewrites
 */
function configureCandidate(config, candidate) {
  if (!candidate) return config;
  if (!/^sonaDashboardCandidate[A-Za-z0-9_-]*$/.test(candidate)) {
    throw new Error('Only an explicitly named dashboard candidate is allowed.');
  }
  return {...config, hosting: {...config.hosting, rewrites: config.hosting.rewrites.map((rule) => (
    rule.function?.functionId === 'sonaDashboard'
      ? {...rule, function: {...rule.function, functionId: candidate}}
      : rule
  ))}};
}

if (require.main === module) {
  const filename = path.resolve(__dirname, '..', 'firebase.json');
  const config = JSON.parse(fs.readFileSync(filename, 'utf8'));
  fs.writeFileSync(filename, `${JSON.stringify(configureCandidate(config,
    process.env.CANDIDATE_API_FUNCTION || ''), null, 2)}\n`);
}

module.exports = {configureCandidate};
