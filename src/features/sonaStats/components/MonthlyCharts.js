import React, { useMemo } from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import ReactApexChart from 'react-apexcharts';
import { chartLabelColor, chartTooltipTheme } from '../utils/chartTheme';
import { monthlyChartData } from '../utils/monthlyCharts';
import { MONTHLY_COPY as C } from '../utils/monthlyCopy';

/**
 * Presents the four monthly graphs using the dashboard's existing chart library.
 * @param {Object} props.report - Monthly summary and traceable target records.
 * @returns {JSX.Element} Daily performance and measured-hit distributions.
 */
export default function MonthlyCharts({ report }) {
  const data = useMemo(() => monthlyChartData(report), [report]);
  const labelColor = chartLabelColor();
  const base = {
    chart: { toolbar: { show: false }, animations: { enabled: false }, parentHeightOffset: 0 },
    colors: ['#506fd9', '#e7a33e'],
    dataLabels: { enabled: false },
    grid: { borderColor: 'rgba(72,94,144,0.12)' },
    xaxis: { categories: data.dates, labels: { style: { colors: labelColor, fontSize: '11px' } }, axisBorder: { show: false } },
    yaxis: { min: 0, labels: { style: { colors: labelColor, fontSize: '11px' } } },
    tooltip: { theme: chartTooltipTheme(), y: { formatter: (value) => Number.isFinite(value) ? value : C.na } },
    legend: { position: 'top', labels: { colors: labelColor } },
  };
  const charts = [
    {
      title: C.accuracyChart, note: C.dailyChartNote, type: 'line', hasData: data.accuracy.some(Number.isFinite),
      series: [{name: C.accuracy, data: data.accuracy}],
      options: {...base, stroke: {curve: 'straight', width: 2.5}, markers: {size: 4},
        yaxis: {...base.yaxis, max: 100, tickAmount: 4, labels: {...base.yaxis.labels, formatter: (value) => `${value}%`}},
        tooltip: {...base.tooltip, y: {formatter: (value) => Number.isFinite(value) ? `${value}%` : C.na}}},
    },
    {
      title: C.volumeChart, note: C.volumeChartNote, type: 'bar', hasData: data.hasDailyReports,
      series: [{name: C.hits, data: data.hits}, {name: C.misses, data: data.misses}],
      options: {...base, chart: {...base.chart, stacked: true}, stroke: {width: 0},
        plotOptions: {bar: {columnWidth: '65%', borderRadius: 2}}, yaxis: {...base.yaxis, forceNiceScale: true, decimalsInFloat: 0}},
    },
    {
      title: C.timingChart, note: `${C.samples}: ${report.timing.samples} / ${report.summary.hits}. ${C.timingNote}`,
      type: 'bar', hasData: report.timing.samples > 0,
      series: [{name: C.hits, data: data.timingCounts}],
      options: {...base, plotOptions: {bar: {horizontal: true, barHeight: '55%', borderRadius: 3}},
        xaxis: {...base.xaxis, categories: Object.values(C.timeBuckets), decimalsInFloat: 0}},
    },
    {
      title: C.pullbackChart, note: `${C.samples}: ${data.pullbackSamples} / ${report.summary.hits}. ${C.pullbackNote}`,
      type: 'bar', hasData: data.pullbackSamples > 0,
      series: [{name: C.hits, data: data.pullbackCounts}],
      options: {...base, colors: ['#0c9e83'], plotOptions: {bar: {horizontal: true, barHeight: '55%', borderRadius: 3}},
        xaxis: {...base.xaxis, categories: C.pullbackBuckets, decimalsInFloat: 0}},
    },
  ];
  return <Row className="g-3" style={{minWidth: 0}}>{charts.map((chart) => <Col key={chart.title} xs={12} xl={6} style={{minWidth: 0}}>
    <Card className="card-one h-100 overflow-hidden"><Card.Body>
      <h5>{chart.title}</h5><p className="text-secondary fs-sm">{chart.note}</p>
      {chart.hasData ? <div role="group" aria-label={chart.title}>
        <ReactApexChart type={chart.type} series={chart.series} options={chart.options} height={260} />
      </div> : <p className="text-secondary">{C.chartEmpty}</p>}
    </Card.Body></Card>
  </Col>)}</Row>;
}
