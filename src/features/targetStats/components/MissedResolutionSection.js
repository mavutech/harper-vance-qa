import React from 'react';
import { Card, Col, Row, OverlayTrigger, Popover } from 'react-bootstrap';
import KpiTile from './KpiTile';
import UnderlyingDataTable from './UnderlyingDataTable';
import { normalizeLateResolverStats } from '../utils/normalizeLateResolverStats';

const SESSION_LABELS = { morning: 'Morning', midday: 'Midday', afternoon: 'Afternoon' };
const SESSION_ORDER = ['morning', 'midday', 'afternoon'];

/**
 * Renders a percentage or a placeholder when the group lacks sample.
 *
 * @param {{ hasSample: boolean, eventualHitRate: number, n: number }} group
 * @param {number} minSample - Doc-supplied sample size threshold
 * @returns {string}
 */
const formatHitRate = (group, minSample) => {
  if (!group.hasSample) return `low sample (${group.n}/${minSample})`;
  return `${group.eventualHitRate.toFixed(1)}%`;
};

/**
 * Renders a minutes value or em-dash when null.
 *
 * @param {number|null} value
 * @returns {string}
 */
const formatMinutes = (value) => (value === null ? 'N/A' : `${Math.round(value)} min`);

/**
 * A single small tile inside the direction or session grid.
 * Not a full KpiTile — this is a compact variant scoped to this section.
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {Object} props.group - Normalized group from normalizeLateResolverStats
 * @param {number} props.minSample
 * @returns {JSX.Element}
 */
