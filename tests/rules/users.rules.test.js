/**
 * Rules tests — global user identity (`users/{uid}`).
 *
 * Users can read and write their own doc but cannot self-mutate `orgIds`
 * or `email`. Both are server-managed via Cloud Functions.
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
    await setDoc(doc(db, 'users/alice'), {
      email: 'alice@example.com',
      displayName: 'Alice',
      orgIds: ['orgA'],
      currentOrgId: 'orgA',
    });
  });
});
after(teardownTestEnv);

describe('users/{uid}', () => {
  it('unauthenticated read is denied', async () => {
    const db = anon().firestore();
    await assertFails(getDoc(doc(db, 'users/alice')));
  });

  it('user can read own doc', async () => {
    const db = authed('alice').firestore();
    await assertSucceeds(getDoc(doc(db, 'users/alice')));
  });

  it('user cannot read another user doc', async () => {
    const db = authed('bob').firestore();
    await assertFails(getDoc(doc(db, 'users/alice')));
  });

  it('user can create own doc with empty orgIds', async () => {
    const db = authed('carol').firestore();
    await assertSucceeds(
      setDoc(doc(db, 'users/carol'), {
        email: 'carol@example.com',
        displayName: 'Carol',
        orgIds: [],
        currentOrgId: null,
      }),
    );
  });

  it('user cannot create own doc with non-empty orgIds', async () => {
    const db = authed('dave').firestore();
    await assertFails(
      setDoc(doc(db, 'users/dave'), {
        email: 'dave@example.com',
        displayName: 'Dave',
        orgIds: ['orgA'],
        currentOrgId: 'orgA',
      }),
    );
  });

  it('user cannot create another user doc', async () => {
    const db = authed('bob').firestore();
    await assertFails(
      setDoc(doc(db, 'users/alice'), {
        email: 'x@x.com',
        displayName: 'X',
        orgIds: [],
        currentOrgId: null,
      }),
    );
  });

  it('user can update displayName / currentOrgId', async () => {
    const db = authed('alice').firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'users/alice'), { displayName: 'Alice A.', currentOrgId: 'orgA' }),
    );
  });

  it('user cannot self-modify orgIds', async () => {
    const db = authed('alice').firestore();
    await assertFails(
      updateDoc(doc(db, 'users/alice'), { orgIds: ['orgA', 'orgB'] }),
    );
  });

  it('user cannot self-modify email', async () => {
    const db = authed('alice').firestore();
    await assertFails(
      updateDoc(doc(db, 'users/alice'), { email: 'evil@example.com' }),
    );
  });

  it('user cannot delete own doc', async () => {
    const db = authed('alice').firestore();
    await assertFails(deleteDoc(doc(db, 'users/alice')));
  });
});
