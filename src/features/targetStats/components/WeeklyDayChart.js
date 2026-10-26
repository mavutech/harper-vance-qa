import React, { useMemo } from 'react';
import { Card } from 'react-bootstrap';
import ReactApexChart from 'react-apexcharts';
import moment from 'moment';
import { chartTooltipTheme } from '../utils/chartTheme';

const WIN_THRESHOLD = 70;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

/**
 * Renders a bar chart of daily accuracy for each day of the selected trading week.
 * Bars are colour-coded green (≥70%) or red (<70%).
 * Days with no data (holidays, missing runs) display as 0.
 *
 * @param {Object} props
 * @param {Array<{ rawPayload: Object }>} props.rangeData - Daily stats for the 5 days of the week
 * @param {string[]} props.weekDates - Array of 5 ISO date strings for the week (Mon–Fri)
 * @returns {JSX.Element}
 */
const WeeklyDayChart = ({ rangeData, weekDates }) => {
  const { categories, accuracies, barColors } = useMemo(() => {
    const cats = weekDates.map((d, i) => `${DAY_LABELS[i]} ${moment(d).format('MM/DD')}`);

    // Build a map of date → accuracy for quick lookup
    const accByDate = {};
    (rangeData || []).forEach(({ rawPayload }) => {
      const created = parseInt(rawPayload.targetsCreated, 10);
      const reached = parseInt(rawPayload.targetsReached, 10);
      accByDate[rawPayload.alertDate] = created > 0
        ? parseFloat(((reached / created) * 100).toFixed(1))
        : 0;
    });

    const accs = weekDates.map((d) => accByDate[d] ?? 0);
    const colors = accs.map((a) => (a >= WIN_THRESHOLD ? '#0cb785' : a === 0 ? '#e5e9f2' : '#dc3545'));

    return { categories: cats, accuracies: accs, barColors: colors };
  }, [rangeData, weekDates]);

  const series = [{ name: 'Accuracy', data: accuracies }];

  const options = {
    chart: {
      type: 'bar',
      parentHeightOffset: 0,
      toolbar: { show: false },
      animations: { enabled: false },
    },
    colors: barColors,
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '50%',
        distributed: true,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (v) => (v > 0 ? `${v}%` : 'N/A'),
      style: { fontSize: '11px', colors: ['#fff'] },
    },
    grid: {
      borderColor: 'rgba(72,94,144,0.08)',
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories,
      labels: { style: { colors: '#6e7985', fontSize: '11px' } },
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
        <Card.Title as="h6">Daily Accuracy This Week</Card.Title>
      </Card.Header>
      <Card.Body>
        <ReactApexChart series={series} options={options} type="bar" height={220} />
      </Card.Body>
    </Card>
  );
};

export default WeeklyDayChart;
