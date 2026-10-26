import React from 'react';
import { Card } from 'react-bootstrap';

/**
 * Renders the distance-vs-hit-rate breakdown: how resolution rate varies with
 * how far the target sat from price at generation. Horizontal bars per bucket;
 * misses visibly truncate the bar. This is the prototype of the probability
 * score — "is there a distance beyond which targets stop being trustworthy?"
 *
 * @param {Object} props
 * @param {{ avgDistance: string, medianDistance: string, buckets: Array<{ range: string, created: number, hit: number, hitRate: string|null }> }|null} props.distanceVsHitRate
 * @returns {JSX.Element|null}
 */
const DistanceVsHitRate = ({ distanceVsHitRate }) => {
  if (!distanceVsHitRate || !Array.isArray(distanceVsHitRate.buckets) || distanceVsHitRate.buckets.length === 0) {
    return null;
  }

  // Skip empty buckets — "0/0 (N/A)" rows read as missing data, not absence of targets
  const buckets = distanceVsHitRate.buckets.filter((b) => b.created > 0);
  if (buckets.length === 0) return null;
  const { avgDistance, medianDistance } = distanceVsHitRate;

  return (
    <Card className="card-one mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <Card.Title as="h6">Target Distance vs Hit Rate</Card.Title>
        <span className="fs-xs text-secondary">
          Avg distance: {avgDistance} · Median: {medianDistance} · n={buckets.reduce((sum, b) => sum + b.created, 0)}
        </span>
      </Card.Header>
      <Card.Body>
        {buckets.map((bucket) => {
          const pct = bucket.created > 0 ? (bucket.hit / bucket.created) * 100 : 0;
          const barColor = pct >= 70 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-danger';

          return (
            <div key={bucket.range} className="d-flex align-items-center gap-3 mb-2">
              <span className="fs-sm fw-medium text-end" style={{ width: 80, flexShrink: 0 }}>
                {bucket.range}
              </span>
              <div className="flex-grow-1 rounded-pill bg-secondary bg-opacity-10" style={{ height: 14 }}>
                <div
                  className={`rounded-pill h-100 ${barColor}`}
                  style={{ width: `${pct}%`, minWidth: pct > 0 ? 8 : 0, transition: 'width .3s' }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                ></div>
              </div>
              <span className="fs-sm text-secondary text-nowrap" style={{ width: 90, flexShrink: 0 }}>
                {bucket.hit}/{bucket.created} ({bucket.hitRate ?? '—'})
              </span>
            </div>
          );
        })}
        <p className="fs-xs text-secondary mb-0 mt-3">
          Distance is measured from the alert candle close to the target price at generation.
        </p>
      </Card.Body>
    </Card>
  );
};

export default DistanceVsHitRate;
