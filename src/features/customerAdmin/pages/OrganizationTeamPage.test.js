import React from 'react';
import {render, screen} from '@testing-library/react';
import {useSelector} from 'react-redux';
import {useAccess} from '../../access';
import {useOrganizationTeam} from '../hooks/useOrganizationTeam';
import OrganizationTeamPage from './OrganizationTeamPage';

jest.mock('react-redux', () => ({useSelector: jest.fn()}));
jest.mock('../../access', () => ({useAccess: jest.fn()}));
jest.mock('../hooks/useOrganizationTeam', () => ({useOrganizationTeam: jest.fn()}));
jest.mock('../../../layouts/Header', () => () => <div>Header</div>);
jest.mock('../../../layouts/Footer', () => () => <div>Footer</div>);
jest.mock('../components/CustomerUsersPanel', () => (props) => (
  <div data-testid="customer-users" data-role={props.viewerOrgRole}>{props.orgId}</div>
));

describe('OrganizationTeamPage', () => {
  beforeEach(() => {
    useSelector.mockImplementation((selector) => selector({auth: {user: {id: 'admin-1'}}}));
    useAccess.mockReturnValue({
      access: {
        defaultOrgId: 'org-alpha',
        organizations: [{orgId: 'org-alpha', name: 'Alpha Trading', orgRole: 'admin'}],
      },
    });
    useOrganizationTeam.mockReturnValue({
      record: {
        org: {id: 'org-alpha', name: 'Alpha Trading'},
        members: [],
        pendingInvitations: [{id: 'invite-1'}],
        seatUsage: {used: 3, pending: 2, allocated: 5, available: 0, limit: 5},
        onboarding: {
          status: 'in_progress',
          progress: {completed: 5, total: 6, percent: 83},
          steps: [{code: 'product_access_active', complete: false}],
          nextAction: 'await_product_access',
        },
      },
      loading: false,
      error: null,
      submitting: false,
      operationError: null,
      reload: jest.fn(),
      inviteMember: jest.fn(),
      revokeInvitation: jest.fn(),
      changeMemberRole: jest.fn(),
      removeMember: jest.fn(),
    });
  });

  it('shows licensed seat use and scopes roster management to the selected organization', () => {
    render(<OrganizationTeamPage />);

    expect(screen.getByText('Team & Seats')).toBeInTheDocument();
    expect(screen.getByText('Active seats')).toBeInTheDocument();
    expect(screen.getByText('5 of 5')).toBeInTheDocument();
    expect(screen.getByText('Seats available')).toBeInTheDocument();
    expect(screen.getByText('Pending invitations reserve licensed seats.')).toBeInTheDocument();
    expect(screen.getByText('5 of 6 steps complete')).toBeInTheDocument();
    expect(screen.getByText('Wait for Harper Vance to activate product access.')).toBeInTheDocument();
    expect(screen.getByTestId('customer-users')).toHaveTextContent('org-alpha');
    expect(screen.getByTestId('customer-users')).toHaveAttribute('data-role', 'admin');
  });
});
