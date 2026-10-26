import { ROLLING_COPY as C, ROLLING_CHART_COLORS } from './rollingCopy';
import { chartLabelColor, chartTooltipTheme } from './chartTheme';

/** Formats an actual measured rate without turning unavailable values into zero. */
export const formatRate = (value) => Number.isFinite(value) ? `${value}%` : C.na;

/** Builds display-only series from the backend's already calculated values. */
export const rollingChart = (report) => {
  const days = report.days;
  const labelColor = chartLabelColor();
  const labelStep = Math.max(1, Math.ceil(days.length / 6));
  const categories = days.map((day) => day.date);
  return {
    series: [
      {name: C.daily, type: 'column', data: days.map((day) => day.accuracy ?? null)},
      {name: C.trend, type: 'line', data: report.trend.map((point) => point.accuracy)},
    ],
    options: {
      chart: {toolbar: {show: false}, animations: {enabled: false}, parentHeightOffset: 0},
      colors: ROLLING_CHART_COLORS,
      plotOptions: {bar: {columnWidth: '55%', borderRadius: 2, distributed: false}},
      stroke: {width: [0, 3], curve: 'straight'},
      fill: {opacity: [0.8, 1]}, markers: {size: [0, 3]},
      dataLabels: {enabled: false}, grid: {borderColor: 'rgba(72,94,144,0.12)'},
      xaxis: {categories, labels: {rotate: 0, hideOverlappingLabels: true, style: {colors: labelColor, fontSize: '11px'},
        formatter: (value) => {
          const index = categories.indexOf(value);
          return index % labelStep === 0 || index === days.length - 1 ? String(value).slice(5).replace('-', '/') : '';
        }}, axisBorder: {show: false}},
      yaxis: {min: 0, max: 100, tickAmount: 4, labels: {formatter: (value) => `${value}%`, style: {colors: labelColor}}},
      legend: {position: 'top', labels: {colors: labelColor}, fontSize: '12px'},
      tooltip: {theme: chartTooltipTheme(), shared: true, intersect: false,
        x: {formatter: (_, {dataPointIndex}) => categories[dataPointIndex]},
        y: {formatter: (value, {seriesIndex, dataPointIndex}) => {
          const row = seriesIndex === 0 ? days[dataPointIndex] : report.trend[dataPointIndex];
          return Number.isFinite(value) ? `${formatRate(value)} · ${row.hits}/${row.created} hits` : C.na;
        }}},
    },
  };
};
