import React, {useEffect, useState} from 'react';
import {Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import Footer from '../layouts/Footer';
import Header from '../layouts/Header';
import HeaderMobile from '../layouts/HeaderMobile';
import {useCurrentOrg} from '../features/organizations/hooks/useCurrentOrg';
import {fetchOrgs, clearOrgError} from '../features/organizations/redux/orgActions';
import {updateOrg} from '../features/organizations/services/organizationCallables';

/**
 * Org settings — read-only for members, editable for owners/admins.
 * Guarded by ProtectedRoute with requireOrgRole=['owner','admin'] at
 * the router layer; this component still degrades gracefully if a
 * non-admin somehow lands here.
 */
export default function OrgSettings() {
  const dispatch = useDispatch();
  const {currentOrg, currentOrgRole, isAdmin} = useCurrentOrg();
  const {loading, error} = useSelector((s) => s.organization);

  const [name, setName] = useState(currentOrg ? currentOrg.name : '');
  const [emailDomainsRaw, setEmailDomainsRaw] = useState(
      currentOrg && Array.isArray(currentOrg.emailDomains)
        ? currentOrg.emailDomains.join(', ')
        : '',
  );
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // Sync local form state when currentOrg changes (e.g. after switch).
  useEffect(() => {
    if (currentOrg) {
      setName(currentOrg.name || '');
      setEmailDomainsRaw(
          Array.isArray(currentOrg.emailDomains)
            ? currentOrg.emailDomains.join(', ')
            : '',
      );
    }
  }, [currentOrg]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentOrg || !isAdmin) return;
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    try {
      const emailDomains = emailDomainsRaw
          .split(',')
          .map((d) => d.trim().toLowerCase())
          .filter(Boolean);
      await updateOrg({orgId: currentOrg.id, name: name.trim(), emailDomains});
      // Re-fetch to pick up the server-authored update.
      await dispatch(fetchOrgs()).catch(() => {});
      setSaveMessage('Organization saved.');
    } catch (err) {
      setSaveError((err && err.message) || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (!currentOrg) {
    return (
      <React.Fragment>
        <HeaderMobile />
        <Header />
        <div className="main main-app p-4 p-lg-5">
          <Container>
            <Card>
              <Card.Body>
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" />
                  </div>
                ) : (
                  <p className="mb-0 text-secondary">No organization selected.</p>
                )}
              </Card.Body>
            </Card>
          </Container>
        </div>
        <Footer />
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <HeaderMobile />
      <Header />
      <div className="main main-app p-4 p-lg-5">
        <div className="d-md-flex align-items-center justify-content-between mb-4">
          <div>
            <h2 className="main-title mb-1">Organization settings</h2>
            <p className="text-secondary mb-0">
              {currentOrg.name}
              {' '}
              <Badge bg="secondary" className="ms-1 text-uppercase fs-xs">{currentOrgRole}</Badge>
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="warning" dismissible onClose={() => dispatch(clearOrgError())}>
            {error}
          </Alert>
        )}

        <Card className="card-settings">
          <Card.Header>
            <Card.Title>General</Card.Title>
            <Card.Text>
              {isAdmin
                ? 'Edit your organization name and allowed email domains.'
                : 'Read-only. Contact an admin to change these.'}
            </Card.Text>
          </Card.Header>
          <Card.Body className="p-0">
            <Form onSubmit={handleSave}>
              <div className="setting-item">
                <Row className="g-2 align-items-center">
                  <Col md="5">
                    <h6>Organization name</h6>
                    <p>Displayed in the switcher and on invites.</p>
                  </Col>
                  <Col md>
                    <Form.Control
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isAdmin || saving}
                      required
                    />
                  </Col>
                </Row>
              </div>

              <div className="setting-item">
                <Row className="g-2 align-items-center">
                  <Col md="5">
                    <h6>Allowed email domains</h6>
                    <p>Comma-separated. Used to route SSO signups to this org.</p>
                  </Col>
                  <Col md>
                    <Form.Control
                      type="text"
                      value={emailDomainsRaw}
                      onChange={(e) => setEmailDomainsRaw(e.target.value)}
                      placeholder="acme.example, acme.co"
                      disabled={!isAdmin || saving}
                    />
                  </Col>
                </Row>
              </div>

              <div className="setting-item">
                <Row className="g-2 align-items-center">
                  <Col md="5">
                    <h6>Plan</h6>
                    <p>Read-only. Contact sales to change.</p>
                  </Col>
                  <Col md>
                    <p className="mb-0"><strong>{currentOrg.plan || 'pilot'}</strong> · seats: {currentOrg.seatLimit || '—'}</p>
                  </Col>
                </Row>
              </div>

              {isAdmin && (
                <div className="setting-item">
                  <div className="d-flex gap-2 align-items-center">
                    <Button type="submit" variant="primary" disabled={saving}>
                      {saving ? 'Saving…' : 'Save changes'}
                    </Button>
                    {saveMessage && <span className="text-success">{saveMessage}</span>}
                    {saveError && <span className="text-danger">{saveError}</span>}
                  </div>
                </div>
              )}
            </Form>
          </Card.Body>
        </Card>
      </div>
      <Footer />
    </React.Fragment>
  );
}
