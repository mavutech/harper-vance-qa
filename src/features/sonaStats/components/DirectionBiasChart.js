import React, { useMemo } from 'react';
import { Card } from 'react-bootstrap';
import ReactApexChart from 'react-apexcharts';
import moment from 'moment';
import { chartTooltipTheme } from '../utils/chartTheme';

/**
 * Renders a grouped bar chart of bullish vs. bearish accuracy per session day.
 * Makes directional bias visible across the loaded date range.
 * Days where bullish or bearish had no targets (null accuracy) are shown as 0.
 *
 * @param {Object} props
 * @param {Array<{ rawPayload: Object, computedStats: Object|null }>} props.rangeData - Daily stats ascending by date
 * @returns {JSX.Element}
 */
const DirectionBiasChart = ({ rangeData }) => {
  const { categories, bullishSeries, bearishSeries } = useMemo(() => {
    if (!rangeData || rangeData.length === 0) {
      return { categories: [], bullishSeries: [], bearishSeries: [] };
    }

    const cats = rangeData.map(({ rawPayload }) =>
      moment(rawPayload.alertDate).format('MM/DD')
    );

    const bullish = rangeData.map(({ computedStats }) =>
      computedStats?.directionSplit?.bullish?.accuracy ?? 0
    );

    const bearish = rangeData.map(({ computedStats }) =>
      computedStats?.directionSplit?.bearish?.accuracy ?? 0
    );

    return { categories: cats, bullishSeries: bullish, bearishSeries: bearish };
  }, [rangeData]);

  const series = [
    { name: 'Bullish', data: bullishSeries },
    { name: 'Bearish', data: bearishSeries },
  ];

  const options = {
    chart: {
      type: 'bar',
      parentHeightOffset: 0,
      toolbar: { show: false },
      animations: { enabled: false },
    },
    colors: ['#0cb785', '#dc3545'],
    plotOptions: {
      bar: {
        borderRadius: 3,
        columnWidth: '55%',
        grouped: true,
      },
    },
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
      position: 'top',
      fontSize: '11px',
      labels: { colors: '#6e7985' },
    },
    tooltip: {
      theme: chartTooltipTheme(),
      shared: true,
      intersect: false,
      y: { formatter: (v) => `${v}%` },
    },
  };

  return (
    <Card className="card-one mb-4">
      <Card.Header>
        <Card.Title as="h6">Direction Bias</Card.Title>
        <span className="fs-xs text-secondary ms-2">Bullish vs. Bearish accuracy per day</span>
      </Card.Header>
      <Card.Body>
        {categories.length === 0 ? (
          <p className="text-secondary fs-sm">No data available.</p>
        ) : (
          <ReactApexChart series={series} options={options} type="bar" height={220} />
        )}
      </Card.Body>
    </Card>
  );
};

export default DirectionBiasChart;
