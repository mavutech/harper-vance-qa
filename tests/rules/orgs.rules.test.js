/**
 * Rules tests — org root document (`orgs/{orgId}`).
 *
 * Client cannot create or delete an org (both go through callables).
 * Members can read; admins can update.
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
    await setDoc(doc(db, 'orgs/orgA'), {
      name: 'Acme Prop',
      slug: 'acme',
      plan: 'pilot',
      seatLimit: 25,
    });
    await setDoc(doc(db, 'orgs/orgB'), {
      name: 'Other Fund',
      slug: 'other',
      plan: 'pilot',
      seatLimit: 25,
    });
  });
});
after(teardownTestEnv);

describe('orgs/{orgId}', () => {
  it('unauthenticated read is denied', async () => {
    const db = anon().firestore();
    await assertFails(getDoc(doc(db, 'orgs/orgA')));
  });

  it('signed-in non-member cannot read', async () => {
    const db = authed('alice').firestore();
    await assertFails(getDoc(doc(db, 'orgs/orgA')));
  });

  it('member can read own org', async () => {
    const db = authed('alice', { orgs: { orgA: 'member' } }).firestore();
    await assertSucceeds(getDoc(doc(db, 'orgs/orgA')));
  });

  it('member of orgA cannot read orgB', async () => {
    const db = authed('alice', { orgs: { orgA: 'member' } }).firestore();
    await assertFails(getDoc(doc(db, 'orgs/orgB')));
  });

  it('client cannot create an org (must go through callable)', async () => {
    const db = authed('alice').firestore();
    await assertFails(
      setDoc(doc(db, 'orgs/newOrg'), {
        name: 'New',
        slug: 'new',
        plan: 'pilot',
        seatLimit: 25,
      }),
    );
  });

  it('member cannot update org root', async () => {
    const db = authed('alice', { orgs: { orgA: 'member' } }).firestore();
    await assertFails(updateDoc(doc(db, 'orgs/orgA'), { name: 'Hacked' }));
  });

  it('admin can update org root', async () => {
    const db = authed('alice', { orgs: { orgA: 'admin' } }).firestore();
    await assertSucceeds(updateDoc(doc(db, 'orgs/orgA'), { name: 'Acme Prop Ltd' }));
  });

  it('owner can update org root', async () => {
    const db = authed('alice', { orgs: { orgA: 'owner' } }).firestore();
    await assertSucceeds(updateDoc(doc(db, 'orgs/orgA'), { name: 'Acme Prop Ltd' }));
  });

  it('owner cannot delete org root directly (callable-only)', async () => {
    const db = authed('alice', { orgs: { orgA: 'owner' } }).firestore();
    await assertFails(deleteDoc(doc(db, 'orgs/orgA')));
  });
});
