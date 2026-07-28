import React from 'react';
import moment from 'moment-timezone';
import { Badge, Card, Col, Row } from 'react-bootstrap';
import { BULLISH_COLOR, EST_TIMEZONE, SESSION_END } from '../utils/sonaStatsConstants';
import { resolveGeneratedCloseTimestamp } from '../utils/closeTime';

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * Plain-language label for what the context is based on, reflecting the bucket
 * the backend matched (so a fallback to a broader group reads honestly).
 */
const basisLabel = (ctx) => {
  if (ctx.level === 'direction+session') return `${cap(ctx.direction)} ${ctx.session} targets`;
  if (ctx.level === 'direction') return `${cap(ctx.direction)} targets`;
  return 'Recent targets';
};

/** Friendly wording for the backend's retraction-vs-typical label. */
const RETRACTION_LABEL = { less: 'less than usual', normal: 'normal', deeper: 'deeper than usual' };

/**
 * Plain-language label for the late-cohort basis. Mirrors `basisLabel` but
 * sourced from the `lateContext` block (which carries its own direction /
 * session / fallback level fields).
 */
const lateBasisLabel = (late) => {
  if (late.level === 'direction+session') return `${cap(late.direction)} ${late.session} late targets`;
  if (late.level === 'direction') return `${cap(late.direction)} late targets`;
  return 'Late targets';
};

/**
 * Plain-language one-liner explaining how a special-day bucket compares to
 * the typical day. Leads with time-to-target (where the signal lives) and
 * only mentions accuracy when it materially differs.
 *
 * @param {Object} tagSummary - One entry from daySummary.tags
 * @param {Object} baseline   - daySummary.baseline
 * @returns {string}
 */
const dayContextLine = (tagSummary, baseline) => {
  const ttr = tagSummary.ttrVsBaseline;
  const acc = tagSummary.accuracyVsBaseline;
  const eventTtr = tagSummary.bucket.avgTtrMinutes;
  const baseTtr = baseline && baseline.avgTtrMinutes;
  const n = tagSummary.bucket.nDays;

  let lead;
  if (ttr.label === 'faster') {
    lead = `Targets typically hit faster than usual — ~${eventTtr} min vs ~${baseTtr} min on a regular day (n=${n}).`;
  } else if (ttr.label === 'slower') {
    lead = `Targets typically take longer to hit — ~${eventTtr} min vs ~${baseTtr} min on a regular day (n=${n}).`;
  } else {
    lead = `Targets behave about the same as a regular day (~${eventTtr} min to hit, n=${n}).`;
  }

  if (acc.label === 'above') {
    lead += ` Accuracy runs higher (~${Math.round(tagSummary.bucket.accuracy * 100)}% vs ~${Math.round(baseline.accuracy * 100)}%).`;
  } else if (acc.label === 'below') {
    lead += ` Accuracy runs lower (~${Math.round(tagSummary.bucket.accuracy * 100)}% vs ~${Math.round(baseline.accuracy * 100)}%).`;
  }
  return lead;
};

/**
 * Returns the plain-language retraction comparison label for a live block, or
 * null when there's no baseline to compare against.
 *
 * @param {Object} live - target.live block stamped by the backend
 * @returns {string|null}
 */
const retractionLabel = (live) => (live && RETRACTION_LABEL[live.retractionVsTypical]) || null;

/**
 * Unix seconds for the session close (4:00 PM ET) on the calendar day the
 * target opened. Mirrors the backend freeze boundary.
 *
 * @param {number} openTs - Target open timestamp (unix seconds)
 * @returns {number} Session-close timestamp (unix seconds)
 */
const sessionCloseSeconds = (openTs) =>
  moment.unix(openTs).tz(EST_TIMEZONE)
    .hour(SESSION_END.hour).minute(SESSION_END.minute).second(0).millisecond(0)
    .unix();

