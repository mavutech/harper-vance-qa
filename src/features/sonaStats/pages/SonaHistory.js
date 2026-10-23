import MonthlyHistory from '../components/MonthlyHistory';
import RollingHistory from '../components/RollingHistory';
import { MONTHLY_COPY } from '../utils/monthlyCopy';
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import moment from 'moment-timezone';
import { EST_TIMEZONE } from '../utils/sonaStatsConstants';
import Header from '../../../layouts/Header';
import Footer from '../../../layouts/Footer';
import { trackEvent } from '../../../utils/analytics';
import { updatePageSEO } from '../../../config/seoConfig';

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
  const [toDate] = useState(moment().tz(EST_TIMEZONE).format('YYYY-MM-DD'));
  const [searchParams, setSearchParams] = useSearchParams();
  const monthlyMode = searchParams.get('view') === 'monthly';
  /** Selects the report mode while preserving other navigation parameters. */
  const selectMode = (monthly) => {
    const next = new URLSearchParams(searchParams);
    if (monthly) next.set('view', 'monthly');
    else next.delete('view');
    setSearchParams(next);
    trackEvent('sona_history_view_changed', { view: monthly ? 'monthly' : 'rolling' });
  };

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

        <div className="d-flex gap-2 mb-3" role="group" aria-label={MONTHLY_COPY.view}>
          <button type="button" className={`btn btn-sm ${!monthlyMode ? 'btn-primary' : 'btn-outline-primary'}`} aria-pressed={!monthlyMode} onClick={() => selectMode(false)}>{MONTHLY_COPY.rolling}</button>
          <button type="button" className={`btn btn-sm ${monthlyMode ? 'btn-primary' : 'btn-outline-primary'}`} aria-pressed={monthlyMode} onClick={() => selectMode(true)}>{MONTHLY_COPY.monthly}</button>
        </div>
        {/* Page header */}
        <div className="d-md-flex align-items-center justify-content-between mb-4">
          <div>
            <ol className="breadcrumb fs-sm mb-1">
              <li className="breadcrumb-item"><Link to="/dashboard/sona-daily">SONA Analytics</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Historical Performance</li>
            </ol>
            <h4 className="main-title mb-0">NQ Historical Target Performance</h4>
            <p className="text-secondary fs-sm mb-0">{monthlyMode ? MONTHLY_COPY.subtitle : `Last ${days} trading days ending ${moment(toDate).format('MMM D, YYYY')}`}</p>
          </div>
          <div className="d-flex gap-2 mt-3 mt-md-0">
            {!monthlyMode && DAY_OPTIONS.map((n) => (
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

        {monthlyMode ? <MonthlyHistory /> : <RollingHistory toDate={toDate} days={days} />}

        <Footer />
      </div>
    </React.Fragment>
  );
}
