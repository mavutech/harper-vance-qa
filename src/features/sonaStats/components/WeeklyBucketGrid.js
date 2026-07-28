import React, { useState } from 'react';
import { Card, OverlayTrigger, Popover, Table } from 'react-bootstrap';

const DIRECTIONS = ['bullish', 'bearish'];
const SESSIONS = ['morning', 'midday', 'afternoon'];
const SESSION_LABEL = { morning: 'Morning', midday: 'Midday', afternoon: 'Afternoon' };

const TIP = 'This table groups historical targets by direction and trading session. Last 20 sessions uses the rolling period used by live alerts. This week only uses the selected trading week. Rows marked thin do not meet the minimum sample size. In those cases, live alerts use the broader direction group or all-target group. Retraction is measured only for targets that were hit.';

const fmtDrift = (cell) => {
  if (!cell || cell.medianDrift == null) return 'N/A';
  const band = cell.p25Drift != null && cell.p75Drift != null ? ` (${cell.p25Drift} to ${cell.p75Drift})` : '';
  return `~${cell.medianDrift} pts${band}`;
};

const fmtHit = (cell) => (cell && cell.hitRate != null ? `${cell.hitRate}%` : 'N/A');

/**
 * "Hit Rate by Target Type" grid: backend-computed bucket stats (direction x time
 * of day) read straight from the weekly doc. Read-only preview so the cells can
 * be validated before the numbers go live on alerts. Renders nothing useful
 * until the weekly doc has been regenerated with bucketStats.
 *
 * @param {Object} props
 * @param {Object|null} props.bucketStats - weekly.bucketStats (rolling 20 sessions)
 * @param {Object|null} [props.weekBucketStats] - weekly.weekStats.bucketStats (this week only). When present, a scope toggle is shown.
 * @returns {JSX.Element}
 */
const WeeklyBucketGrid = ({ bucketStats, weekBucketStats }) => {
  const hasWeekScope = Boolean(weekBucketStats?.groups);
  const [scope, setScope] = useState('rolling');
  const active = scope === 'week' && hasWeekScope ? weekBucketStats : bucketStats;
  const groups = active?.groups;
  const minSample = active?.minSample ?? 15;
  const scopeSubtitle = scope === 'week' && hasWeekScope ? 'this week (5 sessions)' : 'last 20 sessions';

  return (
    <Card className="card-one mb-4">
      <Card.Header>
        <Card.Title as="h6">Hit Rate by Target Type</Card.Title>
        <span className="fs-xs text-secondary ms-2">{scopeSubtitle}</span>
        <OverlayTrigger
          trigger="click"
          rootClose
          placement="top"
          overlay={
            <Popover id="bucket-grid-tip" style={{ maxWidth: 340 }}>
              <Popover.Header as="h6" className="fs-sm">Hit Rate by Target Type</Popover.Header>
              <Popover.Body className="fs-xs">{TIP}</Popover.Body>
            </Popover>
          }
        >
          <span className="fs-xs text-secondary ms-2" style={{ cursor: 'pointer', textDecoration: 'underline dotted' }} tabIndex={0}>
            how to read this <i className="ri-information-line"></i>
          </span>
        </OverlayTrigger>
        {hasWeekScope && (
          <div className="btn-group btn-group-sm ms-auto" role="group" aria-label="Bucket stats scope">
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
        {!groups ? (
          <p className="text-secondary fs-sm mb-0">
            No data yet. Regenerate this week’s stats doc to populate Hit Rate by Target Type.
          </p>
        ) : (
          <Table responsive borderless className="fs-sm align-middle mb-0">
            <thead>
              <tr className="text-secondary fs-xs text-uppercase">
                <th>Target type</th>
                <th className="text-center">Samples</th>
                <th className="text-center">Hit rate</th>
                <th>Typical retraction, median</th>
              </tr>
            </thead>
            <tbody>
              {DIRECTIONS.map((dir) => (
                <React.Fragment key={dir}>
                  {SESSIONS.map((s) => {
                    const cell = groups[`${dir}|${s}`];
                    const thin = !cell || cell.n < minSample;
                    return (
                      <tr key={`${dir}|${s}`} className={thin ? 'text-secondary' : ''}>
                        <td className="text-capitalize">{dir} · {SESSION_LABEL[s]}</td>
                        <td className="text-center">
                          {cell ? cell.n : 0}{thin && <span className="ms-1 badge bg-secondary bg-opacity-25 text-secondary fw-normal">thin</span>}
                        </td>
                        <td className="text-center">{fmtHit(cell)}</td>
                        <td>{fmtDrift(cell)}</td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
              {/* Fallback rows the live alert drops to when a cell is thin */}
              {DIRECTIONS.map((dir) => (
                <tr key={dir} className="fw-semibold border-top">
                  <td className="text-capitalize">{dir} (any time)</td>
                  <td className="text-center">{groups[dir]?.n ?? 0}</td>
                  <td className="text-center">{fmtHit(groups[dir])}</td>
                  <td>{fmtDrift(groups[dir])}</td>
                </tr>
              ))}
              <tr className="fw-semibold">
                <td>All targets</td>
                <td className="text-center">{groups.all?.n ?? 0}</td>
                <td className="text-center">{fmtHit(groups.all)}</td>
                <td>{fmtDrift(groups.all)}</td>
              </tr>
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

export default WeeklyBucketGrid;
