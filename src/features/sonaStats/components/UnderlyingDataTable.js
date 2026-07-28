import React, { useState } from 'react';
import { Badge, Card, OverlayTrigger, Popover, Table } from 'react-bootstrap';
import moment from 'moment-timezone';
import { normalizeLateResolverStats } from '../utils/normalizeLateResolverStats';
import { useMissedTargetsResolution } from '../hooks/useMissedTargetsResolution';
import { useMissedTargetsSnapshot } from '../hooks/useMissedTargetsSnapshot';
import { EST_TIMEZONE } from '../utils/sonaStatsConstants';

const TIP = 'Both views reconcile targets left unresolved at their session close against the last 20 sessions of 5-minute candle history to detect eventual fills. "Missed target resolution" partitions strictly by the selected week (in-week origins with their eventual status, and prior-origin misses that filled during the selected week). "Missed targets snapshot" is a point-in-time view: every miss in the 20-session window plus its status as of the end of the selected week (filled by then, or still open at that point). Fills are detected when a later bar\'s high (bullish) or low (bearish) touches the target price.';

/**
 * Format an EST wall-clock date+time from a unix seconds epoch. Returns an
 * em-dash for non-finite input so table cells stay non-empty.
 *
 * @param {number|null|undefined} epoch - Unix seconds
 * @returns {string}
 */
const formatEstDateTime = (epoch) => {
  if (!Number.isFinite(epoch)) return '—';
  return moment.unix(epoch).tz(EST_TIMEZONE).format('MMM D · HH:mm');
};

/**
 * Format a raw target price to a stable, comma-free 2-decimal string.
 *
 * @param {number|null} price
 * @returns {string}
 */
const formatTargetPrice = (price) => {
  if (!Number.isFinite(price)) return '—';
  return price.toFixed(2);
};

/**
 * Format a minute count as a compact wall-clock string. Any negative or
 * non-finite value falls back to '—' so table cells never render blank.
 *
 * @param {number} minutes
 * @returns {string}
 *
 * @example
 * formatDurationMinutes(42);    // '42m'
 * formatDurationMinutes(125);   // '2h 5m'
 * formatDurationMinutes(4045);  // '2d 19h'
 */
const formatDurationMinutes = (minutes) => {
  if (!Number.isFinite(minutes) || minutes < 0) return '—';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 24 * 60) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes - h * 60);
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }
  const d = Math.floor(minutes / (24 * 60));
  const h = Math.floor((minutes - d * 24 * 60) / 60);
  return h === 0 ? `${d}d` : `${d}d ${h}h`;
};

/**
 * Human-readable resolution latency for the Time to Resolve column. Uses the
 * day-based wall-clock formatter (`Nd Hh` past a day, `Nh Mm` past an hour,
 * `Nm` otherwise) so cross-day fills read as calendar time rather than
 * trading-session count.
 *
 * @param {Object} row - Reconciled target with `resolved: true`
 * @returns {string}
 */
const formatTimeToResolve = (row) => {
  const minutes = row.minutesToResolve ?? null;
  if (minutes === null) return '—';
  return formatDurationMinutes(minutes);
};

/**
 * Direction label shared by both sub-tables.
 *
 * @param {Object} row - Reconciled target with `direction`
 * @returns {JSX.Element}
 */
const DirectionBadge = ({ direction }) => (
  <Badge
    bg={direction === 'bullish' ? 'success' : 'danger'}
    className="bg-opacity-25 text-body fw-medium"
  >
    {direction === 'bullish' ? 'Bull' : 'Bear'}
  </Badge>
);

/**
 * Rough classifier used only for display grouping (matches how
 * filterLateTargets labels session). Any target whose origin timestamp isn't
 * parseable falls back to em-dash.
 *
 * @param {string|number|null|undefined} epochLike
 * @returns {string}
 */
