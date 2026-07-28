import React, { useMemo } from 'react';
import { Card } from 'react-bootstrap';
import ReactApexChart from 'react-apexcharts';
import moment from 'moment';
import { chartTooltipTheme } from '../utils/chartTheme';

const WIN_THRESHOLD = 70;

/**
 * Computes a rolling N-day average series aligned to each data point index.
 * Each value is the mean of the N preceding values (inclusive of current).
 * Points with fewer than N predecessors use the available window.
 *
 * @param {number[]} values - Array of daily accuracy percentages in ascending order
 * @param {number} n - Rolling window size
 * @returns {number[]} Rolling averages aligned to input indices
 */
const rollingAvg = (values, n) =>
  values.map((_, i) => {
    const window = values.slice(Math.max(0, i - n + 1), i + 1);
    return parseFloat((window.reduce((a, b) => a + b, 0) / window.length).toFixed(1));
  });

/**
 * Renders the rolling accuracy chart for SONA historical performance.
 * Displays:
 *   - Bar series: daily accuracy per session
 *   - Line series: 5-day rolling average
 *   - Line series: 20-day rolling average
 * Each bar is colour-coded green (≥70%) or red (<70%).
 *
 * @param {Object} props
 * @param {Array<{ rawPayload: Object }>} props.rangeData - Enriched daily stats ascending by date
 * @param {number|null} props.rolling5Day - Current 5-day rolling average (displayed in header)
 * @param {number|null} props.rolling20Day - Current 20-day rolling average (displayed in header)
 * @returns {JSX.Element}
 */
const RollingAccuracyChart = ({ rangeData, rolling5Day, rolling20Day }) => {
  const { categories, dailyAcc, avg5, avg20, barColors } = useMemo(() => {
    if (!rangeData || rangeData.length === 0) {
      return { categories: [], dailyAcc: [], avg5: [], avg20: [], barColors: [] };
    }

    const cats = rangeData.map(({ rawPayload }) =>
      moment(rawPayload.alertDate).format('MM/DD')
    );

    const accuracies = rangeData.map(({ rawPayload }) => {
      const created = parseInt(rawPayload.targetsCreated, 10);
      const reached = parseInt(rawPayload.targetsReached, 10);
      return created > 0 ? parseFloat(((reached / created) * 100).toFixed(1)) : 0;
    });

    const colors = accuracies.map((a) => (a >= WIN_THRESHOLD ? '#0cb785' : '#dc3545'));

    return {
      categories: cats,
      dailyAcc: accuracies,
      avg5: rollingAvg(accuracies, 5),
      avg20: rollingAvg(accuracies, 20),
      barColors: colors,
    };
  }, [rangeData]);

  const series = [
    { name: 'Daily Accuracy', type: 'bar', data: dailyAcc },
    { name: '5-Day Avg', type: 'line', data: avg5 },
    { name: '20-Day Avg', type: 'line', data: avg20 },
  ];

  const options = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false },
      animations: { enabled: false },
    },
    colors: ['#506fd9', '#f7c948', '#0cb785'],
    plotOptions: {
      bar: {
        borderRadius: 3,
        columnWidth: '55%',
        distributed: true,
      },
    },
    fill: { opacity: [0.85, 1, 1] },
    stroke: { width: [0, 2.5, 2.5], curve: 'smooth' },
    dataLabels: { enabled: false },
    grid: {
      borderColor: 'rgba(72,94,144,0.08)',
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories,
      labels: { style: { colors: '#6e7985', fontSize: '10px' } },
      axisBorder: { show: false },
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      labels: {
        style: { colors: '#6e7985', fontSize: '10px' },
        formatter: (v) => `${v}%`,
      },
    },
    legend: {
      show: true,
      position: 'top',
      fontSize: '11px',
      labels: { colors: '#6e7985' },
    },
    tooltip: {
      theme: chartTooltipTheme(),
      shared: true,
      y: { formatter: (v) => `${v}%` },
    },
  };

  // Override bar colours individually after options are set
  options.colors = barColors.length > 0
    ? [null, '#f7c948', '#0cb785']
    : ['#506fd9', '#f7c948', '#0cb785'];

  if (barColors.length > 0) {
    options.plotOptions.bar.colors = { ranges: [], backgroundBarColors: barColors };
    // ApexCharts distributed mode uses `colors` array for individual bars
    options.colors = [...barColors, '#f7c948', '#0cb785'];
  }

  return (
    <Card className="card-one mb-4">
      <Card.Header className="d-flex align-items-center justify-content-between">
        <Card.Title as="h6">Rolling Accuracy</Card.Title>
        <div className="d-flex gap-3 fs-xs text-secondary">
          <span>
            5-Day Avg: <strong className="text-dark">
              {rolling5Day !== null ? `${rolling5Day}%` : '—'}
            </strong>
          </span>
          <span>
            20-Day Avg: <strong className="text-dark">
              {rolling20Day !== null ? `${rolling20Day}%` : '—'}
            </strong>
          </span>
        </div>
      </Card.Header>
      <Card.Body>
        {dailyAcc.length === 0 ? (
          <p className="text-secondary fs-sm">No data available for this range.</p>
        ) : (
          <ReactApexChart series={series} options={options} type="line" height={280} />
        )}
      </Card.Body>
    </Card>
  );
};

export default RollingAccuracyChart;
