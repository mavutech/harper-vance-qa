import {SEO_CONFIG, updatePageSEO} from './seoConfig';

describe('SEO configuration', () => {
  it('uses the production apex domain as the canonical website', () => {
    expect(SEO_CONFIG.company.website).toBe('https://harpervanceqa.com');
  });

  it('uses the controlled non-advisory market-intelligence vocabulary', () => {
    const serializedConfig = JSON.stringify(SEO_CONFIG);

    expect(SEO_CONFIG.default.title).toContain('Reviewable NQ Market Intelligence');
    expect(serializedConfig).not.toMatch(/trading signals/i);
    expect(serializedConfig).not.toMatch(/profit monitoring/i);
    expect(serializedConfig).not.toMatch(/guaranteed accuracy/i);
  });

  it('marks unknown routes noindex and restores indexing on known pages', () => {
    const robots = document.createElement('meta');
    robots.setAttribute('name', 'robots');
    document.head.appendChild(robots);

    updatePageSEO('notFound');
    expect(robots).toHaveAttribute('content', 'noindex, nofollow');

    updatePageSEO('landing');
    expect(robots).toHaveAttribute('content', 'index, follow');

    robots.remove();
  });
});
