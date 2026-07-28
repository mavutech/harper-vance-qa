import React from 'react';
import { Card } from 'react-bootstrap';
import moment from 'moment';
import { formatDayContextLabel } from '../utils/formatDayContext';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WIN_THRESHOLD = 70;

/**
 * Per-day log for the selected trading week: one row per weekday with targets
 * created, hit, accuracy, median time to target, and median retraction. Reads
 * the same daily docs as the day chart. Styled to match the daily performance
 * page's resolution table. Days with no session render as N/A.
 *
 * @param {Object} props
 * @param {Array<{ rawPayload: Object }>} props.rangeData - Daily docs for the week
 * @param {string[]} props.weekDates - The 5 ISO dates (Mon-Fri) for the week
 * @returns {JSX.Element}
 */
const WeeklyDailyLog = ({ rangeData, weekDates }) => {
  const byDate = {};
  (rangeData || []).forEach(({ rawPayload }) => {
    if (rawPayload && rawPayload.alertDate) byDate[rawPayload.alertDate] = rawPayload;
  });

  const rows = (weekDates || []).map((d, i) => {
    const doc = byDate[d];
    const created = doc ? parseInt(doc.targetsCreated, 10) : null;
    const hit = doc ? parseInt(doc.targetsReached, 10) : null;
    const acc = Number.isFinite(created) && created > 0 && Number.isFinite(hit)
      ? (hit / created) * 100
      : null;
    return {
      label: `${DAY_LABELS[i] || ''} ${moment(d).format('MM/DD')}`.trim(),
      created,
      hit,
      acc,
      medianTime: doc ? (doc.targetMedianTime || null) : null,
      medianRetraction: doc ? (doc.medianRetraction || null) : null,
      dayType: doc ? formatDayContextLabel(doc.dayContext) : null,
      hasData: Boolean(doc),
    };
  });

  const showDayTypeColumn = rows.some((r) => r.dayType);

  return (
    <Card className="card-one mb-4">
      <Card.Header>
        <Card.Title as="h6" className="mb-0">Daily Log This Week</Card.Title>
        <span className="text-secondary fs-xs ms-2">{(weekDates || []).length} sessions</span>
      </Card.Header>
      <Card.Body className="p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0 fs-sm">
            <thead className="table-light">
              <tr>
                <th className="ps-3">Day</th>
                <th>Targets</th>
                <th>Hit</th>
                <th>Accuracy</th>
                <th>Median Time</th>
                <th>Median Retraction</th>
                {showDayTypeColumn && <th>Day Type</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <td className="ps-3 fw-medium">{r.label}</td>
                  <td className="text-secondary">{r.hasData ? r.created : 'no session'}</td>
                  <td className="text-secondary">{r.hasData ? r.hit : 'N/A'}</td>
                  <td>
                    {r.acc !== null
                      ? <span className={`fw-semibold ${r.acc >= WIN_THRESHOLD ? 'text-success' : 'text-danger'}`}>{r.acc.toFixed(1)}%</span>
                      : <span className="text-secondary">N/A</span>}
                  </td>
                  <td className="text-secondary">{r.hasData ? (r.medianTime || 'N/A') : 'N/A'}</td>
                  <td className="text-secondary">{r.hasData ? (r.medianRetraction || 'N/A') : 'N/A'}</td>
                  {showDayTypeColumn && (
                    <td className="text-secondary fs-xs">{r.dayType || '—'}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default WeeklyDailyLog;
