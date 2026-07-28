import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Row, Spinner } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import moment from 'moment';
import Header from '../../../layouts/Header';
import Footer from '../../../layouts/Footer';
import { useWeeklyStats } from '../hooks/useWeeklyStats';
import { trackEvent } from '../../../utils/analytics';
import { updatePageSEO } from '../../../config/seoConfig';
import WeeklyKpiCards from '../components/WeeklyKpiCards';
import WeeklyRetractionCards from '../components/WeeklyRetractionCards';
import WeeklyDayChart from '../components/WeeklyDayChart';
import WeeklyDailyLog from '../components/WeeklyDailyLog';
import WeekOverWeekChart from '../components/WeekOverWeekChart';
import WeeklyBucketGrid from '../components/WeeklyBucketGrid';
import WeeklyMedianRetractionChart from '../components/WeeklyMedianRetractionChart';
import MissedResolutionSection from '../components/MissedResolutionSection';

const currentSkin = localStorage.getItem('skin-mode') ? 'dark' : '';

/**
 * Returns the latest valid ISO week, preventing requests for future data.
 *
 * @returns {{ weekNumber: number, year: number }} Current ISO week selection
 */
const getCurrentWeek = () => ({
  weekNumber: moment().isoWeek(),
  year: moment().isoWeekYear(),
});

/**
 * Reads and validates a week selection from URL query parameters. Invalid or
 * future selections fall back to the current ISO week.
 *
 * @param {URLSearchParams} searchParams - Current route query parameters
 * @returns {{ weekNumber: number, year: number }} Valid selected ISO week
 */
export const getWeekSelectionFromSearch = (searchParams) => {
  const current = getCurrentWeek();
  const weekNumber = Number(searchParams.get('week'));
  const year = Number(searchParams.get('year'));
  const weeksInYear = moment().isoWeekYear(year).isoWeeksInYear();
  const isValid = Number.isInteger(weekNumber) && Number.isInteger(year) &&
    year >= 2000 && year <= current.year && weekNumber >= 1 && weekNumber <= weeksInYear;
  const isFuture = year === current.year && weekNumber > current.weekNumber;

  return isValid && !isFuture ? { weekNumber, year } : current;
};

/**
 * Explains why only daily-record fallback data is displayed when a generated
 * weekly summary is unavailable.
 *
 * @param {number} weekNumber - Selected ISO week number
 * @param {number} year - Selected ISO week year
 * @param {{ weekNumber: number, year: number }} [currentWeek] - Current ISO week, injectable for tests
 * @returns {string} User-facing fallback notice
 */
export const getWeeklySummaryFallbackMessage = (weekNumber, year, currentWeek = getCurrentWeek()) => {
  const isHistoricalWeek = year < currentWeek.year ||
    (year === currentWeek.year && weekNumber < currentWeek.weekNumber);

  if (isHistoricalWeek) {
    return `The generated weekly summary for Week ${weekNumber}, ${year} is unavailable. Core results below are calculated from the available daily records; comparison metrics will return after the summary is regenerated.`;
  }

  return 'The weekly summary is still being generated. Core results below are calculated from the available daily records; comparison metrics will appear once generation is complete.';
};

/**
 * Weekly SONA target performance page.
 * Allows week navigation via prev/next controls.
 * Orchestrates weekly KPI cards, day-by-day bar chart, direction split,
 * and week-over-week trend line. No data logic lives here.
 *
 * Route: /dashboard/sona-weekly
 *
 * @returns {JSX.Element}
 */
