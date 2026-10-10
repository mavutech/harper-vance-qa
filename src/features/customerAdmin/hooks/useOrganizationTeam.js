/**
 * @fileoverview Customer administrator team and seat management state.
 */

import {useCallback, useEffect, useState} from 'react';
import {trackEvent} from '../../../utils/analytics';
import {
  getOrganizationDetail,
  getOrganizationOnboarding,
  inviteOrganizationMember,
  removeOrganizationMember,
  revokeOrganizationInvitation,
  updateOrganizationMemberRole,
} from '../services/customerOrganizationsService';

/**
 * Loads one customer organization's team and exposes governed roster actions.
 *
 * @param {string|null} orgId - Organization selected from the access contract
 * @return {Object} Team state and roster actions
 */
export const useOrganizationTeam = (orgId) => {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(Boolean(orgId));
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [operationError, setOperationError] = useState(null);

  const load = useCallback(async () => {
    if (!orgId) {
      setRecord(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const onboardingRequest = getOrganizationOnboarding(orgId).catch((requestError) => {
        trackEvent('organization_onboarding_progress_load_failed', {
          reason: requestError?.code || 'unknown',
        });
        return null;
      });
      const [detail, onboarding] = await Promise.all([
        getOrganizationDetail(orgId),
        onboardingRequest,
      ]);
      const aggregate = {...detail, onboarding};
      setRecord(aggregate);
      trackEvent('organization_team_viewed');
      trackEvent('organization_onboarding_progress_viewed', {
        onboarding_status: onboarding?.status || 'unavailable',
      });
      return aggregate;
    } catch (requestError) {
      setRecord(null);
      setError(requestError);
      trackEvent('organization_team_load_failed', {
        reason: requestError?.code || 'unknown',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const runAction = useCallback(async (action, eventName) => {
    setSubmitting(true);
    setOperationError(null);
    try {
      const result = await action();
      await load();
      trackEvent(eventName);
      return result;
    } catch (requestError) {
      setOperationError(requestError);
      throw requestError;
    } finally {
      setSubmitting(false);
    }
  }, [load]);

  const inviteMember = useCallback((selectedOrgId, input) => runAction(
      () => inviteOrganizationMember(selectedOrgId, input),
      'organization_member_invited',
  ), [runAction]);

  const revokeInvitation = useCallback((selectedOrgId, invitationId) => runAction(
      () => revokeOrganizationInvitation(selectedOrgId, invitationId),
      'organization_invitation_revoked',
  ), [runAction]);

  const changeMemberRole = useCallback((selectedOrgId, uid, orgRole) => runAction(
      () => updateOrganizationMemberRole(selectedOrgId, uid, orgRole),
      'organization_member_role_updated',
  ), [runAction]);

  const removeMember = useCallback((selectedOrgId, uid) => runAction(
      () => removeOrganizationMember(selectedOrgId, uid),
      'organization_member_removed',
  ), [runAction]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    record,
    loading,
    error,
    submitting,
    operationError,
    reload: load,
    inviteMember,
    revokeInvitation,
    changeMemberRole,
    removeMember,
  };
};
