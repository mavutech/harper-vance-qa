import React, { useMemo } from 'react';
import { Card, OverlayTrigger, Popover } from 'react-bootstrap';
import ReactApexChart from 'react-apexcharts';
import moment from 'moment';
import { chartLabelColor, chartTooltipTheme } from '../utils/chartTheme';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Two hues from the same blue family — the line pops as the "answer" and the
// band reads as ambient context. Indigo and cyan are far enough apart in hue
// to be distinguishable but still coordinate.
const BAND_COLOR = '#41b8ff';    // cyan
const MEDIAN_COLOR = '#506fd9';  // indigo (primary)

const TIP = 'For each day, the point shows the median retraction for targets that were hit. The shaded range shows the middle 50% of values, from the 25th to the 75th percentile. Wider ranges indicate greater variation. Days without a session or a hit are shown as gaps. Use Retraction Summary for the weekly values.';

// Daily payloads carry retraction values as strings like "3.5 pts" or "N/A".
// Return null so ApexCharts leaves a gap on missing days.
const parsePts = (raw) => {
  if (raw == null || raw === 'N/A') return null;
  const n = parseFloat(String(raw));
  return Number.isFinite(n) ? n : null;
};

/**
 * Per-day median retraction with a p25–p75 band across the 5 weekdays of the
 * selected trading week. Reads the fields the daily generator now emits on
 * every daily doc (medianRetraction, p25Retraction, p75Retraction). Replaces
 * the Retraction Depth survival curve.
 *
 * @param {Object} props
 * @param {Array<{ rawPayload: Object }>} props.rangeData - Daily docs for the week
 * @param {string[]} props.weekDates - The 5 ISO dates (Mon–Fri) for the week
 * @returns {JSX.Element}
 */
const WeeklyMedianRetractionChart = ({ rangeData, weekDates }) => {
  const { categories, medianPoints, bandPoints, hasAny } = useMemo(() => {
    const byDate = {};
    (rangeData || []).forEach(({ rawPayload }) => {
      if (rawPayload && rawPayload.alertDate) byDate[rawPayload.alertDate] = rawPayload;
    });

    const cats = (weekDates || []).map((d, i) => `${DAY_LABELS[i] || ''} ${moment(d).format('MM/DD')}`.trim());
    const medians = [];
    const band = [];
    let anyMedian = false;

    (weekDates || []).forEach((d) => {
      const doc = byDate[d];
      const m = parsePts(doc?.medianRetraction);
      const lo = parsePts(doc?.p25Retraction);
      const hi = parsePts(doc?.p75Retraction);
      medians.push(m);
      // Range series needs [low, high]; leave both null when the day has no band
      band.push(lo != null && hi != null ? [lo, hi] : [null, null]);
      if (m != null) anyMedian = true;
    });

    return { categories: cats, medianPoints: medians, bandPoints: band, hasAny: anyMedian };
  }, [rangeData, weekDates]);

  const series = [
    { name: 'p25–p75 band', type: 'rangeArea', data: bandPoints.map((y, i) => ({ x: categories[i], y })) },
    { name: 'Median retraction', type: 'line', data: medianPoints.map((y, i) => ({ x: categories[i], y })) },
  ];

  const labelColor = chartLabelColor();

  const options = {
    chart: {
      type: 'rangeArea',
      parentHeightOffset: 0,
      toolbar: { show: false },
      animations: { enabled: false },
    },
    colors: [BAND_COLOR, MEDIAN_COLOR],
    fill: { opacity: [0.25, 1] },
    stroke: { curve: 'smooth', width: [0, 2.5] },
    markers: { size: [0, 5], hover: { size: 7 } },
    dataLabels: { enabled: false },
    xaxis: {
      type: 'category',
      categories,
      labels: { style: { colors: labelColor, fontSize: '11px' } },
      axisBorder: { show: false },
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      title: { text: 'Retraction (pts)', style: { fontSize: '10px', color: labelColor } },
      labels: { style: { colors: labelColor, fontSize: '10px' }, formatter: (v) => `${Math.round(v)}` },
    },
    grid: { borderColor: 'rgba(72,94,144,0.08)' },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '11px',
      labels: { colors: labelColor },
      markers: { fillColors: [BAND_COLOR, MEDIAN_COLOR] },
      // Legend items are labels only — clicking them in a mixed rangeArea +
      // line chart crashes ApexCharts because it can't render the rangeArea
      // chart type with the rangeArea series hidden.
      onItemClick: { toggleDataSeries: false },
      onItemHover: { highlightDataSeries: false },
    },
    tooltip: {
      theme: chartTooltipTheme(),
      shared: true,
      intersect: false,
      y: {
        formatter: (val) => (val == null ? 'N/A' : `${val} pts`),
      },
    },
  };

  return (
    <Card className="card-one mb-4">
      <Card.Header>
        <Card.Title as="h6">Median Retraction per Day</Card.Title>
        <span className="fs-xs text-secondary ms-2">this week: median with p25–p75 band</span>
        <OverlayTrigger
          trigger="click"
          rootClose
          placement="top"
          overlay={
            <Popover id="weekly-median-retraction-tip" style={{ maxWidth: 340 }}>
              <Popover.Header as="h6" className="fs-sm">Median Retraction per Day</Popover.Header>
              <Popover.Body className="fs-xs">{TIP}</Popover.Body>
            </Popover>
          }
        >
          <span
            className="fs-xs text-secondary ms-2"
            style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
            tabIndex={0}
          >
            how to read this <i className="ri-information-line"></i>
          </span>
        </OverlayTrigger>
      </Card.Header>
      <Card.Body>
        {!hasAny ? (
          <p className="text-secondary fs-sm mb-0">
            No retraction data yet this week. Days with hits will populate as the week runs.
          </p>
        ) : (
          <React.Fragment>
            <ReactApexChart series={series} options={options} type="rangeArea" height={260} />
            <p className="fs-xs text-secondary mt-2 mb-0">
              Dot = median retraction across that day&apos;s hits. Shaded band = middle 50% of hits (p25 to p75). Days without hits render as gaps.
            </p>
          </React.Fragment>
        )}
      </Card.Body>
    </Card>
  );
};

export default WeeklyMedianRetractionChart;