export default function SonaWeekly() {
  // ── Hooks ────────────────────────────────────────────────────────────────────
  const [skin, setSkin] = useState(currentSkin);
  const [searchParams, setSearchParams] = useSearchParams();
  const { weekNumber, year } = useMemo(
    () => getWeekSelectionFromSearch(searchParams),
    [searchParams]
  );
  const { weekly, weekDates, rangeData, weeklyDirection, trendData, coverage, loading, error, weeklySummaryMissing } = useWeeklyStats(weekNumber, year);

  // ── Derived values ───────────────────────────────────────────────────────────
  const weekLabel = weekly?.weekOfDateFormatted ?? `Week ${weekNumber} of ${year}`;
  const isCurrentWeek = weekNumber === moment().isoWeek() && year === moment().isoWeekYear();
  const weeklySummaryFallbackMessage = getWeeklySummaryFallbackMessage(weekNumber, year);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handlePrevWeek = useCallback(() => {
    let newWeek = weekNumber - 1;
    let newYear = year;
    if (newWeek < 1) {
      newYear = year - 1;
      newWeek = moment().isoWeekYear(newYear).isoWeeksInYear();
    }
    setSearchParams({ week: String(newWeek), year: String(newYear) });
    trackEvent('sona_weekly_week_changed', { weekNumber: newWeek, year: newYear, direction: 'prev' });
  }, [setSearchParams, weekNumber, year]);

  const handleNextWeek = useCallback(() => {
    let newWeek = weekNumber + 1;
    let newYear = year;
    const weeksInYear = moment().isoWeekYear(year).isoWeeksInYear();
    if (newWeek > weeksInYear) {
      newYear = year + 1;
      newWeek = 1;
    }
    setSearchParams({ week: String(newWeek), year: String(newYear) });
    trackEvent('sona_weekly_week_changed', { weekNumber: newWeek, year: newYear, direction: 'next' });
  }, [setSearchParams, weekNumber, year]);

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
  useEffect(() => { updatePageSEO('sonaWeekly'); }, []);
  useEffect(() => {
    if (searchParams.get('week') !== String(weekNumber) || searchParams.get('year') !== String(year)) {
      setSearchParams({ week: String(weekNumber), year: String(year) }, { replace: true });
    }
  }, [searchParams, setSearchParams, weekNumber, year]);

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
              <li className="breadcrumb-item active" aria-current="page">Weekly Summary</li>
            </ol>
            <h4 className="main-title mb-0">NQ Weekly Target Summary</h4>
            <p className="text-secondary fs-sm mb-0">{weekLabel}</p>
          </div>
          <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
            <button
              type="button"
              className="btn btn-sm btn-white d-flex align-items-center"
              onClick={handlePrevWeek}
              aria-label="Previous week"
            >
              <i className="ri-arrow-left-s-line fs-18"></i>
            </button>
            <span className="fs-sm fw-medium px-1">
              Week {weekNumber} · {year}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-white d-flex align-items-center"
              onClick={handleNextWeek}
              disabled={isCurrentWeek}
              aria-label="Next week"
            >
              <i className="ri-arrow-right-s-line fs-18"></i>
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="d-flex justify-content-center py-5">
            <Spinner animation="border" variant="primary" role="status">
              <span className="visually-hidden">Loading weekly stats...</span>
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

        {/* Daily-data fallback notice */}
        {!loading && weeklySummaryMissing && (
          <div className="card card-one mb-4">
            <div className="card-body text-secondary fs-sm">
              <i className="ri-information-line me-2"></i>
              {weeklySummaryFallbackMessage}
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <Row className="g-3">
            <Col xs="12">
              <WeeklyKpiCards weekly={weekly} weeklyDirection={weeklyDirection} coverage={coverage} />
            </Col>
            <Col xs="12">
              <h6 className="fs-sm fw-semibold text-secondary mb-2">Retraction & Day Shape</h6>
              <WeeklyRetractionCards weekly={weekly} coverage={coverage} />
            </Col>
            <Col xs="12">
              <WeeklyDailyLog rangeData={rangeData} weekDates={weekDates} />
            </Col>
            <Col xs="12">
              <WeeklyDayChart rangeData={rangeData} weekDates={weekDates} />
            </Col>
            <Col xs="12">
              <WeeklyBucketGrid
                bucketStats={weekly?.bucketStats}
                weekBucketStats={weekly?.weekStats?.bucketStats}
              />
            </Col>
            <Col xs="12">
              <MissedResolutionSection weekly={weekly} weekDates={weekDates} />
            </Col>
            <Col xs="12">
              <WeeklyMedianRetractionChart rangeData={rangeData} weekDates={weekDates} />
            </Col>
            <Col xs="12">
              <WeekOverWeekChart trendData={trendData} />
            </Col>
          </Row>
        )}

        <Footer />
      </div>
    </React.Fragment>
  );
}
