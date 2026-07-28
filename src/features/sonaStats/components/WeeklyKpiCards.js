import React from 'react';
import { Col, Row } from 'react-bootstrap';
import KpiTile from './KpiTile';
import { buildComparison, buildCountComparison } from '../utils/weeklyComparison';

/**
 * Renders the weekly headline KPI cards derived from the weekly rawPayload.
 * Shows: targets created, targets hit, weekly accuracy (volume-weighted),
 * median time to target, bullish accuracy, and bearish accuracy (last two
 * from aggregated daily data).
 *
 * Statistical notes:
 * - Accuracy uses `targetAccuracyOverall` (pooled across every target), so a
 *   quiet day cannot weigh as much as a busy day. The unweighted daily average
 *   (`targetAccuracySum`) is shown only as a secondary caption.
 * - Time uses `targetMedianTimeWeek` (median over every hit) as the headline;
 *   the average is the secondary caption.
 * - When the week is built from fewer than the expected sessions, or from very
 *   few targets, a coverage caption flags it (from the `coverage` prop).
 *
 * @param {Object} props
 * @param {Object|null} props.weekly - Weekly rawPayload from Firebase
 * @param {{ bullishAcc: number|null, bearishAcc: number|null }} props.weeklyDirection - Aggregated direction split
 * @param {{ daysCovered: number, daysExpected: number, totalTargets: number, partialWeek: boolean, smallSample: boolean }} [props.coverage] - Coverage flags from useWeeklyStats
 * @returns {JSX.Element}
 */
const WeeklyKpiCards = ({ weekly, weeklyDirection, coverage }) => {
  const { bullishHit, bullishCreated, bearishHit, bearishCreated } = weeklyDirection || {};
  const bullishHitLine = Number.isFinite(bullishCreated) && bullishCreated > 0 ? `${bullishHit}/${bullishCreated} hit` : null;
  const bearishHitLine = Number.isFinite(bearishCreated) && bearishCreated > 0 ? `${bearishHit}/${bearishCreated} hit` : null;
  // Coverage caption for the accuracy tile: "based on 4 of 5 sessions · n=23 (small sample)"
  let coverageLine = null;
  if (coverage) {
    const parts = [];
    if (coverage.partialWeek) parts.push(`based on ${coverage.daysCovered} of ${coverage.daysExpected} sessions`);
    if (coverage.smallSample) parts.push(`n=${coverage.totalTargets} (small sample)`);
    if (parts.length) coverageLine = parts.join(' · ');
  }

  // "This week vs the prior 20-session norm" comparisons. Suppressed on a thin
  // week (a delta off few targets is noise) or when no baseline exists yet.
  const trailing = weekly?.trailingStats;
  const buckets = weekly?.bucketStats?.groups;
  const sessions = weekly?.bucketStats?.sessions;
  const notThin = !(coverage && coverage.smallSample);

  // Volume comparison: this week's count vs a typical week (recent window
  // average, scaled to 5 trading days). Only on a full week, since a
  // holiday-short week naturally has fewer targets and would compare unfairly.
  const fullWeek = !(coverage && coverage.partialWeek);
  const volumeOk = notThin && fullWeek && buckets?.all && Number.isFinite(sessions) && sessions > 0;
  const perWeek = (total) => (total / sessions) * 5;
  const createdComparison = volumeOk
    ? buildCountComparison({ thisWeek: weekly?.targetsCreatedSum, baselinePerWeek: perWeek(buckets.all.n) })
    : null;
  const hitsComparison = volumeOk
    ? buildCountComparison({ thisWeek: weekly?.targetsReachedSum, baselinePerWeek: perWeek(buckets.all.hits) })
    : null;
  const accuracyComparison = trailing && notThin
    ? buildComparison({ thisWeek: weekly?.targetAccuracyOverall, baseline: trailing.hitRate, unit: '%', betterWhenHigher: true })
    : null;
  const timeComparison = trailing && notThin
    ? buildComparison({ thisWeek: weekly?.targetMedianTimeWeek, baseline: trailing.medianTimeAvg, unit: 'min', betterWhenHigher: false })
    : null;
  // Direction baselines come from the 20-session bucket engine.
  const bullishComparison = buckets && notThin
    ? buildComparison({ thisWeek: weeklyDirection?.bullishAcc, baseline: buckets.bullish?.hitRate, unit: '%', betterWhenHigher: true })
    : null;
  const bearishComparison = buckets && notThin
    ? buildComparison({ thisWeek: weeklyDirection?.bearishAcc, baseline: buckets.bearish?.hitRate, unit: '%', betterWhenHigher: true })
    : null;

  const cards = [
    {
      label: 'Targets Created',
      value: weekly?.targetsCreatedSum ?? 'N/A',
      comparison: createdComparison,
      tip: 'Total SONA targets generated during the selected trading week. When available, the comparison uses the prior 20 sessions.',
      icon: 'ri-focus-3-line',
      color: 'primary',
    },
    {
      label: 'Targets Hit',
      value: weekly?.targetsReachedSum ?? 'N/A',
      comparison: hitsComparison,
      tip: 'Targets that reached their stated price during the selected trading week. When available, the comparison uses the prior 20 sessions.',
      icon: 'ri-checkbox-circle-line',
      color: 'success',
    },
    {
      label: 'Weekly Accuracy',
      value: weekly?.targetAccuracyOverall ?? 'N/A',
      comparison: accuracyComparison,
      sub: coverageLine,
      tip: 'The percentage of all targets generated this week that were hit. Results are calculated across all targets, so days with more targets have greater weight. When the sample is sufficient, the comparison uses the prior 20 sessions. A daily average is tracked separately and may differ when daily target volume varies.',
      icon: 'ri-percent-line',
      color: 'info',
    },
    {
      label: 'Median Time to Target',
      value: weekly?.targetMedianTimeWeek ?? 'N/A',
      comparison: timeComparison,
      tip: 'Half of the targets that were hit reached their price sooner than this time, and half took longer. The median limits the effect of unusually slow targets. When available, the comparison uses the prior 20 sessions.',
      icon: 'ri-time-line',
      color: 'warning',
    },
    {
      label: 'Bullish Accuracy',
      value: weeklyDirection?.bullishAcc !== null && weeklyDirection?.bullishAcc !== undefined
        ? `${weeklyDirection.bullishAcc}%`
        : 'N/A',
      comparison: bullishComparison,
      sub: bullishHitLine,
      tip: 'The hit rate for bullish targets during the selected week. When available, the comparison uses the prior 20 sessions.',
      icon: 'ri-arrow-up-line',
      color: 'success',
    },
    {
      label: 'Bearish Accuracy',
      value: weeklyDirection?.bearishAcc !== null && weeklyDirection?.bearishAcc !== undefined
        ? `${weeklyDirection.bearishAcc}%`
        : 'N/A',
      comparison: bearishComparison,
      sub: bearishHitLine,
      tip: 'The hit rate for bearish targets during the selected week. When available, the comparison uses the prior 20 sessions.',
      icon: 'ri-arrow-down-line',
      color: 'danger',
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

export default WeeklyKpiCards;
