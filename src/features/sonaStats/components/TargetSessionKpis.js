import React, { useMemo } from 'react';
import { Card, Col, Row } from 'react-bootstrap';

/**
 * Renders the live session KPI strip for the Today's Targets page.
 * All values are derived from the targets array — no Firebase calls.
 * Updates in real time as the subscription pushes new data.
 *
 * @param {Object} props
 * @param {Object[]} props.targets - Real-time targets array from useTodaysTargets
 * @param {boolean} props.isSessionLive - Whether the NQ session is currently active
 * @returns {JSX.Element}
 */
const TargetSessionKpis = ({ targets, isSessionLive }) => {
  const { created, hit, open, accuracy } = useMemo(() => {
    const totalCreated = targets.length;
    const totalHit = targets.filter((t) => t.targetReached === true).length;
    const totalOpen = totalCreated - totalHit;
    const acc = totalCreated > 0
      ? `${((totalHit / totalCreated) * 100).toFixed(1)}%`
      : '—';

    return { created: totalCreated, hit: totalHit, open: totalOpen, accuracy: acc };
  }, [targets]);

  const cards = [
    {
      label: 'Session Status',
      value: isSessionLive ? 'Live' : 'Closed',
      sub: isSessionLive ? '9:30 AM – 4:00 PM ET' : 'Ended 4:00 PM ET',
      icon: 'ri-radio-button-line',
      color: isSessionLive ? 'success' : 'secondary',
    },
    {
      label: 'Targets Created',
      value: created,
      icon: 'ri-focus-3-line',
      color: 'primary',
    },
    {
      label: 'Targets Hit',
      value: hit,
      icon: 'ri-checkbox-circle-line',
      color: 'success',
    },
    {
      // After the close these targets won't resolve — they're unresolved, not "open".
      label: isSessionLive ? 'Open Targets' : 'Unresolved',
      value: open,
      icon: 'ri-time-line',
      color: 'warning',
    },
    {
      label: 'Session Accuracy',
      value: accuracy,
      sub: `${hit} of ${created} hit`,
      icon: 'ri-percent-line',
      color: 'info',
    },
  ];

  return (
    <Row className="g-3 mb-4">
      {cards.map((card) => (
        <Col sm="6" xl key={card.label}>
          <Card className="card-one">
            <Card.Body className="d-flex align-items-center gap-3 p-3">
              <div
                className={`d-flex align-items-center justify-content-center rounded-circle bg-${card.color} bg-opacity-25`}
                style={{ width: 48, height: 48, flexShrink: 0 }}
              >
                <i className={`${card.icon} fs-22 text-${card.color}`}></i>
              </div>
              <div>
                <h2 className="card-value mb-0 fs-22 lh-1">{card.value}</h2>
                <span className="fs-xs text-secondary fw-medium">{card.label}</span>
                {card.sub && <div className="fs-xs text-secondary lh-1 mt-1">{card.sub}</div>}
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default TargetSessionKpis;
