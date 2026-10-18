import {SEO_CONFIG} from './seoConfig';

describe('SEO configuration', () => {
  it('uses the production apex domain as the canonical website', () => {
    expect(SEO_CONFIG.company.website).toBe('https://harpervanceqa.com');
  });
});
