import {
  buildDayContextSummary,
  classifyAccuracy,
  classifyTtr,
  MIN_TARGETS,
} from './dayContextSummary';

describe('classifyAccuracy', () => {
  test('above when delta >= +3pp', () => {
    expect(classifyAccuracy(0.95, 0.9)).toEqual({ label: 'above', deltaPct: 5 });
  });
  test('below when delta <= -3pp', () => {
    expect(classifyAccuracy(0.85, 0.9)).toEqual({ label: 'below', deltaPct: -5 });
  });
  test('similar within +/-3pp', () => {
    expect(classifyAccuracy(0.91, 0.9).label).toBe('similar');
  });
  test('unknown when null', () => {
    expect(classifyAccuracy(null, 0.9).label).toBe('unknown');
  });
});

describe('classifyTtr', () => {
  test('faster when delta <= -3 min', () => {
    expect(classifyTtr(9, 14)).toEqual({ label: 'faster', deltaMin: -5 });
  });
  test('slower when delta >= +3 min', () => {
    expect(classifyTtr(20, 14)).toEqual({ label: 'slower', deltaMin: 6 });
  });
  test('similar within +/-3 min', () => {
    expect(classifyTtr(14, 13).label).toBe('similar');
  });
});

describe('buildDayContextSummary', () => {
  const baseline = { _overall: { nDays: 200, nTargets: 1500, nHits: 1350, accuracy: 0.9, avgTtrMinutes: 14 } };

  test('null when no event tags', () => {
    expect(buildDayContextSummary([], { baseline })).toBeNull();
  });

  test('null when buckets tree missing', () => {
    expect(buildDayContextSummary(['fomc_rate_decision'], null)).toBeNull();
  });

  test('null when bucket below threshold', () => {
    const tree = {
      baseline,
      retail_sales: { _overall: { nDays: 1, nTargets: 5, nHits: 4, accuracy: 0.8, avgTtrMinutes: 10 } },
    };
    expect(buildDayContextSummary(['retail_sales'], tree)).toBeNull();
  });

  test('returns one summary for qualifying tag', () => {
    const tree = {
      baseline,
      fomc_rate_decision: { _overall: { nDays: 26, nTargets: 220, nHits: 200, accuracy: 0.91, avgTtrMinutes: 14.3 } },
    };
    const out = buildDayContextSummary(['fomc_rate_decision'], tree);
    expect(out).not.toBeNull();
    expect(out.tags).toHaveLength(1);
    expect(out.tags[0].label).toBe('FOMC meeting day');
    expect(out.tags[0].ttrVsBaseline.label).toBe('similar');
    expect(out.baseline.accuracy).toBe(0.9);
  });

  test('orders tags by severity then sample size', () => {
    const tree = {
      baseline,
      fomc_rate_decision: { _overall: { nDays: 26, nTargets: 220, nHits: 200, accuracy: 0.91, avgTtrMinutes: 14.3 } },
      jobless_claims: { _overall: { nDays: 74, nTargets: 585, nHits: 540, accuracy: 0.92, avgTtrMinutes: 13.3 } },
    };
    const out = buildDayContextSummary(['jobless_claims', 'fomc_rate_decision'], tree);
    expect(out.tags.map((t) => t.tag)).toEqual(['fomc_rate_decision', 'jobless_claims']);
  });

  test('flags faster timing on opex days', () => {
    const tree = {
      baseline,
      opex_monthly: { _overall: { nDays: 17, nTargets: 135, nHits: 120, accuracy: 0.89, avgTtrMinutes: 9.4 } },
    };
    const out = buildDayContextSummary(['opex_monthly'], tree);
    expect(out.tags[0].ttrVsBaseline.label).toBe('faster');
  });

  test(`MIN_TARGETS is ${MIN_TARGETS}`, () => {
    expect(MIN_TARGETS).toBe(15);
  });
});
