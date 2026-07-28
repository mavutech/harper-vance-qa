import React from 'react';
import { Col, Row } from 'react-bootstrap';
import KpiTile from './KpiTile';
import { buildComparison } from '../utils/weeklyComparison';

/**
 * Week-level retraction statistics plus best/worst day. All values come from the
 * weekly rawPayload (computed in the backend over every hit row in the week).
 *
 * Retraction is how far price retraces against a called target before reversing
 * back to hit it. It is reported only on hits, because a miss never reverses.
 * Copy is kept plain and uses "retraction" (not "drift" or "entry").
 *
 * @param {Object} props
 * @param {Object|null} props.weekly - Weekly rawPayload from Firebase
 * @returns {JSX.Element}
 */
const WeeklyRetractionCards = ({ weekly, coverage }) => {
  // Middle-50% band (p25 to p75): the spread of retraction depth.
  const hasBand = weekly?.p25Retraction && weekly?.p75Retraction &&
    weekly.p25Retraction !== 'N/A' && weekly.p75Retraction !== 'N/A';
  const bandLine = hasBand
    ? `middle 50%: ${String(weekly.p25Retraction).replace(' pts', '')} to ${weekly.p75Retraction}`
    : null;

  // This week vs the prior 20-session norm. Neutral tone: deeper or shallower
  // retraction is descriptive, not good or bad. Hidden on a thin week.
  const trailing = weekly?.trailingStats;
  const allBucket = weekly?.bucketStats?.groups?.all;
  const notThin = !(coverage && coverage.smallSample);
  const retractionComparison = trailing && notThin
    ? buildComparison({ thisWeek: weekly?.medianRetraction, baseline: trailing.medianRetractionAvg, unit: 'pts', neutral: true })
    : null;
  const shallowComparison = allBucket && notThin
    ? buildComparison({ thisWeek: weekly?.pctHitWithin10pts, baseline: allBucket.pctWithin10, unit: '%', neutral: true })
    : null;

  // Middle-50% "usual range" — this week's own p25/p75 as the headline, with the
  // rolling 20-session pooled band on the sub-line for context.
  const usualRangeValue = hasBand
    ? `${String(weekly.p25Retraction).replace(' pts', '')} – ${weekly.p75Retraction}`
    : 'N/A';
  const usualRangeSub = allBucket?.p25Drift != null && allBucket?.p75Drift != null
    ? `20-session avg: ${allBucket.p25Drift} – ${allBucket.p75Drift} pts`
    : null;

  // Outlier (p90) — 1 in 10 hits pull back this deep or deeper. This-week value
  // from the weekly doc; 20-session baseline from the pooled bucketStats.
  const p90Value = weekly?.p90Retraction && weekly.p90Retraction !== 'N/A'
    ? weekly.p90Retraction
    : 'N/A';
  const p90Comparison = allBucket && notThin
    ? buildComparison({ thisWeek: weekly?.p90Retraction, baseline: allBucket.p90Drift, unit: 'pts', neutral: true })
    : null;

  const cards = [
    {
      label: 'Typical Retraction (median)',
      value: weekly?.medianRetraction ?? 'N/A',
      comparison: retractionComparison,
      sub: bandLine,
      tip: 'Retraction is the movement against a target before price reverses and reaches it. This value is the median retraction for targets hit during the selected week. Half retraced less and half retraced more. The middle 50% range shows where most values fell. When available, the comparison uses the prior 20 sessions. Retraction is measured only for targets that were hit.',
      icon: 'ri-arrow-left-right-line',
      color: 'info',
    },
    {
      label: 'Usual Range (middle 50%)',
      value: usualRangeValue,
      sub: usualRangeSub,
      tip: 'This range contains the middle 50% of retractions for targets hit this week. One quarter were below the lower value, and one quarter were above the upper value. A narrow range indicates more consistent retractions. The secondary line shows the equivalent range for the prior 20 sessions.',
      icon: 'ri-expand-height-line',
      color: 'primary',
    },
    {
      label: 'Deep Retraction (1 in 10)',
      value: p90Value,
      comparison: p90Comparison,
      tip: 'Ninety percent of targets hit this week retraced less than this amount before reaching their price. Ten percent retraced this amount or more. When available, the comparison uses the prior 20 sessions.',
      icon: 'ri-arrow-up-down-line',
      color: 'warning',
    },
    {
      label: 'Deepest Retraction',
      value: weekly?.maxRetraction ?? 'N/A',
      tip: 'The largest retraction recorded for a target that was hit during the selected week.',
      icon: 'ri-arrow-up-down-line',
      color: 'danger',
    },
    {
      label: 'Shallow Retraction (≤10 pts)',
      value: weekly?.pctHitWithin10pts ?? 'N/A',
      comparison: shallowComparison,
      tip: 'The percentage of targets hit this week that retraced 10 points or less before reaching their price. When available, the comparison uses the prior 20 sessions.',
      icon: 'ri-arrow-right-line',
      color: 'warning',
    },
    {
      label: 'Best Day',
      value: weekly?.bestDay ?? 'N/A',
      tip: 'The day in the selected week with the highest target hit rate.',
      icon: 'ri-arrow-up-circle-line',
      color: 'success',
    },
    {
      label: 'Worst Day',
      value: weekly?.worstDay ?? 'N/A',
      tip: 'The day in the selected week with the lowest target hit rate.',
      icon: 'ri-arrow-down-circle-line',
      color: 'secondary',
    },
  ];

  return (
    <Row className="g-3 mb-4">
      {cards.map((card) => (
        <Col sm="6" xl="4" key={card.label}>
          <KpiTile {...card} />
        </Col>
      ))}
    </Row>
  );
};

export default WeeklyRetractionCards;
