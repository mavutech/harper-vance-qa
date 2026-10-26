import React from 'react';
import { Card, Col, Row } from 'react-bootstrap';

/**
 * Renders the missed target analysis section.
 * Shows closest miss distance, average miss distance, and a per-target detail log.
 * Returns null when all targets were hit (no misses to display).
 *
 * @param {Object} props
 * @param {{ count: number, closestMiss: string|null, avgDistance: string|null, detailedLog: Array }} props.missAnalysis
 * @param {{ missedAvg: number, hitAvg: number }|null} [props.askComparison] - Avg target distance at generation, misses vs hits
 * @returns {JSX.Element|null}
 */
const MissAnalysis = ({ missAnalysis, askComparison }) => {
  if (!missAnalysis || missAnalysis.count === 0) return null;

  const { count, closestMiss, avgDistance, detailedLog } = missAnalysis;

  return (
    <Card className="card-one mb-4">
      <Card.Header>
        <Card.Title as="h6">
          <i className="ri-error-warning-line text-danger me-1"></i>
          Missed Target Analysis
        </Card.Title>
        <span className="text-secondary fs-xs ms-2">{count} missed</span>
      </Card.Header>
      <Card.Body>
        <Row className="g-3 mb-3">
          <Col xs="6" sm="3">
            <h5 className="card-value mb-0 text-start">{closestMiss ?? '—'}</h5>
            <span className="fs-xs text-secondary d-block text-start">Closest Miss</span>
          </Col>
          <Col xs="6" sm="3">
            <h5 className="card-value mb-0 text-start">{avgDistance ?? '—'}</h5>
            <span className="fs-xs text-secondary d-block text-start">Avg Miss Distance</span>
          </Col>
          {askComparison && (
            <Col xs="12" sm="6">
              <h5 className="card-value mb-0 text-start">
                {askComparison.missedAvg} pts <span className="fs-sm text-secondary fw-normal">vs</span> {askComparison.hitAvg} pts
              </h5>
              <span className="fs-xs text-secondary d-block text-start">
                Avg target distance at generation — misses vs hits. Larger asks carry lower resolution odds.
              </span>
            </Col>
          )}
        </Row>

        {detailedLog && detailedLog.length > 0 && (
          <div className="table-responsive">
            <table className="table table-sm mb-0 fs-xs">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Target Price</th>
                  <th>Direction</th>
                  <th>Closest Reached</th>
                  <th>Distance</th>
                </tr>
              </thead>
              <tbody>
                {detailedLog.map((entry) => (
                  <tr key={entry.index}>
                    <td className="text-secondary">{entry.index}</td>
                    <td className="fw-semibold">{entry.price}</td>
                    <td>
                      <span className={entry.direction === 'Up' ? 'text-success' : 'text-danger'}>
                        <i className={entry.direction === 'Up' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
                        {entry.direction}
                      </span>
                    </td>
                    <td className="text-secondary">{entry.closestReached ?? '—'}</td>
                    <td className="text-danger fw-medium">{entry.distance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default MissAnalysis;
