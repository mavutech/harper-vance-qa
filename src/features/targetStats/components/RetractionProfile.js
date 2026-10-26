import React from 'react';
import { Card, Col, OverlayTrigger, Row, Tooltip } from 'react-bootstrap';

const BAND_COLOR = '#506fd9';
const MAX_COLOR = '#0cb785';

/**
 * Renders the retraction profile for the day's hits: a visual zone strip
 * (p25–p75 band with the median marked) on a 0→max scale, plus the stat row.
 * Retraction = how far price walked away from the target before reversing
 * back to hit it — the entry zone, stated as a zone.
 *
 * The band requires 5+ hits to be defensible; below that only the stat row
 * renders. Hidden entirely when no hits carry retraction data.
 *
 * @param {Object} props
 * @param {{ band: Object|null, median: number|null, max: number|null, count: number }|null} props.retractionStats
 * @param {Object} [props.trailing] - data.trailingStats — used for the 20-session baseline footer
 * @returns {JSX.Element|null}
 */
const RetractionProfile = ({ retractionStats, trailing }) => {
  if (!retractionStats || !retractionStats.count) return null;

  const { band, median, max, count } = retractionStats;
  const showBand = Boolean(band) && count >= 5 && Number.isFinite(max) && max > 0;

  // 20-session baseline footer — "compared to what?" for today's profile.
  // Includes mean and p90 so deep-outlier days don't hide behind the median.
  const pooled = trailing?.pooled ?? null;
  const baselineParts = pooled ? [
    pooled.medianRetraction !== null && pooled.medianRetraction !== undefined
      ? `median ${pooled.medianRetraction} pts` : null,
    pooled.meanRetraction !== null && pooled.meanRetraction !== undefined
      ? `mean ${pooled.meanRetraction} pts` : null,
    pooled.p90Retraction !== null && pooled.p90Retraction !== undefined
      ? `p90 ${pooled.p90Retraction} pts` : null,
    pooled.maxRetraction !== null && pooled.maxRetraction !== undefined
      ? `max ${pooled.maxRetraction} pts` : null,
  ].filter(Boolean) : [];
  const baselineLine = trailing && baselineParts.length
    ? `${trailing.sessions}-session typical: ${baselineParts.join(' · ')}`
    : null;

  // Positions as % of the 0→max scale
  const pct = (v) => Math.min(100, Math.max(0, (v / max) * 100));

  return (
    <Card className="card-one mb-4 h-100">
      <Card.Header className="d-flex align-items-center gap-2">
        <Card.Title as="h6" className="mb-0">Retraction Profile</Card.Title>
        <span className="fs-xs text-secondary">n={count}</span>
      </Card.Header>
      <Card.Body>
        {showBand ? (
          <div className="mb-4">
            <div className="position-relative rounded-pill bg-secondary bg-opacity-10" style={{ height: 14 }}>
              {/* p25–p75 zone */}
              <div
                className="position-absolute rounded-pill"
                style={{
                  left: `${pct(band.p25)}%`,
                  width: `${Math.max(pct(band.p75) - pct(band.p25), 1)}%`,
                  top: 0,
                  bottom: 0,
                  backgroundColor: BAND_COLOR,
                  opacity: 0.55,
                }}
              ></div>
              {/* median marker */}
              <div
                className="position-absolute"
                style={{
                  left: `${pct(band.median)}%`,
                  top: -3,
                  bottom: -3,
                  width: 3,
                  marginLeft: -1.5,
                  borderRadius: 2,
                  backgroundColor: '#fff',
                }}
              ></div>
              {/* max ride marker */}
              <div
                className="position-absolute"
                style={{
                  left: `${pct(max)}%`,
                  top: -3,
                  bottom: -3,
                  width: 3,
                  marginLeft: -3,
                  borderRadius: 2,
                  backgroundColor: MAX_COLOR,
                }}
              ></div>
            </div>
            <div className="d-flex justify-content-between fs-xs text-secondary mt-2">
              <span>0</span>
              <span>{max} pts</span>
            </div>
            <p className="fs-xs text-secondary mb-0 mt-2">
              Half of today&apos;s hits retraced between <strong>{band.p25}</strong> and{' '}
              <strong>{band.p75} pts</strong> before reversing to the target. This is the typical entry zone.
              The deepest ride that still resolved: <strong style={{ color: MAX_COLOR }}>{max} pts</strong>.
            </p>
          </div>
        ) : (
          <p className="fs-xs text-secondary">
            Zone view needs 5+ hits with retraction data (n={count}).
          </p>
        )}

        <Row className="g-2 border-top pt-3">
          {[
            { label: 'p25', value: band ? `${band.p25}` : '—', tip: 'Twenty-five percent of measured resolved targets retraced by this amount or less before resolution.' },
            { label: 'Median', value: median !== null && median !== undefined ? `${median}` : '—', tip: 'Half of measured resolved targets retraced less than this value, and half retraced more.' },
            { label: 'p75', value: band ? `${band.p75}` : '—', tip: 'Seventy-five percent of measured resolved targets retraced by this amount or less.' },
            { label: 'Max ride', value: max !== null && max !== undefined ? `${max}` : '—', tip: 'The largest measured retraction among targets that resolved on the selected day.' },
          ].map(({ label, value, tip }) => (
            <Col xs="3" key={label}>
              <h6 className="card-value fs-16 mb-0 text-start">{value}</h6>
              <OverlayTrigger
                trigger="click"
                rootClose
                placement="top"
                overlay={<Tooltip id={`retraction-tip-${label}`}>{tip}</Tooltip>}
              >
                <span className="fs-xs text-secondary d-block text-start" style={{ cursor: 'pointer', textDecoration: 'underline dotted' }} tabIndex={0}>{label}</span>
              </OverlayTrigger>
            </Col>
          ))}
        </Row>

        {baselineLine && (
          <p className="fs-xs text-secondary mb-0 mt-3 pt-2 border-top">{baselineLine}</p>
        )}
      </Card.Body>
    </Card>
  );
};

export default RetractionProfile;
