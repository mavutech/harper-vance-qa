import {
  buildCandleSeries,
  buildTargetSeries,
  buildLabelAnnotations,
  CHART_COLORS,
} from './intradayChart';

const BULLISH = 7004928;
const BEARISH = 16711680;

const hitTarget = {
  colorHighlight: BEARISH,
  targetReached: true,
  dateTimestamp: '1781011800',
  targetReachedTimestamp: '1781013600',
  targetReachedDuration: '26 mins',
  targetPrice: '29633.25',
  retractionPoints: 215,
};

describe('buildCandleSeries', () => {
  test('maps string OHLC candles to apex format in epoch ms', () => {
    const series = buildCandleSeries([
      { dateTimestamp: '1781011800', open: '29737', high: '29748', low: '29633.25', close: '29649.75' },
    ]);
    expect(series).toEqual([
      { x: 1781011800000, y: [29737, 29748, 29633.25, 29649.75] },
    ]);
  });

  test('skips malformed candles and handles empty input', () => {
    expect(buildCandleSeries([{ dateTimestamp: 'bad', open: 'x', high: '1', low: '1', close: '1' }])).toEqual([]);
    expect(buildCandleSeries(null)).toEqual([]);
  });
});

describe('buildTargetSeries', () => {
  test('creates called and resolved points with meta for a hit target', () => {
    const { called, resolved, discrete } = buildTargetSeries([hitTarget]);

    expect(called).toHaveLength(1);
    expect(called[0].x).toBe(1781011800000);
    expect(called[0].y).toBe(29633.25);
    expect(called[0].meta.number).toBe(1);
    expect(called[0].meta.direction).toBe('Bearish');
    expect(called[0].meta.retraction).toBe('215 pts');

    expect(resolved).toHaveLength(1);
    expect(resolved[0].x).toBe(1781013600000);

    // Discrete styling: alert hollow, resolution filled, both direction-colored
    expect(discrete).toHaveLength(2);
    expect(discrete[0].strokeColor).toBe(CHART_COLORS.bearish);
    expect(discrete[1].fillColor).toBe(CHART_COLORS.bearish);
  });

  test('misses produce a called point only, amber, no resolution', () => {
    const { called, resolved, discrete } = buildTargetSeries([
      { ...hitTarget, targetReached: false, targetReachedTimestamp: undefined, retractionPoints: undefined },
    ]);
    expect(called).toHaveLength(1);
    expect(resolved).toHaveLength(0);
    expect(discrete).toHaveLength(1);
    expect(discrete[0].strokeColor).toBe(CHART_COLORS.miss);
    expect(called[0].meta.hit).toBe(false);
  });

  test('bullish hits use the bullish color and skip invalid rows', () => {
    const { called } = buildTargetSeries([
      { ...hitTarget, colorHighlight: BULLISH },
      { colorHighlight: BEARISH, targetReached: true, dateTimestamp: 'bad', targetPrice: 'bad' },
    ]);
    expect(called).toHaveLength(1);
    expect(called[0].meta.color).toBe(CHART_COLORS.bullish);
  });

  test('dataPointIndex stays aligned per series when targets are skipped', () => {
    const second = { ...hitTarget, dateTimestamp: '1781020200', targetReachedTimestamp: '1781020500', targetPrice: '28847.75' };
    const { discrete } = buildTargetSeries([hitTarget, second]);
    const calledIdx = discrete.filter((d) => d.seriesIndex === 1).map((d) => d.dataPointIndex);
    const resolvedIdx = discrete.filter((d) => d.seriesIndex === 2).map((d) => d.dataPointIndex);
    expect(calledIdx).toEqual([0, 1]);
    expect(resolvedIdx).toEqual([0, 1]);
  });
});

describe('buildLabelAnnotations', () => {
  test('labels called and resolved points with invisible markers', () => {
    const ts = buildTargetSeries([hitTarget]);
    const labels = buildLabelAnnotations(ts);
    expect(labels.map((l) => l.label.text)).toEqual(['T1', 'T1 ✓']);
    expect(labels.every((l) => l.marker.size === 0)).toBe(true);
  });
});

describe('meta payload for the details panel', () => {
  test('includes retraction, duration and times for hits', () => {
    const { called } = buildTargetSeries([hitTarget]);
    expect(called[0].meta).toMatchObject({
      number: 1,
      direction: 'Bearish',
      hit: true,
      duration: '26 mins',
      retraction: '215 pts',
    });
    expect(called[0].meta.calledAt).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    expect(called[0].meta.reachedAt).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
  });

  test('misses carry hit=false and no retraction', () => {
    const { called } = buildTargetSeries([
      { ...hitTarget, targetReached: false, retractionPoints: undefined },
    ]);
    expect(called[0].meta.hit).toBe(false);
    expect(called[0].meta.retraction).toBeNull();
  });
});
