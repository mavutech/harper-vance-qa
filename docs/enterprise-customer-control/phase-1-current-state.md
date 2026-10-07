# Phase 1: Frontend Current-State Inventory

## Summary

Harper Vance already has a working authenticated dashboard, a shared backend API client, and four useful market-intelligence views. The frontend is not yet customer-control aware. Any signed-in user can reach the full dashboard, and the browser reads market data directly from Realtime Database without checking the customer's organization, license, seat, or retention rights.

This phase records the current boundary. It does not change production behavior or move market data.

## Source and deployment

| Area | Current state |
| --- | --- |
| Repository | `mavutech/harper-vance-qa` |
| Source of truth | `main` |
| Firebase project | `goldensetups-dev` |
| Hosting site | `harpervanceqa` |
| Public entry | `/` |
| Customer login | `/login` |
| Signed-in entry | `/dashboard/sona-targets` |
| Pull-request previews | Firebase preview workflow runs for each pull request |
| Live deployment | A push to `main` deploys Firebase Hosting |

The existing repository workflow remains correct: feature branches start from `main`, pull requests receive a preview, and approved merges to `main` deploy the live frontend.

## Product views customers can use today

| Route | Customer-facing purpose | Main source |
| --- | --- | --- |
| `/dashboard/sona-targets` | Follow today's published targets and their current state | Realtime Database live subscription |
| `/dashboard/sona-daily` | Review the day's targets, outcomes, context, and supporting charts | Realtime Database daily statistics and market history |
| `/dashboard/sona-weekly` | Review weekly performance, daily breakdowns, ranges, and comparisons | Realtime Database weekly statistics |
| `/dashboard/sona-history` | Review rolling and historical behavior | Realtime Database daily and weekly statistics |

The active sidebar exposes these four Harper Vance views. The codebase still contains template routes and components for unrelated dashboards, apps, pages, and UI examples. They are protected by sign-in but are not part of the Harper Vance product offering and should not become licensed product features by accident.

## Current data-access map

| Browser read or write | Current path | Use | Decision |
| --- | --- | --- | --- |
| Live targets | `targets/nq/5m/YYYY-MM/DD` | Real-time target feed | Keep in Realtime Database |
| Daily report data | `stats/nq/5m/daily/YYYY-MM/DD` | Daily analysis and target outcomes | Keep in Realtime Database |
| Weekly report data | `stats/nq/5m/weekly/YYYY/weekNumber` | Weekly analysis | Keep in Realtime Database |
| Session candles | `history/{ticker}/{timeframe}/YYYY-MM/DD` | Supporting charts and resolution review | Keep in Realtime Database |
| Day labels | `calendar/specialDays/YYYY-MM-DD/eventTags` | Market-day context | Keep in Realtime Database |
| Day-context comparisons | `stats/nq/5m/byDayContext` | Context benchmarks | Keep in Realtime Database |
| Signup profile copy | `users/{uid}` in the optional client database | Legacy user record created by the browser | Retire after Firestore user flow is verified |
| User profile API | `/api/users/me` | Server-verified profile | Keep and extend |
| Credential API | `/api/auth/*` | Email, password-event, and session lifecycle | Keep and extend |

The frontend initializes both Realtime Database and Firestore clients, but current product screens do not use Firestore for organization, membership, subscription, or entitlement information.

## Identity and access behavior

### What exists

- Firebase Authentication handles sign-in and session restoration.
- The shared API client attaches a Firebase ID token to backend requests.
- Protected routes redirect signed-out visitors to `/login`.
- The frontend has helpers for platform roles such as `user`, `admin`, and `super_admin`.
- The backend already offers `/api/users/me` as a server-verified profile source.

### What is missing or inconsistent

