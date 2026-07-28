import React from 'react';
import { Card, OverlayTrigger, Popover } from 'react-bootstrap';

const TONE_CLASS = { positive: 'success', negative: 'danger', neutral: 'secondary' };
const ARROW = { up: 'ri-arrow-up-line', down: 'ri-arrow-down-line' };

/**
 * Single KPI tile: icon, value, an optional comparison line (e.g. vs last
 * week / the recent baseline), optional secondary caption(s), and a label that
 * (when a tip is supplied) reveals a plain-language explainer popover on
 * click/tap. Shared by the daily and weekly SONA stat pages.
 *
 * @param {Object} props
 * @param {string} props.label - Tile label (also the popover header)
 * @param {string|number} props.value - Headline value
 * @param {{ text: string, direction?: 'up'|'down', tone?: 'positive'|'negative'|'neutral' }} [props.comparison]
 *   - Comparison line under the value. Colored by `tone` (positive=green,
 *     negative=red, neutral=grey); `direction` adds an up/down arrow.
 * @param {string|string[]} [props.sub] - Secondary caption line(s)
 * @param {string} [props.tip] - Plain-language explainer; omit for no popover
 * @param {string} props.icon - Remix icon class (e.g. 'ri-percent-line')
 * @param {string} [props.color='secondary'] - Bootstrap theme color
 * @returns {JSX.Element}
 */
const KpiTile = ({ label, value, comparison, sub, tip, icon, color = 'secondary' }) => {
  const subLines = sub ? (Array.isArray(sub) ? sub : [sub]).filter(Boolean) : [];
  const toneClass = TONE_CLASS[comparison?.tone] || 'secondary';

  return (
    <Card className="card-one">
      <Card.Body className="d-flex align-items-center gap-3 p-3">
        <div
          className={`d-flex align-items-center justify-content-center rounded-circle bg-${color} bg-opacity-25`}
          style={{ width: 48, height: 48, flexShrink: 0 }}
        >
          <i className={`${icon} fs-22 text-${color}`}></i>
        </div>
        <div>
          <h2 className="card-value mb-0 fs-22 lh-1">{value}</h2>
          {comparison?.text && (
            <span className="fs-xs fw-medium d-block text-secondary">
              {comparison.direction && ARROW[comparison.direction] && (
                <i className={`${ARROW[comparison.direction]} me-1 text-${toneClass}`}></i>
              )}
              {comparison.text}
            </span>
          )}
          {subLines.map((line) => (
            <span key={line} className="fs-xs text-secondary d-block">{line}</span>
          ))}
          {tip ? (
            <OverlayTrigger
              trigger="click"
              rootClose
              placement="top"
              overlay={
                <Popover id={`kpi-tip-${label}`}>
                  <Popover.Header as="h6" className="fs-sm">{label}</Popover.Header>
                  <Popover.Body className="fs-xs">{tip}</Popover.Body>
                </Popover>
              }
            >
              <span
                className="fs-xs text-secondary fw-medium"
                style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
                tabIndex={0}
              >
                {label} <i className="ri-information-line"></i>
              </span>
            </OverlayTrigger>
          ) : (
            <span className="fs-xs text-secondary fw-medium">{label}</span>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default KpiTile;
