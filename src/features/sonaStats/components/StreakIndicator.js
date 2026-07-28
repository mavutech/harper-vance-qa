import React, { useMemo } from 'react';
import { Card, Col, Row } from 'react-bootstrap';

const WIN_THRESHOLD = 70;

/**
 * Computes the longest win or loss streak from the full range dataset.
 *
 * @param {Array<{ rawPayload: Object }>} rangeData - Daily stats in ascending order
 * @param {number} threshold - Accuracy % required for a win day
 * @returns {{ winStreak: number, lossStreak: number }}
 */
const computeBestStreaks = (rangeData, threshold) => {
  let bestWin = 0;
  let bestLoss = 0;
  let currentWin = 0;
  let currentLoss = 0;

  rangeData.forEach(({ rawPayload }) => {
    const created = parseInt(rawPayload.targetsCreated, 10);
    const reached = parseInt(rawPayload.targetsReached, 10);
    const accuracy = created > 0 ? (reached / created) * 100 : 0;
    const isWin = accuracy >= threshold;

    if (isWin) {
      currentWin++;
      currentLoss = 0;
    } else {
      currentLoss++;
      currentWin = 0;
    }

    if (currentWin > bestWin) bestWin = currentWin;
    if (currentLoss > bestLoss) bestLoss = currentLoss;
  });

  return { winStreak: bestWin, lossStreak: bestLoss };
};

/**
 * Displays the current win/loss streak and best streaks for the loaded range.
 * A "win day" is any day where accuracy >= 70%.
 *
 * @param {Object} props
 * @param {{ type: 'win'|'loss'|null, count: number }} props.streak - Current streak from useRollingStats
 * @param {Array<{ rawPayload: Object }>} props.rangeData - Full range data for best streak computation
 * @returns {JSX.Element}
 */
const StreakIndicator = ({ streak, rangeData }) => {
  const { winStreak, lossStreak } = useMemo(
    () => (rangeData?.length ? computeBestStreaks(rangeData, WIN_THRESHOLD) : { winStreak: 0, lossStreak: 0 }),
    [rangeData]
  );

  const isWin = streak?.type === 'win';
  const streakColor = streak?.type === 'win' ? 'success' : streak?.type === 'loss' ? 'danger' : 'secondary';
  const streakIcon = streak?.type === 'win' ? 'ri-arrow-up-circle-fill' : streak?.type === 'loss' ? 'ri-arrow-down-circle-fill' : 'ri-minus-circle-line';
  const streakLabel = streak?.type === 'win' ? 'Win Streak' : streak?.type === 'loss' ? 'Loss Streak' : 'No Streak';

  return (
    <Card className="card-one mb-4 h-100">
      <Card.Header>
        <Card.Title as="h6">Current Streak</Card.Title>
        <span className="fs-xs text-secondary ms-2">≥70% = win day</span>
      </Card.Header>
      <Card.Body className="d-flex flex-column justify-content-center">
        <div className={`d-flex align-items-center gap-3 mb-4`}>
          <i className={`${streakIcon} fs-40 text-${streakColor}`}></i>
          <div>
            <h2 className={`card-value mb-0 text-${streakColor}`}>
              {streak?.count ?? 0} {streak?.count === 1 ? 'Day' : 'Days'}
            </h2>
            <span className="fs-sm text-secondary">{streakLabel}</span>
          </div>
        </div>

        <Row className="g-2 border-top pt-3">
          <Col xs="6" className="text-center">
            <h5 className="card-value text-success mb-0">{winStreak}</h5>
            <span className="fs-xs text-secondary">Best Win Streak</span>
          </Col>
          <Col xs="6" className="text-center">
            <h5 className="card-value text-danger mb-0">{lossStreak}</h5>
            <span className="fs-xs text-secondary">Best Loss Streak</span>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default StreakIndicator;
