import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import {Alert, Badge, Button, Card, Col, Form, Nav, Row, Spinner} from 'react-bootstrap';

import Footer from '../layouts/Footer';
import Header from '../layouts/Header';
import HeaderMobile from '../layouts/HeaderMobile';
import Avatar from '../components/Avatar';
import {useDisplayName} from '../features/auth';
import {
  fetchMe,
  updateMe,
  changeEmail,
  changePassword,
  revokeAllSessions,
  resendVerificationEmail,
  clearErrors,
} from '../redux/authentication/authActions';
import {setShowTemplateMenus} from '../redux/preferences/preferencesActions';
import {
  setNotificationSoundEnabled,
  setBrowserAlertsEnabled,
  setBrowserPermission,
} from '../redux/notifications/notificationActions';
import {
  notificationsSupported,
  requestNotificationPermission,
} from '../features/sonaStats/utils/targetNotifications';

const ROLE_LABEL = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  user: 'Member',
};

const initialIdentity = {displayName: '', photoURL: ''};
const initialEmail = {newEmail: '', currentPassword: ''};
const initialPassword = {currentPassword: '', newPassword: '', confirmPassword: ''};

const Banner = ({tone, message, onDismiss}) => {
  if (!message) return null;
  return (
    <Alert variant={tone} onClose={onDismiss} dismissible className="mt-3">
      {message}
    </Alert>
  );
};

