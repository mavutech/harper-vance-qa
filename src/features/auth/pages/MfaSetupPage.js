import brandUi from "../../../config/brandUi";
/**
 * @fileoverview Required authenticator-app enrollment and reauthentication page.
 */

import React from 'react';
import {Alert, Button, Card, Container} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import {Navigate, useNavigate} from 'react-router-dom';

import {ROUTES} from '../../../config/routes';
import {logoutUser} from '../../../redux/authentication/authActions';
import MfaEnrollmentCard from '../components/MfaEnrollmentCard';

/**
 * Keeps users outside the application until their current session has passed
 * the authenticator-app challenge.
 *
 * @returns {React.ReactElement}
 */
export default function MfaSetupPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {initialized, isLoggedIn, user} = useSelector((state) => state.auth);

  if (!initialized) {
    return <div className="d-flex justify-content-center align-items-center min-vh-100">Loading account security...</div>;
  }
  if (!isLoggedIn) return <Navigate to={ROUTES.login} replace />;
  if (user?.mfaAuthenticated === true) return <Navigate to={ROUTES.dashboard} replace />;

  const signInAgain = () => {
    dispatch(logoutUser({
      onComplete: () => navigate(ROUTES.login, {replace: true}),
    }));
  };

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100 py-5">
      <Card className="shadow-sm w-100" style={{maxWidth: 760}}>
        <Card.Body className="p-4 p-md-5">
          <h1 className="h3 mb-3">Authenticator app required</h1>
          <p className="text-secondary">
            {brandUi.mfaNotice}
          </p>
          {user?.mfaEnrolled ? (
            <Alert variant="info" className="mb-0">
              <p>Your authenticator is enrolled. Sign in again to complete the security check for this session.</p>
              <Button variant="primary" onClick={signInAgain}>Sign in again</Button>
            </Alert>
          ) : (
            <>
              <Alert variant="warning">
                Finish this one-time setup before continuing to the application.
              </Alert>
              <MfaEnrollmentCard onEnrollmentComplete={signInAgain} />
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
