import React from 'react';
import { Card, Col, Row } from 'react-bootstrap';

const PERIOD_COLORS = {
  Morning: { bg: 'bg-primary bg-opacity-10', text: 'text-primary', icon: 'ri-sun-line' },
  Midday: { bg: 'bg-warning bg-opacity-10', text: 'text-warning', icon: 'ri-sun-foggy-line' },
  Afternoon: { bg: 'bg-info bg-opacity-10', text: 'text-info', icon: 'ri-moon-line' },
};

// Time ranges shown beside period names — boundaries match the generator's
// SESSION_PERIODS; an 11:45 alert is Midday and the label must say why.
const PERIOD_RANGES = {
  Morning: '9:30–11:30',
  Midday: '11:30–2:00',
  Afternoon: '2:00–4:00',
};

// Maps the period label rendered on the card to the backend bucket key.
// Backend buckets are stored at the direction|session granularity; an "all
// directions for this session" aggregate isn't computed today, so we pool
// bullish + bearish into a session-level baseline below.
const PERIOD_BUCKET_KEY = {
  Morning: 'morning',
  Midday: 'midday',
  Afternoon: 'afternoon',
};

/**
 * Pools bullish|session and bearish|session bucket groups into a single
 * session-level baseline (hit rate + median time). Used for the "20-session
 * typical" footer under each period card. Returns null when neither bucket
 * has samples — older daily docs without bucketStats produce no footer.
 *
 * @param {Object|null} bucketGroups - data.bucketStats.groups
 * @param {string} sessionKey - 'morning' | 'midday' | 'afternoon'
 * @returns {{n:number, hitRate:number|null, medianTimeMin:number|null}|null}
 */
const poolSessionBaseline = (bucketGroups, sessionKey) => {
  if (!bucketGroups) return null;
  const bull = bucketGroups[`bullish|${sessionKey}`];
  const bear = bucketGroups[`bearish|${sessionKey}`];
  const groups = [bull, bear].filter((g) => g && Number.isFinite(g.n) && g.n > 0);
  if (!groups.length) return null;
  const nTotal = groups.reduce((s, g) => s + g.n, 0);
  const hitsTotal = groups.reduce((s, g) => s + (g.hits ?? 0), 0);
  // Weighted average of medianTimeMin by hits — a coarse but honest combiner
  // (each bucket already pooled its own median, so this is the cleanest
  // session-level summary without re-walking per-target rows here).
  const timedGroups = groups.filter((g) => Number.isFinite(g.medianTimeMin) && (g.hits ?? 0) > 0);
  const wHits = timedGroups.reduce((s, g) => s + g.hits, 0);
  const medianTimeMin = wHits > 0
    ? Number((timedGroups.reduce((s, g) => s + g.medianTimeMin * g.hits, 0) / wHits).toFixed(1))
    : null;
  return {
    n: nTotal,
    hitRate: nTotal > 0 ? Number(((hitsTotal / nTotal) * 100).toFixed(1)) : null,
    medianTimeMin,
  };
};

/**
 * Renders accuracy and performance for each of the three session periods:
 * Morning (9:30–11:30), Midday (11:30–14:00), Afternoon (14:00–16:00).
 * Each card shows: targets created, targets hit, accuracy %, and median time.
 *
 * @param {Object} props
 * @param {Array<{ period: string, created: number, hit: number, accuracy: number|null, medianTime: number|null }>} props.sessionPeriods
 * @param {Object} [props.bucketStats] - data.bucketStats — used for per-period 20-session baselines
 * @param {number} [props.bucketSessions] - data.trailingStats.sessions for the baseline label
 * @returns {JSX.Element}
 */
const SessionPeriodBreakdown = ({ sessionPeriods, bucketStats, bucketSessions }) => {
  if (!sessionPeriods || sessionPeriods.length === 0) return null;

  const bucketGroups = bucketStats?.groups ?? null;
  const sessionsLabel = Number.isFinite(bucketSessions) ? `${bucketSessions}-session` : '20-session';

  return (
    <Card className="card-one mb-4">
      <Card.Header>
        <Card.Title as="h6">Session Period Breakdown</Card.Title>
      </Card.Header>
      <Card.Body>
        <Row className="g-3">
          {sessionPeriods.map((period) => {
            const style = PERIOD_COLORS[period.period] ?? PERIOD_COLORS.Morning;
            // An inactive period (0 targets) is not a failed period: show an
            // em dash with no verdict color instead of a red 0%.
            const inactive = !period.created;
            const accuracyDisplay = !inactive && period.accuracy !== null ? `${period.accuracy}%` : '—';
            const medianDisplay = period.medianTime !== null ? `${period.medianTime} min` : '—';
            const accuracyColor =
              inactive || period.accuracy === null ? 'text-secondary'
              : period.accuracy >= 70 ? 'text-success'
              : period.accuracy >= 50 ? 'text-warning'
              : 'text-danger';

            return (
              <Col sm="4" key={period.period}>
                <div className={`rounded-3 p-3 h-100 ${style.bg}`}>
                  <div className={`d-flex align-items-center gap-2 ${style.text}`}>
                    <i className={`${style.icon} fs-18`}></i>
                    <span className="fw-semibold fs-sm">{period.period}</span>
                  </div>
                  <p className="fs-xs text-secondary mb-2">{PERIOD_RANGES[period.period] ?? ''}</p>

                  <h3 className={`mb-1 fw-bold ${accuracyColor}`}>{accuracyDisplay}</h3>
                  <p className="fs-xs text-secondary mb-2">Accuracy</p>

                  <div className="fs-xs text-secondary">{period.hit}/{period.created} targets</div>
                  <div className="fs-xs text-secondary">Median: {medianDisplay}</div>
                  {(() => {
                    const sessionKey = PERIOD_BUCKET_KEY[period.period];
                    const baseline = sessionKey ? poolSessionBaseline(bucketGroups, sessionKey) : null;
                    if (!baseline) return null;
                    const bits = [];
                    if (baseline.hitRate !== null) bits.push(`${baseline.hitRate}%`);
                    if (baseline.medianTimeMin !== null) bits.push(`~${baseline.medianTimeMin} min`);
                    if (!bits.length) return null;
                    return (
                      <div className="fs-xs text-secondary mt-2 pt-2 border-top">
                        {sessionsLabel} typical: {bits.join(' · ')}
                      </div>
                    );
                  })()}
                </div>
              </Col>
            );
          })}
        </Row>
      </Card.Body>
    </Card>
  );
};

export default SessionPeriodBreakdown;
