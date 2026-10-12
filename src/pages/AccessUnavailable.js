import React, {useState} from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import Header from '../layouts/Header';
import Footer from '../layouts/Footer';
import {SUPPORT_CONFIG} from '../config/supportConfig';
import {useAccess} from '../features/access';
import copy from '../features/access/locales/en.json';

/**
 * Explains a missing or temporarily unavailable product entitlement.
 *
 * @returns {React.ReactElement} Access status page
 */
export default function AccessUnavailable() {
  const {error, refreshAccess} = useAccess();
  const [checking, setChecking] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const requestedPath = location.state?.from?.pathname || '/dashboard/sona-targets';

  const retryAccess = async () => {
    setChecking(true);
    const access = await refreshAccess();
    setChecking(false);
    if (access) navigate(requestedPath, {replace: true});
  };

  return (
    <React.Fragment>
      <Header />
      <main className="main main-app p-3 p-lg-4">
        <div className="card card-one mx-auto" style={{maxWidth: 680}}>
          <div className="card-body p-4 p-lg-5">
            <p className="text-primary fw-semibold text-uppercase fs-sm mb-2">{copy.eyebrow}</p>
            <h1 className="h3 mb-3">
              {error
                ? copy.errorTitle
                : copy.notIncludedTitle}
            </h1>
            <p className="text-secondary mb-2">
              {error
                ? copy.errorDescription
                : copy.notIncludedDescription}
            </p>
            <p className="text-secondary fs-sm mb-4">{copy.supportAvailability}</p>
            <div className="d-flex flex-wrap gap-2">
              {error && (
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={retryAccess}
                  disabled={checking}
                >
                  {checking ? copy.checkingAccess : copy.checkAccessAgain}
                </button>
              )}
              <Link className="btn btn-outline-primary" to="/pages/profile">{copy.viewProfile}</Link>
              <a className="btn btn-outline-primary" href={`mailto:${SUPPORT_CONFIG.email}`}>
                {copy.contactSupport}
              </a>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </React.Fragment>
  );
}
