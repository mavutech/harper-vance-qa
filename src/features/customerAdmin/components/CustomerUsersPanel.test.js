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

  it('does not remove a member when confirmation is declined', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    renderPanel();

    fireEvent.click(screen.getByRole('button', {name: 'Remove Desk Analyst'}));

    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('copies the one-time fallback link without storing it elsewhere', async () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: {value: 'invitee@example.com'},
    });
    fireEvent.click(screen.getByRole('button', {name: 'Send invitation'}));

    const copyButton = await screen.findByRole('button', {name: 'Copy link'});
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          'http://localhost/pages/accept-invite?token=safe-token',
      );
      expect(screen.getByRole('button', {name: 'Copied'})).toBeInTheDocument();
    });
  });

  it('shows a safe error without exposing the underlying service failure', () => {
    render(
      <CustomerUsersPanel
        orgId="org-alpha"
        members={MEMBERS}
        invitations={INVITATIONS}
        submitting={false}
        error={new Error('private database details')}
        onInvite={mockInvite}
        onRevoke={mockRevoke}
        onChangeRole={mockChangeRole}
        onRemove={mockRemove}
        isPlatformAdmin
      />,
    );

    expect(screen.getByText(/could not be completed/i)).toBeInTheDocument();
    expect(screen.queryByText(/private database details/i)).not.toBeInTheDocument();
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

  it('renders every included Firm-Wide Enterprise seat for administration', () => {
    const members = Array.from({length: 15}, (_, index) => ({
      uid: `enterprise-user-${index + 1}`,
      email: `user${index + 1}@example.com`,
      displayName: `Enterprise User ${index + 1}`,
      orgRole: index === 0 ? 'owner' : 'member',
      accessStatus: 'active',
    }));

    render(
      <CustomerUsersPanel
        orgId="org-enterprise"
        members={members}
        invitations={[]}
        submitting={false}
        error={null}
        onInvite={mockInvite}
        onRevoke={mockRevoke}
        onChangeRole={mockChangeRole}
        onRemove={mockRemove}
        isPlatformAdmin
      />,
    );

    expect(screen.getByText('Enterprise User 1')).toBeInTheDocument();
    expect(screen.getByText('Enterprise User 15')).toBeInTheDocument();
    expect(screen.getAllByRole('combobox', {name: /Role for Enterprise User/})).toHaveLength(15);
  });
});
