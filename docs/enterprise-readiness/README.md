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

## Current delivery status

The enterprise foundation is complete in the local release candidate. The
current candidate is not yet a deployed release because Firebase Hosting is
under provider review and no recent local commit has been pushed.

| Area | Current status |
| --- | --- |
| Owner access and MFA | Implemented and protected by pre-deployment and post-deployment release gates |
| Analytics access and customer-safe errors | Implemented and covered by unit, component, and browser tests |
| Customer administration | Implemented for organization, license, agreement, seat, user, lifecycle, and audit operations |
| Customer lifecycle and isolation | Certified locally through disposable Firebase emulators |
| Product access integration | Implemented; current-candidate preview and production verification remain external gates |
| Billing and onboarding | Stripe Test logic and administrator-led onboarding are implemented; deployed Test checkout and signed webhook recheck remain external gates |
| Browser release gates | Implemented for public, signed-out, authenticated, mobile, keyboard, and enterprise lifecycle journeys |
| Operational readiness | Onboarding, billing, support, recovery, handoff, rollback, and paired release procedures are documented |
| Scale and performance | The 1, 5, and 15-seat offers, initial 100-organization envelope, route splitting, and 400 KiB entry-bundle budget are certified |
| Current release | Blocked until Firebase Hosting recovers, a working preview passes, and the paired repositories complete their `main` workflows |

The numbered `phase-*` documents record how the platform was built and tested
at that point in time. They are historical implementation evidence, not the
current release checklist. Use the source-of-truth map below for current work.

## Current source-of-truth documents

| Need | Document |
| --- | --- |
| Current launch status and remaining gates | `docs/enterprise-readiness/launch-readiness-review.md` |
| Exact certified local commits and test evidence | `docs/enterprise-readiness/local-release-candidate-manifest.md` |
| Repeatable paired local test command | `docs/enterprise-readiness/local-release-certification.md` |
| Backend-first merge, preview, deployment, and rollback | `docs/enterprise-readiness/paired-release-checklist.md` |
| Customer onboarding and handoff | `docs/enterprise-readiness/customer-onboarding-guide.md` and `docs/enterprise-readiness/operational-handoff.md` |
| Billing operation and Test-mode acceptance | `docs/enterprise-readiness/billing-operations-checklist.md` |
| Support and account recovery | `docs/enterprise-readiness/support-and-recovery.md` |
| Mobile and keyboard verification | `docs/enterprise-readiness/local-usability-review.md` |

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

Use `docs/enterprise-readiness/paired-release-checklist.md` for the exact
backend-first merge order, preview evidence, production verification, stop
conditions, and rollback sequence.

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
