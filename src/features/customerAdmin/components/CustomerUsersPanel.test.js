import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import CustomerUsersPanel from './CustomerUsersPanel';

const mockInvite = jest.fn();
const mockRevoke = jest.fn();
const mockChangeRole = jest.fn();
const mockRemove = jest.fn();

const MEMBERS = [{
  uid: 'user-1',
  email: 'analyst@example.com',
  displayName: 'Desk Analyst',
  orgRole: 'member',
  accessStatus: 'active',
}];

const INVITATIONS = [{
  id: 'invite-1',
  email: 'new.user@example.com',
  orgRole: 'admin',
}];

/**
 * Renders the customer users panel with governed action mocks.
 *
 * @return {void}
 */
const renderPanel = () => render(
  <CustomerUsersPanel
    orgId="org-alpha"
    members={MEMBERS}
    invitations={INVITATIONS}
    submitting={false}
    error={null}
    onInvite={mockInvite}
    onRevoke={mockRevoke}
    onChangeRole={mockChangeRole}
    onRemove={mockRemove}
    isPlatformAdmin
  />,
);

describe('CustomerUsersPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInvite.mockResolvedValue({invitationId: 'invite-2', rawToken: 'safe-token'});
    mockRevoke.mockResolvedValue(undefined);
    mockChangeRole.mockResolvedValue(undefined);
    mockRemove.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {writeText: jest.fn().mockResolvedValue(undefined)},
    });
  });

  it('creates and displays a one-time fallback invitation link', async () => {
    renderPanel();

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: {value: 'Invitee@Example.com'},
    });
    fireEvent.click(screen.getByRole('button', {name: 'Send invitation'}));

    await waitFor(() => {
      expect(mockInvite).toHaveBeenCalledWith('org-alpha', {
        email: 'invitee@example.com',
        orgRole: 'member',
      });
      expect(screen.getByLabelText('Invitation fallback link')).toHaveValue(
          'http://localhost/pages/accept-invite?token=safe-token',
      );
    });
  });

  it('updates roles and revokes pending invitations through callbacks', async () => {
    renderPanel();

    fireEvent.change(screen.getByLabelText('Role for Desk Analyst'), {target: {value: 'admin'}});
    fireEvent.click(screen.getByRole('button', {name: 'Revoke'}));

    await waitFor(() => expect(mockChangeRole).toHaveBeenCalledWith('org-alpha', 'user-1', 'admin'));
    expect(mockRevoke).toHaveBeenCalledWith('org-alpha', 'invite-1');
  });

  it('requires confirmation before removing a member', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    renderPanel();

    fireEvent.click(screen.getByRole('button', {name: 'Remove Desk Analyst'}));

    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith('org-alpha', 'user-1'));
  });

  it('prevents a customer administrator from altering an owner', () => {
    render(
      <CustomerUsersPanel
        orgId="org-alpha"
        members={[{...MEMBERS[0], uid: 'owner-1', orgRole: 'owner', displayName: 'Desk Owner'}]}
        invitations={[]}
        submitting={false}
        error={null}
        onInvite={mockInvite}
        onRevoke={mockRevoke}
        onChangeRole={mockChangeRole}
        onRemove={mockRemove}
        viewerOrgRole="admin"
        viewerUid="admin-1"
      />,
    );

    expect(screen.getByLabelText('Role for Desk Owner')).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Remove Desk Owner'})).toBeDisabled();
  });
});
