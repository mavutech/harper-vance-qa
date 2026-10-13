import {act, renderHook, waitFor} from '@testing-library/react';
import {trackEvent} from '../../../utils/analytics';
import {
  getOrganizationDetail,
  getOrganizationOnboarding,
  inviteOrganizationMember,
  removeOrganizationMember,
  revokeOrganizationInvitation,
  updateOrganizationMemberRole,
} from '../services/customerOrganizationsService';
import {useOrganizationTeam} from './useOrganizationTeam';

jest.mock('../../../utils/analytics', () => ({trackEvent: jest.fn()}));
jest.mock('../services/customerOrganizationsService', () => ({
  getOrganizationDetail: jest.fn(),
  getOrganizationOnboarding: jest.fn(),
  inviteOrganizationMember: jest.fn(),
  removeOrganizationMember: jest.fn(),
  revokeOrganizationInvitation: jest.fn(),
  updateOrganizationMemberRole: jest.fn(),
}));

const DETAIL = {
  org: {id: 'org-alpha', name: 'Alpha Trading'},
  members: [{uid: 'owner-1', orgRole: 'owner'}],
  pendingInvitations: [],
  seatUsage: {used: 1, pending: 0, allocated: 1, available: 4, limit: 5},
};

const ONBOARDING = {
  status: 'in_progress',
  progress: {completed: 4, total: 6, percent: 67},
  steps: [],
  nextAction: 'invite_customer_admin',
};

describe('useOrganizationTeam', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getOrganizationDetail.mockResolvedValue(DETAIL);
    getOrganizationOnboarding.mockResolvedValue(ONBOARDING);
    inviteOrganizationMember.mockResolvedValue({invitationId: 'invite-1', rawToken: 'one-time-token'});
    revokeOrganizationInvitation.mockResolvedValue({status: 'revoked'});
    updateOrganizationMemberRole.mockResolvedValue({orgRole: 'admin'});
    removeOrganizationMember.mockResolvedValue({status: 'revoked'});
  });

  it('does not request customer data without an authorized organization', async () => {
    const {result} = renderHook(() => useOrganizationTeam(null));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.record).toBeNull();
    expect(getOrganizationDetail).not.toHaveBeenCalled();
    expect(getOrganizationOnboarding).not.toHaveBeenCalled();
  });

  it('loads the roster and role-safe onboarding progress together', async () => {
    const {result} = renderHook(() => useOrganizationTeam('org-alpha'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.record).toEqual({...DETAIL, onboarding: ONBOARDING});
    expect(getOrganizationDetail).toHaveBeenCalledWith('org-alpha');
    expect(getOrganizationOnboarding).toHaveBeenCalledWith('org-alpha');
    expect(trackEvent).toHaveBeenCalledWith('organization_team_viewed');
    expect(trackEvent).toHaveBeenCalledWith('organization_onboarding_progress_viewed', {
      onboarding_status: 'in_progress',
    });
  });

  it('keeps team administration available when progress reporting is unavailable', async () => {
    getOrganizationOnboarding.mockRejectedValueOnce({code: 'ONBOARDING_UNAVAILABLE'});
    const {result} = renderHook(() => useOrganizationTeam('org-alpha'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.record).toEqual({...DETAIL, onboarding: null});
    expect(result.current.error).toBeNull();
    expect(trackEvent).toHaveBeenCalledWith('organization_onboarding_progress_load_failed', {
      reason: 'ONBOARDING_UNAVAILABLE',
    });
  });

  it('fails closed when the authorized organization detail cannot be loaded', async () => {
    const requestError = {code: 'FORBIDDEN'};
    getOrganizationDetail.mockRejectedValueOnce(requestError);
    const {result} = renderHook(() => useOrganizationTeam('org-alpha'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.record).toBeNull();
    expect(result.current.error).toBe(requestError);
    expect(trackEvent).toHaveBeenCalledWith('organization_team_load_failed', {reason: 'FORBIDDEN'});
  });

  it('invites a member and reloads authoritative seat usage', async () => {
    const {result} = renderHook(() => useOrganizationTeam('org-alpha'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response;
    await act(async () => {
      response = await result.current.inviteMember('org-alpha', {
        email: 'analyst@example.com',
        orgRole: 'member',
      });
    });

    expect(response).toEqual({invitationId: 'invite-1', rawToken: 'one-time-token'});
    expect(inviteOrganizationMember).toHaveBeenCalledWith('org-alpha', {
      email: 'analyst@example.com',
      orgRole: 'member',
    });
    expect(getOrganizationDetail).toHaveBeenCalledTimes(2);
    expect(trackEvent).toHaveBeenCalledWith('organization_member_invited');
  });

  it.each([
    ['revokeInvitation', revokeOrganizationInvitation, ['org-alpha', 'invite-1'], 'organization_invitation_revoked'],
    ['changeMemberRole', updateOrganizationMemberRole, ['org-alpha', 'user-1', 'admin'], 'organization_member_role_updated'],
    ['removeMember', removeOrganizationMember, ['org-alpha', 'user-1'], 'organization_member_removed'],
  ])('routes %s through the governed service and refreshes the roster', async (
      actionName,
      service,
      args,
      eventName,
  ) => {
    const {result} = renderHook(() => useOrganizationTeam('org-alpha'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current[actionName](...args);
    });

    expect(service).toHaveBeenCalledWith(...args);
    expect(getOrganizationDetail).toHaveBeenCalledTimes(2);
    expect(trackEvent).toHaveBeenCalledWith(eventName);
  });

  it('surfaces a safe operation failure and does not report success', async () => {
    const requestError = {code: 'SEAT_LIMIT_REACHED'};
    inviteOrganizationMember.mockRejectedValueOnce(requestError);
    const {result} = renderHook(() => useOrganizationTeam('org-alpha'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.inviteMember('org-alpha', {
        email: 'full@example.com',
        orgRole: 'member',
      })).rejects.toBe(requestError);
    });

    expect(result.current.operationError).toBe(requestError);
    expect(result.current.submitting).toBe(false);
    expect(getOrganizationDetail).toHaveBeenCalledTimes(1);
    expect(trackEvent).not.toHaveBeenCalledWith('organization_member_invited');
  });
});
