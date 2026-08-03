import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, Badge, Button, Card, Col, Container, Form, Modal, Row, Spinner, Table} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import Footer from '../layouts/Footer';
import Header from '../layouts/Header';
import HeaderMobile from '../layouts/HeaderMobile';
import {useCurrentOrg} from '../features/organizations/hooks/useCurrentOrg';
import {
  changeMemberRole,
  getOrgDetail,
  inviteMember,
  removeMember,
  revokeInvitation,
} from '../features/organizations/services/organizationApi';
import {clearOrgError} from '../features/organizations/redux/orgActions';
import Avatar from '../components/Avatar';

/**
 * Formats a date value (ISO string from the API, or a legacy Firestore
 * Timestamp) as YYYY-MM-DD. Returns an em dash when absent/unparseable.
 *
 * @param {string|{toDate: () => Date}|null|undefined} value
 * @returns {string}
 */
const formatDate = (value) => {
  if (!value) return '—';
  try {
    const d = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toISOString().slice(0, 10);
  } catch (_e) {
    return '—';
  }
};

/**
 * Org members roster + pending invitations.
 * Route-guarded to owner/admin at the router layer.
 */
export default function OrgMembers() {
  const dispatch = useDispatch();
  const {currentOrg, isAdmin, isOwner} = useCurrentOrg();
  const {error} = useSelector((s) => s.organization);
  const orgId = currentOrg ? currentOrg.id : null;

  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [rosterError, setRosterError] = useState(null);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [banner, setBanner] = useState(null); // {tone, message}

  const loadRoster = useCallback(async () => {
    if (!orgId) return;
    setLoadingRoster(true);
    setRosterError(null);
    try {
      // One call: the backend returns the roster (with profile fields joined
      // in from users/{uid}) plus pending invitations. Profile data is not
      // duplicated on member docs — it is resolved by reference server-side.
      const detail = await getOrgDetail(orgId);
      setMembers(detail.members || []);
      setInvitations(detail.pendingInvitations || []);
    } catch (err) {
      setRosterError((err && err.message) || 'Failed to load roster.');
    } finally {
      setLoadingRoster(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  // Refresh the roster periodically so pending invitations disappear when
  // invitees accept them in another session. The list is otherwise stale
  // because the page only reloads after admin-initiated actions.
  useEffect(() => {
    if (!orgId) return;
    const interval = setInterval(() => {
      loadRoster();
    }, 10000);
    return () => clearInterval(interval);
  }, [orgId, loadRoster]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteBusy(true);
    setInviteError(null);
    try {
      await inviteMember({orgId, email: inviteEmail.trim().toLowerCase(), role: inviteRole});
      setBanner({tone: 'success', message: `Invitation sent to ${inviteEmail}.`});
      setShowInvite(false);
      setInviteEmail('');
      setInviteRole('member');
      await loadRoster();
    } catch (err) {
      setInviteError((err && err.message) || 'Failed to send invitation.');
    } finally {
      setInviteBusy(false);
    }
  };

  const handleRevoke = async (invitationId) => {
    try {
      await revokeInvitation({orgId, invitationId});
      setBanner({tone: 'success', message: 'Invitation revoked.'});
      await loadRoster();
    } catch (err) {
      setBanner({tone: 'danger', message: (err && err.message) || 'Failed to revoke.'});
    }
  };

  const handleRemove = async (uid) => {
    try {
      await removeMember({orgId, uid});
      setBanner({tone: 'success', message: 'Member removed.'});
      await loadRoster();
    } catch (err) {
      setBanner({tone: 'danger', message: (err && err.message) || 'Failed to remove member.'});
    }
  };

  const handleRoleChange = async (uid, role) => {
    try {
      await changeMemberRole({orgId, uid, role});
      setBanner({tone: 'success', message: 'Role updated.'});
      await loadRoster();
    } catch (err) {
      setBanner({tone: 'danger', message: (err && err.message) || 'Failed to change role.'});
    }
  };

  const sortedMembers = useMemo(() => {
    const rank = {owner: 0, admin: 1, member: 2};
    return [...members].sort((a, b) => (rank[a.role] ?? 9) - (rank[b.role] ?? 9));
  }, [members]);

  if (!currentOrg) {
    return (
      <React.Fragment>
        <HeaderMobile />
        <Header />
        <div className="main main-app p-4 p-lg-5">
          <Container>
            <Card><Card.Body><p className="mb-0 text-secondary">No organization selected.</p></Card.Body></Card>
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
            <h2 className="main-title mb-1">Members</h2>
            <p className="text-secondary mb-0">{currentOrg.name}</p>
          </div>
          {isAdmin && (
            <Button variant="primary" onClick={() => setShowInvite(true)}>
              <i className="ri-user-add-line me-1"></i> Invite member
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="warning" dismissible onClose={() => dispatch(clearOrgError())}>
            {error}
          </Alert>
        )}
        {banner && (
          <Alert variant={banner.tone} dismissible onClose={() => setBanner(null)}>
            {banner.message}
          </Alert>
        )}
        {rosterError && <Alert variant="danger">{rosterError}</Alert>}

        <Card className="mb-4">
          <Card.Header>
            <Card.Title>Roster ({members.length})</Card.Title>
          </Card.Header>
          <Card.Body>
            {loadingRoster ? (
              <div className="text-center py-4"><Spinner animation="border" /></div>
            ) : (
              <Table responsive hover className="mb-0">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Joined</th>
                    {isAdmin && <th style={{width: 1}}></th>}
                  </tr>
                </thead>
                <tbody>
                  {sortedMembers.map((m) => (
                    <tr key={m.uid}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {m.photoURL ? (
                            <Avatar img={m.photoURL} size="sm" />
                          ) : (
                            <Avatar
                              initial={(m.displayName || m.email || m.uid || '?').charAt(0).toUpperCase()}
                              size="sm"
                            />
                          )}
                          <div className="d-flex flex-column">
                            <span>{m.displayName || m.email || '—'}</span>
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
                        {isOwner && m.role !== 'owner' ? (
                          <Form.Select
                            size="sm"
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.uid, e.target.value)}
                            style={{maxWidth: 140}}
                          >
                            <option value="member">member</option>
                            <option value="admin">admin</option>
                            <option value="owner">owner</option>
                          </Form.Select>
                        ) : (
                          <Badge bg={m.role === 'owner' ? 'primary' : m.role === 'admin' ? 'info' : 'secondary'}>
                            {m.role}
                          </Badge>
                        )}
                      </td>
                      <td>{formatDate(m.joinedAt)}</td>
                      {isAdmin && (
                        <td>
                          {m.role !== 'owner' && (
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleRemove(m.uid)}
                            >
                              Remove
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {sortedMembers.length === 0 && (
                    <tr><td colSpan={isAdmin ? 4 : 3} className="text-center text-secondary">No members yet.</td></tr>
                  )}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>

        {isAdmin && (
          <Card>
            <Card.Header>
              <Card.Title>Pending invitations ({invitations.length})</Card.Title>
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
                  {invitations.map((inv) => (
                    <tr key={inv.id}>
                      <td>{inv.email}</td>
                      <td><Badge bg="secondary">{inv.role}</Badge></td>
                      <td>{formatDate(inv.expiresAt)}</td>
                      <td>
                        <Button size="sm" variant="outline-danger" onClick={() => handleRevoke(inv.id)}>
                          Revoke
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {invitations.length === 0 && (
                    <tr><td colSpan={4} className="text-center text-secondary">No pending invitations.</td></tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}
      </div>
      <Footer />

      {/* Invite modal */}
      <Modal show={showInvite} onHide={() => setShowInvite(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Invite member</Modal.Title>
        </Modal.Header>
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
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="member">member</option>
                  <option value="admin">admin</option>
                </Form.Select>
              </Col>
            </Row>
            <p className="fs-xs text-secondary mt-3 mb-0">
              The invitee will get an email with a one-time link. Invitations
              expire after 7 days.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowInvite(false)} disabled={inviteBusy}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={inviteBusy}>
              {inviteBusy ? 'Sending…' : 'Send invitation'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </React.Fragment>
  );
}
