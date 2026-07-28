import React, { useCallback, useEffect, useState } from 'react';
import { Col, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Header from '../../../layouts/Header';
import Footer from '../../../layouts/Footer';
import { useRollingStats } from '../hooks/useRollingStats';
import { trackEvent } from '../../../utils/analytics';
import { updatePageSEO } from '../../../config/seoConfig';
import RollingAccuracyChart from '../components/RollingAccuracyChart';
import StreakIndicator from '../components/StreakIndicator';
import DailyBreakdownTable from '../components/DailyBreakdownTable';
import DirectionBiasChart from '../components/DirectionBiasChart';

const currentSkin = localStorage.getItem('skin-mode') ? 'dark' : '';
const DAY_OPTIONS = [10, 20, 40];

/**
 * Historical SONA target performance page.
 * Displays rolling accuracy, win/loss streak, day-by-day breakdown table,
 * and directional bias chart across a configurable trading day range.
 * No data logic lives here — all computation is in useRollingStats and components.
 *
 * Route: /dashboard/sona-history
 *
 * @returns {JSX.Element}
 */
export default function SonaHistory() {
  // ── Hooks ────────────────────────────────────────────────────────────────────
  const [skin, setSkin] = useState(currentSkin);
  const [days, setDays] = useState(20);
  const [toDate] = useState(moment().format('YYYY-MM-DD'));
  const { rangeData, rolling5Day, rolling20Day, streak, loading, error } = useRollingStats(toDate, days);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleDaysChange = useCallback((n) => {
    setDays(n);
    trackEvent('sona_history_date_range_changed', { days: n });
  }, []);

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
  useEffect(() => { updatePageSEO('sonaHistory'); }, []);

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
              <li className="breadcrumb-item active" aria-current="page">Historical Performance</li>
            </ol>
            <h4 className="main-title mb-0">NQ Historical Target Performance</h4>
            <p className="text-secondary fs-sm mb-0">Last {days} trading days ending {moment(toDate).format('MMM D, YYYY')}</p>
          </div>
          <div className="d-flex gap-2 mt-3 mt-md-0">
            {DAY_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleDaysChange(n)}
                className={`btn btn-sm ${days === n ? 'btn-primary' : 'btn-white'}`}
                aria-pressed={days === n}
              >
                {n}D
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="d-flex justify-content-center py-5">
            <Spinner animation="border" variant="primary" role="status">
              <span className="visually-hidden">Loading historical stats...</span>
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

        {/* Content */}
        {!loading && !error && (
          <Row className="g-3">
            <Col xs="12" xl="8">
              <RollingAccuracyChart
                rangeData={rangeData}
                rolling5Day={rolling5Day}
                rolling20Day={rolling20Day}
              />
            </Col>
            <Col xs="12" xl="4">
              <StreakIndicator streak={streak} rangeData={rangeData} />
            </Col>
            <Col xs="12">
              <DirectionBiasChart rangeData={rangeData} />
            </Col>
            <Col xs="12">
              <DailyBreakdownTable rangeData={rangeData} />
            </Col>
          </Row>
        )}

        <Footer />
      </div>
    </React.Fragment>
  );
}
