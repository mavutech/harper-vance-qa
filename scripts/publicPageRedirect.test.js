const {test} = require('node:test');
const assert = require('node:assert/strict');
const {publicPageRedirect} = require('./publicPageRedirect');

test('routes public pages and preserves only approved license selection', () => {
  assert.equal(publicPageRedirect('/pages/client-access', 'GET'), 'https://harpervanceqa-dev.web.app/pages/client-access');
  for (const plan of ['entity_core', 'desk_intelligence', 'firm_wide_enterprise']) {
    assert.equal(publicPageRedirect(`/pages/request-access?plan=${plan}`, 'GET'), `https://harpervanceqa-dev.web.app/pages/request-access?plan=${plan}`);
  }
});

test('does not forward secrets, arbitrary destinations, or writes', () => {
  assert.equal(publicPageRedirect('/pages/request-access?token=secret&plan=invalid&next=https://example.com', 'GET'), 'https://harpervanceqa-dev.web.app/pages/request-access');
  assert.equal(publicPageRedirect('/pages/request-access', 'POST'), null);
  assert.equal(publicPageRedirect('/api/report-requests', 'POST'), null);
  assert.equal(publicPageRedirect('/pages/client-onboarding?token=secret', 'GET'), null);
  assert.equal(publicPageRedirect('/reports/sample.pdf', 'GET'), null);
});
