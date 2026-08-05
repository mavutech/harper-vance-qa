import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {useSelector} from 'react-redux';
import {Alert, Button, Card, Container} from 'react-bootstrap';
import Footer from '../layouts/Footer';
import Header from '../layouts/Header';
import HeaderMobile from '../layouts/HeaderMobile';
import CreateOrgModal from '../features/organizations/components/CreateOrgModal';
import {bootstrapSuperAdmin} from '../features/auth/api/authApi';
import * as firebaseAuthService from '../features/auth/services/firebaseAuthService';

/**
 * Landing shown when a route with `requireOrgMembership` is accessed by
 * a user who has no org context yet. Offers a direct "Create organization"
 * path for super_admin users; everyone else sees a "contact your admin"
 * message.
 */
export default function NoOrg() {
  const [showCreate, setShowCreate] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [bootstrapMessage, setBootstrapMessage] = useState(null);
  const [bootstrapTone, setBootstrapTone] = useState('info');
  const user = useSelector((s) => s.auth && s.auth.user);
  const isSuperAdmin = user && user.platformRole === 'super_admin';

  const handleBootstrap = async () => {
    setBootstrapping(true);
    setBootstrapMessage(null);
    try {
      await bootstrapSuperAdmin();
      // Force a fresh ID token so the new claim is visible immediately.
      await firebaseAuthService.refreshClaims();
      setBootstrapTone('success');
      setBootstrapMessage(
          'Super admin enabled. Reloading so the app picks up the new role\u2026',
      );
      // Full reload is the simplest way to re-hydrate Redux from the new token.
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setBootstrapTone('danger');
      setBootstrapMessage(
          (err && err.message) ||
          'Failed to enable super admin. Your email may not match the SUPER_ADMIN_EMAIL configured on the backend.',
      );
    } finally {
      setBootstrapping(false);
    }
  };

  return (
    <React.Fragment>
      <HeaderMobile />
      <Header />
      <div className="main main-app p-4 p-lg-5">
        <Container>
          <Card className="mx-auto" style={{maxWidth: 640}}>
            <Card.Body className="text-center p-4 p-lg-5">
              <div className="mb-3" style={{fontSize: 48, color: '#6c757d'}}>
                <i className="ri-building-2-line"></i>
              </div>
              <h3 className="mb-2">No organization</h3>
              <p className="text-secondary mb-4">
                {isSuperAdmin
                  ? 'You are signed in as a super administrator. Create your first organization to get started, or wait for an invitation.'
                  : 'You are signed in but not yet a member of any organization. Contact your administrator to request access.'}
              </p>

              {bootstrapMessage && (
                <Alert variant={bootstrapTone} className="text-start">
                  {bootstrapMessage}
                </Alert>
              )}

              <div className="d-flex gap-2 justify-content-center flex-wrap">
                {isSuperAdmin && (
                  <Button variant="primary" onClick={() => setShowCreate(true)}>
                    <i className="ri-add-line me-1"></i> Create organization
                  </Button>
                )}
                <Link to="/pages/profile">
                  <Button variant="outline-secondary">Edit profile</Button>
                </Link>
              </div>

              {!isSuperAdmin && (
                <div className="mt-4 pt-3 border-top">
                  <p className="fs-sm text-secondary mb-2">
                    Are you the platform&apos;s configured super administrator?
                  </p>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={handleBootstrap}
                    disabled={bootstrapping}
                  >
                    {bootstrapping ? 'Enabling\u2026' : 'Enable super admin'}
                  </Button>
                  <p className="fs-xs text-secondary mt-2 mb-0">
                    Only works if your email matches the <code>SUPER_ADMIN_EMAIL</code> env var on the backend.
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>
      <Footer />

      <CreateOrgModal
        show={showCreate}
        onHide={() => setShowCreate(false)}
      />
    </React.Fragment>
  );
}
