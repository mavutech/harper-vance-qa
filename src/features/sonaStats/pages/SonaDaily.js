import React, { useCallback, useEffect, useState } from 'react';
import { Col, Row, Spinner } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import moment from 'moment-timezone';
import Header from '../../../layouts/Header';
import Footer from '../../../layouts/Footer';
import { useTargetStats } from '../hooks/useTargetStats';
import { trackEvent } from '../../../utils/analytics';
import { updatePageSEO } from '../../../config/seoConfig';
import KpiCards from '../components/KpiCards';
import TargetResolutionTable from '../components/TargetResolutionTable';
import ResolutionTimeBuckets from '../components/ResolutionTimeBuckets';
import SessionPeriodBreakdown from '../components/SessionPeriodBreakdown';
import MissAnalysis from '../components/MissAnalysis';
import DistanceVsHitRate from '../components/DistanceVsHitRate';
import IntradayTargetChart from '../components/IntradayTargetChart';
import RetractionProfile from '../components/RetractionProfile';
import SonaDailyContextCard from '../components/SonaDailyContextCard';
import StatsPrimerDrawer from '../components/StatsPrimerDrawer';

const currentSkin = localStorage.getItem('skin-mode') ? 'dark' : '';

/**
 * Snaps a date to the most recent weekday (Mon–Fri).
 * Saturday → Friday (–1d); Sunday → Friday (–2d); weekday → unchanged.
 *
 * @param {string|moment.Moment} date - YYYY-MM-DD string or moment
 * @returns {string} YYYY-MM-DD weekday
 */
const toWeekday = (date) => {
  const m = moment(date);
  const dow = m.isoWeekday(); // 1=Mon … 7=Sun
  if (dow === 6) return m.subtract(1, 'day').format('YYYY-MM-DD');
  if (dow === 7) return m.subtract(2, 'day').format('YYYY-MM-DD');
  return m.format('YYYY-MM-DD');
};

/**
 * Steps a date by ±1 weekday, skipping Sat/Sun.
 *
 * @param {string} date - YYYY-MM-DD
 * @param {1|-1} step - +1 forward, -1 backward
 * @returns {string} YYYY-MM-DD weekday
 */
const stepWeekday = (date, step) => {
  const m = moment(date).add(step, 'day');
  while (m.isoWeekday() > 5) m.add(step, 'day');
  return m.format('YYYY-MM-DD');
};

/**
 * Daily SONA target performance page.
 * Orchestrates all daily stat sub-components. No data logic lives here —
 * all derivations are handled by useTargetStats and computeAllStats.
 * Accepts an optional `?date=YYYY-MM-DD` query param — used when navigating
 * from the History page. Falls back to today when absent.
 *
 * Route: /dashboard/sona-daily
 *
 * @returns {JSX.Element}
 */
