import React, { useCallback, useEffect, useState } from 'react';
import { Col, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Header from '../../../layouts/Header';
import Footer from '../../../layouts/Footer';
import { useTodaysTargets } from '../hooks/useTodaysTargets';
import { useDayContextSummary } from '../hooks/useDayContextSummary';
import { updatePageSEO } from '../../../config/seoConfig';
import TargetSessionKpis from '../components/TargetSessionKpis';
import OpenTargetsPanel from '../components/OpenTargetsPanel';
import TargetLiveTable from '../components/TargetLiveTable';
import StaleLevelsPanel from '../components/StaleLevelsPanel';

const currentSkin = localStorage.getItem('skin-mode') ? 'dark' : '';

// Feature flag — panel is off by default until we've validated signal quality
// against real session data. Enable per-environment via .env.
const STALE_LEVELS_PANEL_ENABLED = process.env.REACT_APP_ENABLE_STALE_LEVELS_PANEL === 'true';

/**
 * Today's live SONA targets page.
 * Displays a real-time feed of today's NQ 5m targets as they are generated
 * and resolved during the trading session. No date picker — always today.
 *
 * Updates automatically via Firebase onValue subscription managed by
 * useTodaysTargets. No data logic lives in this component.
 *
 * Route: /dashboard/sona-targets
 *
 * @returns {JSX.Element}
 */
export default function SonaTargets() {
  // ── Hooks ────────────────────────────────────────────────────────────────────
  const [skin, setSkin] = useState(currentSkin);
  const { targets, isSessionLive, loading, error } = useTodaysTargets();
  const daySummary = useDayContextSummary();

  // ── Derived values ───────────────────────────────────────────────────────────
  const todayLabel = moment().format('dddd, MMMM D YYYY');
  const hasTargets = targets.length > 0;
  // Current price proxy for the stale-levels panel: entryPrice of the most
  // recent target fired today. Stale between firings but sufficient for a
  // "levels within N pts" discovery panel. Null when no targets yet.
  const latestPriceFromTargets = hasTargets
    ? parseFloat(targets[targets.length - 1]?.entryPrice)
    : null;
  const currentPrice = Number.isFinite(latestPriceFromTargets) ? latestPriceFromTargets : null;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const switchSkin = useCallback((mode) => {
    const btnWhite = document.getElementsByClassName('btn-white');
    for (const btn of btnWhite) {
      if (mode === 'dark') {
        btn.classList.add('btn-outline-primary');
        btn.classList.remove('btn-white');
      } else {
        btn.classList.remove('btn-outline-primary');
        btn.classList.add('btn-white');
      }
    }
  }, []);

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => { switchSkin(skin); }, [skin, switchSkin]);
  useEffect(() => { updatePageSEO('sonaTargets'); }, []);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <React.Fragment>
      <Header onSkin={setSkin} />
      <div className="main main-app p-3 p-lg-4">

        {/* Page header */}
        <div className="d-md-flex align-items-center justify-content-between mb-4">
          <div>
            <ol className="breadcrumb fs-sm mb-1">
              <li className="breadcrumb-item"><Link to="/dashboard/sona-daily">SONA Analytics</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Today's Targets</li>
            </ol>
            <h4 className="main-title mb-0">NQ Today's Targets</h4>
            <p className="text-secondary fs-sm mb-0">{todayLabel}</p>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="d-flex justify-content-center py-5">
            <Spinner animation="border" variant="primary" role="status">
              <span className="visually-hidden">Loading today's targets...</span>
            </Spinner>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="card card-one mb-4">
            <div className="card-body text-secondary fs-sm">
              <i className="ri-information-line me-2"></i>
              {error}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && !hasTargets && (
          <div className="card card-one mb-4">
            <div className="card-body text-secondary fs-sm">
              <i className="ri-focus-3-line me-2"></i>
              No targets generated yet for today's session.
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <Row className="g-3">
            {hasTargets && (
              <Col xs="12">
                <OpenTargetsPanel targets={targets} isSessionLive={isSessionLive} daySummary={daySummary} />
              </Col>
            )}
            <Col xs="12">
            {STALE_LEVELS_PANEL_ENABLED && (
              <Col xs="12">
                <StaleLevelsPanel currentPrice={currentPrice} enabled />
              </Col>
            )}
              <TargetSessionKpis targets={targets} isSessionLive={isSessionLive} />
            </Col>
            {hasTargets && (
              <Col xs="12">
                <TargetLiveTable targets={targets} isSessionLive={isSessionLive} />
              </Col>
            )}
          </Row>
        )}

        <Footer />
      </div>
    </React.Fragment>
  );
}
