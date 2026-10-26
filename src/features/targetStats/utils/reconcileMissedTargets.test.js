import { reconcileMissedTarget, reconcileMissedTargets } from './reconcileMissedTargets';

const BULLISH = 7004928;
const BEARISH = 16711680;

// Monday 2026-06-08 15:00 EST — target created just before the bell.
const ORIGIN_EPOCH = 1749409200;

const unreachedTarget = (overrides = {}) => ({
  alertId: 'abc123',
  title: 'NQ1! 5m Bearish Target',
  colorHighlight: BEARISH,
  dateTimestamp: String(ORIGIN_EPOCH),
  targetReached: false,
  entryPrice: '21500',
  targetPrice: '21490',
  originDate: '2026-06-08',
  ...overrides,
});

/**
 * Build a 5-minute bar with a resolvable epoch derived from an ISO date.
 * All string-typed to mirror the on-disk shape.
 */
const bar = (dateIso, hhmm, { open, high, low, close }) => {
  const dt = new Date(`${dateIso}T${hhmm}:00-04:00`); // EDT
  return {
    open: String(open),
    high: String(high),
    low: String(low),
    close: String(close),
    dateTimestamp: String(Math.floor(dt.getTime() / 1000)),
  };
};

describe('reconcileMissedTarget', () => {
  test('marks a bearish target as resolved when a later-day bar prints a low <= target price', () => {
    const target = unreachedTarget();
    const subsequentDays = [
      {
        date: '2026-06-09',
        candles: [
          bar('2026-06-09', '09:25', { open: 21510, high: 21515, low: 21505, close: 21507 }),
          bar('2026-06-09', '09:30', { open: 21507, high: 21508, low: 21488, close: 21492 }),
        ],
      },
    ];
    const result = reconcileMissedTarget(target, subsequentDays);
    expect(result.resolved).toBe(true);
    expect(result.direction).toBe('bearish');
    expect(result.resolvedOnDate).toBe('2026-06-09');
    expect(result.sessionsToResolve).toBe(1);
    expect(result.resolvedPreMarket).toBe(false);
    expect(result.minutesToResolve).toBeGreaterThan(0);
  });

  test('marks a bullish target as resolved when a later-day bar prints a high >= target price', () => {
    const target = unreachedTarget({
      colorHighlight: BULLISH,
      title: 'NQ1! 5m Bullish Target',
      targetPrice: '21600',
    });
    const subsequentDays = [
      {
        date: '2026-06-09',
        candles: [
          bar('2026-06-09', '09:25', { open: 21580, high: 21599, low: 21575, close: 21585 }),
          bar('2026-06-09', '09:30', { open: 21585, high: 21605, low: 21580, close: 21600 }),
        ],
      },
    ];
    const result = reconcileMissedTarget(target, subsequentDays);
    expect(result.resolved).toBe(true);
    expect(result.direction).toBe('bullish');
    expect(result.resolvedByBar.high).toBe('21605');
  });

  test('flags pre-market fill when the touching bar is the first bar of the day', () => {
    const target = unreachedTarget({ targetPrice: '21490' });
    const subsequentDays = [
      {
        date: '2026-06-09',
        candles: [
          bar('2026-06-09', '09:25', { open: 21510, high: 21515, low: 21485, close: 21492 }),
          bar('2026-06-09', '09:30', { open: 21492, high: 21495, low: 21488, close: 21491 }),
        ],
      },
    ];
    const result = reconcileMissedTarget(target, subsequentDays);
    expect(result.resolved).toBe(true);
    expect(result.resolvedPreMarket).toBe(true);
  });

  test('skips days with no candles and resolves on the next day that does', () => {
    const target = unreachedTarget();
    const subsequentDays = [
      { date: '2026-06-09', candles: [] },
      {
        date: '2026-06-10',
        candles: [
          bar('2026-06-10', '10:00', { open: 21500, high: 21500, low: 21489, close: 21490 }),
        ],
      },
    ];
    const result = reconcileMissedTarget(target, subsequentDays);
    expect(result.resolved).toBe(true);
    expect(result.resolvedOnDate).toBe('2026-06-10');
    expect(result.sessionsToResolve).toBe(2);
  });

  test('returns unresolved when no subsequent bar touches the level', () => {
    const target = unreachedTarget();
    const subsequentDays = [
      {
        date: '2026-06-09',
        candles: [
          bar('2026-06-09', '09:30', { open: 21510, high: 21515, low: 21495, close: 21500 }),
        ],
      },
      {
        date: '2026-06-10',
        candles: [
          bar('2026-06-10', '09:30', { open: 21500, high: 21510, low: 21492, close: 21495 }),
        ],
      },
    ];
    const result = reconcileMissedTarget(target, subsequentDays);
    expect(result.resolved).toBe(false);
    expect(result.sessionsElapsed).toBe(2);
  });

  test('returns unresolved when direction cannot be inferred', () => {
    const target = unreachedTarget({ colorHighlight: null, title: 'NQ1! 5m Target' });
    const result = reconcileMissedTarget(target, [
      { date: '2026-06-09', candles: [bar('2026-06-09', '09:30', { open: 21500, high: 21500, low: 21480, close: 21485 })] },
    ]);
    expect(result.resolved).toBe(false);
    expect(result.direction).toBeNull();
  });

  test('returns unresolved when target price is missing', () => {
    const target = unreachedTarget({ targetPrice: null });
    const result = reconcileMissedTarget(target, [
      { date: '2026-06-09', candles: [bar('2026-06-09', '09:30', { open: 21500, high: 21500, low: 21480, close: 21485 })] },
    ]);
    expect(result.resolved).toBe(false);
    expect(result.targetPriceNum).toBeNull();
  });

  test('infers direction from title when colorHighlight is missing', () => {
    const target = unreachedTarget({ colorHighlight: undefined, title: 'NQ1! 5m Bullish Target', targetPrice: '21600' });
    const subsequentDays = [
      { date: '2026-06-09', candles: [bar('2026-06-09', '09:30', { open: 21580, high: 21610, low: 21575, close: 21600 })] },
    ];
    const result = reconcileMissedTarget(target, subsequentDays);
    expect(result.direction).toBe('bullish');
    expect(result.resolved).toBe(true);
  });
});

