import { normalizeLateResolverStats } from './normalizeLateResolverStats';

const baseZeroHitsGroup = {
  eventualHitRate: 0,
  hits: 0,
  n: 55,
  neverResolved: 55,
};

const baseHitsGroup = {
  eventualHitRate: 4.1,
  hits: 5,
  n: 123,
  neverResolved: 118,
  maxRetraction: 56.3,
  meanRetraction: 34.9,
  medianRetraction: 35.8,
  p25Retraction: 24.8,
  p75Retraction: 42.8,
  p90Retraction: 50.9,
  maxTimeMin: 30,
  meanTimeMin: 21,
  medianTimeMin: 25,
  p90TimeMin: 28,
};

const buildRawStats = (overrides = {}) => ({
  groups: { all: baseZeroHitsGroup },
  minSample: 8,
  thresholdMin: 5,
  share: 100,
  totalLate: 55,
  totalTargets: 55,
  windowSessions: 10,
  ...overrides,
});

describe('normalizeLateResolverStats', () => {
  test('returns null for null / undefined / non-object input', () => {
    expect(normalizeLateResolverStats(null)).toBeNull();
    expect(normalizeLateResolverStats(undefined)).toBeNull();
    expect(normalizeLateResolverStats('string')).toBeNull();
    expect(normalizeLateResolverStats(42)).toBeNull();
  });

  test('returns null when groups field is missing', () => {
    expect(normalizeLateResolverStats({ minSample: 8 })).toBeNull();
  });

  test('preserves top-level meta fields', () => {
    const stats = normalizeLateResolverStats(buildRawStats());
    expect(stats.minSample).toBe(8);
    expect(stats.thresholdMin).toBe(5);
    expect(stats.share).toBe(100);
    expect(stats.totalLate).toBe(55);
    expect(stats.totalTargets).toBe(55);
    expect(stats.windowSessions).toBe(10);
  });

  test('meta fields default safely when backend omits them', () => {
    const stats = normalizeLateResolverStats({ groups: { all: baseZeroHitsGroup } });
    expect(stats.minSample).toBe(0);
    expect(stats.thresholdMin).toBeNull();
    expect(stats.share).toBeNull();
    expect(stats.totalLate).toBe(0);
    expect(stats.totalTargets).toBe(0);
    expect(stats.windowSessions).toBe(0);
  });

  test('fills all percentile fields with null for hits===0 groups', () => {
    const stats = normalizeLateResolverStats(buildRawStats());
    const group = stats.groups.all;

    expect(group.maxRetraction).toBeNull();
    expect(group.meanRetraction).toBeNull();
    expect(group.medianRetraction).toBeNull();
    expect(group.p25Retraction).toBeNull();
    expect(group.p75Retraction).toBeNull();
    expect(group.p90Retraction).toBeNull();
    expect(group.maxTimeMin).toBeNull();
    expect(group.meanTimeMin).toBeNull();
    expect(group.medianTimeMin).toBeNull();
    expect(group.p90TimeMin).toBeNull();
  });

  test('preserves percentile fields for hits>0 groups', () => {
    const stats = normalizeLateResolverStats(buildRawStats({
      groups: { all: baseHitsGroup },
    }));
    const group = stats.groups.all;

    expect(group.eventualHitRate).toBe(4.1);
    expect(group.hits).toBe(5);
    expect(group.medianRetraction).toBe(35.8);
    expect(group.p25Retraction).toBe(24.8);
    expect(group.p75Retraction).toBe(42.8);
    expect(group.p90Retraction).toBe(50.9);
    expect(group.medianTimeMin).toBe(25);
    expect(group.p90TimeMin).toBe(28);
  });

  test('flags hasSample=true when n >= minSample', () => {
    const stats = normalizeLateResolverStats(buildRawStats({
      minSample: 8,
      groups: {
        big: { ...baseZeroHitsGroup, n: 55 },
        exact: { ...baseZeroHitsGroup, n: 8 },
        small: { ...baseZeroHitsGroup, n: 7 },
      },
    }));

    expect(stats.groups.big.hasSample).toBe(true);
    expect(stats.groups.exact.hasSample).toBe(true);
    expect(stats.groups.small.hasSample).toBe(false);
  });

  test('normalizes all real-world group keys from the backend', () => {
    const stats = normalizeLateResolverStats(buildRawStats({
      groups: {
        'all': baseHitsGroup,
        'bullish': baseHitsGroup,
        'bearish': baseZeroHitsGroup,
        'bullish|morning': baseHitsGroup,
        'bullish|midday': baseZeroHitsGroup,
        'bullish|afternoon': baseHitsGroup,
        'bearish|morning': baseZeroHitsGroup,
        'bearish|midday': baseZeroHitsGroup,
        'bearish|afternoon': baseZeroHitsGroup,
      },
    }));

    expect(Object.keys(stats.groups)).toHaveLength(9);
    expect(stats.groups['bullish|morning'].hits).toBe(5);
    expect(stats.groups['bearish|morning'].hits).toBe(0);
  });

  test('missing group fields default to safe zero values', () => {
    const stats = normalizeLateResolverStats({
      groups: { all: {} },
      minSample: 8,
    });
    const group = stats.groups.all;

    expect(group.eventualHitRate).toBe(0);
    expect(group.hits).toBe(0);
    expect(group.n).toBe(0);
    expect(group.neverResolved).toBe(0);
    expect(group.hasSample).toBe(false);
  });
});
