import React, { useMemo } from 'react';
import { Card, OverlayTrigger, Popover } from 'react-bootstrap';
import moment from 'moment-timezone';
import { useUnreachedTargetsWindow } from '../hooks/useUnreachedTargetsWindow';
import {
  filterStaleLevelsInRange,
  STALE_LEVELS_PROXIMITY_POINTS,
  STALE_LEVELS_WINDOW_SESSIONS,
} from '../utils/staleLevels';
import { EST_TIMEZONE } from '../utils/sonaStatsConstants';

/**
 * Format a target price to a compact string (no trailing zeros beyond .00).
 *
 * @param {number} price
 * @returns {string}
 */
const formatPrice = (price) => price.toFixed(2);

/**
 * Format the age of a stale target given its origin date.
 * "yesterday" for 1 session back, "N days ago" otherwise.
 *
 * @param {string} originDateIso - YYYY-MM-DD
 * @returns {string}
 */
const formatAge = (originDateIso) => {
  const now = moment().tz(EST_TIMEZONE).startOf('day');
  const then = moment.tz(originDateIso, EST_TIMEZONE).startOf('day');
  const days = now.diff(then, 'days');
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
};

/**
 * Info popover explaining what the panel surfaces.
 *
 * @returns {JSX.Element}
 */
const MethodologyTooltip = () => (
  <OverlayTrigger
    trigger="click"
    rootClose
    placement="bottom-start"
    overlay={
      <Popover id="stale-levels-methodology" style={{ maxWidth: 360 }}>
        <Popover.Header as="h6" className="fs-sm">
          Stale Levels In Range
        </Popover.Header>
        <Popover.Body className="fs-xs">
          Unresolved target levels from the last {STALE_LEVELS_WINDOW_SESSIONS}
          {' '}trading sessions that sit within {STALE_LEVELS_PROXIMITY_POINTS}
          {' '}points of the current price and are approaching from the
          direction the target expects. This is a discovery aid — not a signal.
          Historical hit rates for late targets are shown on the weekly page.
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
      <i className="ri-information-line"></i> what is this?
    </span>
  </OverlayTrigger>
);

/**
 * Renders a single stale-level row.
 *
 * @param {Object} props
 * @param {Object} props.item - Decorated target from filterStaleLevelsInRange
 * @param {number} props.currentPrice
 * @returns {JSX.Element}
 */
const StaleLevelRow = ({ item, currentPrice }) => {
  const isBull = item.direction === 'bullish';
  const arrowIcon = isBull ? 'ri-arrow-up-line' : 'ri-arrow-down-line';
  const colorClass = isBull ? 'text-success' : 'text-danger';
  const above = item.targetPriceNum > currentPrice;
  const relation = above ? 'above' : 'below';

  return (
    <div className="d-flex align-items-center justify-content-between py-2 border-bottom border-opacity-25">
      <div className="d-flex align-items-center gap-2">
        <i className={`${arrowIcon} ${colorClass} fs-18`} aria-hidden="true"></i>
        <div>
          <div className="fs-sm fw-medium">{formatPrice(item.targetPriceNum)}</div>
          <div className="fs-xs text-secondary">
            {isBull ? 'Bull' : 'Bear'} target · {formatAge(item.originDate)}
          </div>
        </div>
      </div>
      <div className="text-end">
        <div className="fs-sm">
          {item.distancePoints.toFixed(1)} pts {relation}
        </div>
        <div className="fs-xs text-secondary">
          approaching
        </div>
      </div>
    </div>
  );
};

/**
 * Live-page "Stale Levels In Range" panel. Surfaces unresolved historical
 * targets sitting within proximity of the current price. Secondary visual
 * weight — this is a discovery aid, not a primary signal.
 *
 * Data flow:
 *   useUnreachedTargetsWindow → unreached pool (prior N sessions)
 *   filterStaleLevelsInRange  → in-proximity + directional gate applied
 *
 * Returns `null` (renders nothing) when disabled by feature flag or when the
 * caller supplies no current price.
 *
 * @param {Object} props
 * @param {number|null} props.currentPrice - Current NQ price (from live targets)
 * @param {boolean} [props.enabled=false] - Feature flag gate
 * @returns {JSX.Element|null}
 */
const StaleLevelsPanel = ({ currentPrice, enabled = false }) => {
  const { targets, loading, error } = useUnreachedTargetsWindow();

  const inRange = useMemo(
    () => filterStaleLevelsInRange(targets, currentPrice),
    [targets, currentPrice]
  );

  if (!enabled) return null;

  return (
    <Card className="card-one">
      <Card.Body className="p-3">
        <div className="d-flex align-items-center mb-2">
          <h6 className="fs-sm fw-semibold text-secondary mb-0">
            Stale Levels In Range
          </h6>
          <MethodologyTooltip />
        </div>

        {loading && (
          <div className="fs-xs text-secondary py-2">Loading recent unresolved levels…</div>
        )}

        {!loading && error && (
          <div className="fs-xs text-secondary py-2">
            <i className="ri-information-line me-1"></i>
            {error}
          </div>
        )}

        {!loading && !error && currentPrice === null && (
          <div className="fs-xs text-secondary py-2">
            Waiting for live price data — no targets generated yet today.
          </div>
        )}

        {!loading && !error && currentPrice !== null && inRange.length === 0 && (
          <div className="fs-xs text-secondary py-2">
            No unresolved targets from the last {STALE_LEVELS_WINDOW_SESSIONS}
            {' '}sessions are within {STALE_LEVELS_PROXIMITY_POINTS} pts of
            {' '}{formatPrice(Number(currentPrice))}.
          </div>
        )}

        {!loading && !error && inRange.length > 0 && (
          <>
            <div className="fs-xs text-secondary mb-2">
              Current: {formatPrice(Number(currentPrice))} ·
              {' '}{inRange.length} level{inRange.length === 1 ? '' : 's'} within
              {' '}{STALE_LEVELS_PROXIMITY_POINTS} pts
            </div>
            <div>
              {inRange.map((item) => (
                <StaleLevelRow
                  key={`${item.originDate}-${item.alertId}`}
                  item={item}
                  currentPrice={Number(currentPrice)}
                />
              ))}
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default StaleLevelsPanel;
