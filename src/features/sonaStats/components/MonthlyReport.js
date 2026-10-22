import React from 'react';
import { Alert, Card, Col, Row, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import moment from 'moment-timezone';
import KpiTile from './KpiTile';
import MonthlyCharts from './MonthlyCharts';
import { monthlyDisplayDays } from '../utils/monthlyCharts';
import { MONTHLY_COPY as C } from '../utils/monthlyCopy';
import { EST_TIMEZONE } from '../utils/sonaStatsConstants';

/**
 * Formats a measured value without converting missing measurements to zero.
 * @param {number|null} value - Value returned by the monthly API.
 * @param {string} unit - Optional display unit.
 * @returns {string} Display text.
 */
const valueText = (value, unit = '') => Number.isFinite(value) ? `${Number(value.toFixed(1))}${unit}` : C.na;

/**
 * Displays a titled collection of parallel measurements.
 * @param {Object} props - Title, rows, explanatory note and optional children.
 * @returns {JSX.Element} Accessible report section.
 */
function Measurements({ title, rows, note, children }) {
  return <Card className="card-one h-100"><Card.Body>
    <h5>{title}</h5>{note && <p className="text-secondary fs-sm">{note}</p>}
    {rows && <Table responsive size="sm"><tbody>{rows.map(([label, value]) =>
      <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody></Table>}
    {children}
  </Card.Body></Card>;
}

/**
 * Labels one direction/session group using centralized UI copy.
 * @param {string} key - Group identifier.
 * @returns {string} Human-readable group name.
 */
const groupLabel = (key) => key.split('|').map((part) => C[part]).join(' · ');

/**
 * Formats a best/worst day with its numerator and denominator.
 * @param {Object|null} day - Ranked daily summary.
 * @returns {string} Traceable date and sample.
 */
const rankedDay = (day) => day ? `${day.date}: ${day.hits}/${day.created} (${valueText(day.accuracy, C.percentUnit)})` : C.na;

/**
 * Renders monthly metrics and audit tables without recomputing outcomes.
 * @param {Object} props.report - Calculated monthly report from the licensed API.
 * @returns {JSX.Element} Monthly report sections.
 */
export default function MonthlyReport({ report }) {
  const { summary: s, coverage: c, timing: t, pullbacks: p, consistency: k, comparison } = report;
  const prior = comparison.summary;
  const groupRows = [
    ...Object.entries(report.groups).map(([key, group]) => ({ label: groupLabel(key), created: group.n, hits: group.hits, accuracy: group.hitRate })),
    ...report.sessions.map((period) => ({ label: C[period.period.toLowerCase()], created: period.created, hits: period.hit, accuracy: period.accuracy })),
  ];
  const headline = [
    [C.created, s.created], [C.hits, s.hits], [C.missed, s.missed],
    [C.accuracy, valueText(s.accuracy, C.percentUnit)],
    [C.medianTime, valueText(s.medianTime, C.minUnit)], [C.medianPullback, valueText(s.medianPullback, C.ptsUnit)],
  ];
  const comparisonRows = [
    [C.sessionsIncluded, c.daysCovered, comparison.coverage?.daysCovered, ''],
    [C.accuracy, s.accuracy, prior?.accuracy, C.percentUnit],
    [C.medianTime, s.medianTime, prior?.medianTime, C.minUnit],
    [C.medianPullback, s.medianPullback, prior?.medianPullback, C.ptsUnit],
    [C.targetsPerSession, s.targetsPerSession, prior?.targetsPerSession, ''],
    [C.hitsPerSession, s.hitsPerSession, prior?.hitsPerSession, ''],
  ];
  return <div className="d-grid gap-3">
    <Measurements title={`${report.month} · ${report.period.inProgress ? C.soFar : C.fullMonth}`} note={C.coverageNote}
      rows={[
        [C.coverage, C.coverageLabels[c.status]], [C.sessionsIncluded, `${c.daysCovered} / ${c.daysExpected}`],
        [C.monthSessions, c.sessionsInMonth], [C.missing, c.missingDates.join(', ') || '0'],
        [C.invalid, c.invalidDates.join(', ') || '0'], [C.closed, c.closedDates.length], [C.pending, c.pendingDates.length],
        [C.calculated, moment(report.computedAt).tz(EST_TIMEZONE).format('MMM D, YYYY HH:mm z')],
      ]}>
      {c.status === 'incomplete' && <Alert variant="warning">{C.gaps}</Alert>}
      {c.legacyDates.length > 0 && <p className="text-secondary">{C.legacy} {c.legacyDates.join(', ')}</p>}
      <p className="text-secondary fs-sm mb-0">{C.sourceNote}</p>
    </Measurements>
    {c.daysCovered === 0 && <Alert variant="info">{C.noReports}</Alert>}
    {s.created > 0 && s.lowSample && <Alert variant="info">{C.lowSample}</Alert>}
    <Row className="g-3">{headline.map(([label, value]) => <Col key={label} xs={6} lg={4} xl={2}>
      <KpiTile label={label} value={value} icon="ri-bar-chart-line" />
    </Col>)}</Row>
    <MonthlyCharts report={report} />
    <Row className="g-3">
      <Col lg={6}><Measurements title={C.timing} note={C.timingNote} rows={[
        [C.samples, `${t.samples} / ${s.hits}`], [C.unmeasured, t.missing],
        [C.average, valueText(t.avg, C.minUnit)], [C.median, valueText(t.median, C.minUnit)],
        [C.fastest, valueText(t.fastest, C.minUnit)], [C.slowest, valueText(t.slowest, C.minUnit)],
        [C.variation, valueText(t.stdDev, C.minUnit)],
        ...Object.entries(t.buckets).map(([key, count]) => [C.timeBuckets[key], count]),
      ]} /></Col>
      <Col lg={6}><Measurements title={C.pullbacks} note={C.pullbackNote} rows={[
        [C.samples, `${p.samples} / ${s.hits}`], [C.unmeasured, p.missing],
        ...[['average', C.average], ['median', C.median], ['p25', C.p25], ['p75', C.p75], ['p90', C.p90], ['deepest', C.deepest]]
          .map(([key, label]) => [label, valueText(p[key], C.ptsUnit)]),
        [C.within10, valueText(p.within10, C.percentUnit)],
      ]} /></Col>
    </Row>
    <Measurements title={C.directionSession} note={C.groupNote}>
      <Table responsive size="sm"><thead><tr>{[C.group, C.created, C.hits, C.misses, C.accuracy, C.sample].map((label) => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>{groupRows.map((group) => <tr key={group.label}>
          <th scope="row">{group.label}</th><td>{group.created}</td><td>{group.hits}</td><td>{group.created - group.hits}</td>
          <td>{valueText(group.accuracy, C.percentUnit)}</td><td>{group.created > 0 && group.created < report.minSample ? C.small : valueText(group.created)}</td>
        </tr>)}</tbody></Table>
    </Measurements>
    <Measurements title={C.missLate} note={C.lateNote} rows={[
      [C.missed, report.misses.count], [C.measuredMisses, `${report.misses.samples} / ${report.misses.count}`],
      [C.closestMiss, valueText(report.misses.closest)], [C.averageMiss, valueText(report.misses.averageDistance)],
      [C.slowHits, report.late.groups.all.hits], [C.unresolved, report.late.groups.all.neverResolved],
    ]} />
    <Measurements title={C.consistency} note={C.streakNote} rows={[
      [C.longestHits, k.longestHitRun], [C.longestMisses, k.longestMissRun],
      [C.currentHits, k.currentHitRun], [C.currentMisses, k.currentMissRun],
      [C.firstHits, `${k.firstTargetHits} / ${k.daysWithTargets}`], [C.firstAccuracy, valueText(k.firstTargetAccuracy, C.percentUnit)],
      [C.best, rankedDay(k.bestDay)], [C.worst, rankedDay(k.worstDay)], [C.distanceSamples, `${report.distances.samples} / ${s.created}`],
    ]}>
      <Table responsive size="sm"><thead><tr>{[C.distance, C.created, C.hits, C.accuracy].map((label) => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>{report.distances.buckets.map((bucket) => <tr key={bucket.range}><th scope="row">{bucket.range}</th><td>{bucket.created}</td><td>{bucket.hit}</td><td>{bucket.hitRate}</td></tr>)}</tbody>
      </Table>
    </Measurements>
    <Measurements title={C.comparison} note={C.comparisonNote}>
      {!prior ? <p>{C.comparisonUnavailable}</p> : <Table responsive size="sm">
        <thead><tr><th>{C.metric}</th><th>{C.selected} ({report.month})</th><th>{C.prior} ({comparison.month})</th></tr></thead>
        <tbody>{comparisonRows.map(([label, selected, previous, unit]) => <tr key={label}><th scope="row">{label}</th><td>{valueText(selected, unit)}</td><td>{valueText(previous, unit)}</td></tr>)}</tbody>
      </Table>}
    </Measurements>
    <Measurements title={C.daily} note={C.tradingDaysOnly}>
      <Table responsive size="sm"><thead><tr>{[C.date, C.status, C.created, C.hits, C.accuracy, C.medianTime, C.lastDaily].map((label) => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>{monthlyDisplayDays(report.days).map((day) => <tr key={day.date}>
          <th scope="row">{['included', 'zero_targets', 'invalid'].includes(day.status) ? <Link aria-label={`${C.dailyLink} ${day.date}`} to={`/dashboard/sona-daily?date=${day.date}`}>{day.date}</Link> : day.date}</th>
          <td>{C.statusLabels[day.status]}</td><td>{valueText(day.created)}</td><td>{valueText(day.hits)}</td><td>{valueText(day.accuracy, C.percentUnit)}</td>
          <td>{valueText(day.medianTime, C.minUnit)}</td><td>{day.computedAt ? moment(day.computedAt).tz(EST_TIMEZONE).format('MMM D HH:mm z') : C.na}</td>
        </tr>)}</tbody>
      </Table>
    </Measurements>
    <Measurements title={C.targets}>
      <details><summary>{C.targets} ({report.targets.length})</summary>
        <Table responsive size="sm"><thead><tr>{[C.date, C.target, C.generated, C.group, C.price, C.outcome, C.minutes, C.points, C.closestMiss].map((label) => <th key={label}>{label}</th>)}</tr></thead>
          <tbody>{report.targets.map((target) => <tr key={`${target.date}-${target.index}`}>
            <td><Link to={`/dashboard/sona-daily?date=${target.date}`}>{target.date}</Link></td><td>{target.alertId || target.index}</td>
            <td>{moment.unix(target.generatedAt).tz(EST_TIMEZONE).format('HH:mm z')}</td>
            <td>{C[target.direction]}{target.session ? ` · ${C[target.session]}` : ''}</td><td>{target.price ?? C.na}</td><td>{target.hit ? C.hit : C.miss}</td>
            <td>{valueText(target.timeMinutes)}</td><td>{valueText(target.pullback)}</td><td>{valueText(target.closestMiss)}</td>
          </tr>)}</tbody>
        </Table>
      </details>
    </Measurements>
  </div>;
}