- All four product routes allow any authenticated user. There is no organization, active-seat, license, feature, delivery, or retention check.
- Route protection is based on platform role only. It does not understand organization roles such as owner, admin, and member.
- Auth initialization reads the legacy `role` claim, while the backend's current claim name is `platformRole`.
- `fetchMe` reads `me.role`, while the backend user response currently exposes `platformRole`.
- Organization claims may exist in the Firebase token, but the frontend does not load or use them.
- Direct Realtime Database reads cannot independently verify Firestore subscription data.
- The browser writes a legacy Realtime Database user record during signup even though Firestore is the backend source for managed user profiles.
- The dashboard has no clear loading, suspended-access, expired-license, no-seat, or no-organization state.

## Required frontend boundary

The frontend should treat the backend as the authority for customer access.

1. Firebase Authentication proves who the user is.
2. The backend returns a small customer-access summary for that user.
3. The frontend uses that summary to show or hide routes, features, retention choices, and administrative tools.
4. The backend and database rules still enforce access. Frontend hiding is only a user-experience aid.
5. Live market data remains in Realtime Database. A minimal, server-managed access projection or protected backend endpoint will bridge Firestore entitlements to Realtime Database access.

## Customer-access summary needed by the frontend

The next phases should establish one stable response shaped around customer decisions rather than raw database documents. At minimum it must answer:

| Question | Required answer |
| --- | --- |
| Who is signed in? | User ID and safe profile fields |
| Which customer account applies? | Active organization ID and organization name |
| What can this person do? | Organization role and platform role |
| Is access active? | Active, pending, suspended, expired, or revoked |
| Which product features are included? | Dashboard, email reports, team notifications, webhooks, API, and archive access |
| How much history is allowed? | Retention window or full archive |
| Can the user administer the account? | Seat, invitation, delivery, and integration permissions |
| When did access change? | Entitlement version or update marker used for refresh |

## Keep, add, and retire

| Action | Frontend item | Reason |
| --- | --- | --- |
| Keep | Firebase Authentication | Existing identity foundation |
| Keep | Shared authenticated API client | Correct place for protected customer-control requests |
| Keep | Four Harper Vance product views | They represent the current product |
| Keep | Realtime Database market feeds | Suitable for live and time-series product data |
| Add | Customer-access bootstrap | Gives the app an authoritative organization and license context |
| Add | Organization and entitlement guards | Prevents the UI from presenting unavailable features |
| Add | Clear access-state screens | Supports pending, suspended, expired, and revoked customers |
| Add | Account and delivery management views | Lets authorized customer admins manage seats and destinations |
| Retire | Browser-created Realtime Database user profile | Duplicates the managed Firestore user record |
| Quarantine | Unrelated template routes | Reduces product confusion and accidental exposure |

## Standards and security findings

The implementation will follow the repository's React, Firebase, security, testing, and JSDoc standards.

| Finding | Required treatment |
| --- | --- |
| Sensitive access cannot rely on client state | Verify every protected operation on the backend |
| Realtime Database access is not entitlement-aware | Add a minimal server-managed access bridge and restrictive rules |
| Role field names disagree between frontend and backend | Establish one canonical access response and mapping |
| Direct reads can expose more history than a license allows | Use bounded reads and backend delivery for retention-controlled history |
| Browser signup writes duplicate user data | Remove only after the Firestore lifecycle path is tested |
| Product and template routes share one protected shell | Explicitly identify the licensed Harper Vance route set |
| New access logic will be security-sensitive | Cover allowed, denied, expired, suspended, and stale-session cases with tests |

The repository standards prefer separate Firebase projects for development, staging, and production. The current approved infrastructure uses `goldensetups-dev` for this application. This inventory preserves that setup and records the environment split as a later operational decision instead of creating a new Firebase project without approval.

## Phase 1 acceptance record

- Current product routes are identified.
- Every direct product-data read is classified.
- Current authentication and authorization behavior is documented.
- No market-intelligence data is marked for migration to Firestore.
- Frontend-only enforcement is explicitly rejected for sensitive access.
- The customer-control information needed from the backend is defined.
- Existing production behavior is unchanged.
