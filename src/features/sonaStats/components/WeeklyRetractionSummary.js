import React, { useState } from 'react';
import { Card, Col, OverlayTrigger, Popover, Row } from 'react-bootstrap';
import KpiTile from './KpiTile';

const TIP = 'Three numbers that summarise how much winning targets typically retrace against you before reversing to hit. "Typical retracement" is the median — half of hits retraced less and half retraced more. "Usual range" is the middle 50% (p25 to p75), so most winning targets fall between these two numbers. "Outlier" is the 90th percentile — 1 in 10 winning targets retraced this deep or deeper before hitting. The "Last 20 sessions" view is the rolling window the live alert quotes from; the "This week only" view is the same math scoped to just the 5 days of the week you are viewing. Retraction is only measured on hits, because a miss never reverses.';

const fmtPts = (n) => (n == null ? 'N/A' : `${n} pts`);
const fmtRange = (lo, hi) => (lo == null || hi == null ? 'N/A' : `${lo} – ${hi} pts`);

/**
 * Three-tile summary of retraction depth (median, middle 50%, outlier) read
 * from the pooled bucketStats.groups.all block on the weekly doc. Same scope
 * toggle pattern as WeeklyBucketGrid: shows a "This week only" button when
 * weekBucketStats is present.
 *
 * @param {Object} props
 * @param {Object|null} props.bucketStats - weekly.bucketStats (rolling 20 sessions)
 * @param {Object|null} [props.weekBucketStats] - weekly.weekStats.bucketStats (this week only)
 * @returns {JSX.Element}
 */
const WeeklyRetractionSummary = ({ bucketStats, weekBucketStats }) => {
  const hasWeekScope = Boolean(weekBucketStats?.groups?.all);
  const [scope, setScope] = useState('rolling');
  const active = scope === 'week' && hasWeekScope ? weekBucketStats : bucketStats;
  const all = active?.groups?.all;
  const scopeSubtitle = scope === 'week' && hasWeekScope ? 'this week (5 sessions)' : 'last 20 sessions';

  const cards = [
    {
      label: 'Typical retracement',
      value: fmtPts(all?.medianDrift),
      sub: 'median across winning targets',
      tip: 'Half of winning targets retraced less than this and half retraced more. A good "what should I expect" number for how far price usually moves against a called target before reversing.',
      icon: 'ri-arrow-left-right-line',
      color: 'info',
    },
    {
      label: 'Usual range',
      value: fmtRange(all?.p25Drift, all?.p75Drift),
      sub: 'middle 50% of winning targets (p25 – p75)',
      tip: 'A quarter of winning targets retraced less than the low number, a quarter retraced more than the high number, and the middle half fell between the two. Use this to gauge how tight or wide the day\'s retracements were: a narrow band means they clustered; a wide band means they varied a lot.',
      icon: 'ri-expand-height-line',
      color: 'primary',
    },
    {
      label: 'Outlier',
      value: fmtPts(all?.p90Drift),
      sub: '90th percentile — 1 in 10 hits go this deep',
      tip: '9 out of 10 winning targets retraced less than this before hitting. The other 1 in 10 retraced this much or more. It shows how deep the occasional bad-feeling entry actually gets before the target still works.',
      icon: 'ri-arrow-up-down-line',
      color: 'warning',
    },
  ];

  return (
    <Card className="card-one mb-4">
      <Card.Header>
        <Card.Title as="h6">Retraction Summary</Card.Title>
        <span className="fs-xs text-secondary ms-2">{scopeSubtitle}</span>
        <OverlayTrigger
          trigger="click"
          rootClose
          placement="top"
          overlay={
            <Popover id="weekly-retraction-summary-tip" style={{ maxWidth: 340 }}>
              <Popover.Header as="h6" className="fs-sm">Retraction Summary</Popover.Header>
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
          <div className="btn-group btn-group-sm ms-auto" role="group" aria-label="Retraction summary scope">
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
        {!all ? (
          <p className="text-secondary fs-sm mb-0">
            No retraction data yet. Regenerate this week&apos;s stats doc to populate the summary.
          </p>
        ) : (
          <Row className="g-3">
            {cards.map((card) => (
              <Col md="4" key={card.label}>
                <KpiTile {...card} />
              </Col>
            ))}
          </Row>
        )}
      </Card.Body>
    </Card>
  );
};

export default WeeklyRetractionSummary;
