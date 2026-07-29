/**
 * Rules tests — audit logs (`orgs/{orgId}/auditLogs/{logId}`).
 *
 * Server-write-only for integrity. Admins can read their own org's log;
 * everyone else is denied read and write.
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
    await setDoc(doc(db, 'orgs/orgA/auditLogs/log1'), {
      actorUid: 'alice',
      action: 'member.added',
      target: 'bob',
      metadata: { role: 'member' },
      at: new Date(),
    });
  });
});
after(teardownTestEnv);

describe('orgs/{orgId}/auditLogs/{logId}', () => {
  it('member cannot read audit logs', async () => {
    const db = authed('bob', { orgs: { orgA: 'member' } }).firestore();
    await assertFails(getDoc(doc(db, 'orgs/orgA/auditLogs/log1')));
  });

  it('admin can read audit logs', async () => {
    const db = authed('alice', { orgs: { orgA: 'admin' } }).firestore();
    await assertSucceeds(getDoc(doc(db, 'orgs/orgA/auditLogs/log1')));
  });

  it('owner can read audit logs', async () => {
    const db = authed('alice', { orgs: { orgA: 'owner' } }).firestore();
    await assertSucceeds(getDoc(doc(db, 'orgs/orgA/auditLogs/log1')));
  });

  it('non-member cannot read audit logs', async () => {
    const db = authed('outsider').firestore();
    await assertFails(getDoc(doc(db, 'orgs/orgA/auditLogs/log1')));
  });

  it('admin cannot create audit log entries', async () => {
    const db = authed('alice', { orgs: { orgA: 'admin' } }).firestore();
    await assertFails(
      setDoc(doc(db, 'orgs/orgA/auditLogs/log2'), {
        actorUid: 'alice',
        action: 'member.added',
        target: 'x',
        metadata: {},
        at: new Date(),
      }),
    );
  });

  it('owner cannot update audit log entries', async () => {
    const db = authed('alice', { orgs: { orgA: 'owner' } }).firestore();
    await assertFails(updateDoc(doc(db, 'orgs/orgA/auditLogs/log1'), { action: 'x' }));
  });

  it('owner cannot delete audit log entries', async () => {
    const db = authed('alice', { orgs: { orgA: 'owner' } }).firestore();
    await assertFails(deleteDoc(doc(db, 'orgs/orgA/auditLogs/log1')));
  });
});
