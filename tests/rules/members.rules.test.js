/**
 * Rules tests — org member roster (`orgs/{orgId}/members/{uid}`).
 *
 * Reads: members see the roster. Writes: callable-only, so all direct
 * client writes must fail. This is the key defence against self-promotion.
 */

const { describe, it, before, after, beforeEach } = require('node:test');
const { doc, getDoc, setDoc, updateDoc, deleteDoc } = require('firebase/firestore');
const {
  setupTestEnv,
  clearFirestore,
  teardownTestEnv,
  authed,
  anon,
  seed,
  assertFails,
  assertSucceeds,
} = require('./setup');

before(setupTestEnv);
beforeEach(async () => {
  await clearFirestore();
  await seed(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'orgs/orgA'), { name: 'Acme', slug: 'acme' });
    await setDoc(doc(db, 'orgs/orgA/members/alice'), {
      role: 'owner',
      joinedAt: new Date(),
    });
    await setDoc(doc(db, 'orgs/orgA/members/bob'), {
      role: 'member',
      joinedAt: new Date(),
    });
  });
});
after(teardownTestEnv);

describe('orgs/{orgId}/members/{uid}', () => {
  it('unauthenticated read is denied', async () => {
    const db = anon().firestore();
    await assertFails(getDoc(doc(db, 'orgs/orgA/members/alice')));
  });

  it('non-member cannot read roster', async () => {
    const db = authed('carol').firestore();
    await assertFails(getDoc(doc(db, 'orgs/orgA/members/alice')));
  });

  it('member can read roster entry', async () => {
    const db = authed('bob', { orgs: { orgA: 'member' } }).firestore();
    await assertSucceeds(getDoc(doc(db, 'orgs/orgA/members/alice')));
  });

  it('admin cannot directly add a member (callable-only)', async () => {
    const db = authed('alice', { orgs: { orgA: 'admin' } }).firestore();
    await assertFails(
      setDoc(doc(db, 'orgs/orgA/members/carol'), {
        role: 'member',
        joinedAt: new Date(),
      }),
    );
  });

  it('admin cannot self-promote to owner', async () => {
    const db = authed('alice', { orgs: { orgA: 'admin' } }).firestore();
    await assertFails(updateDoc(doc(db, 'orgs/orgA/members/alice'), { role: 'owner' }));
  });

  it('member cannot self-promote to admin', async () => {
    const db = authed('bob', { orgs: { orgA: 'member' } }).firestore();
    await assertFails(updateDoc(doc(db, 'orgs/orgA/members/bob'), { role: 'admin' }));
  });

  it('admin cannot delete another member directly (callable-only)', async () => {
    const db = authed('alice', { orgs: { orgA: 'admin' } }).firestore();
    await assertFails(deleteDoc(doc(db, 'orgs/orgA/members/bob')));
  });

  it('owner cannot delete a member directly (callable-only)', async () => {
    const db = authed('alice', { orgs: { orgA: 'owner' } }).firestore();
    await assertFails(deleteDoc(doc(db, 'orgs/orgA/members/bob')));
  });
});