describe('reconcileMissedTargets (batch)', () => {
  test('returns empty array when targets input is not an array', () => {
    expect(reconcileMissedTargets(null)).toEqual([]);
    expect(reconcileMissedTargets(undefined)).toEqual([]);
  });

  test('only considers days strictly after each target originDate', () => {
    const olderTarget = unreachedTarget({ originDate: '2026-06-08', targetPrice: '21490' });
    const newerTarget = unreachedTarget({ originDate: '2026-06-09', targetPrice: '21490' });

    const dailyCandles = [
      {
        date: '2026-06-08',
        candles: [bar('2026-06-08', '09:30', { open: 21500, high: 21500, low: 21489, close: 21490 })],
      },
      {
        date: '2026-06-09',
        candles: [bar('2026-06-09', '09:30', { open: 21500, high: 21500, low: 21489, close: 21490 })],
      },
    ];

    const [older, newer] = reconcileMissedTargets([olderTarget, newerTarget], dailyCandles);
    // olderTarget origin was 06-08, so only 06-09 candles count → resolves.
    expect(older.resolved).toBe(true);
    expect(older.resolvedOnDate).toBe('2026-06-09');
    // newerTarget origin was 06-09, no strictly-later candles → unresolved.
    expect(newer.resolved).toBe(false);
    expect(newer.sessionsElapsed).toBe(0);
  });

  test('sorts input days ascending by date before scanning', () => {
    const target = unreachedTarget({ targetPrice: '21490' });
    const dailyCandles = [
      // Deliberately out of order.
      {
        date: '2026-06-10',
        candles: [bar('2026-06-10', '09:30', { open: 21495, high: 21496, low: 21488, close: 21489 })],
      },
      {
        date: '2026-06-09',
        candles: [bar('2026-06-09', '09:30', { open: 21500, high: 21500, low: 21489, close: 21490 })],
      },
    ];
    const [result] = reconcileMissedTargets([target], dailyCandles);
    expect(result.resolved).toBe(true);
    expect(result.resolvedOnDate).toBe('2026-06-09');
    expect(result.sessionsToResolve).toBe(1);
  });
});
