import React, { useMemo } from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import ReactApexChart from 'react-apexcharts';
import { chartTooltipTheme } from '../utils/chartTheme';

const BUCKET_LABELS = ['0–5 min', '6–15 min', '16–30 min', '31–60 min', '60+ min'];
const BUCKET_KEYS = ['0-5', '6-15', '16-30', '31-60', '60+'];

/**
 * Builds ApexCharts bar chart options for the resolution time distribution.
 *
 * @param {string[]} labels - X-axis category labels
 * @returns {Object} ApexCharts options object
 */
const buildChartOptions = (labels) => ({
  chart: {
    type: 'bar',
    parentHeightOffset: 0,
    toolbar: { show: false },
  },
  colors: ['#506fd9'],
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: '45%',
    },
  },
  dataLabels: { enabled: true, style: { fontSize: '11px', colors: ['#fff'] } },
  grid: {
    borderColor: 'rgba(72,94,144, 0.08)',
    yaxis: { lines: { show: true } },
  },
  xaxis: {
    categories: labels,
    labels: { style: { colors: '#6e7985', fontSize: '11px' } },
    axisBorder: { show: false },
  },
  yaxis: {
    labels: { style: { colors: '#6e7985', fontSize: '11px' } },
    title: { text: 'Targets', style: { color: '#6e7985', fontSize: '11px' } },
    min: 0,
    tickAmount: 4,
  },
  legend: { show: false },
  tooltip: {
    theme: chartTooltipTheme(),
    y: { formatter: (val) => `${val} resolved target${val !== 1 ? 's' : ''}` },
  },
});

/**
 * Renders the resolution time distribution as a bar chart.
 * Buckets: 0–5 min, 6–15 min, 16–30 min, 31–60 min, 60+ min.
 * Includes a summary text showing what % of hits resolved within 15 minutes.
 *
 * @param {Object} props
 * @param {Object} props.timeBuckets - Bucket counts keyed by bucket label
 * @param {Object} props.resolutionTimes - { avg, median, fastest, slowest, stdDev }
 * @param {Object} [props.trailing] - data.trailingStats — used for the 20-session baseline footer
 * @returns {JSX.Element}
 */
const ResolutionTimeBuckets = ({ timeBuckets, resolutionTimes, trailing }) => {
  const series = useMemo(() => {
    if (!timeBuckets) return [{ name: 'Targets', data: [0, 0, 0, 0, 0] }];
    return [{ name: 'Targets', data: BUCKET_KEYS.map((k) => timeBuckets[k] ?? 0) }];
  }, [timeBuckets]);

  const options = useMemo(() => buildChartOptions(BUCKET_LABELS), []);

  const fastHitCount = timeBuckets ? (timeBuckets['0-5'] ?? 0) + (timeBuckets['6-15'] ?? 0) : 0;
  const totalHit = timeBuckets ? BUCKET_KEYS.reduce((sum, k) => sum + (timeBuckets[k] ?? 0), 0) : 0;
  const fastPct = totalHit > 0 ? Math.round((fastHitCount / totalHit) * 100) : 0;

  // 20-session baseline footer — median (typical), mean (real average,
  // slow outliers included), p90 (the slow tail), max (worst case).
  const pooled = trailing?.pooled ?? null;
  const baselineParts = pooled ? [
    pooled.medianTime !== null && pooled.medianTime !== undefined
      ? `median ${pooled.medianTime} min` : null,
    pooled.meanTime !== null && pooled.meanTime !== undefined
      ? `mean ${pooled.meanTime} min` : null,
    pooled.p90Time !== null && pooled.p90Time !== undefined
      ? `p90 ${pooled.p90Time} min` : null,
    pooled.maxTime !== null && pooled.maxTime !== undefined
      ? `max ${pooled.maxTime} min` : null,
  ].filter(Boolean) : [];
  const baselineLine = trailing && baselineParts.length
    ? `${trailing.sessions}-session typical: ${baselineParts.join(' · ')}`
    : null;

  return (
    <Card className="card-one mb-4">
      <Card.Header>
        <Card.Title as="h6">Resolution Time Distribution</Card.Title>
      </Card.Header>
      <Card.Body>
        <ReactApexChart series={series} options={options} type="bar" height={220} />
        <Row className="g-3 mt-1 border-top pt-3">
          {[
            { label: 'Avg', value: resolutionTimes?.avg != null ? `${resolutionTimes.avg} min` : '—' },
            { label: 'Median', value: resolutionTimes?.median != null ? `${resolutionTimes.median} min` : '—' },
            { label: 'Fastest', value: resolutionTimes?.fastest != null ? `${resolutionTimes.fastest} min` : '—' },
            { label: 'Slowest', value: resolutionTimes?.slowest != null ? `${resolutionTimes.slowest} min` : '—' },
            // Std dev on a handful of observations is noise — guard at n>=5
            { label: totalHit >= 5 ? 'Std Dev' : `Std Dev (n=${totalHit})`, value: totalHit >= 5 && resolutionTimes?.stdDev != null ? `${resolutionTimes.stdDev} min` : '—' },
            { label: 'Hit ≤15 min', value: totalHit > 0 ? `${fastPct}%` : '—' },
          ].map(({ label, value }) => (
            <Col xs="6" sm="4" md="2" key={label}>
              <h6 className="card-value fs-16 mb-0 text-start">{value}</h6>
              <span className="fs-xs text-secondary d-block text-start">{label}</span>
            </Col>
          ))}
        </Row>

        {baselineLine && (
          <p className="fs-xs text-secondary mb-0 mt-3 pt-2 border-top">{baselineLine}</p>
        )}
      </Card.Body>
    </Card>
  );
};

export default ResolutionTimeBuckets;