/**
 * Minutes a target has been open, FROZEN at the earlier of now or the session
 * close so the clock stops at the bell instead of climbing overnight. Prefers
 * the backend-stamped `live` block when present (so the dashboard and API match
 * exactly); otherwise computes it client-side.
 *
 * @param {Object} target - Open target record
 * @returns {{ minutes: number, marketClosed: boolean }|null} Frozen minutes + closed flag, or null
 */
const minutesOpenInfo = (target) => {
  // Backend source of truth, once deployed.
  if (target.live && Number.isFinite(target.live.minutesOpen)) {
    return { minutes: target.live.minutesOpen, marketClosed: target.live.marketClosed === true };
  }
  const ts = resolveGeneratedCloseTimestamp(target);
  if (!ts) return null;
  const openTs = parseInt(ts, 10);
  const nowSec = Math.floor(Date.now() / 1000);
  const closeTs = sessionCloseSeconds(openTs);
  // Only freeze targets that actually opened during the session.
  const frozen = openTs < closeTs && nowSec >= closeTs;
  const end = frozen ? closeTs : nowSec;
  return { minutes: Math.max(0, Math.round((end - openTs) / 60)), marketClosed: frozen };
};

/**
 * Prominent panel of open (unresolved) targets, each with its "targets like
 * this" context stamped by the backend (target.bucketContext). Visual hierarchy:
 * direction + price first, the decision context second, timing third.
 *
 * @param {Object} props
 * @param {Object[]} props.targets - Real-time targets array
 * @param {?Object} props.daySummary - Day-context summary or null on regular days
 * @returns {JSX.Element}
 */