const sessionLabelForEpoch = (epochLike) => {
  const epoch = typeof epochLike === 'number' ? epochLike : parseInt(epochLike, 10);
  if (!Number.isFinite(epoch)) return '—';
  const m = moment.unix(epoch).tz(EST_TIMEZONE);
  const totalMins = m.hour() * 60 + m.minute();
  if (totalMins < 11 * 60 + 30) return 'Morning';
  if (totalMins < 14 * 60) return 'Midday';
  return 'Afternoon';
};

/**
 * Consolidated missed-target resolution view. Loads the last 20 sessions of
 * unreached targets, reconciles them against later candle series, and
 * partitions the result into a "Missed this week" panel and a
 * "Resolved this week (prior origins)" panel.
 *
 * @param {Object} props
 * @param {string|null} props.weekStartDate - Selected week's Monday (YYYY-MM-DD)
 * @param {string|null} props.weekEndDate   - Selected week's Friday (YYYY-MM-DD)
 * @param {number} props.windowSessions - Backward lookback session count
 * @returns {JSX.Element}
 */
const MissedResolutionTables = ({ weekStartDate, weekEndDate, windowSessions }) => {
  const { missedThisWeek, resolvedThisWeek, loading, error } = useMissedTargetsResolution(
    weekStartDate,
    weekEndDate,
    windowSessions
  );

  if (loading) {
    return (
      <div className="fs-xs text-secondary px-3 py-3">Loading missed target resolution…</div>
    );
  }

  if (error) {
    return (
      <div className="fs-xs text-secondary px-3 py-3">
        <i className="ri-information-line me-1"></i>{error}
      </div>
    );
  }

  const missedResolvedCount = missedThisWeek.filter((r) => r.resolved).length;
  const missedTotal = missedThisWeek.length;
  const fillRatePct = missedTotal > 0 ? (missedResolvedCount / missedTotal) * 100 : null;
  const fillRateLabel = fillRatePct === null ? '—' : `${fillRatePct.toFixed(1)}%`;

  return (
    <>
      <div className="row g-2 mb-3">
        <div className="col-6 col-md-3">
          <div className="border rounded p-2 h-100">
            <span className="d-block fs-xs text-secondary">Missed this week</span>
            <strong className="fs-18">{missedTotal}</strong>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="border rounded p-2 h-100">
            <span className="d-block fs-xs text-secondary">Resolved this week (prior origins)</span>
            <strong className="fs-18">{resolvedThisWeek.length}</strong>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="border rounded p-2 h-100">
            <span className="d-block fs-xs text-secondary">Fill rate (this week)</span>
            <strong className="fs-sm text-success">{fillRateLabel}</strong>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="border rounded p-2 h-100">
            <span className="d-block fs-xs text-secondary">Week ending</span>
            <strong className="fs-sm">{weekEndDate ?? '—'}</strong>
          </div>
        </div>
      </div>

      <h6 className="fs-sm fw-semibold text-secondary mb-2">Missed this week</h6>
      <ReconciledMissesTable
        rows={missedThisWeek}
        emptyCopy="No targets originated in the selected week were unresolved at close."
      />

      <h6 className="fs-sm fw-semibold text-secondary mt-4 mb-2">
        Resolved this week (prior origins)
      </h6>
      <ReconciledMissesTable
        rows={resolvedThisWeek}
        emptyCopy="No prior-origin misses resolved during the selected week."
      />
    </>
  );
};

/**
 * Compact status badge for a reconciled miss row. Green for "Filled",
 * secondary for "Open".
 *
 * @param {Object} props
 * @param {boolean} props.filled
 * @returns {JSX.Element}
 */
const MissStatusBadge = ({ filled }) => (
  <Badge
    bg={filled ? 'success' : 'secondary'}
    className="bg-opacity-25 text-body fw-medium"
  >
    {filled ? 'Filled' : 'Open'}
  </Badge>
);

/**
 * Shared reconciled-misses table. Used by both halves of the Snapshot view
 * and by both panels of the Missed Target Resolution view so the row shape
 * stays identical across the card. Filled rows show fill timestamp +
 * time-to-resolve; open rows show em-dashes in those slots.
 *
 * @param {Object} props
 * @param {Object[]} props.rows - Reconciled targets
 * @param {string} props.emptyCopy - Message when rows is empty
 * @returns {JSX.Element}
 */
