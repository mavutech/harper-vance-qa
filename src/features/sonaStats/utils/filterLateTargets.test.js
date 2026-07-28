import { filterLateTargets } from './filterLateTargets';

const BULLISH = 7004928;
const BEARISH = 16711680;

// A specific unix timestamp within RTH morning (Mon 2026-06-08 10:00 EST = 1749391200)
const MORNING_TS = 1749391200;

const target = (overrides = {}) => ({
  colorHighlight: BEARISH,
  dateTimestamp: String(MORNING_TS),
  targetReached: true,
  targetReachedTimestamp: String(MORNING_TS + 20 * 60), // 20 min later
  entryPrice: '21500',
  targetPrice: '21490',
  ...overrides,
});

describe('filterLateTargets', () => {
  test('returns empty array for non-array input', () => {
    expect(filterLateTargets(null)).toEqual([]);
    expect(filterLateTargets(undefined)).toEqual([]);
    expect(filterLateTargets('nope')).toEqual([]);
  });

  test('excludes fast hits (resolved within threshold)', () => {
    const fast = target({
      targetReachedTimestamp: String(MORNING_TS + 3 * 60), // 3 min
    });
    const late = target({
      targetReachedTimestamp: String(MORNING_TS + 30 * 60), // 30 min
    });
    const result = filterLateTargets([fast, late], 5);
    expect(result).toHaveLength(1);
    expect(result[0].timeToResolveMin).toBe(30);
  });

  test('includes unresolved targets regardless of threshold', () => {
    const unresolved = target({
      targetReached: false,
      targetReachedTimestamp: undefined,
    });
    const result = filterLateTargets([unresolved], 5);
    expect(result).toHaveLength(1);
    expect(result[0].timeToResolveMin).toBeNull();
  });

  test('honors a custom threshold', () => {
    const t10 = target({ targetReachedTimestamp: String(MORNING_TS + 10 * 60) });
    const t20 = target({ targetReachedTimestamp: String(MORNING_TS + 20 * 60) });
    const result = filterLateTargets([t10, t20], 15);
    expect(result).toHaveLength(1);
    expect(result[0].timeToResolveMin).toBe(20);
  });

  test('decorates surviving targets with display fields', () => {
    const [decorated] = filterLateTargets([target({ colorHighlight: BULLISH })], 5);
    expect(decorated.direction).toBe('bullish');
    expect(decorated.session).toBe('Morning');
    expect(decorated.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    expect(decorated.resolvedAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    expect(decorated.entryPriceNum).toBe(21500);
    expect(decorated.targetPriceNum).toBe(21490);
  });

  test('classifies session bucket by generation time', () => {
    const morning = target({ dateTimestamp: String(MORNING_TS) });                 // 10:00 EST
    const midday = target({ dateTimestamp: String(MORNING_TS + 3 * 3600) });        // 13:00 EST
    const afternoon = target({ dateTimestamp: String(MORNING_TS + 5 * 3600) });     // 15:00 EST
    const result = filterLateTargets([morning, midday, afternoon], 5);
    const sessions = result.map((t) => t.session);
    // Sort order is newest first
    expect(sessions).toEqual(['Afternoon', 'Midday', 'Morning']);
  });

  test('sorts results newest first by generation time', () => {
    const t1 = target({ alertId: 'oldest',   dateTimestamp: String(MORNING_TS) });
    const t2 = target({ alertId: 'middle',   dateTimestamp: String(MORNING_TS + 3600) });
    const t3 = target({ alertId: 'newest',   dateTimestamp: String(MORNING_TS + 7200) });
    const result = filterLateTargets([t1, t3, t2], 5);
    expect(result.map((t) => t.alertId)).toEqual(['newest', 'middle', 'oldest']);
  });

  test('skips null / undefined entries in the input array', () => {
    const result = filterLateTargets([null, undefined, target()], 5);
    expect(result).toHaveLength(1);
  });
});
