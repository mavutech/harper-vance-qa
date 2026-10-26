/** Verifies that a replacement identity reaches UI copy and SEO without page edits. */
test('a new owner name propagates into page copy, metadata and compact labels', () => {
  jest.resetModules();
  jest.doMock('./brand.generated.json', () => {
    const original = jest.requireActual('./brand.generated.json');
    return {...original, brand: {...original.brand,
      fullName: 'North & West Institutional Research Intelligence', shortName: 'NWIRI'}};
  });
  const {BRAND} = require('./brand');
  const landing = require('../features/landingPage/locales/en').default;
  const invitations = require('../features/customerOnboarding/locales/en').default;
  const ui = require('./brandUi').default;
  const {SEO_CONFIG, generatePageTitle} = require('./seoConfig');
  expect(landing.common.brand).toBe(BRAND.fullName);
  expect(invitations.existing).toContain(BRAND.fullName);
  expect(ui.analytics).toBe('NWIRI Analytics');
  expect(SEO_CONFIG.company.name).toBe(BRAND.fullName);
  expect(generatePageTitle('dailyReport')).toContain('NWIRI Daily Target Performance');
  expect(generatePageTitle('dailyReport')).not.toMatch(/Harper Vance|SONA/);
  jest.dontMock('./brand.generated.json');
  jest.resetModules();
});
