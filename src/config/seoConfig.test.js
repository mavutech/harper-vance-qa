import {SEO_CONFIG, updatePageSEO} from './seoConfig';

describe('SEO configuration', () => {
  it('uses the production apex domain as the canonical website', () => {
    expect(SEO_CONFIG.company.website).toBe('https://harpervanceqa.com');
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
