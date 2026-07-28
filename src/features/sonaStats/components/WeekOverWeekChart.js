import React, { useMemo } from 'react';
import { Card } from 'react-bootstrap';
import ReactApexChart from 'react-apexcharts';
import { chartTooltipTheme } from '../utils/chartTheme';

/**
 * Renders a line chart of weekly accuracy for the last N weeks.
 * Parses targetAccuracyOverall strings (e.g. "83.3% Accuracy"), the
 * volume-weighted weekly accuracy, from weekly rawPayloads, falling back to
 * the legacy targetAccuracySum for weeks generated before it existed.
 * Annotates the 70% win threshold as a dashed reference line.
 *
 * @param {Object} props
 * @param {Object[]} props.trendData - Array of weekly rawPayload objects in ascending order
 * @returns {JSX.Element}
 */
const WeekOverWeekChart = ({ trendData }) => {
  const { categories, accuracies } = useMemo(() => {
    if (!trendData || trendData.length === 0) {
      return { categories: [], accuracies: [] };
    }

    const cats = trendData.map((w) => w.weekNumberFormatted?.replace(' of 52', '') ?? `Wk ${w.weekNumberRaw}`);

    const accs = trendData.map((w) => {
      const raw = w.targetAccuracyOverall ?? w.targetAccuracySum ?? '';
      const num = parseFloat(raw.replace('% Accuracy', ''));
      return isNaN(num) ? 0 : num;
    });

    return { categories: cats, accuracies: accs };
  }, [trendData]);

  const series = [{ name: 'Weekly Accuracy', data: accuracies }];

  const options = {
    chart: {
      type: 'line',
      parentHeightOffset: 0,
      toolbar: { show: false },
      animations: { enabled: false },
    },
    colors: ['#506fd9'],
    stroke: { width: 2.5, curve: 'smooth' },
    markers: { size: 5, hover: { size: 7 } },
    annotations: {
      yaxis: [
        {
          y: 70,
          borderColor: '#0cb785',
          borderWidth: 1.5,
          strokeDashArray: 4,
          label: {
            text: '70% threshold',
            style: { color: '#0cb785', fontSize: '10px', background: 'transparent' },
            position: 'left',
            offsetX: 10,
          },
        },
      ],
    },
    grid: {
      borderColor: 'rgba(72,94,144,0.08)',
      yaxis: { lines: { show: true } },
    },
    dataLabels: {
      enabled: true,
      formatter: (v) => `${v}%`,
      style: { fontSize: '10px', colors: ['#506fd9'] },
      offsetY: -8,
      background: { enabled: false },
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
    legend: { show: false },
    tooltip: { theme: chartTooltipTheme(), y: { formatter: (v) => `${v}%` } },
  };

  return (
    <Card className="card-one mb-4">
      <Card.Header>
        <Card.Title as="h6">Week-over-Week Accuracy</Card.Title>
        <span className="fs-xs text-secondary ms-2">Last {trendData?.length ?? 0} weeks</span>
      </Card.Header>
      <Card.Body>
        {categories.length === 0 ? (
          <p className="text-secondary fs-sm">No trend data available.</p>
        ) : (
          <ReactApexChart series={series} options={options} type="line" height={220} />
        )}
      </Card.Body>
    </Card>
  );
};

export default WeekOverWeekChart;
