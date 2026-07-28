import React, { useMemo } from 'react';
import { Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import moment from 'moment';

const WIN_THRESHOLD = 70;

/**
 * Renders the daily breakdown table for the loaded range.
 * One row per trading day with accuracy colour-coded by threshold.
 * Each row links to /dashboard/sona-daily?date=YYYY-MM-DD for drill-down.
 *
 * @param {Object} props
 * @param {Array<{ rawPayload: Object, computedStats: Object|null }>} props.rangeData - Enriched daily stats ascending by date
 * @returns {JSX.Element}
 */
const DailyBreakdownTable = ({ rangeData }) => {
  const rows = useMemo(() => {
    if (!rangeData || rangeData.length === 0) return [];

    return [...rangeData].reverse().map(({ rawPayload, computedStats }) => {
      const created = parseInt(rawPayload.targetsCreated, 10);
      const reached = parseInt(rawPayload.targetsReached, 10);
      const accuracy = created > 0 ? parseFloat(((reached / created) * 100).toFixed(1)) : 0;
      const isWin = accuracy >= WIN_THRESHOLD;

      return {
        date: rawPayload.alertDate,
        dateFormatted: moment(rawPayload.alertDate).format('ddd, MMM D'),
        created,
        reached,
        accuracy,
        isWin,
        avgTime: rawPayload.targetAvgTime ?? '—',
        bullish: computedStats?.directionSplit?.bullish?.accuracy ?? null,
        bearish: computedStats?.directionSplit?.bearish?.accuracy ?? null,
      };
    });
  }, [rangeData]);

  if (rows.length === 0) {
    return (
      <Card className="card-one mb-4">
        <Card.Header><Card.Title as="h6">Daily Breakdown</Card.Title></Card.Header>
        <Card.Body className="text-secondary fs-sm p-3">No historical data loaded.</Card.Body>
      </Card>
    );
  }

  return (
    <Card className="card-one mb-4">
      <Card.Header>
        <Card.Title as="h6">Daily Breakdown</Card.Title>
        <span className="text-secondary fs-xs ms-2">{rows.length} sessions — most recent first</span>
      </Card.Header>
      <Card.Body className="p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0 fs-sm">
            <thead className="table-light">
              <tr>
                <th className="ps-3">Date</th>
                <th>Created</th>
                <th>Hit</th>
                <th>Accuracy</th>
                <th>Avg Time</th>
                <th>Bullish %</th>
                <th>Bearish %</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.date}>
                  <td className="ps-3 fw-medium">{row.dateFormatted}</td>
                  <td className="text-secondary">{row.created}</td>
                  <td className="text-secondary">{row.reached}</td>
                  <td>
                    <span className={`fw-semibold ${row.isWin ? 'text-success' : 'text-danger'}`}>
                      {row.accuracy}%
                    </span>
                  </td>
                  <td className="text-secondary">{row.avgTime}</td>
                  <td>
                    {row.bullish !== null
                      ? <span className="text-success">{row.bullish}%</span>
                      : <span className="text-secondary">—</span>}
                  </td>
                  <td>
                    {row.bearish !== null
                      ? <span className="text-danger">{row.bearish}%</span>
                      : <span className="text-secondary">—</span>}
                  </td>
                  <td>
                    <Link
                      to={`/dashboard/sona-daily?date=${row.date}`}
                      className="fs-xs text-primary"
                      aria-label={`View full report for ${row.dateFormatted}`}
                    >
                      View <i className="ri-arrow-right-s-line"></i>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default DailyBreakdownTable;
