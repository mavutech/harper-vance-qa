const {configureCandidate} = require('../../scripts/configureCandidateHosting');

describe('candidate hosting isolation', () => {
  const config = {hosting: {rewrites: [
    {source: '/api/**', function: {functionId: 'sonaDashboard', region: 'us-central1'}},
    {source: '**', destination: '/index.html'},
  ]}};

  it('keeps production unchanged unless a candidate is explicitly selected', () => {
    expect(configureCandidate(config, '')).toBe(config);
  });

  it('preserves production configuration, region and SPA routing', () => {
    const candidate = configureCandidate(config, 'sonaDashboardCandidate');
    expect(candidate.hosting.rewrites[0].function).toEqual({
      functionId: 'sonaDashboardCandidate', region: 'us-central1',
    });
    expect(candidate.hosting.rewrites[1]).toEqual(config.hosting.rewrites[1]);
    expect(config.hosting.rewrites[0].function.functionId).toBe('sonaDashboard');
  });

  it('rejects arbitrary services and production as the candidate', () => {
    for (const name of ['sonaDashboard', 'otherService', 'sonaDashboardCandidate/x']) {
      expect(() => configureCandidate(config, name)).toThrow();
    }
  });
});
