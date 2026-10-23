import React, { useMemo } from 'react';
import { Card } from 'react-bootstrap';
import ReactApexChart from 'react-apexcharts';
import { rollingChart } from '../utils/rollingPresentation';
import { ROLLING_COPY as C } from '../utils/rollingCopy';

/** Displays actual daily percentages and one distinctly colored pooled trend. */
export default function RollingAccuracyChart({ report }) {
  const chart = useMemo(() => rollingChart(report), [report]);
  return <Card className="card-one mb-3 overflow-hidden"><Card.Body className="p-3">
    <h5>{C.chart}</h5><p className="text-secondary fs-sm">{C.chartNote}</p>
    <div role="group" aria-label={C.chart}>
      <ReactApexChart type="line" series={chart.series} options={chart.options} height={280} />
    </div>
  </Card.Body></Card>;
}