const GroupTile = ({ label, group, minSample }) => {
  const insufficient = !group.hasSample;
  return (
    <Card className="card-one h-100">
      <Card.Body className="p-3">
        <div className="d-flex align-items-center justify-content-between mb-1">
          <span className="fs-xs text-secondary fw-medium">{label}</span>
          <span className="fs-xs text-secondary">n={group.n}</span>
        </div>
        <h3 className={`fs-20 mb-0 ${insufficient ? 'text-secondary' : ''}`}>
          {formatHitRate(group, minSample)}
        </h3>
        <span className="fs-xs text-secondary">
          {group.hits}/{group.n} eventually hit
        </span>
        {group.medianTimeMin !== null && (
          <div className="fs-xs text-secondary mt-1">
            median {formatMinutes(group.medianTimeMin)} to hit
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

/**
 * Info popover for the section header. Deliberately describes what the
 * backend actually computes rather than the more marketable "cross-session
 * resolution" story it superficially resembles. Enterprise audits will
 * cross-reference this copy against the underlying data — keep it truthful.
 *
 * @returns {JSX.Element}
 */
const MethodologyTooltip = ({ thresholdMin }) => (
  <OverlayTrigger
    trigger="click"
    rootClose
    placement="bottom-start"
    overlay={
      <Popover id="late-resolver-methodology" style={{ maxWidth: 380 }}>
        <Popover.Header as="h6" className="fs-sm">How this is computed</Popover.Header>
        <Popover.Body className="fs-xs">
          Late targets took longer than {' '}{thresholdMin ?? 5} minutes to
          first resolve or remain unresolved. This section shows the share
          that later reached their price and the time taken. Most late
          resolutions occur in the same session. Results below the minimum
          sample size are shown as low sample. See Retraction and Day Shape
          for retraction metrics.
        </Popover.Body>
      </Popover>
    }
  >
    <span
      className="fs-xs text-secondary fw-medium ms-2"
      style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
      tabIndex={0}
      role="button"
      aria-label="How this is computed"
    >
      <i className="ri-information-line"></i> methodology
    </span>
  </OverlayTrigger>
);

/**
 * Late Resolver Analysis section for the weekly page. Renders top-level
 * KPIs, a bullish vs bearish split, a direction × session grid, and a
 * collapsible audit table — all derived from the backend-written
 * `lateResolverStats` field on the weekly rawPayload document.
 *
 * The pool this section describes is targets that took longer than
 * `thresholdMin` minutes to first resolve, OR did not resolve at all.
 * Time and retraction stats therefore describe the behaviour of "slow"
 * hits (mostly same-session but delayed), not exclusively cross-session
 * resolutions. See MethodologyTooltip below for the auditable definition.
 *
 * Returns `null` when the field is absent so the parent page collapses the
 * section cleanly (e.g. for very old weeks or weeks with no data).
 *
 * @param {Object} props
 * @param {Object|null} props.weekly - Weekly rawPayload from Firebase
 * @param {string[]} [props.weekDates] - Mon–Fri ISO dates for the selected week
 * @returns {JSX.Element|null}
 */
const MissedResolutionSection = ({ weekly, weekDates = [] }) => {
  const stats = normalizeLateResolverStats(weekly?.lateResolverStats);
  if (!stats) return null;

  const weekStartDate = weekDates[0] ?? null;
  const weekEndDate = weekDates[weekDates.length - 1] ?? null;

  const all = stats.groups.all;
  const bullish = stats.groups.bullish;
  const bearish = stats.groups.bearish;

  return (
    <div>
      <div className="d-flex align-items-center mb-1">
        <h6 className="fs-sm fw-semibold text-secondary mb-0">
          Late Resolver Analysis
        </h6>
        <MethodologyTooltip thresholdMin={stats.thresholdMin} />
      </div>
      <div className="fs-xs text-secondary mb-3">
        Last {stats.windowSessions} trading session{stats.windowSessions === 1 ? '' : 's'} ·
        {' '}{stats.totalLate} late of {stats.totalTargets} total targets
        {' '}({stats.share !== null ? `${stats.share.toFixed(1)}%` : 'N/A'}) ·
        {' '}"late" = took &gt; {stats.thresholdMin ?? 5} min to first resolve or never resolved
      </div>

      {/* Overview KPI row */}
      <Row className="g-3 mb-3">
        <Col xs={12} md={4}>
          <KpiTile
            label="Eventual Hit Rate"
            value={formatHitRate(all, stats.minSample)}
            icon="ri-focus-3-line"
            color="info"
            tip="The percentage of late targets in the rolling window that later reached their price. Late means the target exceeded the configured time to first resolution or remains unresolved. Results below the minimum sample size are labeled low sample."
          />
        </Col>
        <Col xs={12} md={4}>
          <KpiTile
            label="Hits / Sample"
            value={`${all.hits}/${all.n}`}
            icon="ri-checkbox-circle-line"
            color="success"
            sub={`${all.neverResolved} still open`}
            tip="The counts used to calculate eventual hit rate. Still open is the number of late targets in the window that have not yet resolved."
          />
        </Col>
        <Col xs={12} md={4}>
          <KpiTile
            label="Median Time to Hit"
            value={formatMinutes(all.medianTimeMin)}
            icon="ri-time-line"
            color="primary"
            sub={all.p90TimeMin !== null ? `p90 ${formatMinutes(all.p90TimeMin)}` : null}
            tip="The median time from target creation to first resolution for late targets that were hit. Most results are resolved in the same session. Higher percentile values may include cross-session resolutions."
          />
        </Col>
      </Row>

      {/* Direction split */}
      <Row className="g-3 mb-3">
        <Col xs={12} md={6}>
          <GroupTile label="Bullish late targets" group={bullish} minSample={stats.minSample} />
        </Col>
        <Col xs={12} md={6}>
          <GroupTile label="Bearish late targets" group={bearish} minSample={stats.minSample} />
        </Col>
      </Row>

      {/* Session grid — bullish row, bearish row */}
      <Row className="g-2 mb-3">
        {['bullish', 'bearish'].map((direction) => (
          <React.Fragment key={direction}>
            {SESSION_ORDER.map((session) => {
              const key = `${direction}|${session}`;
              const group = stats.groups[key];
              if (!group) return null;
              return (
                <Col xs={6} md={4} lg={2} key={key}>
                  <GroupTile
                    label={`${direction === 'bullish' ? 'Bull' : 'Bear'} · ${SESSION_LABELS[session]}`}
                    group={group}
                    minSample={stats.minSample}
                  />
                </Col>
              );
            })}
          </React.Fragment>
        ))}
      </Row>

      {/* Low-sample footer note */}
      <div className="fs-xs text-secondary mb-3">
        Groups below n={stats.minSample} shown as low sample.
      </div>

      {/* Consolidated audit trail — group stats + per-target misses log */}
      <UnderlyingDataTable
        weekly={weekly}
        weekStartDate={weekStartDate}
        weekEndDate={weekEndDate}
      />
    </div>
  );
};

export default MissedResolutionSection;