export default function Profile() {
  const dispatch = useDispatch();
  const showTemplateMenus = useSelector((state) => state.preferences.showTemplateMenus);
  const {
    soundEnabled,
    browserPermission,
    browserAlertsEnabled,
  } = useSelector((state) => state.notifications);
  const {user, loading, error} = useSelector((state) => state.auth || {});

  // Theme is tracked in DOM/localStorage rather than Redux (see Header.js).
  // Seed from either the current <html data-skin> attribute or the persisted key.
  const [skin, setSkin] = useState(() => {
    if (typeof document === 'undefined') return 'light';
    if (document.documentElement.getAttribute('data-skin') === 'dark') return 'dark';
    return localStorage.getItem('skin-mode') === 'dark' ? 'dark' : 'light';
  });

  const applySkin = (next) => {
    setSkin(next);
    const html = document.documentElement;
    if (next === 'dark') {
      html.setAttribute('data-skin', 'dark');
      localStorage.setItem('skin-mode', 'dark');
    } else {
      html.removeAttribute('data-skin');
      localStorage.removeItem('skin-mode');
    }
  };

  const onEnableBrowserAlerts = async () => {
    if (!notificationsSupported()) {
      dispatch(setBrowserPermission('unsupported'));
      return;
    }
    const result = await requestNotificationPermission();
    dispatch(setBrowserPermission(result || 'default'));
  };

  const [identity, setIdentity] = useState(initialIdentity);
  const [emailForm, setEmailForm] = useState(initialEmail);
  const [passwordForm, setPasswordForm] = useState(initialPassword);

  const [identityState, setIdentityState] = useState({tone: '', message: ''});
  const [emailState, setEmailState] = useState({tone: '', message: ''});
  const [passwordState, setPasswordState] = useState({tone: '', message: ''});
  const [sessionState, setSessionState] = useState({tone: '', message: ''});
  const [verifyState, setVerifyState] = useState({tone: '', message: ''});

  const [activeTab, setActiveTab] = useState('identity');

  // Fetch the authoritative profile from /api/users/me on mount.
  useEffect(() => {
    dispatch(fetchMe()).catch(() => undefined);
    return () => {
      dispatch(clearErrors());
    };
  }, [dispatch]);

  // Seed the identity form whenever the user payload changes.
  useEffect(() => {
    if (user) {
      setIdentity({
        displayName: user.displayName || user.name || '',
        photoURL: user.photoURL || '',
      });
    }
  }, [user]);

  const onIdentitySubmit = async (e) => {
    e.preventDefault();
    setIdentityState({tone: '', message: ''});
    try {
      const patch = {};
      const nextDisplayName = (identity.displayName || '').trim();
      const nextPhotoURL = (identity.photoURL || '').trim();
      const currentDisplayName = (user && (user.displayName || user.name)) || '';
      const currentPhotoURL = (user && user.photoURL) || '';

      if (nextDisplayName && nextDisplayName !== currentDisplayName) {
        patch.displayName = nextDisplayName;
      }
      // Backend schema requires photoURL to be a valid http(s) URI when present,
      // so only include it in the patch when the user actually entered a value.
      if (nextPhotoURL && nextPhotoURL !== currentPhotoURL) {
        patch.photoURL = nextPhotoURL;
      }
      if (Object.keys(patch).length === 0) {
        setIdentityState({tone: 'info', message: 'No changes to save.'});
        return;
      }
      await dispatch(updateMe(patch));
      setIdentityState({tone: 'success', message: 'Profile updated.'});
    } catch (err) {
      setIdentityState({tone: 'danger', message: err.message || 'Failed to update profile.'});
    }
  };

  const onEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailState({tone: '', message: ''});
    try {
      if (!emailForm.newEmail || !emailForm.currentPassword) {
        setEmailState({tone: 'danger', message: 'Both fields are required.'});
        return;
      }
      await dispatch(changeEmail({
        newEmail: emailForm.newEmail.trim().toLowerCase(),
        currentPassword: emailForm.currentPassword,
      }));
      setEmailForm(initialEmail);
      setEmailState({
        tone: 'success',
        message: 'Email updated. A verification email was sent to the new address.',
      });
    } catch (err) {
      setEmailState({tone: 'danger', message: err.message || 'Failed to change email.'});
    }
  };

  const onPasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordState({tone: '', message: ''});
    try {
      if (!passwordForm.currentPassword || !passwordForm.newPassword) {
        setPasswordState({tone: 'danger', message: 'All fields are required.'});
        return;
      }
      if (passwordForm.newPassword.length < 8) {
        setPasswordState({tone: 'danger', message: 'New password must be at least 8 characters.'});
        return;
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordState({tone: 'danger', message: 'New passwords do not match.'});
        return;
      }
      await dispatch(changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }));
      setPasswordForm(initialPassword);
      setPasswordState({tone: 'success', message: 'Password updated. Other sessions have been signed out.'});
    } catch (err) {
      setPasswordState({tone: 'danger', message: err.message || 'Failed to change password.'});
    }
  };

  const onRevokeSessions = async () => {
    setSessionState({tone: '', message: ''});
    try {
      await dispatch(revokeAllSessions());
      // The thunk also logs the user out locally — UI will navigate via guards.
    } catch (err) {
      setSessionState({tone: 'danger', message: err.message || 'Failed to sign out other sessions.'});
    }
  };

  const onResendVerify = async () => {
    setVerifyState({tone: '', message: ''});
    try {
      await dispatch(resendVerificationEmail());
      setVerifyState({tone: 'success', message: 'Verification email sent. Check your inbox.'});
    } catch (err) {
      setVerifyState({tone: 'danger', message: err.message || 'Failed to send verification email.'});
    }
  };

  const {displayName} = useDisplayName();
  const initial = (user && (user.displayName || user.name || user.email || 'U')).charAt(0).toUpperCase();
  const role = (user && user.role) || 'user';

  const tabs = [
    {key: 'identity', label: 'Identity'},
    {key: 'email', label: 'Email'},
    {key: 'password', label: 'Password'},
    {key: 'preferences', label: 'Preferences'},
    {key: 'security', label: 'Security'},
  ];

  return (
    <React.Fragment>
      <HeaderMobile />
      <Header />
      <div className="main main-app p-4 p-lg-5">
        <h2 className="main-title">Profile</h2>

        <div className="media-profile mb-4">
          <div className="media-img mb-3 mb-sm-0">
            {user && user.photoURL ? (
              <Avatar img={user.photoURL} size="xl" shape="circle" />
            ) : (
              <Avatar initial={initial} size="xl" shape="circle" />
            )}
          </div>
          <div className="media-body">
            <h5 className="media-name">{user ? displayName : 'Profile'}</h5>
            <p className="d-flex gap-2 mb-2 align-items-center flex-wrap">
              <span><i className="ri-mail-line"></i> {user ? user.email : '—'}</span>
              {user && user.emailVerified ? (
                <Badge bg="success">Verified</Badge>
              ) : (
                <Badge bg="warning" text="dark">Email not verified</Badge>
              )}
              <Badge bg="info">{ROLE_LABEL[role] || role}</Badge>
            </p>
            {!loading && error ? <span className="text-danger small">{error}</span> : null}
          </div>
        </div>

        {user && !user.emailVerified ? (
          <Alert variant="warning" className="d-flex align-items-center justify-content-between">
            <span>
              <strong>Verify your email</strong> — until then, some features may be unavailable.
            </span>
            <Button variant="outline-warning" size="sm" onClick={onResendVerify}>
              Resend verification
            </Button>
          </Alert>
        ) : null}
        <Banner tone={verifyState.tone} message={verifyState.message} onDismiss={() => setVerifyState({tone: '', message: ''})} />

        <Nav
          className="nav-line mb-4"
          activeKey={activeTab}
          onSelect={(k) => k && setActiveTab(k)}
        >
          {tabs.map((t) => (
            <Nav.Link key={t.key} eventKey={t.key}>
              {t.label}
            </Nav.Link>
          ))}
        </Nav>

        {activeTab === 'identity' && (
          <Card className="card-settings">
            <Card.Header>
              <Card.Title>Identity</Card.Title>
              <Card.Text>How your name and picture appear across the app.</Card.Text>
            </Card.Header>
            <Card.Body className="p-0">
              <Form onSubmit={onIdentitySubmit}>
                <div className="setting-item">
                  <Row className="g-2 align-items-center">
                    <Col md="5">
                      <h6>Display name</h6>
                      <p>Shown next to your avatar and on activity you generate.</p>
                    </Col>
                    <Col md>
                      <Form.Control
                        type="text"
                        value={identity.displayName}
                        onChange={(e) => setIdentity({...identity, displayName: e.target.value})}
                        maxLength={120}
                        placeholder="Your name as shown across the app"
                      />
                    </Col>
                  </Row>
                </div>
                <div className="setting-item">
                  <Row className="g-2 align-items-center">
                    <Col md="5">
                      <h6>Photo URL</h6>
                      <p>Link to an image (https://…) used as your avatar.</p>
                    </Col>
                    <Col md>
                      <Form.Control
                        type="url"
                        value={identity.photoURL}
                        onChange={(e) => setIdentity({...identity, photoURL: e.target.value})}
                        maxLength={2048}
                        placeholder="https://..."
                      />
                    </Col>
                  </Row>
                </div>
                <div className="setting-item">
                  <Row className="g-2 align-items-center">
                    <Col md="5">
                      <h6>&nbsp;</h6>
                    </Col>
                    <Col md>
                      <div className="d-flex align-items-center gap-3">
                        <Button type="submit" variant="primary" disabled={loading}>
                          {loading ? <Spinner size="sm" animation="border" /> : 'Save changes'}
                        </Button>
                        <Banner tone={identityState.tone} message={identityState.message} onDismiss={() => setIdentityState({tone: '', message: ''})} />
                      </div>
                    </Col>
                  </Row>
                </div>
              </Form>
            </Card.Body>
          </Card>
        )}

        {activeTab === 'email' && (
          <Card className="card-settings">
            <Card.Header>
              <Card.Title>Email</Card.Title>
              <Card.Text>Changing your email signs you out of other devices and resets verification. You will be asked to re-enter your current password.</Card.Text>
            </Card.Header>
            <Card.Body className="p-0">
              <Form onSubmit={onEmailSubmit}>
                <div className="setting-item">
                  <Row className="g-2 align-items-center">
                    <Col md="5">
                      <h6>Current email</h6>
                      <p>The address currently associated with this account.</p>
                    </Col>
                    <Col md>
                      <Form.Control type="email" value={(user && user.email) || ''} disabled readOnly />
                    </Col>
                  </Row>
                </div>
                <div className="setting-item">
                  <Row className="g-2 align-items-center">
                    <Col md="5">
                      <h6>New email</h6>
                      <p>We'll send a verification link to this address.</p>
                    </Col>
                    <Col md>
                      <Form.Control
                        type="email"
                        value={emailForm.newEmail}
                        onChange={(e) => setEmailForm({...emailForm, newEmail: e.target.value})}
                        required
                      />
                    </Col>
                  </Row>
                </div>
                <div className="setting-item">
                  <Row className="g-2 align-items-center">
                    <Col md="5">
                      <h6>Current password</h6>
                      <p>Required to confirm the change.</p>
                    </Col>
                    <Col md>
                      <Form.Control
                        type="password"
                        value={emailForm.currentPassword}
                        onChange={(e) => setEmailForm({...emailForm, currentPassword: e.target.value})}
                        autoComplete="current-password"
                        required
                      />
                    </Col>
                  </Row>
                </div>
                <div className="setting-item">
                  <Row className="g-2 align-items-center">
                    <Col md="5">
                      <h6>&nbsp;</h6>
                    </Col>
                    <Col md>
                      <div className="d-flex align-items-center gap-3">
                        <Button type="submit" variant="primary" disabled={loading}>
                          {loading ? <Spinner size="sm" animation="border" /> : 'Update email'}
                        </Button>
                        <Banner tone={emailState.tone} message={emailState.message} onDismiss={() => setEmailState({tone: '', message: ''})} />
                      </div>
                    </Col>
                  </Row>
                </div>
              </Form>
            </Card.Body>
          </Card>
        )}

        {activeTab === 'password' && (
          <Card className="card-settings">
            <Card.Header>
              <Card.Title>Password</Card.Title>
              <Card.Text>Choose a strong password (at least 8 characters). Changing your password will sign you out everywhere else.</Card.Text>
            </Card.Header>
            <Card.Body className="p-0">
              <Form onSubmit={onPasswordSubmit}>
                <div className="setting-item">
                  <Row className="g-2 align-items-center">
                    <Col md="5">
                      <h6>Current password</h6>
                      <p>Enter your existing password to confirm it's you.</p>
                    </Col>
                    <Col md>
                      <Form.Control
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        autoComplete="current-password"
                        required
                      />
                    </Col>
                  </Row>
                </div>
                <div className="setting-item">
                  <Row className="g-2 align-items-center">
                    <Col md="5">
                      <h6>New password</h6>
                      <p>Minimum 8 characters.</p>
                    </Col>
                    <Col md>
                      <Form.Control
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        autoComplete="new-password"
                        minLength={8}
                        required
                      />
                    </Col>
                  </Row>
                </div>
                <div className="setting-item">
                  <Row className="g-2 align-items-center">
                    <Col md="5">
                      <h6>Confirm new password</h6>
                      <p>Re-type the new password to catch typos.</p>
                    </Col>
                    <Col md>
                      <Form.Control
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        autoComplete="new-password"
                        minLength={8}
                        required
                      />
                    </Col>
                  </Row>
                </div>
                <div className="setting-item">
                  <Row className="g-2 align-items-center">
                    <Col md="5">
                      <h6>&nbsp;</h6>
                    </Col>
                    <Col md>
                      <div className="d-flex align-items-center gap-3">
                        <Button type="submit" variant="primary" disabled={loading}>
                          {loading ? <Spinner size="sm" animation="border" /> : 'Change password'}
                        </Button>
                        <Banner tone={passwordState.tone} message={passwordState.message} onDismiss={() => setPasswordState({tone: '', message: ''})} />
                      </div>
                    </Col>
                  </Row>
                </div>
              </Form>
            </Card.Body>
          </Card>
        )}

        {activeTab === 'security' && (
          <Card className="card-settings">
            <Card.Header>
              <Card.Title>Security</Card.Title>
              <Card.Text>Manage sessions and account safety.</Card.Text>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="setting-item">
                <Row className="g-2 align-items-center">
                  <Col md="5">
                    <h6>Active sessions</h6>
                    <p>Signing out everywhere immediately invalidates every device session, including this one. You will need to sign in again.</p>
                  </Col>
                  <Col md>
                    <div className="d-flex align-items-center gap-3 flex-wrap">
                      <Button variant="outline-danger" onClick={onRevokeSessions} disabled={loading}>
                        Sign out everywhere
                      </Button>
                      <Banner tone={sessionState.tone} message={sessionState.message} onDismiss={() => setSessionState({tone: '', message: ''})} />
                    </div>
                  </Col>
                </Row>
              </div>
            </Card.Body>
          </Card>
        )}

        {activeTab === 'preferences' && (
          <Card className="card-settings">
            <Card.Header>
              <Card.Title>Preferences</Card.Title>
              <Card.Text>Personal display settings. These only affect what you see.</Card.Text>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="setting-item">
                <Row className="g-2 align-items-center">
                  <Col md="5">
                    <h6>Theme</h6>
                    <p>Switch between the light and dark skin for the entire app.</p>
                  </Col>
                  <Col md>
                    <Form.Check
                      inline
                      type="radio"
                      id="pref-skin-light"
                      name="pref-skin"
                      label="Light"
                      checked={skin === 'light'}
                      onChange={() => applySkin('light')}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      id="pref-skin-dark"
                      name="pref-skin"
                      label="Dark"
                      checked={skin === 'dark'}
                      onChange={() => applySkin('dark')}
                    />
                  </Col>
                </Row>
              </div>
              <div className="setting-item">
                <Row className="g-2 align-items-center">
                  <Col md="5">
                    <h6>Notification sound</h6>
                    <p>Play a short audio ping when a new SONA target notification arrives.</p>
                  </Col>
                  <Col md>
                    <Form.Check
                      type="switch"
                      id="pref-notif-sound"
                      label={soundEnabled ? 'On' : 'Off'}
                      checked={soundEnabled}
                      onChange={(e) => dispatch(setNotificationSoundEnabled(e.target.checked))}
                    />
                  </Col>
                </Row>
              </div>
              <div className="setting-item">
                <Row className="g-2 align-items-center">
                  <Col md="5">
                    <h6>Browser notifications</h6>
                    <p>
                      Fire a native OS notification when a target arrives, even if the tab
                      isn't focused. Requires browser permission.
                    </p>
                  </Col>
                  <Col md>
                    <div className="d-flex align-items-center gap-3 flex-wrap">
                      <Form.Check
                        type="switch"
                        id="pref-notif-browser"
                        label={browserAlertsEnabled ? 'On' : 'Off'}
                        checked={browserAlertsEnabled}
                        onChange={(e) => dispatch(setBrowserAlertsEnabled(e.target.checked))}
                        disabled={browserPermission === 'denied' || browserPermission === 'unsupported'}
                      />
                      {browserPermission === 'granted' && (
                        <Badge bg="success">Permission granted</Badge>
                      )}
                      {browserPermission === 'denied' && (
                        <Badge bg="danger">Permission denied</Badge>
                      )}
                      {browserPermission === 'unsupported' && (
                        <Badge bg="secondary">Not supported</Badge>
                      )}
                      {(browserPermission === 'default' || !browserPermission) && (
                        <Button size="sm" variant="outline-primary" onClick={onEnableBrowserAlerts}>
                          Enable in browser
                        </Button>
                      )}
                    </div>
                  </Col>
                </Row>
              </div>
              <div className="setting-item">
                <Row className="g-2 align-items-center">
                  <Col md="5">
                    <h6>Show template menu groups</h6>
                    <p>Reveals the theme's demo sections (Dashboard, Applications, Pages, UI Elements) in the sidebar. Off by default so the menu stays focused on SONA Analytics.</p>
                  </Col>
                  <Col md>
                    <Form.Check
                      type="switch"
                      id="pref-show-template-menus"
                      label={showTemplateMenus ? 'On' : 'Off'}
                      checked={showTemplateMenus}
                      onChange={(e) => dispatch(setShowTemplateMenus(e.target.checked))}
                    />
                  </Col>
                </Row>
              </div>
            </Card.Body>
          </Card>
        )}

        <Footer />
      </div>
    </React.Fragment>
  );
}