const ReconciledMissesTable = ({ rows, emptyCopy }) => {
  if (rows.length === 0) {
    return <div className="fs-xs text-secondary py-2">{emptyCopy}</div>;
  }
  return (
    <Table responsive borderless className="fs-sm align-middle mb-0">
      <thead>
        <tr className="text-secondary fs-xs text-uppercase">
          <th>Origin date</th>
          <th>Session</th>
          <th>Dir</th>
          <th className="text-center">Target</th>
          <th>Status</th>
          <th>Fill date/time (ET)</th>
          <th>Time to resolve</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.originDate}-${row.alertId}`}>
            <td>{row.originDate}</td>
            <td>{sessionLabelForEpoch(row.dateTimestamp)}</td>
            <td><DirectionBadge direction={row.direction} /></td>
            <td className="text-center">{formatTargetPrice(row.targetPriceNum)}</td>
            <td><MissStatusBadge filled={row.resolved === true} /></td>
            <td>
              {row.resolved ? (
                <>
                  {formatEstDateTime(row.resolvedAtEpoch)}
                  {row.resolvedPreMarket && (
                    <span className="text-secondary fs-xs"> · pre-mkt fill</span>
                  )}
                </>
              ) : (
                <span className="text-secondary">—</span>
              )}
            </td>
            <td>
              {row.resolved
                ? formatTimeToResolve(row)
                : <span className="text-secondary">—</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

/**
 * Point-in-time missed-targets view. Loads the last 20 sessions of unreached
 * targets ending at the selected week's Friday and reconciles each against
 * that same window, capped at the anchor date so a fill happening after the
 * week doesn't leak into the historical snapshot.
 *
 * @param {Object} props
 * @param {string|null} props.weekEndDate
 * @param {number} props.windowSessions
 * @returns {JSX.Element}
 */
const MissedTargetsSnapshotView = ({ weekEndDate, windowSessions }) => {
  const {
    filledByEndOfWeek,
    openAtEndOfWeek,
    loading,
    error,
    asOfDate,
  } = useMissedTargetsSnapshot(weekEndDate, windowSessions);

  if (loading) {
    return (
      <div className="fs-xs text-secondary px-3 py-3">Loading missed targets snapshot…</div>
    );
  }

  if (error) {
    return (
      <div className="fs-xs text-secondary px-3 py-3">
        <i className="ri-information-line me-1"></i>{error}
      </div>
    );
  }

  const total = filledByEndOfWeek.length + openAtEndOfWeek.length;
  const fillRatePct = total > 0 ? (filledByEndOfWeek.length / total) * 100 : null;
  const fillRateLabel = fillRatePct === null ? '—' : `${fillRatePct.toFixed(1)}%`;

  return (
    <>
      <div className="row g-2 mb-3">
        <div className="col-6 col-md-3">
          <div className="border rounded p-2 h-100">
            <span className="d-block fs-xs text-secondary">Misses in window</span>
            <strong className="fs-18">{total}</strong>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="border rounded p-2 h-100">
            <span className="d-block fs-xs text-secondary">Filled by end of week</span>
            <strong className="fs-sm text-success">{filledByEndOfWeek.length}</strong>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="border rounded p-2 h-100">
            <span className="d-block fs-xs text-secondary">Fill rate ({windowSessions} sessions)</span>
            <strong className="fs-sm text-success">{fillRateLabel}</strong>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="border rounded p-2 h-100">
            <span className="d-block fs-xs text-secondary">As of</span>
            <strong className="fs-sm">{asOfDate ?? '—'}</strong>
          </div>
        </div>
      </div>

      <h6 className="fs-sm fw-semibold text-secondary mb-2">Filled by end of week</h6>
      <ReconciledMissesTable
        rows={filledByEndOfWeek}
        emptyCopy="No misses in the review window resolved by the end of the selected week."
      />

      <h6 className="fs-sm fw-semibold text-secondary mt-4 mb-2">Still open by end of week</h6>
      <ReconciledMissesTable
        rows={openAtEndOfWeek}
        emptyCopy="Every miss in the review window resolved by the end of the selected week."
      />
      <div className="fs-xs text-secondary mt-3">
        Fills reconstructed from 5-minute candle history in the review window. A
        {' '}<em>pre-mkt fill</em> means the touching bar was the first bar of
        that day’s data (09:25 ET) — the pre-market/opening auction bar —
        so the target price was reached before the regular session started.
      </div>
    </>
  );
};

/**
 * Consolidated missed-target resolution and delayed-resolution detail card.
 * Toggles between the group-level aggregate receipt ("Delayed resolution
 * analysis") and the per-target reconciliation view ("Missed target
 * resolution"). Styled like the house log tables (WeeklyDailyLog,
 * TargetResolutionTable) so it feels native to the rest of the page.
 *
 * The reconciliation view is lazy-loaded: its hook only fetches when the
 * user switches to that tab.
 *
 * @param {Object} props
 * @param {Object|null} props.weekly - Weekly rawPayload from Firebase
 * @param {string|null} [props.weekStartDate] - Selected week's Monday (YYYY-MM-DD)
 * @param {string|null} [props.weekEndDate]   - Selected week's Friday (YYYY-MM-DD)
 * @returns {JSX.Element|null}
 */
const UnderlyingDataTable = ({ weekly, weekStartDate = null, weekEndDate = null }) => {
  const [view, setView] = useState('resolution');
  const stats = normalizeLateResolverStats(weekly?.lateResolverStats);
  if (!stats) return null;

  const scopeSubtitle = view === 'snapshot'
    ? `last ${stats.windowSessions} trading sessions · status as of selected week end`
    : `focused on the selected week · prior origins from the last ${stats.windowSessions} sessions`;

  const cardTitle = view === 'resolution'
    ? 'Missed Target Resolution'
    : 'Missed Targets Snapshot';

  return (
    <Card className="card-one mb-4">
      <Card.Header>
        <Card.Title as="h6">{cardTitle}</Card.Title>
        <span className="fs-xs text-secondary ms-2">{scopeSubtitle}</span>
        <OverlayTrigger
          trigger="click"
          rootClose
          placement="top"
          overlay={
            <Popover id="late-resolution-detail-tip" style={{ maxWidth: 360 }}>
              <Popover.Header as="h6" className="fs-sm">{cardTitle}</Popover.Header>
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
        <div className="btn-group btn-group-sm ms-auto" role="group" aria-label="Missed targets detail view">
          <button
            type="button"
            className={`btn ${view === 'snapshot' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setView('snapshot')}
          >
            Missed targets snapshot
          </button>
          <button
            type="button"
            className={`btn ${view === 'resolution' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setView('resolution')}
          >
            Missed target resolution
          </button>
        </div>
      </Card.Header>
      <Card.Body>
        <p className="fs-xs text-secondary mb-3">
          {view === 'snapshot'
            ? 'Point-in-time snapshot of every miss in the review window. Rows are labeled with their status as of the end of the selected week — filled by then (with when) or still open at that point. Fills happening after the selected week do not appear here; that\'s covered by "Missed target resolution".'
            : 'Per-target reconciliation of misses within the review window against subsequent candle history. "Missed this week" origins can still be open; "Resolved this week" lists prior-origin misses that filled during the selected week.'}
        </p>
        {view === 'snapshot' ? (
          <MissedTargetsSnapshotView
            weekEndDate={weekEndDate}
            windowSessions={stats.windowSessions}
          />
        ) : (
          <MissedResolutionTables
            weekStartDate={weekStartDate}
            weekEndDate={weekEndDate}
            windowSessions={stats.windowSessions}
          />
        )}
      </Card.Body>
    </Card>
  );
};

export default UnderlyingDataTable;
