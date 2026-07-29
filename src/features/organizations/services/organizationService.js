/**
 * @fileoverview Firestore read wrappers for organization data.
 *
 * All writes to orgs/{orgId} and its subcollections are callable-only per
 * firestore.rules (WS-B). This service intentionally exposes reads only.
 * Mutation flows go through Cloud Functions callables in WS-C.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import {firestore} from '../../../firebase/config';

/**
 * Fetches a single organization document by id.
 *
 * @param {string} orgId
 * @returns {Promise<import('../utils/orgShapes').Organization|null>}
 * @throws {Error} on Firestore errors (network, rules)
 */
export const getOrganization = async (orgId) => {
  if (!orgId || typeof orgId !== 'string') {
    throw new Error('getOrganization: orgId is required.');
  }
  const snap = await getDoc(doc(firestore, 'orgs', orgId));
  if (!snap.exists()) return null;
  return {id: snap.id, ...snap.data()};
};

/**
 * Fetches multiple organizations in parallel. Missing docs are omitted from
 * the returned array (they are silently skipped, not treated as errors).
 *
 * @param {string[]} orgIds
 * @returns {Promise<import('../utils/orgShapes').Organization[]>}
 */
export const getOrganizations = async (orgIds) => {
  if (!Array.isArray(orgIds) || orgIds.length === 0) return [];
  const results = await Promise.all(orgIds.map(getOrganization));
  return results.filter(Boolean);
};

/**
 * Fetches the caller's own membership record within an org. Returns null
 * when the caller is not a member (Firestore rules will deny the read).
 *
 * @param {string} orgId
 * @param {string} uid
 * @returns {Promise<import('../utils/orgShapes').OrgMember|null>}
 */
export const getMembership = async (orgId, uid) => {
  if (!orgId || !uid) throw new Error('getMembership: orgId and uid are required.');
  const snap = await getDoc(doc(firestore, 'orgs', orgId, 'members', uid));
  if (!snap.exists()) return null;
  return {uid: snap.id, ...snap.data()};
};

/**
 * Lists the roster of an org. Callers must be an org member (rules enforce).
 *
 * @param {string} orgId
 * @returns {Promise<import('../utils/orgShapes').OrgMember[]>}
 */
export const listMembers = async (orgId) => {
  if (!orgId) throw new Error('listMembers: orgId is required.');
  const snap = await getDocs(collection(firestore, 'orgs', orgId, 'members'));
  return snap.docs.map((d) => ({uid: d.id, ...d.data()}));
};

/**
 * Lists pending invitations for an org. Callers must be an org admin (rules
 * enforce). Results are ordered oldest first and capped at 100 rows.
 *
 * @param {string} orgId
 * @returns {Promise<import('../utils/orgShapes').OrgInvitation[]>}
 */
export const listPendingInvitations = async (orgId) => {
  if (!orgId) throw new Error('listPendingInvitations: orgId is required.');
  const q = query(
      collection(firestore, 'orgs', orgId, 'invitations'),
      where('status', '==', 'pending'),
      orderBy('expiresAt', 'asc'),
      fsLimit(100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({id: d.id, ...d.data()}));
};
