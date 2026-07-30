import React, {useEffect, useState} from 'react';
import {Link, useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import {Alert, Button, Card, Container, Spinner} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import {acceptInvitation} from '../features/organizations/services/organizationCallables';
import {fetchOrgs, switchOrg} from '../features/organizations/redux/orgActions';

/**
 * Public route that invitees land on from the email link. When signed
 * in, calls the acceptInvitation callable; when signed out, redirects
 * to /login with a `from` state so the invite is retried after auth.
 */
export default function AcceptInvite() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {isLoggedIn} = useSelector((s) => s.auth);

  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState('idle'); // idle | pending | success | error
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Missing invitation token.');
      return;
    }
    if (!isLoggedIn) {
      // Preserve the invite URL so the user returns here after login.
      navigate('/login', {state: {from: location}, replace: true});
      return;
    }

    let cancelled = false;
    const run = async () => {
      setStatus('pending');
      setErrorMessage(null);
      try {
        const {orgId, role} = await acceptInvitation({token});
        if (cancelled) return;
        // Refresh the orgs list so the new membership shows up in the
        // switcher, then switch to it.
        await dispatch(fetchOrgs()).catch(() => {});
        await dispatch(switchOrg(orgId)).catch(() => {});
        setStatus('success');
        // Give the user a beat to read the success message before
        // sending them to the dashboard.
        setTimeout(() => {
          if (!cancelled) navigate('/dashboard/sona-targets', {replace: true});
        }, 1500);
        return {orgId, role};
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setErrorMessage((err && err.message) || 'Failed to accept invitation.');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isLoggedIn]);

  return (
    <div className="page-sign d-block">
      <Container>
        <Card className="card-sign mx-auto" style={{maxWidth: 480}}>
          <Card.Header>
            <Link to="/" className="header-logo mb-4">dashbyte</Link>
            <Card.Title>Accept invitation</Card.Title>
            <Card.Text>
              {status === 'pending' && 'Verifying your invitation…'}
              {status === 'success' && 'Welcome aboard. Redirecting…'}
              {status === 'error' && 'We could not accept your invitation.'}
              {status === 'idle' && 'Preparing…'}
            </Card.Text>
          </Card.Header>
          <Card.Body>
            {status === 'pending' && (
              <div className="text-center py-3">
                <Spinner animation="border" role="status" />
              </div>
            )}
            {status === 'success' && (
              <Alert variant="success" className="mb-0">
                Invitation accepted.
              </Alert>
            )}
            {status === 'error' && (
              <>
                <Alert variant="danger">{errorMessage}</Alert>
                <div className="d-flex gap-2">
                  <Link to="/">
                    <Button variant="outline-secondary">Home</Button>
                  </Link>
                  <Link to="/pages/profile">
                    <Button variant="primary">Go to profile</Button>
                  </Link>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
