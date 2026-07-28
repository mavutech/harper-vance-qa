import React from 'react';
import { Col, Row } from 'react-bootstrap';
import KpiTile from './KpiTile';

/**
 * Renders the top KPI summary cards for a single day's SONA target performance.
 * Six metrics in a balanced 3×2 grid: hit rate (combined created/hit/accuracy),
 * median time to target, resolution speed, bullish accuracy, bearish accuracy,
 * and the retraction zone (sample-size guarded).
 *
 * Statistical discipline notes:
 * - Median leads on time-to-target; the average is outlier-skewed on scalp days.
 * - The p25/median/p75 retraction zone only renders with 5+ hits; below that
 *   the card falls back to median-only. Sample size is always displayed.
 *
 * @param {Object} props
 * @param {Object} props.data - rawPayload from Firebase for the selected date
 * @param {Object} props.computedStats - Derived stats from computeAllStats()
 * @returns {JSX.Element}
 */
const KpiCards = ({ data, computedStats }) => {
  const created = Number(data?.targetsCreated);
  const reached = Number(data?.targetsReached);
  const hasCounts = Number.isFinite(created) && Number.isFinite(reached) && created > 0;
  const hitRatePct = hasCounts ? ((reached / created) * 100).toFixed(1) : null;

  // Trailing baselines embedded in the day doc by the generator — answers
  // "compared to what?" beside today's headline numbers.
  const trailing = data?.trailingStats ?? null;
  const pooled = trailing?.pooled ?? null;
  // Direction × session baselines from the same 20-session window.
  const bucketGroups = data?.bucketStats?.groups ?? null;
  // Late-resolver cohort (targets that ran past 5 min) from the same window.
  const lateAll = data?.lateResolverStats?.groups?.all ?? null;
  const lateThreshold = data?.lateResolverStats?.thresholdMin ?? 5;
  const baseline = (value, unit = '') => (
    trailing && value !== null && value !== undefined
      ? `${trailing.sessions}-session avg: ${value}${unit}`
      : null
  );
  // Format the "median X · mean Y · p90 Z" pooled line. Only renders when
  // the pooled block carries usable values (older day docs won't have it).
  const pooledLine = (median, mean, p90, unit) => {
    if (median === null || median === undefined) return null;
    const parts = [`median ${median}${unit}`];
    if (mean !== null && mean !== undefined) parts.push(`mean ${mean}${unit}`);
    if (p90 !== null && p90 !== undefined) parts.push(`p90 ${p90}${unit}`);
    return `${trailing.sessions}-session: ${parts.join(' · ')}`;
  };

  // Small-sample guard: a 4-target day against an ~80-target baseline reads
  // stronger than it is — tag it so nobody overreads the comparison.
  const smallSample = hasCounts && created < 10;

  // Current hit run as system state ("is the machine behaving as designed"),
  // chained across sessions: if every target today has hit, today's run
  // extends the run we entered the day with. States the run; implies nothing
  // about the next target.
  const streak = computedStats?.consecutiveStreak ?? null;
  let streakLine = null;
  if (streak && trailing && Number.isFinite(trailing.runEnteringToday) && Number.isFinite(trailing.bestRun)) {
    const todayUnbroken = hasCounts && streak.current === created;
    const currentRun = (todayUnbroken ? trailing.runEnteringToday : 0) + (streak.current ?? 0);
    const best = Math.max(trailing.bestRun, currentRun);
    streakLine = `Streak ${currentRun} · ${trailing.sessions}-session best ${best}`;
  }

  // Median time: prefer the generator's value, fall back to client-computed
  const medianTimeRaw = data?.targetMedianTime ?? (
    computedStats?.resolutionTimes?.median !== null && computedStats?.resolutionTimes?.median !== undefined
      ? `${computedStats.resolutionTimes.median} min`
      : null
  );

  // Resolution speed: how many hits resolved within 5 minutes
  const fastCount = computedStats?.timeBuckets?.['0-5'];
  const speedValue = Number.isFinite(fastCount) && hasCounts && reached > 0
    ? `${fastCount} of ${reached}`
    : null;

  const bullishAcc = computedStats?.directionSplit?.bullish?.accuracy;
  const bearishAcc = computedStats?.directionSplit?.bearish?.accuracy;

  // One number only — the full retraction profile lives in its own card
  const retraction = computedStats?.retractionStats;
  const retractionCount = retraction?.count ?? 0;
  const retractionValue = retraction?.median !== null && retraction?.median !== undefined
    ? `${retraction.median} pts`
    : '—';
  const retractionLabel = `Median Retraction Before Hit (n=${retractionCount})`;

  const cards = [
    {
      label: 'Hit Rate',
      value: hasCounts ? `${reached}/${created} (${hitRatePct}%)` : '—',
      sub: [
        baseline(trailing?.hitRate, '%') && `${baseline(trailing?.hitRate, '%')}${smallSample ? ` · today n=${created} (small sample)` : ''}`,
        streakLine,
      ].filter(Boolean),
      tip: 'The percentage of targets generated on the selected day that reached the target price. The comparison value uses the prior 20 trading sessions. Small samples should not be interpreted as representative. The streak is a historical count of consecutive resolved targets and is not predictive.',
      icon: 'ri-percent-line',
      color: hasCounts && hitRatePct >= 70 ? 'success' : hasCounts && hitRatePct >= 50 ? 'warning' : hasCounts ? 'danger' : 'secondary',
    },
    {
      label: 'Median Time to Target',
      value: medianTimeRaw ?? '—',
      sub: [
        // Prefer the pooled "median · mean · p90" line when the day doc
        // carries it; fall back to the legacy avg-of-daily-medians.
        pooledLine(pooled?.medianTime, pooled?.meanTime, pooled?.p90Time, ' min')
          || baseline(trailing?.medianTimeAvg, ' min'),
      ].filter(Boolean),
      tip: 'The middle resolution time for targets that reached the target price. Half resolved faster and half resolved slower. The comparison includes median, mean, and 90th-percentile values for the prior 20 sessions.',
      icon: 'ri-time-line',
      color: 'warning',
    },
    {
      label: 'Hits Resolved Within 5 Min',
      value: speedValue ?? '—',
      sub: baseline(pooled?.pctWithin5, '%'),
      tip: 'The number of resolved targets that reached the target price within five minutes of generation. The comparison value is the percentage of resolved targets meeting this threshold over the prior 20 sessions.',
      icon: 'ri-flashlight-line',
      color: 'primary',
    },
    {
      label: 'Bullish Accuracy',
      value: bullishAcc !== null && bullishAcc !== undefined ? `${bullishAcc}%` : '—',
      sub: baseline(bucketGroups?.bullish?.hitRate, '%'),
      tip: 'The percentage of bullish targets generated on the selected day that reached the target price. The comparison value uses bullish targets from the prior 20 sessions.',
      icon: 'ri-arrow-up-line',
      color: 'success',
    },
    {
      label: 'Bearish Accuracy',
      value: bearishAcc !== null && bearishAcc !== undefined ? `${bearishAcc}%` : '—',
      sub: baseline(bucketGroups?.bearish?.hitRate, '%'),
      tip: 'The percentage of bearish targets generated on the selected day that reached the target price. The comparison value uses bearish targets from the prior 20 sessions.',
      icon: 'ri-arrow-down-line',
      color: 'danger',
    },
    {
      label: retractionLabel,
      value: retractionValue,
      sub: [
        pooledLine(pooled?.medianRetraction, pooled?.meanRetraction, pooled?.p90Retraction, ' pts')
          || baseline(trailing?.medianRetractionAvg, ' pts'),
        // Max retraction belongs on this card, not the bare median tile —
        // it's part of "the absolute average story" the user asked for.
        pooled?.maxRetraction !== null && pooled?.maxRetraction !== undefined
          ? `${trailing.sessions}-session max: ${pooled.maxRetraction} pts`
          : null,
      ].filter(Boolean),
      tip: 'Retraction is the maximum movement away from the target price after generation and before resolution. This value is the median across measured resolved targets. Comparison values use the prior 20 sessions.',
      icon: 'ri-arrow-left-right-line',
      color: 'info',
    },
    {
      label: `Late Resolvers (>${lateThreshold} min)`,
      value: lateAll && lateAll.eventualHitRate !== null && lateAll.eventualHitRate !== undefined
        ? `${lateAll.eventualHitRate}%`
        : '—',
      sub: lateAll ? [
        lateAll.hits !== null && lateAll.n !== null
          ? `${lateAll.hits} of ${lateAll.n} eventually hit`
          : null,
        pooledLine(lateAll.medianTimeMin, lateAll.meanTimeMin, lateAll.p90TimeMin, ' min'),
        lateAll.neverResolved > 0 ? `Never resolved: ${lateAll.neverResolved}` : null,
      ].filter(Boolean) : [],
      tip: `Targets unresolved after ${lateThreshold} minutes within the prior ${trailing?.sessions || 20} sessions. Eventual hit rate is the percentage that later reached the target price. Time measures apply only to targets that subsequently resolved.`,
      icon: 'ri-hourglass-line',
      color: lateAll && lateAll.eventualHitRate >= 70 ? 'success' : lateAll && lateAll.eventualHitRate >= 50 ? 'warning' : lateAll ? 'danger' : 'secondary',
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

export default KpiCards;
