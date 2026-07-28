import moment from 'moment-timezone';
import { BULLISH_COLOR } from './sonaStatsConstants';

const EST = 'America/New_York';

export const CHART_COLORS = {
  bullish: '#0cb785',
  bearish: '#dc3545',
  miss: '#f7c948',
  label: '#6e7985',
};

/**
 * Maps raw history candles to the ApexCharts candlestick series format.
 * Skips malformed candles (non-numeric OHLC or timestamp).
 *
 * @param {Object[]} candles - Raw candles from the history node (string OHLC fields)
 * @returns {Array<{ x: number, y: number[] }>} [{ x: epochMs, y: [o, h, l, c] }]
 */
export const buildCandleSeries = (candles) => {
  if (!Array.isArray(candles)) return [];

  return candles
    .map((c) => ({
      x: parseInt(c.dateTimestamp, 10) * 1000,
      y: [parseFloat(c.open), parseFloat(c.high), parseFloat(c.low), parseFloat(c.close)],
    }))
    .filter((p) => Number.isFinite(p.x) && p.y.every(Number.isFinite));
};

/**
 * Builds hoverable marker series for targets: one series for where each
 * target was called, one for where it resolved. Each point carries `meta`
 * used by the tooltip (direction, times, retraction). Returns per-point
 * marker styling (discrete) since colors vary by direction/outcome.
 *
 * Series layout assumption: candlestick = series 0, called = 1, resolved = 2.
 *
 * @param {Object[]} targets - engulfingCandleList array
 * @returns {{ called: Object[], resolved: Object[], discrete: Object[] }}
 */
export const buildTargetSeries = (targets) => {
  const called = [];
  const resolved = [];
  const discrete = [];

  if (!Array.isArray(targets)) return { called, resolved, discrete };

  targets.forEach((t, i) => {
    const ts = parseInt(t.dateTimestamp, 10) * 1000;
    const price = parseFloat(t.targetPrice);
    if (!Number.isFinite(ts) || !Number.isFinite(price)) return;

    const bullish = t.colorHighlight === BULLISH_COLOR;
    const hit = t.targetReached === true;
    const color = hit
      ? (bullish ? CHART_COLORS.bullish : CHART_COLORS.bearish)
      : CHART_COLORS.miss;

    const meta = {
      number: i + 1,
      direction: bullish ? 'Bullish' : 'Bearish',
      hit,
      calledAt: moment(ts).tz(EST).format('h:mm A'),
      targetPrice: t.targetPrice,
      reachedAt: null,
      duration: t.targetReachedDuration ?? null,
      retraction: Number.isFinite(t.retractionPoints) ? `${t.retractionPoints} pts` : null,
      color,
    };

    const reachedTs = parseInt(t.targetReachedTimestamp, 10) * 1000;
    if (hit && Number.isFinite(reachedTs)) {
      meta.reachedAt = moment(reachedTs).tz(EST).format('h:mm A');
    }

    discrete.push({
      seriesIndex: 1,
      dataPointIndex: called.length,
      fillColor: '#192030',
      strokeColor: color,
      size: 5,
      shape: 'circle',
    });
    called.push({ x: ts, y: price, meta });

    if (hit && Number.isFinite(reachedTs)) {
      discrete.push({
        seriesIndex: 2,
        dataPointIndex: resolved.length,
        fillColor: color,
        strokeColor: color,
        size: 5,
        shape: 'circle',
      });
      resolved.push({ x: reachedTs, y: price, meta });
    }
  });

  return { called, resolved, discrete };
};

/**
 * Builds label-only annotations ("T1", "T2 ✓") above the marker positions.
 * Markers themselves are rendered by the hoverable series, not annotations.
 *
 * @param {{ called: Object[], resolved: Object[] }} targetSeries - Output of buildTargetSeries
 * @returns {Object[]} ApexCharts points annotations with invisible markers
 */
export const buildLabelAnnotations = ({ called, resolved }) => {
  const label = (point, text) => ({
    x: point.x,
    y: point.y,
    marker: { size: 0 },
    label: {
      text,
      borderColor: point.meta.color,
      offsetY: -10,
      style: { background: point.meta.color, color: '#fff', fontSize: '10px', fontWeight: 600 },
    },
  });

  return [
    ...called.map((p) => label(p, `T${p.meta.number}`)),
    ...resolved.map((p) => label(p, `T${p.meta.number} ✓`)),
  ];
};

