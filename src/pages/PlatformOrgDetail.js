import React, {useCallback, useEffect, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {Alert, Badge, Button, Card, Col, Container, Form, Modal, Row, Spinner, Table} from 'react-bootstrap';
import Footer from '../layouts/Footer';
import Header from '../layouts/Header';
import HeaderMobile from '../layouts/HeaderMobile';
import Avatar from '../components/Avatar';
import * as organizationApi from '../features/organizations/services/organizationApi';

const PLAN_OPTIONS = ['pilot', 'standard', 'enterprise'];

/**
 * Platform-admin detail view for a single organization. Shows org info,
 * roster, pending invitations, and plan controls. Guarded by
 * requireRole: ['super_admin'] at the router layer.
 */
export default function PlatformOrgDetail() {
  const {orgId} = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [banner, setBanner] = useState(null); // {tone, message}

  // Plan-change form
  const [plan, setPlan] = useState('pilot');
  const [seatLimit, setSeatLimit] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteOrgRole, setInviteOrgRole] = useState('member');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteResult, setInviteResult] = useState(null); // {rawToken, email, invitationId}
  const [copyLabel, setCopyLabel] = useState('Copy');

  // Delete confirmation
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await organizationApi.getOrgDetail(orgId);
      setDetail(d);
      setPlan(d.org.plan || 'pilot');
      setSeatLimit(d.org.seatLimit || '');
    } catch (err) {
      setError((err && err.message) || 'Failed to load organization.');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setSavingPlan(true);
    setBanner(null);
    try {
      const payload = {orgId, plan};
      if (String(seatLimit).trim()) {
        payload.seatLimit = Number(seatLimit);
      }
      await organizationApi.changeOrgPlan(payload);
      setBanner({tone: 'success', message: 'Plan updated.'});
      await load();
    } catch (err) {
      setBanner({tone: 'danger', message: (err && err.message) || 'Failed to update plan.'});
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await organizationApi.deleteOrg(orgId);
      navigate('/pages/orgs', {replace: true});
    } catch (err) {
      setBanner({tone: 'danger', message: (err && err.message) || 'Failed to delete organization.'});
      setShowDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  // ── Member actions ───────────────────────────────────────────────────────
  const openInvite = () => {
    setInviteEmail('');
    setInviteOrgRole('member');
    setInviteError(null);
    setInviteResult(null);
    setCopyLabel('Copy');
    setShowInvite(true);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteBusy(true);
    setInviteError(null);
    try {
      const {invitationId, rawToken} = await organizationApi.inviteMember({
        orgId,
        email: inviteEmail.trim().toLowerCase(),
        orgRole: inviteOrgRole,
      });
      setInviteResult({invitationId, rawToken, email: inviteEmail.trim().toLowerCase()});
      await load();
    } catch (err) {
      setInviteError((err && err.message) || 'Failed to send invitation.');
    } finally {
      setInviteBusy(false);
    }
  };

  const inviteLink = inviteResult
    ? `${window.location.origin}/pages/accept-invite?token=${encodeURIComponent(inviteResult.rawToken)}`
    : null;

  const handleCopyInvite = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopyLabel('Copied');
      setTimeout(() => setCopyLabel('Copy'), 1500);
    } catch (_e) {
      setCopyLabel('Copy failed');
    }
  };

  const handleRoleChange = async (uid, orgRole) => {
    try {
      await organizationApi.changeMemberOrgRole({orgId, uid, orgRole});
      setBanner({tone: 'success', message: 'Role updated.'});
      await load();
    } catch (err) {
      setBanner({tone: 'danger', message: (err && err.message) || 'Failed to change role.'});
    }
  };

  const handleRemoveMember = async (uid) => {
    if (!window.confirm('Remove this member? They will lose access immediately.')) return;
    try {
      await organizationApi.removeMember({orgId, uid});
      setBanner({tone: 'success', message: 'Member removed.'});
      await load();
    } catch (err) {
      setBanner({tone: 'danger', message: (err && err.message) || 'Failed to remove member.'});
    }
  };

  const handleRevokeInvitation = async (invitationId) => {
    try {
      await organizationApi.revokeInvitation({orgId, invitationId});
      setBanner({tone: 'success', message: 'Invitation revoked.'});
      await load();
    } catch (err) {
      setBanner({tone: 'danger', message: (err && err.message) || 'Failed to revoke invitation.'});
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toISOString().slice(0, 10);
    } catch (_e) {
      return '—';
    }
  };

  const memberLabel = (member) => member.displayName || member.email || '—';

  const memberInitial = (member) =>
    (member.displayName || member.email || member.uid || '?').charAt(0).toUpperCase();

  const org = detail && detail.org;
  const canDelete = deleteConfirmText.trim().toLowerCase() === (org && org.slug ? org.slug.toLowerCase() : null);

  return (
    <React.Fragment>
      <HeaderMobile />
      <Header />
      <div className="main main-app p-4 p-lg-5">
        <Container fluid>
          <div className="mb-3">
            <Link to="/pages/orgs" className="text-secondary">
              <i className="ri-arrow-left-line me-1"></i> All organizations
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : !org ? (
            <Alert variant="warning">Organization not found.</Alert>
          ) : (
            <>
              <div className="d-md-flex align-items-start justify-content-between mb-4">
                <div>
                  <h2 className="main-title mb-1">{org.name}</h2>
                  <p className="text-secondary mb-0">
                    <span className="font-monospace">{org.slug}</span>
                    {' · '}
                    <Badge bg={org.plan === 'enterprise' ? 'primary' : org.plan === 'standard' ? 'info' : 'secondary'} className="text-uppercase">
                      {org.plan || 'pilot'}
                    </Badge>
                    {' · seats '}
                    {detail.seatUsage.used}/{detail.seatUsage.limit}
                  </p>
                </div>
              </div>

              {banner && (
                <Alert variant={banner.tone} dismissible onClose={() => setBanner(null)}>
                  {banner.message}
                </Alert>
              )}

              <Row className="g-3">
                <Col lg={6}>
                  <Card className="mb-3">
                    <Card.Header><Card.Title>Details</Card.Title></Card.Header>
                    <Card.Body>
                      <dl className="row mb-0">
                        <dt className="col-sm-4">ID</dt>
                        <dd className="col-sm-8 font-monospace">{org.id}</dd>
                        <dt className="col-sm-4">Created</dt>
                        <dd className="col-sm-8">{formatDate(org.createdAt)}</dd>
                        <dt className="col-sm-4">Updated</dt>
                        <dd className="col-sm-8">{formatDate(org.updatedAt)}</dd>
                        <dt className="col-sm-4">Created by</dt>
                        <dd className="col-sm-8 font-monospace">{org.createdBy}</dd>
                        <dt className="col-sm-4">Email domains</dt>
                        <dd className="col-sm-8">
                          {Array.isArray(org.emailDomains) && org.emailDomains.length > 0
                            ? org.emailDomains.join(', ')
                            : <span className="text-secondary">None</span>}
                        </dd>
                      </dl>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={6}>
                  <Card className="mb-3">
                    <Card.Header>
                      <Card.Title>Plan &amp; seats</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <Form onSubmit={handleSavePlan}>
                        <Row className="g-3 align-items-end">
                          <Col md={5}>
                            <Form.Label>Plan</Form.Label>
                            <Form.Select
                              value={plan}
                              onChange={(e) => setPlan(e.target.value)}
                              disabled={savingPlan}
                            >
                              {PLAN_OPTIONS.map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </Form.Select>
                          </Col>
                          <Col md={4}>
                            <Form.Label>
                              Seat limit <span className="text-secondary fs-xs">(optional)</span>
                            </Form.Label>
                            <Form.Control
                              type="number"
                              value={seatLimit}
                              onChange={(e) => setSeatLimit(e.target.value)}
                              min={1}
                              max={10000}
                              placeholder="Plan default"
                              disabled={savingPlan}
                            />
                          </Col>
                          <Col md={3}>
                            <Button type="submit" variant="primary" disabled={savingPlan} className="w-100">
                              {savingPlan ? 'Saving\u2026' : 'Save plan'}
                            </Button>
                          </Col>
                        </Row>
                      </Form>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Card className="mb-3">
                <Card.Header className="d-flex align-items-center justify-content-between">
                  <Card.Title className="mb-0">Members ({detail.members.length})</Card.Title>
                  <Button variant="primary" size="sm" onClick={openInvite}>
                    <i className="ri-user-add-line me-1"></i> Invite member
                  </Button>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th style={{width: 1}}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.members.map((m) => (
                        <tr key={m.uid}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {m.photoURL ? (
                                <Avatar img={m.photoURL} size="sm" />
                              ) : (
                                <Avatar initial={memberInitial(m)} size="sm" />
                              )}
                              <div className="d-flex flex-column">
                                <span>{memberLabel(m)}</span>
                                {m.email && m.displayName && (
                                  <small className="text-secondary">{m.email}</small>
                                )}
                                {!m.displayName && !m.email && (
                                  <small className="font-monospace text-secondary">{m.uid}</small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            {m.orgRole !== 'owner' ? (
                              <Form.Select
                                size="sm"
                                value={m.orgRole}
                                onChange={(e) => handleRoleChange(m.uid, e.target.value)}
                                style={{maxWidth: 140}}
                              >
                                <option value="member">member</option>
                                <option value="admin">admin</option>
                                <option value="owner">owner</option>
                              </Form.Select>
                            ) : (
                              <Badge bg="primary" className="text-uppercase">owner</Badge>
                            )}
                          </td>
                          <td>{formatDate(m.joinedAt)}</td>
                          <td>
                            {m.orgRole !== 'owner' && (
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleRemoveMember(m.uid)}
                              >
                                Remove
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {detail.members.length === 0 && (
                        <tr><td colSpan={4} className="text-center text-secondary">No members.</td></tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              <Card className="mb-3">
                <Card.Header>
                  <Card.Title>Pending invitations ({detail.pendingInvitations.length})</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Expires</th>
                        <th style={{width: 1}}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.pendingInvitations.map((inv) => (
                        <tr key={inv.id}>
                          <td>{inv.email}</td>
                          <td><Badge bg="secondary" className="text-uppercase">{inv.orgRole}</Badge></td>
                          <td>{formatDate(inv.expiresAt)}</td>
                          <td>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleRevokeInvitation(inv.id)}
                            >
                              Revoke
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {detail.pendingInvitations.length === 0 && (
                        <tr><td colSpan={4} className="text-center text-secondary">No pending invitations.</td></tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              {/* Danger zone */}
              <Card border="danger">
                <Card.Header className="text-danger">
                  <Card.Title>Danger zone</Card.Title>
                </Card.Header>
                <Card.Body className="d-md-flex align-items-center justify-content-between gap-3">
                  <div>
                    <h6 className="mb-1">Delete organization</h6>
                    <p className="mb-0 text-secondary fs-sm">
                      Removes the org and all members, invitations, and audit logs. This cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="outline-danger"
                    onClick={() => setShowDelete(true)}
                    className="mt-3 mt-md-0"
                  >
                    Delete organization
                  </Button>
                </Card.Body>
              </Card>
            </>
          )}
        </Container>
      </div>
      <Footer />

      <Modal show={showInvite} onHide={() => setShowInvite(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Invite member</Modal.Title>
        </Modal.Header>
        {inviteResult ? (
          <>
            <Modal.Body>
              <Alert variant="success" className="mb-3">
                Invitation created for <strong>{inviteResult.email}</strong>.
              </Alert>
              <p className="text-secondary mb-2">
                Copy the invitation link and send it to the invitee. It expires in 7 days.
              </p>
              <Form.Group className="mt-3">
                <Form.Label>Invitation link</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    value={inviteLink}
                    readOnly
                    onFocus={(e) => e.target.select()}
                  />
                  <Button variant="outline-primary" onClick={handleCopyInvite}>
                    {copyLabel}
                  </Button>
                </div>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onClick={() => setShowInvite(false)}>Done</Button>
            </Modal.Footer>
          </>
        ) : (
          <Form onSubmit={handleInvite}>
            <Modal.Body>
              {inviteError && <Alert variant="danger">{inviteError}</Alert>}
              <Row className="g-3">
                <Col md={8}>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </Col>
                <Col md={4}>
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    value={inviteOrgRole}
                    onChange={(e) => setInviteOrgRole(e.target.value)}
                  >
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                  </Form.Select>
                </Col>
              </Row>
              <p className="fs-xs text-secondary mt-3 mb-0">
                Invitations expire after 7 days. You&apos;ll get a copyable link on the next step.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={() => setShowInvite(false)} disabled={inviteBusy}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={inviteBusy || !inviteEmail}>
                {inviteBusy ? 'Sending\u2026' : 'Send invitation'}
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Modal>

      <Modal show={showDelete} onHide={() => { setShowDelete(false); setDeleteConfirmText(''); }} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Delete organization</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            This will permanently delete <strong>{org && org.name}</strong> and every member, invitation, and audit log associated with it.
          </Alert>
          <p className="mb-2">
            To confirm, type the org slug <code>{org && org.slug}</code> below:
          </p>
          <Form.Control
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder={org && org.slug}
            autoFocus
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => { setShowDelete(false); setDeleteConfirmText(''); }} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={!canDelete || deleting}>
            {deleting ? 'Deleting\u2026' : 'Delete organization'}
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
}
