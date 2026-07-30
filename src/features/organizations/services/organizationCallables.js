/**
 * @fileoverview Client stubs for organization Cloud Functions callables.
 *
 * The actual callables ship in WS-C. This file exists so the UI can wire
 * buttons and forms to real function calls today and get a clear
 * "not yet available" error until WS-C lands — instead of the UI carrying
 * TODOs that are easy to miss.
 *
 * When WS-C ships, replace each stub body with the real httpsCallable()
 * invocation. The signatures below are the contract.
 */

const notYetImplemented = (name) => async () => {
  throw new Error(
      `${name} is not yet available (ships in Phase 1 WS-C: Cloud Functions).`,
  );
};

/**
 * Creates a new org and seeds the caller as its owner.
 *
 * @type {(payload: {name: string, slug: string, emailDomains?: string[]}) => Promise<{orgId: string}>}
 */
export const createOrg = notYetImplemented('createOrg');

/**
 * Updates the org root document. Callable-only so admins can't self-promote
 * via a direct Firestore write.
 *
 * @type {(payload: {orgId: string, name?: string, emailDomains?: string[]}) => Promise<void>}
 */
export const updateOrg = notYetImplemented('updateOrg');

/**
 * Invites a user by email. Server generates the token, stores the hash,
 * emails the invitee, and writes the invitation doc.
 *
 * @type {(payload: {orgId: string, email: string, role: 'admin'|'member'}) => Promise<{invitationId: string}>}
 */
export const inviteMember = notYetImplemented('inviteMember');

/**
 * Revokes a pending invitation.
 *
 * @type {(payload: {orgId: string, invitationId: string}) => Promise<void>}
 */
export const revokeInvitation = notYetImplemented('revokeInvitation');

/**
 * Accepts an invitation. The invitee provides the raw token from their
 * email link; server hashes it, matches against the pending invitation,
 * creates the member doc, and syncs the custom claim.
 *
 * @type {(payload: {token: string}) => Promise<{orgId: string, role: 'admin'|'member'}>}
 */
export const acceptInvitation = notYetImplemented('acceptInvitation');

/**
 * Changes a member's role. Guards against last-owner removal and
 * self-demotion of the last owner.
 *
 * @type {(payload: {orgId: string, uid: string, role: 'owner'|'admin'|'member'}) => Promise<void>}
 */
export const changeMemberRole = notYetImplemented('changeMemberRole');

/**
 * Removes a member from an org. Removes the member doc and clears the
 * corresponding custom claim atomically.
 *
 * @type {(payload: {orgId: string, uid: string}) => Promise<void>}
 */
export const removeMember = notYetImplemented('removeMember');
