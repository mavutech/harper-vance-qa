import React from 'react';
import { Badge, Card, Table } from 'react-bootstrap';
import { BULLISH_COLOR } from '../utils/sonaStatsConstants';
import {
  formatCloseTimeEst,
  resolveGeneratedCloseTimestamp,
  resolveReachedCloseTimestamp,
} from '../utils/closeTime';

/**
 * Computes the resolution-time display string for a target using close-time
 * on both ends so it lines up with the Time Generated / Time Reached cells.
 *
 * @param {Object} target - Single target record
 * @returns {string} Formatted duration or '—'
 */
const formatResolutionTime = (target) => {
  if (target.targetReached !== true) return '—';
  const generatedTs = resolveGeneratedCloseTimestamp(target);
  const reachedTs = resolveReachedCloseTimestamp(target);
  if (!generatedTs || !reachedTs) return '—';
  const mins = Math.abs(
    (parseInt(reachedTs, 10) - parseInt(generatedTs, 10)) / 60
  );
  if (mins < 60) return `${Math.round(mins)} min`;
  const hrs = Math.floor(mins / 60);
  const rem = Math.round(mins % 60);
  return rem === 0 ? `${hrs} hr` : `${hrs} hr ${rem} min`;
};

/**
 * Renders the per-target live log table for the Today's Targets page.
 * Rows are sorted newest-first (enforced by the service layer).
 * Hit targets show their resolution time; open targets pulse when the
 * session is live.
 *
 * @param {Object} props
 * @param {Object[]} props.targets - Real-time targets array from useTodaysTargets
 * @param {boolean} props.isSessionLive - Whether the NQ session is currently active
 * @returns {JSX.Element}
 */
const TargetLiveTable = ({ targets, isSessionLive }) => {
  if (targets.length === 0) {
    return null;
  }

  return (
    <Card className="card-one mb-4">
      <Card.Header>
        <Card.Title as="h6">Target Log</Card.Title>
        <span className="fs-xs text-secondary ms-2">Most recent first</span>
      </Card.Header>
      <Card.Body className="p-0">
        <Table responsive hover className="mb-0 table-nowrap">
          <thead className="table-light">
            <tr>
              <th className="fs-xs fw-semibold">Direction</th>
              <th className="fs-xs fw-semibold">Target Price</th>
              <th className="fs-xs fw-semibold">Time Generated</th>
              <th className="fs-xs fw-semibold">Time Reached</th>
              <th className="fs-xs fw-semibold">Time to Resolution</th>
              <th className="fs-xs fw-semibold">Retraction</th>
              <th className="fs-xs fw-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {targets.map((target) => {
              const bullish = target.colorHighlight === BULLISH_COLOR;
              const hit = target.targetReached === true;
              const generatedTs = resolveGeneratedCloseTimestamp(target);
              const reachedTs = hit ? resolveReachedCloseTimestamp(target) : null;

              return (
                <tr key={target.alertId}>
                  <td>
                    <Badge bg={bullish ? 'success' : 'danger'} className="fs-xs">
                      {bullish ? 'Bullish' : 'Bearish'}
                    </Badge>
                  </td>
                  <td className="fs-sm fw-semibold">{target.targetPrice}</td>
                  <td className="fs-sm text-secondary">{formatCloseTimeEst(generatedTs) ?? '—'}</td>
                  <td className="fs-sm text-secondary">
                    {hit ? (formatCloseTimeEst(reachedTs) ?? '—') : '—'}
                  </td>
                  <td className="fs-sm text-secondary">{formatResolutionTime(target)}</td>
                  <td className="fs-sm">
                    {hit && target.retractionPoints !== null && target.retractionPoints !== undefined ? (
                      <span className="text-nowrap">
                        {target.retractionPoints} pts{' '}
                        <span className={`badge ms-1 ${target.retractionPrecision === '1m' ? 'bg-success' : 'bg-secondary'} fs-xs`}>
                          {target.retractionPrecision === '1m' ? 'Precise' : 'Est.'}
                        </span>
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    {hit ? (
                      <Badge bg="success" className="fs-xs">Hit ✓</Badge>
                    ) : (
                      <Badge
                        bg="secondary"
                        className="fs-xs"
                        style={isSessionLive ? { animation: 'pulse 1.5s ease-in-out infinite' } : {}}
                      >
                        Open
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default TargetLiveTable;
