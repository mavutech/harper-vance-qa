import {
  computeAllStats,
  computeDistanceVsHitRate,
  computeAskComparison,
  computeRetractionStats,
} from './computeTargetStats';

const BULLISH = 7004928;
const BEARISH = 16711680;

const target = (overrides) => ({
  colorHighlight: BEARISH,
  targetReached: true,
  dateTimestamp: '1781011800',
  targetReachedTimestamp: '1781013600',
  retractionPoints: 5,
  targetDistancePoints: 8,
  ...overrides,
});

const sampleTargets = [
  target({ targetDistancePoints: 16.5, retractionPoints: 215 }),
  target({ targetDistancePoints: 6.25, retractionPoints: 4.5 }),
  target({ colorHighlight: BULLISH, targetDistancePoints: 5, retractionPoints: 4.75 }),
  target({ targetDistancePoints: 3.75, retractionPoints: 4.75 }),
  target({ colorHighlight: BULLISH, targetDistancePoints: 7.75, retractionPoints: 7.5 }),
  target({ colorHighlight: BULLISH, targetDistancePoints: 24.5, retractionPoints: 68.25 }),
  target({ targetReached: false, targetDistancePoints: 33.75, retractionPoints: undefined }),
];

describe('computeAllStats — doc-field preference', () => {
  test('prefers server-computed fields when present on the day doc', () => {
    const docDirectionSplit = { bullish: { created: 3, hit: 3, accuracy: 100 }, bearish: { created: 4, hit: 3, accuracy: 75 } };
    const docDistance = { avgDistance: '13.9 pts', medianDistance: '7.8 pts', buckets: [{ range: '0-5 pts', created: 1, hit: 1, hitRate: '100.0%' }] };

    const stats = computeAllStats({
      engulfingCandleList: sampleTargets,
      directionSplit: docDirectionSplit,
      distanceVsHitRate: docDistance,
      consecutiveStreak: { current: 0, longest: 6 },
      firstTargetHit: true,
    });

    expect(stats.directionSplit).toBe(docDirectionSplit);
    expect(stats.distanceVsHitRate).toBe(docDistance);
    expect(stats.consecutiveStreak).toEqual({ current: 0, longest: 6 });
    expect(stats.firstTargetHit).toBe(true);
  });

  test('falls back to local computation for docs that predate server fields', () => {
    const stats = computeAllStats({ engulfingCandleList: sampleTargets });

    expect(stats.directionSplit.bullish.created).toBe(3);
    expect(stats.directionSplit.bullish.accuracy).toBe(100);
    expect(stats.directionSplit.bearish.created).toBe(4);
    expect(stats.distanceVsHitRate).not.toBeNull();
  });

  test('normalizes missing medianTime in doc sessionPeriods to null', () => {
    const stats = computeAllStats({
      engulfingCandleList: sampleTargets,
      sessionPeriods: [{ period: 'Afternoon', created: 1, hit: 0, accuracy: 0 }],
    });
    expect(stats.sessionPeriods[0].medianTime).toBeNull();
  });
});

describe('computeDistanceVsHitRate fallback', () => {
  test('buckets match the generator boundaries and shape', () => {
    const result = computeDistanceVsHitRate(sampleTargets);
    const byRange = Object.fromEntries(result.buckets.map((b) => [b.range, b]));

    expect(byRange['0-5 pts']).toEqual({ range: '0-5 pts', created: 1, hit: 1, hitRate: '100.0%' });
    expect(byRange['5-10 pts']).toEqual({ range: '5-10 pts', created: 3, hit: 3, hitRate: '100.0%' });
    expect(byRange['10-20 pts']).toEqual({ range: '10-20 pts', created: 1, hit: 1, hitRate: '100.0%' });
    expect(byRange['20+ pts']).toEqual({ range: '20+ pts', created: 2, hit: 1, hitRate: '50.0%' });
    expect(result.medianDistance).toBe('7.8 pts');
  });

  test('returns null without distance data', () => {
    expect(computeDistanceVsHitRate([{ targetReached: true }])).toBeNull();
  });
});

describe('computeAskComparison', () => {
  test('compares avg target distance between misses and hits', () => {
    const result = computeAskComparison(sampleTargets);
    expect(result.missedAvg).toBe(33.75);
    expect(result.hitAvg).toBeCloseTo(10.63, 2);
  });

  test('returns null when no misses', () => {
    expect(computeAskComparison(sampleTargets.filter((t) => t.targetReached))).toBeNull();
  });
});

describe('computeRetractionStats band', () => {
  test('computes p25/median/p75 among hits', () => {
    const { band, median, count } = computeRetractionStats(sampleTargets);
    expect(band.median).toBeCloseTo(6.13, 2);
    expect(median).toBeCloseTo(6.13, 2);
    expect(band.p25).toBeCloseTo(4.75, 2);
    expect(band.p75).toBeGreaterThan(band.median);
    expect(count).toBe(6);
  });

  test('band is null with fewer than 3 hits, median still available', () => {
    const { band, median } = computeRetractionStats(sampleTargets.slice(0, 2));
    expect(band).toBeNull();
    expect(median).toBeCloseTo(109.75, 2);
  });
});
