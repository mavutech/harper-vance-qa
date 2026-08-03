import React, {useEffect, useMemo, useState} from 'react';
import {Link, useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import {Alert, Badge, Button, Card, Container, Spinner} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import {
  acceptInvitation,
  previewInvitation,
} from '../features/organizations/services/organizationApi';
import {fetchOrgs, switchOrg} from '../features/organizations/redux/orgActions';
import {logoutUser} from '../redux/authentication/authActions';

/**
 * Purpose-built accept-invitation page. Anonymous invitees see a
 * "You're invited to {org} as {role}" screen with sign-in / create-account
 * calls to action — they are never bounced to a generic /login page.
 * Signed-in invitees whose email matches accept in one click; mismatched
 * accounts get an explicit "sign out and continue as invitedEmail" flow.
 */
export default function AcceptInvite() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {isLoggedIn, user} = useSelector((s) => s.auth);

  const token = searchParams.get('token') || '';

  // Preview: what the invite is for.
  const [previewStatus, setPreviewStatus] = useState(token ? 'pending' : 'error');
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState(
      token ? null : {message: 'Missing invitation token.'},
  );

  // Accept action: only fires when the user clicks "Accept invitation".
  const [acceptStatus, setAcceptStatus] = useState('idle'); // idle | pending | success | error
  const [acceptError, setAcceptError] = useState(null);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await previewInvitation({token});
        if (!cancelled) {
          setPreview(data);
          setPreviewStatus('ok');
        }
      } catch (err) {
        if (cancelled) return;
        setPreviewError({
          message: (err && err.message) || 'Could not load invitation.',
          code: (err && err.code) || null,
          requestId: (err && err.requestId) || null,
        });
        setPreviewStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const signedInEmail = (user && user.email) || '';
  const invitedEmail = (preview && preview.invitedEmail) || '';
  const emailsMatch = useMemo(
      () => Boolean(signedInEmail && invitedEmail &&
        signedInEmail.trim().toLowerCase() === invitedEmail.trim().toLowerCase()),
      [signedInEmail, invitedEmail],
  );

  const handleAccept = async () => {
    setAcceptStatus('pending');
    setAcceptError(null);
    try {
      const {orgId} = await acceptInvitation({token});
      await dispatch(fetchOrgs()).catch(() => {});
      await dispatch(switchOrg(orgId)).catch(() => {});
      setAcceptStatus('success');
      setTimeout(() => navigate('/dashboard/sona-targets', {replace: true}), 1200);
    } catch (err) {
      setAcceptStatus('error');
      setAcceptError({
        message: (err && err.message) || 'Failed to accept invitation.',
        code: (err && err.code) || null,
        requestId: (err && err.requestId) || null,
      });
    }
  };

  const handleSignOutThenReturn = () => {
    // Sign out, then land back on this same invite URL so the "not signed
    // in" branch renders and the user can sign in as the invited address.
    dispatch(logoutUser({
      onComplete: () => navigate(`${location.pathname}${location.search}`, {replace: true}),
    }));
  };

  const loginState = {from: {pathname: location.pathname, search: location.search}};

  return (
    <div className="page-sign d-block">
      <Container>
        <Card className="card-sign mx-auto" style={{maxWidth: 520}}>
          <Card.Header>
            <Link to="/" className="header-logo mb-4">dashbyte</Link>
            <Card.Title>Accept invitation</Card.Title>
            {previewStatus === 'ok' && preview && (
              <Card.Text>
                You've been invited to <strong>{preview.orgName}</strong> as{' '}
                <Badge bg="secondary" className="text-uppercase">{preview.role}</Badge>.
              </Card.Text>
            )}
            {previewStatus === 'pending' && (
              <Card.Text>Loading your invitation…</Card.Text>
            )}
            {previewStatus === 'error' && (
              <Card.Text>We could not load this invitation.</Card.Text>
            )}
          </Card.Header>

          <Card.Body>
            {previewStatus === 'pending' && (
              <div className="text-center py-3">
                <Spinner animation="border" role="status" />
              </div>
            )}

            {previewStatus === 'error' && (
              <>
                <Alert variant="danger">
                  <div>{previewError && previewError.message}</div>
                  {previewError && (previewError.code || previewError.requestId) && (
                    <div className="fs-xs text-secondary mt-2">
                      {previewError.code && <>Code: <code>{previewError.code}</code></>}
                      {previewError.code && previewError.requestId && ' · '}
                      {previewError.requestId && <>Request: <code>{previewError.requestId}</code></>}
                    </div>
                  )}
                </Alert>
                <Link to="/"><Button variant="outline-secondary">Return home</Button></Link>
              </>
            )}

            {previewStatus === 'ok' && preview && (
              <>
                <div className="mb-4 text-secondary">
                  This invitation was sent to <strong>{preview.invitedEmail}</strong>.
                </div>

                {/* Anonymous invitee → sign in or create account */}
                {!isLoggedIn && (
                  <>
                    <div className="d-grid gap-2 mb-3">
                      <Link
                        to="/login"
                        state={loginState}
                        className="btn btn-primary"
                      >
                        Sign in to accept
                      </Link>
                      <Link
                        to="/pages/signup2"
                        state={loginState}
                        className="btn btn-outline-primary"
                      >
                        Create an account
                      </Link>
                    </div>
                    <div className="fs-xs text-secondary text-center">
                      Use the email address <strong>{preview.invitedEmail}</strong> when signing in
                      or creating your account.
                    </div>
                  </>
                )}

                {/* Signed-in and email matches → one-click accept */}
                {isLoggedIn && emailsMatch && acceptStatus !== 'success' && (
                  <>
                    <div className="d-grid mb-2">
                      <Button
                        variant="primary"
                        onClick={handleAccept}
                        disabled={acceptStatus === 'pending'}
                      >
                        {acceptStatus === 'pending' ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                            Accepting…
                          </>
                        ) : 'Accept invitation'}
                      </Button>
                    </div>
                    {acceptStatus === 'error' && acceptError && (
                      <Alert variant="danger" className="mt-3">
                        <div>{acceptError.message}</div>
                        {(acceptError.code || acceptError.requestId) && (
                          <div className="fs-xs text-secondary mt-2">
                            {acceptError.code && <>Code: <code>{acceptError.code}</code></>}
                            {acceptError.code && acceptError.requestId && ' · '}
                            {acceptError.requestId && <>Request: <code>{acceptError.requestId}</code></>}
                          </div>
                        )}
                      </Alert>
                    )}
                  </>
                )}

                {/* Signed-in but as a different email → explicit switch */}
                {isLoggedIn && !emailsMatch && (
                  <>
                    <Alert variant="warning">
                      You're currently signed in as <strong>{signedInEmail}</strong>, but this
                      invitation is for <strong>{invitedEmail}</strong>. Sign out and continue as
                      the invited address.
                    </Alert>
                    <div className="d-grid">
                      <Button variant="primary" onClick={handleSignOutThenReturn}>
                        Sign out and continue
                      </Button>
                    </div>
                  </>
                )}

                {/* Success */}
                {acceptStatus === 'success' && (
                  <Alert variant="success" className="mb-0">
                    Invitation accepted. Redirecting…
                  </Alert>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
