import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Link, useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import {Alert, Badge, Button, Card, Container, Form, Spinner} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import {
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {auth} from '../firebase/config';
import {
  acceptInvitation,
  acceptInvitationWithSignup,
  previewInvitation,
} from '../features/organizations/services/organizationApi';
import {fetchOrgs, switchOrg} from '../features/organizations/redux/orgActions';
import {checkAuthStatus, logoutUser, signIn} from '../redux/authentication/authActions';

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

  // Google SSO state. `googleAutoAccept` marks the session as "arrived
  // here via SSO" so the effect below can auto-fire the accept as soon as
  // Redux catches up with the fresh sign-in.
  const [googleStatus, setGoogleStatus] = useState('idle'); // idle | pending | error
  const [googleError, setGoogleError] = useState(null);
  const googleAutoAccept = useRef(false);

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

  const handleContinueWithGoogle = async () => {
    setGoogleStatus('pending');
    setGoogleError(null);
    try {
      const provider = new GoogleAuthProvider();
      // Force the account chooser so a stale Google session in the
      // browser can't silently pick the wrong account.
      provider.setCustomParameters({prompt: 'select_account'});
      await signInWithPopup(auth, provider);
      // Mark this so the effect below runs the accept as soon as Redux
      // reflects the fresh sign-in.
      googleAutoAccept.current = true;
      await dispatch(checkAuthStatus()).catch(() => {});
    } catch (err) {
      googleAutoAccept.current = false;
      // User closing the popup is not an error we want to surface.
      if (err && err.code === 'auth/popup-closed-by-user') {
        setGoogleStatus('idle');
        return;
      }
      setGoogleStatus('error');
      setGoogleError({
        message: (err && err.message) || 'Google sign-in failed.',
        code: (err && err.code) || null,
      });
    }
  };

  // After a successful Google sign-in the anonymous branch unmounts and
  // the "signed in" branch mounts. If the account's email matches the
  // invitation, auto-accept — otherwise render the mismatch alert.
  useEffect(() => {
    if (!googleAutoAccept.current) return;
    if (!isLoggedIn || previewStatus !== 'ok') return;
    googleAutoAccept.current = false;
    if (emailsMatch) {
      handleAccept();
    }
    // If !emailsMatch, the mismatch UI renders naturally — no auto action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, previewStatus, emailsMatch]);

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
      const {orgId} = await acceptInvitationWithSignup({token, password});
      // Server has provisioned the Firebase user with the invited email
      // and this password. Sign in through the shared thunk so Redux
      // hydrates exactly the same way as the normal login path.
      await dispatch(signIn({email: preview.invitedEmail, password}));
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
                    <div className="d-grid mb-3">
                      <Button
                        variant="outline-dark"
                        onClick={handleContinueWithGoogle}
                        disabled={googleStatus === 'pending'}
                      >
                        {googleStatus === 'pending' ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                            Opening Google…
                          </>
                        ) : (
                          <>
                            <i className="ri-google-fill me-2"></i>
                            Continue with Google
                          </>
                        )}
                      </Button>
                    </div>
                    {googleStatus === 'error' && googleError && (
                      <Alert variant="danger" className="mb-3">
                        <div>{googleError.message}</div>
                        {googleError.code && (
                          <div className="fs-xs text-secondary mt-2">
                            Code: <code>{googleError.code}</code>
                          </div>
                        )}
                      </Alert>
                    )}

                    {/* Password path is hidden when the org enforces SSO. */}
                    {preview.ssoRequired ? (
                      <Alert variant="info" className="mb-0">
                        <strong>{preview.orgName}</strong> requires single sign-on. Use{' '}
                        <em>Continue with Google</em> above to accept your invitation.
                      </Alert>
                    ) : (
                      <>
                        <div className="divider mb-3"><span>or set a password</span></div>

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
