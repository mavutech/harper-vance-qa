# Firebase Standards
# Mavutech Engineering — docs/standards/firebase.md

---

## Auth

- Firebase Auth token verification always done server-side via `firebase-admin`
- Client never trusts its own auth state for sensitive operations -- always verify via backend
- Use `expo-secure-store` on mobile to store nothing -- tokens are managed by Firebase SDK
- Never store auth tokens in AsyncStorage, Redux, or local state
- Token refresh is handled automatically by Firebase SDK -- never manually refresh

---

## Firestore

### Collection Naming
- Collections: camelCase plural (`users`, `paymentTransactions`, `auditLogs`)
- Document IDs: use Firebase auto-generated IDs unless a natural key exists

### Query Rules
- Always limit queries -- never fetch an unbounded collection
- Always use `.orderBy()` before `.startAfter()` for pagination
- Prefer server-side filtering over client-side filtering

```ts
// Good — server filters and limits
const snapshot = await db
  .collection('paymentTransactions')
  .where('userId', '==', userId)
  .where('status', '==', 'completed')
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get();

// Bad — unbounded fetch with client-side filter
const snapshot = await db.collection('paymentTransactions').get();
const filtered = snapshot.docs.filter(doc => doc.data().userId === userId);
```

### Document Reads
- Always check `.exists` before accessing document data
- Always type the return value -- never use raw `doc.data()` without casting

```ts
/**
 * Fetches a user document from Firestore.
 *
 * @param {string} userId - Firestore document ID
 * @returns {Promise<User>} Typed user data
 * @throws {{ code: string, message: string, status: number }} When not found
 */
const getUser = async (userId: string): Promise<User> => {
  const doc = await db.collection('users').doc(userId).get();

  if (!doc.exists) {
    throw { code: 'USER_NOT_FOUND', message: 'User not found.', status: 404 };
  }

  return { id: doc.id, ...doc.data() } as User;
};
```

### Writes
- Always use `serverTimestamp()` for `createdAt` and `updatedAt` fields -- never `new Date()`
- Use transactions when a write depends on a read
- Use batch writes when writing to multiple documents atomically

```ts
// Timestamps
await db.collection('users').doc(userId).set({
  ...userData,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
});

// Transaction example
await db.runTransaction(async (transaction) => {
  const userRef = db.collection('users').doc(userId);
  const userDoc = await transaction.get(userRef);

  if (!userDoc.exists) {
    throw { code: 'USER_NOT_FOUND', message: 'User not found.', status: 404 };
  }

  transaction.update(userRef, {
    balance: userDoc.data()!.balance - amount,
    updatedAt: FieldValue.serverTimestamp(),
  });
});
```

---

## Cloud Functions

### Structure
```
functions/
  src/
    triggers/       # Firestore, Auth, Pub/Sub triggers
    callable/       # HTTPS callable functions
    scheduled/      # Cron jobs
    utils/          # Shared utilities
```

### Rules
- Every function has JSDoc
- Every callable function validates input before processing
- Every function has structured error handling -- never let unhandled errors surface raw
- Set memory and timeout explicitly -- never rely on defaults for production functions

```ts
/**
 * Triggered on new user creation. Sets up default profile document.
 *
 * @param {UserRecord} user - Firebase Auth user record
 * @returns {Promise<void>}
 */
export const onUserCreated = functions
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .auth.user()
  .onCreate(async (user) => {
    try {
      await db.collection('users').doc(user.uid).set({
        email: user.email,
        displayName: user.displayName ?? null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('onUserCreated failed:', { userId: user.uid, error });
      throw error;
    }
  });
```

---

## Firebase Analytics

- Import `logEvent` from `firebase/analytics`
- All event names: snake_case
- All events go through a centralized analytics utility -- never call `logEvent` directly in a component

```ts
// src/utils/analytics.ts
import { getAnalytics, logEvent } from 'firebase/analytics';

/**
 * Logs a Firebase Analytics event with optional parameters.
 *
 * @param {string} eventName - Snake case event name
 * @param {Record<string, unknown>} [params] - Optional event parameters
 * @example
 * trackEvent('settings_notifications_toggled', { enabled: true });
 */
export const trackEvent = (eventName: string, params?: Record<string, unknown>): void => {
  const analytics = getAnalytics();
  logEvent(analytics, eventName, params);
};
```

---

## Security Rules

- Every collection must have explicit read/write rules -- no wildcards in production
- Authenticated routes always check `request.auth != null`
- User data always scoped to `request.auth.uid == userId`
- Never deploy with `allow read, write: if true`

---

## Environment Config

- All Firebase config values come from environment variables -- never hardcoded
- Use separate Firebase projects for development, staging, and production
- Never commit `.env` files -- use `.env.example` with placeholder values

---

## Security (Hardened)

### Admin SDK
- Firebase Admin SDK used server-side only — never initialize in client-side code
- Admin credentials stored in environment variables — never in source code
- Service account keys rotated regularly and never committed to version control

### Client SDK
- Firebase client config (apiKey, projectId, etc.) is safe to expose in client code — it is not a secret
- However, access is controlled entirely by Firestore Security Rules and Firebase Auth — rules must be airtight
- Always use separate Firebase projects for dev, staging, and production

### Firestore Security Rules — Mandatory Checklist
Before every production deployment, verify:
- [ ] No `allow read, write: if true` anywhere
- [ ] Every collection has explicit rules
- [ ] All user-scoped data checks `request.auth.uid == userId`
- [ ] Admin-only collections check custom claims: `request.auth.token.admin == true`
- [ ] Rules tested with the Firebase Rules Simulator before deployment

### Cloud Functions Security
- Callable functions verify auth via `context.auth` before processing
- HTTP functions use the `authenticate` middleware
- Never trust data from `request.body` without validation
- Rate limit callable functions using Firebase App Check for public-facing features

```ts
// Callable function auth check — always first
export const sensitiveCallable = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }
  // validate data before using it
});
```

### Data Minimization
- Store only what you need — never store data you do not have a clear purpose for
- PII fields (email, phone, name) stored only in user-scoped documents
- Audit logs write-only for non-admin users — never allow reads on audit collections from client
