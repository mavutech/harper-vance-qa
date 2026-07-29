/**
 * @fileoverview Local-dev seed script for the organizations feature.
 *
 * Preconditions:
 *   1. Firestore emulator running: `firebase emulators:start --only firestore`
 *   2. This script bypasses security rules via @firebase/rules-unit-testing.
 *
 * Seeds two orgs, three members, and two invitations so the org switcher
 * and Members page have something to render before we wire real callables
 * in WS-C.
 *
 * Usage:
 *   node scripts/seedOrgs.js
 */

/* eslint-disable no-console */

const {initializeTestEnvironment} = require('@firebase/rules-unit-testing');
const {doc, setDoc, Timestamp} = require('firebase/firestore');

const PROJECT_ID = process.env.SEED_PROJECT_ID || 'demo-harper-vance';

const orgs = [
  {
    id: 'org-acme',
    name: 'Acme Prop',
    slug: 'acme',
    emailDomains: ['acme.example'],
    plan: 'pilot',
    seatLimit: 25,
    createdBy: 'seed-alice',
  },
  {
    id: 'org-beta',
    name: 'Beta Fund',
    slug: 'beta',
    emailDomains: ['beta.example'],
    plan: 'standard',
    seatLimit: 50,
    createdBy: 'seed-carol',
  },
];

const members = [
  {orgId: 'org-acme', uid: 'seed-alice', role: 'owner'},
  {orgId: 'org-acme', uid: 'seed-bob', role: 'member'},
  {orgId: 'org-beta', uid: 'seed-carol', role: 'owner'},
];

const invitations = [
  {
    orgId: 'org-acme',
    id: 'inv-1',
    email: 'newhire@acme.example',
    role: 'member',
    tokenHash: 'sha256:placeholder',
    status: 'pending',
    createdBy: 'seed-alice',
  },
  {
    orgId: 'org-beta',
    id: 'inv-2',
    email: 'analyst@beta.example',
    role: 'admin',
    tokenHash: 'sha256:placeholder',
    status: 'pending',
    createdBy: 'seed-carol',
  },
];

const users = [
  {uid: 'seed-alice', email: 'alice@acme.example', displayName: 'Alice',
    orgIds: ['org-acme'], currentOrgId: 'org-acme'},
  {uid: 'seed-bob',   email: 'bob@acme.example',   displayName: 'Bob',
    orgIds: ['org-acme'], currentOrgId: 'org-acme'},
  {uid: 'seed-carol', email: 'carol@beta.example', displayName: 'Carol',
    orgIds: ['org-beta'], currentOrgId: 'org-beta'},
];

const now = Timestamp.now();
const expiresAt = Timestamp.fromMillis(Date.now() + 7 * 24 * 3600 * 1000);

async function main() {
  const env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {host: '127.0.0.1', port: 8080},
  });

  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();

    for (const u of users) {
      await setDoc(doc(db, 'users', u.uid), {
        email: u.email,
        displayName: u.displayName,
        photoURL: null,
        orgIds: u.orgIds,
        currentOrgId: u.currentOrgId,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (const o of orgs) {
      await setDoc(doc(db, 'orgs', o.id), {
        name: o.name,
        slug: o.slug,
        emailDomains: o.emailDomains,
        plan: o.plan,
        seatLimit: o.seatLimit,
        createdBy: o.createdBy,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (const m of members) {
      await setDoc(doc(db, 'orgs', m.orgId, 'members', m.uid), {
        role: m.role,
        invitedBy: null,
        joinedAt: now,
      });
    }

    for (const inv of invitations) {
      await setDoc(doc(db, 'orgs', inv.orgId, 'invitations', inv.id), {
        email: inv.email,
        role: inv.role,
        tokenHash: inv.tokenHash,
        status: inv.status,
        createdBy: inv.createdBy,
        createdAt: now,
        expiresAt,
      });
    }
  });

  await env.cleanup();

  console.log(`Seeded ${orgs.length} orgs, ${members.length} members, ${invitations.length} invitations, ${users.length} users into project ${PROJECT_ID}.`);
  console.log('Note: this data lives only in the running Firestore emulator and is lost when the emulator shuts down.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
