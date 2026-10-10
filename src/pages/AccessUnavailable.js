import React, {useState} from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import Header from '../layouts/Header';
import Footer from '../layouts/Footer';
import {useAccess} from '../features/access';

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
            <p className="text-primary fw-semibold text-uppercase fs-sm mb-2">Account access</p>
            <h1 className="h3 mb-3">
              {error
                ? 'We could not confirm your account access.'
                : 'This feature is not included in your current access.'}
            </h1>
            <p className="text-secondary mb-4">
              {error
                ? 'Try checking access again. Contact support if the issue continues.'
                : 'Your account is signed in, but your organization does not have an active license for this area.'}
            </p>
            <div className="d-flex flex-wrap gap-2">
              {error && (
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={retryAccess}
                  disabled={checking}
                >
                  {checking ? 'Checking access...' : 'Check access again'}
                </button>
              )}
              <Link className="btn btn-outline-primary" to="/pages/profile">View account profile</Link>
              <a className="btn btn-outline-primary" href="mailto:support@harpervance.com">Contact support</a>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </React.Fragment>
  );
}