const OpenTargetsPanel = ({ targets, daySummary }) => {
  const open = (targets || []).filter((t) => t.targetReached !== true);
  // Once the session is over, open targets didn't resolve — they're unresolved
  // at close, not "waiting".
  const allClosed = open.length > 0 && open.every((t) => {
    const info = minutesOpenInfo(t);
    return info && info.marketClosed;
  });

  return (
    <Card className="card-one mb-4">
      <Card.Header>
        <Card.Title as="h6" className="mb-0">Open Targets</Card.Title>
        <span className="fs-xs text-secondary ms-2">
          {allClosed ? `${open.length} unresolved at close` : `${open.length} waiting to resolve`}
        </span>
      </Card.Header>
      <Card.Body>
        {daySummary && daySummary.tags && daySummary.tags[0] && (
          <div className="rounded-3 p-2 px-3 mb-3 fs-sm border-start border-3 border-primary bg-body-tertiary">
            <strong>Today is a {daySummary.tags[0].label.toLowerCase()}.</strong>{' '}
            {dayContextLine(daySummary.tags[0], daySummary.baseline)}
          </div>
        )}
        {open.length === 0 ? (
          <p className="text-secondary fs-sm mb-0">No open targets right now.</p>
        ) : (
          <Row className="g-3">
            {open.map((t) => {
              const bullish = t.colorHighlight === BULLISH_COLOR;
              const ctx = t.bucketContext || null;
              const late = t.lateContext || null;
              const openInfo = minutesOpenInfo(t);
              const openMin = openInfo ? openInfo.minutes : null;
              const marketClosed = openInfo ? openInfo.marketClosed : false;
              // Switch to the late-cohort baseline once the target has been
              // open longer than the late threshold (5 min by default). This
              // is the user's headline ask: stop comparing a 52-min target
              // against the all-targets 5-min median.
              const lateThreshold = late?.thresholdMin ?? 5;
              const inLateMode = !marketClosed && late && openMin !== null && openMin > lateThreshold;
              // Running long is meaningful against the right cohort:
              //  - normal mode: 1.5x the typical median
              //  - late mode:   1.5x the late-cohort median (so a 14-min
              //    target only flags once it's past ~21 min, not at 6 min)
              const runningLong = !marketClosed && openMin !== null && (
                inLateMode
                  ? (late.medianTimeMin && openMin > late.medianTimeMin * 1.5)
                  : (ctx && ctx.medianTimeMin && openMin > ctx.medianTimeMin * 1.5)
              );

              return (
                <Col xs="12" md="6" xl="4" key={t.alertId}>
                  <div className="border rounded-3 p-3 h-100">
                    {/* Primary: direction + price */}
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <Badge bg={bullish ? 'success' : 'danger'} className="fs-xs">
                          {bullish ? 'Bullish' : 'Bearish'}
                        </Badge>
                        <span className="fs-20 fw-bold">{t.targetPrice}</span>
                      </div>
                      <Badge bg="secondary" className="fs-xs">
                        {marketClosed ? 'Unresolved' : 'Open'}
                      </Badge>
                    </div>

                    {/* Secondary: decision context */}
                    {inLateMode ? (
                      <div className="fs-sm mb-2">
                        <span className="fw-medium">Past {lateThreshold} min:</span>{' '}
                        <span className="fw-medium">{lateBasisLabel(late)}</span> eventually hit{' '}
                        <span className="fw-semibold text-success">{late.eventualHitRate}%</span>
                        <span className="text-secondary"> (n={late.n})</span>
                        {late.medianRetraction != null && (
                          <>
                            ; retrace ~<span className="fw-semibold">{late.medianRetraction} pts</span>
                            {late.p25Retraction != null && late.p75Retraction != null && (
                              <span className="text-secondary"> ({late.p25Retraction} to {late.p75Retraction})</span>
                            )}
                          </>
                        )}
                      </div>
                    ) : ctx ? (
                      <div className="fs-sm mb-2">
                        <span className="fw-medium">{basisLabel(ctx)}</span> hit{' '}
                        <span className="fw-semibold text-success">{ctx.hitRate}%</span>
                        {ctx.medianRetraction != null && (
                          <>
                            ; typically retrace ~<span className="fw-semibold">{ctx.medianRetraction} pts</span>
                            {ctx.p25Retraction != null && ctx.p75Retraction != null && (
                              <span className="text-secondary"> ({ctx.p25Retraction} to {ctx.p75Retraction})</span>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="fs-xs text-secondary mb-2">No recent baseline yet for this target type.</div>
                    )}

                    {/* Live: distance to target + retraction vs typical (backend live block) */}
                    {t.live && t.live.retractionSoFar != null && (
                      <div className="fs-sm mb-2">
                        {marketClosed ? (
                          <>
                            Retraced <span className="fw-semibold">{t.live.retractionSoFar} pts</span> before close
                            {retractionLabel(t.live) && <span className="text-secondary"> — {retractionLabel(t.live)}</span>}
                          </>
                        ) : (
                          <>
                            {t.live.pointsToTarget != null && (
                              <><span className="fw-semibold">{t.live.pointsToTarget} pts</span> to {t.live.distanceDirection} · </>
                            )}
                            retraced <span className="fw-semibold">{t.live.retractionSoFar} pts</span>
                            {retractionLabel(t.live) && <span className="text-secondary"> ({retractionLabel(t.live)})</span>}
                          </>
                        )}
                      </div>
                    )}

                    {/* Tertiary: timing */}
                    <div className="fs-xs text-secondary">
                      {openMin !== null ? `Open ${openMin} min` : 'Open'}
                      {marketClosed
                        ? <span className="fw-medium"> — market closed</span>
                        : inLateMode && late.medianTimeMin
                          ? (() => {
                              const extras = [];
                              if (late.meanTimeMin != null) extras.push(`mean ${late.meanTimeMin}`);
                              if (late.p90TimeMin != null) extras.push(`p90 ${late.p90TimeMin}`);
                              const suffix = extras.length ? ` (${extras.join(', ')})` : '';
                              return ` · late cohort median ~${late.medianTimeMin} min${suffix}`;
                            })()
                          : (ctx && ctx.medianTimeMin ? ` · typically hits within ~${ctx.medianTimeMin} min` : '')}
                      {runningLong && <span className="text-warning fw-medium"> · running long</span>}
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        )}
      </Card.Body>
    </Card>
  );
};

export default OpenTargetsPanel;
