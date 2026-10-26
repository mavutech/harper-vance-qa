import {PRODUCT_ROUTES} from "../../../config/productRoutes";
import brandUi from "../../../config/brandUi";
import MonthlyHistory from '../components/MonthlyHistory';
import RollingHistory from '../components/RollingHistory';
import { MONTHLY_COPY } from '../utils/monthlyCopy';
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ROLLING_COPY, ROLLING_SESSION_OPTIONS } from '../utils/rollingCopy';
import Header from '../../../layouts/Header';
import Footer from '../../../layouts/Footer';
import { trackEvent } from '../../../utils/analytics';
import { updatePageSEO } from '../../../config/seoConfig';

const currentSkin = localStorage.getItem('skin-mode') ? 'dark' : '';

/**
 * Defaults History to calendar-month reporting; recent performance is selected explicitly.
 * @returns {JSX.Element} History view selector and selected report.
 */
export default function TargetHistoryPage() {
  // ── Hooks ────────────────────────────────────────────────────────────────────
  const [skin, setSkin] = useState(currentSkin);
  const [searchParams, setSearchParams] = useSearchParams();
  const monthlyMode = searchParams.get('view') !== 'rolling';
  const requestedSessions = Number(searchParams.get('sessions') || 20);
  const days = ROLLING_SESSION_OPTIONS.includes(requestedSessions) ? requestedSessions : 20;
  /** Selects the report mode while preserving other navigation parameters. */
  const selectMode = (monthly) => {
    const next = new URLSearchParams(searchParams);
    if (monthly) next.set('view', 'monthly');
    else next.set('view', 'rolling');
    setSearchParams(next);
    trackEvent('sona_history_view_changed', { view: monthly ? 'monthly' : 'rolling' });
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleDaysChange = useCallback((n) => {
    const next = new URLSearchParams(searchParams);
    next.set('sessions', String(n));
    setSearchParams(next);
    trackEvent('sona_history_date_range_changed', { days: n });
  }, [searchParams, setSearchParams]);

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
  useEffect(() => { updatePageSEO('targetHistory'); }, []);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <React.Fragment>
      <Header onSkin={setSkin} />
      <div className="main main-app p-3 p-lg-4">

        <div className="d-flex gap-2 mb-3" role="group" aria-label={MONTHLY_COPY.view}>
          <button type="button" className={`btn btn-sm ${monthlyMode ? 'btn-primary' : 'btn-outline-primary'}`} aria-pressed={monthlyMode} onClick={() => selectMode(true)}>{MONTHLY_COPY.monthly}</button>
          <button type="button" className={`btn btn-sm ${!monthlyMode ? 'btn-primary' : 'btn-outline-primary'}`} aria-pressed={!monthlyMode} onClick={() => selectMode(false)}>{MONTHLY_COPY.rolling}</button>
        </div>
        {/* Page header */}
        <div className="d-md-flex align-items-center justify-content-between mb-4">
          <div>
            <ol className="breadcrumb fs-sm mb-1">
              <li className="breadcrumb-item"><Link to={PRODUCT_ROUTES.daily}>{brandUi.analytics}</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Historical Performance</li>
            </ol>
            <h4 className="main-title mb-0">{monthlyMode ? 'NQ Historical Target Performance' : ROLLING_COPY.title}</h4>
            <p className="text-secondary fs-sm mb-0">{monthlyMode ? MONTHLY_COPY.subtitle : `Last ${days} completed reporting sessions`}</p>
          </div>
          <div className="d-flex flex-wrap gap-2 mt-3 mt-md-0">
            {!monthlyMode && ROLLING_SESSION_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleDaysChange(n)}
                className={`btn btn-sm ${days === n ? 'btn-primary' : 'btn-white'}`}
                aria-pressed={days === n}
              >
                {n} {ROLLING_COPY.sessions}
              </button>
            ))}
          </div>
        </div>

        {monthlyMode ? <MonthlyHistory /> : <RollingHistory days={days} />}

        <Footer />
      </div>
    </React.Fragment>
  );
}
