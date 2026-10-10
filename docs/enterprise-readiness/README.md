# Harper Vance enterprise readiness

## Objective

Harper Vance is enterprise ready when customers can use the licensed analytics
dashboard and the platform owner can manage the complete customer lifecycle
through an administration console.

Routine onboarding and support must not require direct Firebase edits,
command-line scripts, or customer password access.

## Recovery baseline

- Frontend source of truth: GitHub `main` at `7b05e86` before recovery work.
- The existing product areas are Today's Targets, Daily Performance, Weekly
  Summary, and Historical and Rolling analysis.
- The approved platform owner product entitlement and organization relationship
  were restored and verified by the governed backend recovery workflow.
- The final `super_admin` owner grant remains protected by the approved MFA
  requirement. The frontend now provides TOTP enrollment and TOTP sign-in so
  the requirement can be satisfied without weakening access rules.
- The recovered frontend and licensed history path were deployed from `main`
  by workflow run `38008615570` on October 9, 2026.
- The rejected JEV open-target workspace changes were discarded before the
  recovery branch was created.
- The production build succeeds. The expired weekly-selection test and broken
  application-shell test were repaired during Phase 1. The full frontend suite
  now passes before preview deployment.

## Live-target access recovery

- The October 8 owner-access incident was a denied Realtime Database listener,
  not missing target data. The live database contained nine target records and
  the governed owner projection contained the active live-target grant for the
  current date.
- Firebase cancels a listener after a permission denial. A listener that was
  opened before access provisioning therefore requires a fresh subscription;
  the live production page loaded the expected records after refresh.
- The target feed now waits for authentication persistence, reads through the
  governed product API, stops unresolved loading after 15 seconds, uses safe
  customer copy, and offers an in-page retry.
- The dashboard no longer reads current targets or day context directly from
  Realtime Database.
- The MFA challenge provides a visible, accessible `Back to sign in` action;
  login labels are programmatically associated with their form controls.
- Recovery verification requires the target-service and target-hook regression
  tests, the full frontend test suite, and a production build before preview.

## Delivery phases

1. Verify owner access against the repaired backend. Completed October 9, 2026.
2. Stabilize the enterprise frontend and replace raw Firebase errors with safe,
   useful customer messages. Completed October 9, 2026.
3. Certify all existing analytics pages on desktop and mobile. Completed
   October 9, 2026. Every preview and main release runs the complete frontend
   suite before Firebase Hosting deployment.
4. Build the owner administration console. Completed October 9, 2026.
5. Prove the complete customer onboarding and access lifecycle. In progress on
   `codex/enterprise-ready-phase-5-certification`; see
   `docs/enterprise-readiness/phase-5-lifecycle-certification.md`.
6. Complete product access integration, then certify the first customer
   release. See
   `docs/enterprise-readiness/phase-6-product-access-integration.md`.

## Phase 2 frontend stabilization

- Analytics service failures are converted to controlled customer copy before
  entering Redux or page components. Firebase paths and internal messages are
  not rendered to customers.
- Every protected Realtime Database analytics read waits for Firebase Auth
  persistence before requesting data, preventing cold-start permission denials
  on Daily, Weekly, Historical, and Session Replay surfaces.
- Missing daily and weekly reports remain explicit business states; permission
  and network failures are no longer silently converted into empty datasets.
- Daily, Weekly, Historical, Today's Targets, and Session Replay surfaces offer
  a fresh request after recoverable failures.
- Repeated analytics error markup is consolidated into one accessible notice,
  and retry and load-failure analytics use stable reasons without PII.
- Supporting late-target and missed-target panels expose safe feature-specific
  errors instead of infrastructure messages.

Every customer-facing phase receives a Firebase preview. The preview URL,
automated test results, scope, risks, and rollback instructions must be included
in the pull request before merge.

## Owner administration acceptance contract

The frontend work is not complete until the platform owner can:

- create and review customer organizations;
- assign and change licenses;
- invite, remove, and manage customer users;
- assign organization roles and seats;
- activate, suspend, reactivate, and close customer access;
- review licensed features, history limits, API access, and webhook access;
- diagnose access problems without exposing Firebase internals;
- review an audit history of customer-management changes.

The customer experience must enforce organization isolation and show clear
loading, empty, expired, suspended, and error states.

## Phase 4 administration frontend

The platform owner now has a protected Customer Organizations console. The
navigation and route are visible only to the canonical `super_admin` platform
role. The browser uses authenticated backend endpoints and does not write
customer-control records directly to Firebase.

The console supports:

- staged customer organization creation;
- authoritative license, subscription status, seat, and billing-mode changes;
- organization member invitations, roles, removal, and pending-invitation
  revocation;
- customer invitation validation, account creation, sign-in return, and access
  token refresh;
- entitlement-aware delivery destination and API-client configuration;
- support-case review;
- one-time fallback invitation links and one-time API-secret display;
- audit-history export; and
- typed-confirmation organization closure.

See `docs/enterprise-readiness/customer-administration.md` for the operator
workflow and Phase 5 acceptance boundary.

## Branch and release policy

- Feature branches start from GitHub `main`.
- Paired frontend and backend work uses the same branch name.
- Every frontend pull request has its own Firebase preview.
- Merges to `main` deploy automatically.
- No merge occurs before owner acceptance of the preview.
- A release stops immediately when an acceptance gate fails.
