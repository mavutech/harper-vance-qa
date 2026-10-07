import React from 'react';
import {Link} from 'react-router-dom';
import Header from '../layouts/Header';
import Footer from '../layouts/Footer';

/**
 * Explains a missing or inactive product entitlement without exposing internals.
 *
 * @returns {React.ReactElement} Access status page
 */
export default function AccessUnavailable() {
  return (
    <React.Fragment>
      <Header />
      <main className="main main-app p-3 p-lg-4">
        <div className="card card-one mx-auto" style={{maxWidth: 680}}>
          <div className="card-body p-4 p-lg-5">
            <p className="text-primary fw-semibold text-uppercase fs-sm mb-2">Account access</p>
            <h1 className="h3 mb-3">This feature is not included in your current access.</h1>
            <p className="text-secondary mb-4">
              Your account is signed in, but your organization does not currently have an active license for this area.
              Contact your Harper Vance administrator or our client team if you believe this is incorrect.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <Link className="btn btn-primary" to="/pages/profile">View account profile</Link>
              <a className="btn btn-outline-primary" href="mailto:support@harpervance.com">Contact support</a>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </React.Fragment>
  );
}
