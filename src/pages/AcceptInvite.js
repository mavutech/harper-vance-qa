import React, {useEffect, useMemo, useState} from 'react';
import {Link, useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import {Alert, Badge, Button, Card, Container, Form, Spinner} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import {signInWithCustomToken} from 'firebase/auth';
import {auth} from '../firebase/config';
import {
  acceptInvitation,
  acceptInvitationWithSignup,
  previewInvitation,
} from '../features/organizations/services/organizationApi';
import {fetchOrgs, switchOrg} from '../features/organizations/redux/orgActions';
import {checkAuthStatus, logoutUser} from '../redux/authentication/authActions';

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

  // Anonymous signup form state.
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [signupStatus, setSignupStatus] = useState('idle'); // idle | pending | success | error
  const [signupError, setSignupError] = useState(null);

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

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setSignupError({message: 'Password must be at least 8 characters.'});
      setSignupStatus('error');
      return;
    }
    if (password !== passwordConfirm) {
      setSignupError({message: 'Passwords do not match.'});
      setSignupStatus('error');
      return;
    }
    setSignupStatus('pending');
    setSignupError(null);
    try {
      const {orgId, customToken} = await acceptInvitationWithSignup({token, password});
      // Sign the new user in on the client, then hydrate Redux from the
      // Firebase auth listener so the rest of the app treats them as
      // authenticated. checkAuthStatus resolves on the next auth event.
      await signInWithCustomToken(auth, customToken);
      await dispatch(checkAuthStatus()).catch(() => {});
      await dispatch(fetchOrgs()).catch(() => {});
      await dispatch(switchOrg(orgId)).catch(() => {});
      setSignupStatus('success');
      setTimeout(() => navigate('/dashboard/sona-targets', {replace: true}), 1200);
    } catch (err) {
      setSignupStatus('error');
      setSignupError({
        message: (err && err.message) || 'Could not create your account.',
        code: (err && err.code) || null,
        requestId: (err && err.requestId) || null,
      });
    }
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

                {/* Anonymous invitee → create account inline with a password */}
                {!isLoggedIn && signupStatus !== 'success' && (
                  <>
                    <Form onSubmit={handleSignupSubmit}>
                      <div className="mb-3">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control
                          type="email"
                          value={preview.invitedEmail}
                          disabled
                          readOnly
                        />
                        <Form.Text className="text-secondary">
                          The invite is tied to this address and cannot be changed.
                        </Form.Text>
                      </div>
                      <div className="mb-3">
                        <Form.Label>Create a password</Form.Label>
                        <Form.Control
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          minLength={8}
                          required
                          disabled={signupStatus === 'pending'}
                          autoComplete="new-password"
                        />
                      </div>
                      <div className="mb-4">
                        <Form.Label>Confirm password</Form.Label>
                        <Form.Control
                          type="password"
                          value={passwordConfirm}
                          onChange={(e) => setPasswordConfirm(e.target.value)}
                          required
                          disabled={signupStatus === 'pending'}
                          autoComplete="new-password"
                        />
                      </div>
                      {signupStatus === 'error' && signupError && (
                        <Alert variant="danger" className="mb-3">
                          <div>{signupError.message}</div>
                          {(signupError.code || signupError.requestId) && (
                            <div className="fs-xs text-secondary mt-2">
                              {signupError.code && <>Code: <code>{signupError.code}</code></>}
                              {signupError.code && signupError.requestId && ' · '}
                              {signupError.requestId && <>Request: <code>{signupError.requestId}</code></>}
                            </div>
                          )}
                        </Alert>
                      )}
                      <div className="d-grid mb-3">
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={signupStatus === 'pending'}
                        >
                          {signupStatus === 'pending' ? (
                            <>
                              <Spinner as="span" animation="border" size="sm" className="me-2" />
                              Creating your account…
                            </>
                          ) : 'Create account & accept'}
                        </Button>
                      </div>
                    </Form>
                    <div className="text-center fs-sm">
                      Already have an account?{' '}
                      <Link to="/login" state={loginState}>Sign in instead</Link>
                    </div>
                  </>
                )}

                {/* Success from the anonymous signup path */}
                {!isLoggedIn && signupStatus === 'success' && (
                  <Alert variant="success" className="mb-0">
                    Account created and invitation accepted. Redirecting…
                  </Alert>
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
