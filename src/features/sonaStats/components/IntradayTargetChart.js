import React, { useMemo, useState } from 'react';
import { Card, Spinner } from 'react-bootstrap';
import ReactApexChart from 'react-apexcharts';
import moment from 'moment-timezone';
import { useSessionCandles } from '../hooks/useSessionCandles';
import {
  buildCandleSeries,
  buildTargetSeries,
  buildLabelAnnotations,
  CHART_COLORS,
} from '../utils/intradayChart';

const EST = 'America/New_York';

/**
 * Renders the target details line shown in the card header when a marker is
 * hovered or clicked.
 *
 * @param {Object} props
 * @param {Object} props.meta - Point meta from buildTargetSeries
 * @returns {JSX.Element}
 */
const TargetDetails = ({ meta }) => (
  <span className="fs-xs d-flex align-items-center gap-2 flex-wrap justify-content-end">
    <span
      className="rounded-circle d-inline-block"
      style={{ width: 8, height: 8, backgroundColor: meta.color, flexShrink: 0 }}
    ></span>
    <strong style={{ color: meta.color }}>Target {meta.number}: {meta.direction}</strong>
    <span className="text-secondary">Target price: {meta.targetPrice}</span>
    <span className="text-secondary">Generated: {meta.calledAt}</span>
    {meta.hit ? (
      <>
        <span className="text-secondary">
          Resolved: {meta.reachedAt ?? ''}{meta.duration ? ` (${meta.duration})` : ''}
        </span>
        {meta.retraction && <span className="text-secondary">Retraction: {meta.retraction}</span>}
      </>
    ) : (
      <span style={{ color: CHART_COLORS.miss }}>Not resolved</span>
    )}
  </span>
);

/**
 * Renders the session's 5-minute candlestick chart with interactive target
 * markers: a numbered marker where each target was called (at the target
 * price) and a matching ✓ marker where it resolved; misses amber. Hovering
 * or clicking a marker shows the target's details (direction, times,
 * retraction) in the card header. Candles are context only — no tooltip.
 *
 * Candles are fetched from the raw history node — not the day stats doc.
 * Hidden entirely when no candle data exists for the date.
 *
 * @param {Object} props
 * @param {string} props.date - ISO date string (YYYY-MM-DD)
 * @param {Object[]} props.targets - engulfingCandleList array for the date
 * @returns {JSX.Element|null}
 */
const IntradayTargetChart = ({ date, targets }) => {
  const { candles, loading } = useSessionCandles(date);
  const [activeMeta, setActiveMeta] = useState(null);

  const candleData = useMemo(() => buildCandleSeries(candles), [candles]);
  const targetSeries = useMemo(() => buildTargetSeries(targets ?? []), [targets]);
  const annotations = useMemo(() => buildLabelAnnotations(targetSeries), [targetSeries]);

  const series = useMemo(() => [
    { name: 'NQ 5m', type: 'candlestick', data: candleData },
    { name: 'Called', type: 'line', data: targetSeries.called },
    { name: 'Resolved', type: 'line', data: targetSeries.resolved },
  ], [candleData, targetSeries]);

  // Marker hover/click events drive the header details panel — ApexCharts'
  // own tooltip is unreliable on candlestick combo charts.
  const options = useMemo(() => {
    const selectPoint = (config) => {
      const { seriesIndex, dataPointIndex } = config;
      if (seriesIndex < 1 || dataPointIndex < 0) return;
      const source = seriesIndex === 2 ? targetSeries.resolved : targetSeries.called;
      const point = source[dataPointIndex];
      if (point) setActiveMeta(point.meta);
    };

    return {
      chart: {
        type: 'candlestick',
        parentHeightOffset: 0,
        toolbar: { show: false },
        animations: { enabled: false },
        events: {
          dataPointMouseEnter: (event, ctx, config) => selectPoint(config),
          markerClick: (event, ctx, config) => selectPoint(config),
        },
      },
      plotOptions: {
        candlestick: {
          colors: { upward: CHART_COLORS.bullish, downward: CHART_COLORS.bearish },
          wick: { useFillColor: true },
        },
      },
      annotations: { points: annotations },
      // Marker series draw points only — no connecting line
      stroke: { width: [1, 0, 0] },
      markers: {
        size: [0, 5, 5],
        strokeWidth: 2,
        discrete: targetSeries.discrete,
        hover: { sizeOffset: 3 },
      },
      legend: { show: false },
      tooltip: { enabled: false },
      grid: {
        borderColor: 'rgba(72,94,144,0.08)',
        yaxis: { lines: { show: true } },
      },
      xaxis: {
        type: 'datetime',
        labels: {
          style: { colors: CHART_COLORS.label, fontSize: '10px' },
          formatter: (value) => moment(Number(value)).tz(EST).format('h:mm A'),
        },
        axisBorder: { show: false },
        tooltip: { enabled: false },
      },
      yaxis: {
        tooltip: { enabled: false },
        labels: {
          style: { colors: CHART_COLORS.label, fontSize: '10px' },
          formatter: (v) => (Number.isFinite(v) ? v.toFixed(0) : v),
        },
      },
    };
  }, [annotations, targetSeries]);

  if (!loading && candleData.length === 0) return null;

  return (
    <Card className="card-one mb-4">
      <Card.Header className="d-flex align-items-center justify-content-between gap-3">
        <Card.Title as="h6" className="mb-0 flex-shrink-0">Session Replay</Card.Title>
        {activeMeta ? (
          <TargetDetails meta={activeMeta} />
        ) : (
          <span className="fs-xs text-secondary">
            Select or hover over a target marker to view details. Times are Eastern Time.
          </span>
        )}
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <Spinner animation="border" size="sm" />
          </div>
        ) : (
          <ReactApexChart series={series} options={options} type="candlestick" height={340} />
        )}
      </Card.Body>
    </Card>
  );
};

export default IntradayTargetChart;
