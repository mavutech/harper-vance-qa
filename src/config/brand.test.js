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

test('logo URLs change whenever the approved artwork changes', () => {
  jest.resetModules();
  const {BRAND_LOGOS: previous} = require('./brand');
  jest.doMock('./brand.integrity.generated.json', () => ({
    'public/brand/wordmark.svg': 'updated-light-artwork',
    'public/brand/wordmark-dark.svg': 'updated-dark-artwork',
  }));
  jest.resetModules();
  const {BRAND_LOGOS: updated} = require('./brand');
  expect(updated.light).toBe('/brand/wordmark.svg?v=updated-light-artwork');
  expect(updated.dark).toBe('/brand/wordmark-dark.svg?v=updated-dark-artwork');
  expect(updated.light).not.toBe(previous.light);
  expect(updated.dark).not.toBe(previous.dark);
  jest.dontMock('./brand.integrity.generated.json');
  jest.resetModules();
});
