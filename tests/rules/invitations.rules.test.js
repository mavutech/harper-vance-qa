/**
 * Rules tests — invitations (`orgs/{orgId}/invitations/{inviteId}`).
 *
 * Admins create and delete (revoke) invitations. Status transitions
 * (pending → accepted / expired) happen inside the acceptInvite callable
 * — no client update is allowed.
 */

const { describe, it, before, after, beforeEach } = require('node:test');
const { doc, getDoc, setDoc, updateDoc, deleteDoc } = require('firebase/firestore');
const {
  setupTestEnv,
  clearFirestore,
  teardownTestEnv,
  authed,
  seed,
  assertFails,
  assertSucceeds,
} = require('./setup');

before(setupTestEnv);
beforeEach(async () => {
  await clearFirestore();
  await seed(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'orgs/orgA'), { name: 'Acme' });
    await setDoc(doc(db, 'orgs/orgA/invitations/inv1'), {
      email: 'bob@example.com',
      role: 'member',
      status: 'pending',
      createdBy: 'alice',
      tokenHash: 'abc123',
    });
  });
});
after(teardownTestEnv);

describe('orgs/{orgId}/invitations/{inviteId}', () => {
  it('member cannot read invitations', async () => {
    const db = authed('bob', { orgs: { orgA: 'member' } }).firestore();
    await assertFails(getDoc(doc(db, 'orgs/orgA/invitations/inv1')));
  });

  it('admin can read invitations', async () => {
    const db = authed('alice', { orgs: { orgA: 'admin' } }).firestore();
    await assertSucceeds(getDoc(doc(db, 'orgs/orgA/invitations/inv1')));
  });

  it('admin can create a pending invitation with valid role', async () => {
    const db = authed('alice', { orgs: { orgA: 'admin' } }).firestore();
    await assertSucceeds(
      setDoc(doc(db, 'orgs/orgA/invitations/inv2'), {
        email: 'carol@example.com',
        role: 'member',
        status: 'pending',
        createdBy: 'alice',
        tokenHash: 'def456',
      }),
    );
  });

  it('admin cannot create an invitation with role=owner', async () => {
    const db = authed('alice', { orgs: { orgA: 'admin' } }).firestore();
    await assertFails(
      setDoc(doc(db, 'orgs/orgA/invitations/inv3'), {
        email: 'evil@example.com',
        role: 'owner',
        status: 'pending',
        createdBy: 'alice',
        tokenHash: 'ghi789',
      }),
    );
  });

  it('admin cannot create an invitation with status != pending', async () => {
    const db = authed('alice', { orgs: { orgA: 'admin' } }).firestore();
    await assertFails(
      setDoc(doc(db, 'orgs/orgA/invitations/inv4'), {
        email: 'x@x.com',
        role: 'member',
        status: 'accepted',
        createdBy: 'alice',
        tokenHash: 'jkl',
      }),
    );
  });

  it('admin cannot forge createdBy', async () => {
    const db = authed('alice', { orgs: { orgA: 'admin' } }).firestore();
    await assertFails(
      setDoc(doc(db, 'orgs/orgA/invitations/inv5'), {
        email: 'x@x.com',
        role: 'member',
        status: 'pending',
        createdBy: 'someone-else',
        tokenHash: 'mno',
      }),
    );
  });

  it('member cannot create invitations', async () => {
    const db = authed('bob', { orgs: { orgA: 'member' } }).firestore();
    await assertFails(
      setDoc(doc(db, 'orgs/orgA/invitations/inv6'), {
        email: 'x@x.com',
        role: 'member',
        status: 'pending',
        createdBy: 'bob',
        tokenHash: 'pqr',
      }),
    );
  });

  it('admin cannot update invitation status (callable-only)', async () => {
    const db = authed('alice', { orgs: { orgA: 'admin' } }).firestore();
    await assertFails(
      updateDoc(doc(db, 'orgs/orgA/invitations/inv1'), { status: 'accepted' }),
    );
  });

  it('admin can delete (revoke) an invitation', async () => {
    const db = authed('alice', { orgs: { orgA: 'admin' } }).firestore();
    await assertSucceeds(deleteDoc(doc(db, 'orgs/orgA/invitations/inv1')));
  });

  it('member cannot delete an invitation', async () => {
    const db = authed('bob', { orgs: { orgA: 'member' } }).firestore();
    await assertFails(deleteDoc(doc(db, 'orgs/orgA/invitations/inv1')));
  });
});
