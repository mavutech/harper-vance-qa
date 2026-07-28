import React from 'react';
import { Offcanvas } from 'react-bootstrap';

/**
 * Off-canvas drawer that defines the statistics vocabulary used across the
 * Daily Performance page. One place, intentionally non-blocking — opens from
 * the page header link and slides over the right edge without pushing any
 * tile around. Intended to grow over time (direction × session, fallback
 * levels, etc.) without crowding the page itself.
 *
 * @param {Object} props
 * @param {boolean} props.show
 * @param {() => void} props.onHide
 * @returns {JSX.Element}
 */
const StatsPrimerDrawer = ({ show, onHide }) => (
  <Offcanvas show={show} onHide={onHide} placement="end" scroll backdrop>
    <Offcanvas.Header closeButton>
      <Offcanvas.Title as="h6" className="mb-0">Metric definitions</Offcanvas.Title>
    </Offcanvas.Header>
    <Offcanvas.Body className="fs-sm">
      <p className="text-secondary fs-xs mb-3">
        Definitions for the measures used on this page.
      </p>

      <div className="mb-3">
        <div className="fw-semibold">Median</div>
        <div className="text-secondary">
          The middle observed value. Half of targets resolved faster or retraced less;
          half resolved slower or retraced more.
        </div>
        <div className="text-secondary fs-xs mt-1">
          <em>Example:</em> a median of 8 minutes means half of observed targets resolved within 8 minutes.
        </div>
      </div>

      <div className="mb-3">
        <div className="fw-semibold">Mean</div>
        <div className="text-secondary">
          The arithmetic average across all observations, including delayed resolutions and deep retractions.
          It may exceed the median.
        </div>
        <div className="text-secondary fs-xs mt-1">
          <em>Example:</em> a median of 8 minutes and mean of 22 minutes indicates that a smaller
          number of longer resolutions increased the average.
        </div>
      </div>

      <div className="mb-3">
        <div className="fw-semibold">p90</div>
        <div className="text-secondary">
          The 90th percentile. Ninety percent of observations resolved faster or retraced less
          than this value.
        </div>
        <div className="text-secondary fs-xs mt-1">
          <em>Example:</em> a p90 of 38 minutes means approximately 10% of observed targets required
          38 minutes or longer to resolve.
        </div>
      </div>

      <div className="mb-3">
        <div className="fw-semibold">Max</div>
        <div className="text-secondary">
          The highest observed value in the 20-session window. It represents an extreme,
          not a typical result.
        </div>
      </div>

      <hr className="my-3" />

      <div className="mb-3">
        <div className="fw-semibold">20-session window</div>
        <div className="text-secondary">
          Rolling comparison values use the prior 20 trading sessions and are refreshed nightly.
          The selected day is excluded from its own comparison.
        </div>
      </div>

      <div className="mb-3">
        <div className="fw-semibold">Late cohort <span className="text-secondary fw-normal">(&gt;5 min)</span></div>
        <div className="text-secondary">
          A comparison group limited to targets unresolved after five minutes. Eventual hit rate
          shows the proportion of those targets that later reached the target price.
        </div>
      </div>

      <div className="mb-1">
        <div className="fw-semibold">Direction × session</div>
        <div className="text-secondary">
          Where sufficient data exists, comparison values are segmented by direction and session.
          When a segment has insufficient observations, a broader comparison group is used.
        </div>
      </div>
    </Offcanvas.Body>
  </Offcanvas>
);

export default StatsPrimerDrawer;
