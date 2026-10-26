import React from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import { ROLLING_COPY as C } from '../utils/rollingCopy';
import { formatRate } from '../utils/rollingPresentation';

/** Compares direction totals without implying that an empty direction lost targets. */
export default function DirectionBiasChart({ report }) {
  return <Card className="card-one mb-3"><Card.Body className="p-3">
    <h5>{C.directions}</h5><p className="text-secondary fs-sm">{C.directionNote}</p>
    <Row>{['bullish', 'bearish'].map((key) => <Col xs={6} key={key}>
      <h6>{C[key]}</h6><strong className="fs-4">{formatRate(report.directions[key].accuracy)}</strong>
      <div className="text-secondary fs-sm">{report.directions[key].hits} / {report.directions[key].created} {C.outcome.toLowerCase()}</div>
    </Col>)}</Row>
  </Card.Body></Card>;
}
