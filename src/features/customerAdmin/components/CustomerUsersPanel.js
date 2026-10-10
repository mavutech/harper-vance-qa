/**
 * @fileoverview Customer members and invitation administration panel.
 */

import React, {useEffect, useState} from 'react';
import {Alert, Button, Form, Table} from 'react-bootstrap';
import copy from '../locales/en.json';
import {humanizeIdentifier} from '../utils/customerAdminConstants';

const INVITABLE_ROLES = Object.freeze(['admin', 'member']);
const MEMBER_ROLES = Object.freeze(['owner', 'admin', 'member']);

/**
 * Renders governed customer members and pending invitations.
 *
 * @param {Object} props - Component properties
 * @param {string} props.orgId - Selected organization ID
 * @param {Array<Object>} props.members - Customer members
 * @param {Array<Object>} props.invitations - Pending invitations
 * @param {boolean} props.submitting - Whether an operation is active
 * @param {Error|null} props.error - Safe operation error
 * @param {Function} props.onInvite - Invitation callback
 * @param {Function} props.onRevoke - Invitation revoke callback
 * @param {Function} props.onChangeRole - Member role callback
 * @param {Function} props.onRemove - Member removal callback
 * @return {JSX.Element} Customer users panel
 */
export default function CustomerUsersPanel({
  orgId,
  members,
  invitations,
  submitting,
  error,
  onInvite,
  onRevoke,
  onChangeRole,
  onRemove,
}) {
  const [email, setEmail] = useState('');
  const [orgRole, setOrgRole] = useState('member');
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setInviteUrl('');
    setCopied(false);
  }, [orgId]);

  /**
   * Creates an invitation and preserves its raw-token link only in memory.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Form submission
   * @return {Promise<void>}
   */
  const handleInvite = async (event) => {
    event.preventDefault();
    try {
      const result = await onInvite(orgId, {email: email.trim().toLowerCase(), orgRole});
      const url = `${window.location.origin}/pages/accept-invite?token=${encodeURIComponent(result.rawToken)}`;
      setInviteUrl(url);
      setCopied(false);
      setEmail('');
    } catch (_error) {
      // The parent presents the safe operation error.
    }
  };

  /**
   * Copies the one-time fallback invitation URL.
   *
   * @return {Promise<void>}
   */
  const copyInviteUrl = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
  };

  /**
   * Confirms and removes a customer member.
   *
   * @param {Object} member - Member record
   * @return {Promise<void>}
   */
  const confirmRemove = async (member) => {
    const label = member.displayName || member.email || 'this member';
    if (window.confirm(`Remove ${label} from this customer organization?`)) {
      try {
        await onRemove(orgId, member.uid);
      } catch (_error) {
        // The parent presents the safe operation error.
      }
    }
  };

  /**
   * Applies a role change while keeping request errors in the parent state.
   *
   * @param {string} uid - Customer user ID
   * @param {string} nextRole - New organization role
   * @return {Promise<void>}
   */
  const handleRoleChange = async (uid, nextRole) => {
    try {
      await onChangeRole(orgId, uid, nextRole);
    } catch (_error) {
      // The parent presents the safe operation error.
    }
  };

  /**
   * Revokes an invitation while keeping request errors in the parent state.
   *
   * @param {string} invitationId - Invitation ID
   * @return {Promise<void>}
   */
  const handleRevoke = async (invitationId) => {
    try {
      await onRevoke(orgId, invitationId);
    } catch (_error) {
      // The parent presents the safe operation error.
    }
  };

  return (
    <div>
      <h6 className="mb-3">{copy.detail.rosterTitle}</h6>
      {error && <Alert variant="danger">{copy.detail.operationError}</Alert>}
      {inviteUrl && (
        <Alert variant="info">
          <p className="mb-2">{copy.detail.inviteCreated}</p>
          <div className="input-group">
            <Form.Control value={inviteUrl} readOnly aria-label="Invitation fallback link" />
            <Button type="button" variant="outline-primary" onClick={copyInviteUrl}>
              {copied ? copy.detail.linkCopied : copy.detail.copyLink}
            </Button>
          </div>
        </Alert>
      )}

      <Form className="row g-2 align-items-end mb-4" onSubmit={handleInvite}>
        <Form.Group className="col-md" controlId="member-invite-email">
          <Form.Label className="fs-sm">{copy.detail.inviteEmail}</Form.Label>
          <Form.Control type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </Form.Group>
        <Form.Group className="col-md-3" controlId="member-invite-role">
          <Form.Label className="fs-sm">{copy.detail.inviteRole}</Form.Label>
          <Form.Select value={orgRole} onChange={(event) => setOrgRole(event.target.value)}>
            {INVITABLE_ROLES.map((role) => <option key={role} value={role}>{humanizeIdentifier(role)}</option>)}
          </Form.Select>
        </Form.Group>
        <div className="col-md-auto">
          <Button type="submit" variant="primary" disabled={submitting || !email.trim()}>
            {submitting ? copy.detail.inviting : copy.detail.inviteAction}
          </Button>
        </div>
      </Form>

      <div className="table-responsive mb-4">
        <Table className="align-middle mb-0" size="sm">
          <thead>
            <tr>
              <th>{copy.detail.member}</th>
              <th>{copy.detail.role}</th>
              <th>{copy.detail.access}</th>
              <th className="text-end">{copy.detail.memberActions}</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && <tr><td colSpan="4" className="text-secondary py-3">{copy.detail.noMembers}</td></tr>}
            {members.map((member) => (
              <tr key={member.uid}>
                <td>
                  <div className="fw-medium">{member.displayName || member.email || 'Customer user'}</div>
                  {member.displayName && member.email && <div className="text-secondary fs-xs">{member.email}</div>}
                </td>
                <td>
                  <Form.Select
                    size="sm"
                    aria-label={`Role for ${member.displayName || member.email || 'customer user'}`}
                    value={member.orgRole}
                    onChange={(event) => handleRoleChange(member.uid, event.target.value)}
                    disabled={submitting}
                  >
                    {MEMBER_ROLES.map((role) => <option key={role} value={role}>{humanizeIdentifier(role)}</option>)}
                  </Form.Select>
                </td>
                <td>{humanizeIdentifier(member.accessStatus || 'active')}</td>
                <td className="text-end">
                  <Button type="button" size="sm" variant="outline-danger" onClick={() => confirmRemove(member)} disabled={submitting}>
                    {copy.detail.removeMember}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <h6 className="mb-2">{copy.detail.pendingTitle}</h6>
      <div className="table-responsive">
        <Table className="align-middle mb-0" size="sm">
          <tbody>
            {invitations.length === 0 && <tr><td className="text-secondary py-3">{copy.detail.noInvitations}</td></tr>}
            {invitations.map((invitation) => (
              <tr key={invitation.id}>
                <td>{invitation.email}</td>
                <td>{humanizeIdentifier(invitation.orgRole)}</td>
                <td className="text-end">
                  <Button type="button" size="sm" variant="outline-secondary" onClick={() => handleRevoke(invitation.id)} disabled={submitting}>
                    {copy.detail.revoke}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
