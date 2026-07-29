/**
 * Rules tests — global market data (`stats`, `targets`).
 *
 * These paths are read-only for signed-in users and never client-writable.
 */

const { describe, it, before, after, beforeEach } = require('node:test');
const { doc, getDoc, setDoc } = require('firebase/firestore');
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
    await setDoc(doc(db, 'stats/nq/5m/daily/2026-07/28'), { hitRate: 90 });
    await setDoc(doc(db, 'targets/nq/5m/2026-07/28/t1'), { price: 20000 });
  });
});
after(teardownTestEnv);

describe('stats and targets — global market data', () => {
  it('unauthenticated read is denied', async () => {
    const db = anon().firestore();
    await assertFails(getDoc(doc(db, 'stats/nq/5m/daily/2026-07/28')));
    await assertFails(getDoc(doc(db, 'targets/nq/5m/2026-07/28/t1')));
  });

  it('signed-in user (no org claims) can read', async () => {
    const db = authed('alice').firestore();
    await assertSucceeds(getDoc(doc(db, 'stats/nq/5m/daily/2026-07/28')));
    await assertSucceeds(getDoc(doc(db, 'targets/nq/5m/2026-07/28/t1')));
  });

  it('signed-in write is denied on stats', async () => {
    const db = authed('alice').firestore();
    await assertFails(setDoc(doc(db, 'stats/nq/5m/daily/2026-07/29'), { hitRate: 91 }));
  });

  it('signed-in write is denied on targets', async () => {
    const db = authed('alice').firestore();
    await assertFails(setDoc(doc(db, 'targets/nq/5m/2026-07/29/t2'), { price: 20100 }));
  });

  it('org-scoped admin cannot write to global stats', async () => {
    const db = authed('alice', { orgs: { orgA: 'owner' } }).firestore();
    await assertFails(setDoc(doc(db, 'stats/nq/5m/daily/2026-07/29'), { hitRate: 91 }));
  });
});
