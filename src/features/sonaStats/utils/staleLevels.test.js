import {
  filterStaleLevelsInRange,
  STALE_LEVELS_PROXIMITY_POINTS,
} from './staleLevels';

const BULLISH = 7004928;
const BEARISH = 16711680;

const target = (overrides = {}) => ({
  alertId: 'a1',
  colorHighlight: BEARISH,
  targetPrice: '21500',
  dateTimestamp: '1735000000',
  targetReached: false,
  ...overrides,
});

describe('filterStaleLevelsInRange', () => {
  test('returns empty array when targets is not an array', () => {
    expect(filterStaleLevelsInRange(null, 21500)).toEqual([]);
    expect(filterStaleLevelsInRange(undefined, 21500)).toEqual([]);
    expect(filterStaleLevelsInRange('nope', 21500)).toEqual([]);
  });

  test('returns empty array when currentPrice is null / undefined / NaN', () => {
    const targets = [target()];
    expect(filterStaleLevelsInRange(targets, null)).toEqual([]);
    expect(filterStaleLevelsInRange(targets, undefined)).toEqual([]);
    expect(filterStaleLevelsInRange(targets, 'abc')).toEqual([]);
  });

  test('excludes targets outside the proximity band', () => {
    const targets = [
      target({ alertId: 'far-away', targetPrice: '25000', colorHighlight: BEARISH }),
      target({ alertId: 'in-range', targetPrice: '21520', colorHighlight: BEARISH }),
    ];
    // Disable gate — this test is about proximity, not direction
    const result = filterStaleLevelsInRange(targets, 21500, { directionalGate: false });
    const ids = result.map((t) => t.alertId);
    expect(ids).toEqual(['in-range']);
  });

  test('directional gate — bull targets only surface when price ≤ level', () => {
    const targets = [
      target({ alertId: 'bull-above', targetPrice: '21450', colorHighlight: BULLISH }),
      target({ alertId: 'bull-below', targetPrice: '21550', colorHighlight: BULLISH }),
    ];
    const result = filterStaleLevelsInRange(targets, 21500);
    expect(result.map((t) => t.alertId)).toEqual(['bull-below']);
  });

  test('directional gate — bear targets only surface when price ≥ level', () => {
    const targets = [
      target({ alertId: 'bear-below', targetPrice: '21550', colorHighlight: BEARISH }),
      target({ alertId: 'bear-above', targetPrice: '21450', colorHighlight: BEARISH }),
    ];
    const result = filterStaleLevelsInRange(targets, 21500);
    expect(result.map((t) => t.alertId)).toEqual(['bear-above']);
  });

  test('directional gate can be disabled', () => {
    const targets = [
      target({ alertId: 'bull-above', targetPrice: '21450', colorHighlight: BULLISH }),
      target({ alertId: 'bear-below', targetPrice: '21550', colorHighlight: BEARISH }),
    ];
    const result = filterStaleLevelsInRange(targets, 21500, { directionalGate: false });
    expect(result.map((t) => t.alertId).sort()).toEqual(['bear-below', 'bull-above']);
  });

  test('sorts results ascending by distance from price', () => {
    const targets = [
      target({ alertId: 'far',    targetPrice: '21580', colorHighlight: BEARISH }),
      target({ alertId: 'near',   targetPrice: '21510', colorHighlight: BEARISH }),
      target({ alertId: 'medium', targetPrice: '21545', colorHighlight: BEARISH }),
    ];
    const result = filterStaleLevelsInRange(targets, 21500, { directionalGate: false });
    expect(result.map((t) => t.alertId)).toEqual(['near', 'medium', 'far']);
  });

  test('decorates surviving targets with derived display fields', () => {
    const targets = [
      target({ alertId: 'bull', targetPrice: '21550', colorHighlight: BULLISH }),
    ];
    const [decorated] = filterStaleLevelsInRange(targets, 21500);
    expect(decorated.direction).toBe('bullish');
    expect(decorated.targetPriceNum).toBe(21550);
    expect(decorated.distancePoints).toBe(50);
    expect(decorated.approaching).toBe(true);
  });

  test('skips targets with unparseable targetPrice', () => {
    const targets = [
      target({ alertId: 'bad',  targetPrice: 'not-a-number', colorHighlight: BEARISH }),
      target({ alertId: 'good', targetPrice: '21510', colorHighlight: BEARISH }),
    ];
    const result = filterStaleLevelsInRange(targets, 21500, { directionalGate: false });
    expect(result.map((t) => t.alertId)).toEqual(['good']);
  });

  test('respects a custom proximityPoints override', () => {
    const targets = [
      target({ alertId: 'inside',  targetPrice: '21520', colorHighlight: BEARISH }),
      target({ alertId: 'outside', targetPrice: '21540', colorHighlight: BEARISH }),
    ];
    const result = filterStaleLevelsInRange(targets, 21500, {
      proximityPoints: 30,
      directionalGate: false,
    });
    expect(result.map((t) => t.alertId)).toEqual(['inside']);
  });

  test('exports a sensible default proximity constant', () => {
    expect(STALE_LEVELS_PROXIMITY_POINTS).toBeGreaterThan(0);
    expect(STALE_LEVELS_PROXIMITY_POINTS).toBeLessThan(1000);
  });
});
