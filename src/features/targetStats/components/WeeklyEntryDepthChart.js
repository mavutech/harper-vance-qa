import React, { useState } from 'react';
import { Card, OverlayTrigger, Popover } from 'react-bootstrap';
import ReactApexChart from 'react-apexcharts';
import { chartTooltipTheme } from '../utils/chartTheme';

const TIP = 'Each point on the line is a retraction size. The line shows how often a winning target retraced at least that far before it reversed and hit. For example, if the line sits at 60% above the 10 mark, then 60% of winning targets retraced 10 points or more before hitting. Read it to see how much room targets usually give back: a line that stays high means targets often retrace a lot before working, and a line that falls quickly means targets usually hit with little retracement. The "Last 20 sessions" view is the recent rolling window; the "This week only" view is the same math scoped to just the 5 days of the week you are viewing. Only winning targets are counted, because a miss never reverses.';

/**
 * Retraction Depth profile. For each retraction size, the share of winning
 * targets that retraced at least that far before reversing to target. Reads the
 * backend-computed curve (weekly.bucketStats.retractionCurve) so it matches the
 * grid and the live alert exactly — same window, same source.
 *
 * @param {Object} props
 * @param {{ points: Array<{depth:number, pctReached:number}>, totalHits:number }|null} props.curve - retractionCurve from the weekly doc (rolling 20 sessions)
 * @param {{ points: Array<{depth:number, pctReached:number}>, totalHits:number }|null} [props.weekCurve] - retractionCurve from weekly.weekStats.bucketStats (this week only). When present, a scope toggle is shown.
 * @returns {JSX.Element}
 */
const WeeklyEntryDepthChart = ({ curve, weekCurve }) => {
  const hasWeekScope = Boolean(weekCurve?.points?.length);
  const [scope, setScope] = useState('rolling');
  const active = scope === 'week' && hasWeekScope ? weekCurve : curve;
  const points = active?.points ?? [];
  const totalHits = active?.totalHits ?? 0;
  const scopeLabel = scope === 'week' && hasWeekScope ? 'this week (5 sessions)' : 'last 20 sessions';

  // Numeric (x,y) points so the tooltip and axis use the real retraction depth,
  // not the category index.
  const series = [{ name: 'Hits retracing this far', data: points.map((p) => ({ x: p.depth, y: p.pctReached })) }];

  const options = {
    chart: { type: 'line', toolbar: { show: false }, animations: { enabled: false }, parentHeightOffset: 0 },
    colors: ['#506fd9'],
    stroke: { width: 2.5, curve: 'smooth' },
    markers: { size: 4, hover: { size: 6 } },
    dataLabels: { enabled: false },
    xaxis: {
      type: 'numeric',
      min: 0,
      tickAmount: Math.min(points.length, 12),
      title: { text: 'Retraction size (pts)', style: { fontSize: '10px', color: '#6e7985' } },
      labels: { style: { colors: '#6e7985', fontSize: '10px' }, formatter: (v) => `${Math.round(v)}` },
      axisBorder: { show: false },
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      labels: { style: { colors: '#6e7985', fontSize: '10px' }, formatter: (v) => `${v}%` },
    },
    grid: { borderColor: 'rgba(72,94,144,0.08)' },
    legend: { show: false },
    tooltip: {
      theme: chartTooltipTheme(),
      x: { formatter: (v) => `Retraced at least ${Math.round(v)} pts` },
      y: { formatter: (v) => `${v}% of winning targets` },
    },
  };

  return (
    <Card className="card-one mb-4">
      <Card.Header>
        <Card.Title as="h6">Retraction Depth</Card.Title>
        <span className="fs-xs text-secondary ms-2">How often a winning target retraced at least this far before hitting ({scopeLabel})</span>
        <OverlayTrigger
          trigger="click"
          rootClose
          placement="top"
          overlay={
            <Popover id="retraction-depth-tip" style={{ maxWidth: 320 }}>
              <Popover.Header as="h6" className="fs-sm">Retraction Depth</Popover.Header>
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
        {hasWeekScope && (
          <div className="btn-group btn-group-sm ms-auto" role="group" aria-label="Retraction depth scope">
            <button
              type="button"
              className={`btn ${scope === 'rolling' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setScope('rolling')}
            >
              Last 20 sessions
            </button>
            <button
              type="button"
              className={`btn ${scope === 'week' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setScope('week')}
            >
              This week only
            </button>
          </div>
        )}
      </Card.Header>
      <Card.Body>
        {points.length === 0 ? (
          <p className="text-secondary fs-sm">
            No retraction data yet. Regenerate this week’s stats doc to populate Retraction Depth.
          </p>
        ) : (
          <React.Fragment>
            <ReactApexChart series={series} options={options} type="line" height={260} />
            <p className="fs-xs text-secondary mt-2 mb-0">
              Based on {totalHits} winning target{totalHits === 1 ? '' : 's'} over the {scopeLabel}. Retraction is only measured on hits.
            </p>
          </React.Fragment>
        )}
      </Card.Body>
    </Card>
  );
};

export default WeeklyEntryDepthChart;