export default function SonaDaily() {
  // ── Hooks ────────────────────────────────────────────────────────────────────
  const [skin, setSkin] = useState(currentSkin);
  const [searchParams, setSearchParams] = useSearchParams();
  const paramDate = searchParams.get('date');
  const [selectedDate, setSelectedDate] = useState(
    toWeekday(
      paramDate && moment(paramDate, 'YYYY-MM-DD', true).isValid()
        ? paramDate
        : moment().format('YYYY-MM-DD')
    )
  );
  const { data, computedStats, loading, error } = useTargetStats(selectedDate);

  // Stats vocabulary drawer ("how to read these numbers") — opens via the
  // subtle link beside the page title. Intentionally off-canvas so it never
  // pushes the tile grid around.
  const [showPrimer, setShowPrimer] = useState(false);

  // ── Derived values ───────────────────────────────────────────────────────────
  const formattedDate = `${moment(selectedDate).format('dddd, MMMM D YYYY')} · New York Time (EST)`;
  const targets = data?.engulfingCandleList ?? [];

  const hasPreciseRetraction =
    computedStats?.retractionStats?.avg !== null &&
    computedStats?.retractionStats?.avg !== undefined;
  const todayWeekday = toWeekday(moment().format('YYYY-MM-DD'));
  const isAtLatestWeekday = selectedDate >= todayWeekday;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const updateDate = useCallback((newDate) => {
    setSelectedDate(newDate);
    setSearchParams({ date: newDate });
    trackEvent('sona_daily_date_changed', { date: newDate });
  }, [setSearchParams]);

  const handleDateChange = useCallback((e) => {
    const raw = e.target.value;
    if (!raw) return;
    const safe = toWeekday(raw);
    updateDate(safe);
  }, [updateDate]);

  const handlePrevDay = useCallback(() => {
    updateDate(stepWeekday(selectedDate, -1));
  }, [selectedDate, updateDate]);

  const handleNextDay = useCallback(() => {
    const next = stepWeekday(selectedDate, 1);
    if (next > todayWeekday) return;
    updateDate(next);
  }, [selectedDate, todayWeekday, updateDate]);

  const handleToday = useCallback(() => {
    if (selectedDate === todayWeekday) return;
    updateDate(todayWeekday);
  }, [selectedDate, todayWeekday, updateDate]);

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
  useEffect(() => { updatePageSEO('sonaDaily'); }, []);

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
              <li className="breadcrumb-item active" aria-current="page">Daily Performance</li>
            </ol>
            <h4 className="main-title mb-0">NQ Daily Target Performance</h4>
            <p className="text-secondary fs-sm mb-0">
              {formattedDate}
              <button
                type="button"
                className="btn btn-link btn-sm p-0 ms-2 fs-xs text-decoration-none align-baseline"
                onClick={() => {
                  setShowPrimer(true);
                  trackEvent('sona_daily_stats_primer_opened', {});
                }}
                aria-label="Open statistics primer"
              >
                <i className="ri-information-line"></i> Metric definitions
              </button>
            </p>
            <SonaDailyContextCard dayContext={data?.dayContext} />
          </div>
          <div className="d-flex flex-column align-items-center mt-3 mt-md-0">
            <button
              type="button"
              className="btn btn-link btn-sm p-0 mb-1 fs-xs text-decoration-none text-center"
              onClick={handleToday}
              disabled={isAtLatestWeekday}
              aria-label="Jump to today"
              style={{ width: 160 }}
            >
              Today
            </button>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-white d-flex align-items-center"
                onClick={handlePrevDay}
                aria-label="Previous trading day"
              >
                <i className="ri-arrow-left-s-line fs-18"></i>
              </button>
              <input
                type="date"
                className="form-control form-control-sm"
                value={selectedDate}
                max={todayWeekday}
                onChange={handleDateChange}
                aria-label="Select date"
                style={{ width: 160 }}
              />
              <button
                type="button"
                className="btn btn-sm btn-white d-flex align-items-center"
                onClick={handleNextDay}
                disabled={isAtLatestWeekday}
                aria-label="Next trading day"
              >
                <i className="ri-arrow-right-s-line fs-18"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="d-flex justify-content-center py-5">
            <Spinner animation="border" variant="primary" role="status">
              <span className="visually-hidden">Loading stats...</span>
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

        {/* Content — only rendered when data is present */}
        {!loading && !error && data && (
          <Row className="g-3">
            <Col xs="12">
              <KpiCards data={data} computedStats={computedStats} />
            </Col>
            <Col xs="12">
              <IntradayTargetChart date={selectedDate} targets={targets} />
            </Col>
            <Col xs="12">
              <TargetResolutionTable targets={targets} precise={hasPreciseRetraction} />
            </Col>
            <Col xs="12" xl="8">
              <DistanceVsHitRate distanceVsHitRate={computedStats?.distanceVsHitRate} />
            </Col>
            <Col xs="12" xl="4">
              <RetractionProfile
                retractionStats={computedStats?.retractionStats}
                trailing={data?.trailingStats}
              />
            </Col>
            <Col xs="12" xl="8">
              <ResolutionTimeBuckets
                timeBuckets={computedStats?.timeBuckets}
                resolutionTimes={computedStats?.resolutionTimes}
                trailing={data?.trailingStats}
              />
            </Col>
            <Col xs="12" xl="4">
              <SessionPeriodBreakdown
                sessionPeriods={computedStats?.sessionPeriods}
                bucketStats={data?.bucketStats}
                bucketSessions={data?.trailingStats?.sessions}
              />
            </Col>
            <Col xs="12">
              <MissAnalysis
                missAnalysis={computedStats?.missAnalysis}
                askComparison={computedStats?.askComparison}
              />
            </Col>
            {data.computedAt && (
              <Col xs="12">
                <p className="fs-xs text-secondary text-end mb-0">
                  Computed {moment(data.computedAt).tz('America/New_York').format('h:mm A z, MMM D')}
                  {data.generatorVersion ? ` · ${data.generatorVersion}` : ''} · final
                </p>
              </Col>
            )}
          </Row>
        )}

        <Footer />
      </div>
      <StatsPrimerDrawer show={showPrimer} onHide={() => setShowPrimer(false)} />
    </React.Fragment>
  );
}
