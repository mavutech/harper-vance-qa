import React, { useMemo } from 'react';
import { Badge, Card, OverlayTrigger, Tooltip } from 'react-bootstrap';
import {
  formatCloseTimeEst,
  resolveGeneratedCloseTimestamp,
  resolveReachedCloseTimestamp,
} from '../utils/closeTime';

/**
 * Computes time-to-resolution display string from a single target object.
 * Uses close-time on both ends (alert candle close → hit candle close) so
 * the value matches what users see in the Time Generated / Time Reached cells.
 *
 * @param {Object} target - Single target from engulfingCandleList
 * @returns {string} Formatted duration or '—'
 */
const formatResolutionTime = (target) => {
  if (!target.targetReached) return '—';
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
 * Renders the per-target resolution log as a sortable table.
 * Each row represents one target from engulfingCandleList with
 * direction, price, time generated, time reached, and resolution time.
 *
 * @param {Object} props
 * @param {Object[]} props.targets - engulfingCandleList array
 * @param {boolean} [props.precise] - Shows the Precise badge (retraction measured on 1m chart)
 * @returns {JSX.Element}
 */
const TargetResolutionTable = ({ targets, precise = false }) => {
  const rows = useMemo(() => {
    if (!targets || targets.length === 0) return [];

    return targets.map((target, index) => {
      const bullish = target.colorHighlight === 7004928;
      const generatedTs = resolveGeneratedCloseTimestamp(target);
      const reachedTs = target.targetReached ? resolveReachedCloseTimestamp(target) : null;
      return {
        num: index + 1,
        direction: bullish ? 'Up' : 'Down',
        bullish,
        price: target.targetPrice || (bullish ? target.high : target.low),
        timeGenerated: formatCloseTimeEst(generatedTs) ?? '—',
        timeReached: target.targetReached ? (formatCloseTimeEst(reachedTs) ?? '—') : '—',
        resolutionTime: formatResolutionTime(target),
        reached: target.targetReached,
        retractionPoints: target.retractionPoints !== undefined ? target.retractionPoints : null,
        retractionPrecision: target.retractionPrecision || null,
        isDeepestRide: false,
      };
    });
  }, [targets]);

  // Star the deepest winning ride when it's a true outlier (>2x the median
  // retraction among hits) — the day's standout, framed as the win it was.
  const deepestRide = useMemo(() => {
    const hitRetractions = rows
      .filter((r) => r.reached && Number.isFinite(r.retractionPoints))
      .map((r) => r.retractionPoints)
      .sort((a, b) => a - b);
    if (hitRetractions.length < 3) return null;

    const mid = Math.floor(hitRetractions.length / 2);
    const median = hitRetractions.length % 2 !== 0
      ? hitRetractions[mid]
      : (hitRetractions[mid - 1] + hitRetractions[mid]) / 2;
    const maxVal = hitRetractions[hitRetractions.length - 1];
    if (maxVal <= 2 * median) return null;

    const row = rows.find((r) => r.reached && r.retractionPoints === maxVal);
    if (row) row.isDeepestRide = true;
    return row ?? null;
  }, [rows]);

  if (rows.length === 0) {
    return (
      <Card className="card-one mb-4">
        <Card.Header><Card.Title as="h6">Target Resolution Log</Card.Title></Card.Header>
        <Card.Body className="p-3 text-secondary fs-sm">No targets found for this date.</Card.Body>
      </Card>
    );
  }

  return (
    <Card className="card-one mb-4">
      <Card.Header className="d-flex align-items-center gap-2">
        <Card.Title as="h6" className="mb-0">Target Resolution Log</Card.Title>
        {precise && (
          <OverlayTrigger
            placement="right"
            overlay={
              <Tooltip id="precise-log-tooltip">
                Retraction values are calculated from one-minute chart data.
              </Tooltip>
            }
          >
            <Badge bg="success" className="fs-xs fw-medium" style={{ cursor: 'help' }}>Precise</Badge>
          </OverlayTrigger>
        )}
        <span className="text-secondary fs-xs">{rows.length} targets</span>
      </Card.Header>
      <Card.Body className="p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0 fs-sm">
            <thead className="table-light">
              <tr>
                <th className="ps-3">#</th>
                <th>Direction</th>
                <th>Target Price</th>
                <th>Time Generated</th>
                <th>Time Reached</th>
                <th>Time to Resolution</th>
                <th>Retraction</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.num}>
                  <td className="ps-3 text-secondary">{row.num}</td>
                  <td>
                    <span className={`d-flex align-items-center gap-1 fw-medium ${row.bullish ? 'text-success' : 'text-danger'}`}>
                      <i className={row.bullish ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
                      {row.direction}
                    </span>
                  </td>
                  <td className="fw-semibold">{row.price}</td>
                  <td className="text-secondary">{row.timeGenerated}</td>
                  <td className="text-secondary">{row.timeReached}</td>
                  <td className="text-secondary">{row.resolutionTime}</td>
                  <td>
                    {row.reached && row.retractionPoints !== null ? (
                      <span className="text-nowrap">
                        {row.retractionPoints} pts
                        {row.isDeepestRide && <span className="text-warning ms-1" title="Largest retraction among resolved targets for the selected day">★</span>}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    {row.reached
                      ? <span className="badge bg-success">✓ Hit</span>
                      : <span className="badge bg-danger">✗ Missed</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {deepestRide && (
          <p className="fs-xs text-secondary px-3 pt-2 mb-2">
            <span className="text-warning">★</span> Largest retraction among resolved targets for the selected day:{' '}
            <strong>{deepestRide.retractionPoints} pts</strong> from target {deepestRide.price} before
            resolution ({'>'}2× the day&apos;s median retraction).
          </p>
        )}
      </Card.Body>
    </Card>
  );
};

export default TargetResolutionTable;
