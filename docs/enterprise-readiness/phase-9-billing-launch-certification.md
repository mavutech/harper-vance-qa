# Phase 9: billing launch certification

## Objective

Certify the complete Harper Vance billing and customer-onboarding lifecycle in
Stripe test mode before introducing any live payment configuration. Existing
product analytics, platform-owner access, customer isolation, and target data
remain protected release gates.

## Phase 0 baseline

Reconciled October 11, 2026.

- Backend and frontend use the matching
  `codex/enterprise-ready-phase-7-billing-onboarding` branch.
- Both branches are clean, pushed, and 13 commits ahead of `main`.
- Current `main` is an ancestor of both branches, so the work remains based on
  the production source of truth.
- Backend pull request 12 and frontend pull request 12 are open, target `main`,
  and report a clean merge state.
- Backend CI and the frontend Firebase Hosting Preview checks pass.
- The approved application origin is configured as
  `https://harpervanceqa.com`.
- The following Stripe test configuration names exist in Google Secret Manager:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_ENTITY_CORE_MONTHLY`
  - `STRIPE_PRICE_ENTITY_CORE_ANNUAL`
  - `STRIPE_PRICE_DESK_INTELLIGENCE_MONTHLY`
  - `STRIPE_PRICE_DESK_INTELLIGENCE_ANNUAL`
- Secret values remain outside source control, documentation, browser storage,
  customer records, and application logs.
- Stripe is still in test mode. No live charge or production payment acceptance
  is enabled.

## Engineering standards

This phase follows Mavutech Engineering Standards 1.0.0, including the Node API,
React Web, Firebase, Axios, JSDoc, security, and unit-test standards. The work
must preserve the existing Routes to Controllers to Services boundary, use the
central API client and analytics utilities, validate all browser input on the
server, verify Firebase identity and organization authority, and keep payment
credentials server-only.

## Delivery phases

| Phase | Outcome | Required evidence |
| --- | --- | --- |
| 0. Baseline | Branches, standards, pull requests, test configuration, and release gates are reconciled | This document committed in both repositories |
| 1. Secret binding | The backend function receives all six Stripe test secrets from Secret Manager | Deployment configuration tests and a successful test deployment |
| 2. Test deployment | Backend test billing and the paired frontend preview are available without product regressions | Health, owner-access, dashboard-data, test-suite, and build results |
| 3. Checkout | An approved organization can receive the exact hosted checkout session staged by the platform owner | Monthly and annual test checkout evidence for both standard licenses |
| 4. Webhooks | Signed Stripe events reconcile once and only against the staged organization contract | Completion, activation, duplicate, mismatch, and out-of-order event results |
| 5. Access and seats | Verified payment state controls licensed access and the 1, 5, and 15-seat boundaries | Owner, customer-admin, member, suspension, recovery, and cancellation results |
| 6. Progress | Platform owners and customer administrators see role-appropriate onboarding and billing progress | UI, authorization, fallback, and analytics results |
| 7. End-to-end certification | The complete test customer lifecycle passes without cross-organization access or owner regression | Completed certification record and approved Firebase preview |
| 8. Production readiness | Legal links, monitoring, support, recovery, domains, and operator procedures are approved | Signed launch checklist |
| 9. Live configuration | Matching live Stripe products, prices, webhook, and secrets are created and stored separately | Names and amounts verified without exposing values |
| 10. Production deployment | Live configuration is deployed without performing a charge | Production health and no-charge smoke-test evidence |
| 11. Controlled live transaction | One explicitly approved real payment proves the live lifecycle | Payment, receipt, webhook, entitlement, seat, and dashboard evidence |
| 12. Launch handoff | Client onboarding, billing operations, support, and rollback instructions are complete | Platform-owner acceptance |

Each implementation phase receives a focused commit and push in each affected
repository. A phase cannot advance when authentication, authorization, data
isolation, payment integrity, or existing dashboard behavior fails.

## Test strategy

Automated coverage must include configuration validation, checkout terms,
signature verification, event idempotency, provider-reference matching,
subscription-state transitions, entitlement projection, seat enforcement,
organization isolation, platform-owner access, safe response shapes, and UI
failure states.

End-to-end test-mode certification must cover:

- successful, declined, authenticated, canceled, and abandoned checkout;
- monthly and annual terms for Entity Core and Desk Intelligence;
- checkout completion without premature access activation;
- active, past-due, recovered, canceled, duplicate, delayed, and out-of-order
  subscription events;
- 1-seat, 5-seat, and 15-seat organization behavior;
- platform-owner, customer-owner, customer-administrator, and member access;
- cross-organization access denial;
- mobile checkout return, profile navigation, and onboarding progress; and
- canonical apex and `www` domain behavior.

## Production boundary

Test-mode objects cannot be converted into live objects. After test
certification, the platform owner must approve the creation of matching live
products, prices, and a live webhook. Live secret values must be stored as a
separate production configuration. The first real transaction requires an
explicit action-time approval and stops the release if any payment, webhook,
access, seat, or dashboard result is incorrect.

Stripe identity, banking, tax, payout, and account-security steps that require
the account owner remain owner-completed actions.

## Phase 1 certification

Certified October 11, 2026.

- All six Stripe test secrets are declared through Firebase Secret Manager
  parameters and attached only to the `sonaDashboard` HTTPS function.
- The main deployment workflow verifies every required secret name and the
  approved application origin before deployment.
- Regression coverage prevents a required binding or deployment gate from
  being removed silently.
- All 65 backend suites and 539 tests passed, all 9 Firebase rules suites and
  79 rules tests passed, and backend lint passed.
- The production dependency audit reported no high-severity finding. Eight
  known moderate transitive findings remain in the Firebase and Google
  dependency chain; the automated recommendation requires a breaking Firebase
  Admin downgrade and was not applied.

## Phase 2 certification

Certified October 11, 2026.

- Firebase successfully updated the Node.js 22 `sonaDashboard` function in
  `goldensetups-dev` with all six Stripe test secrets attached.
- The Firebase runtime service account has Secret Manager accessor permission
  for each required Stripe test secret.
- The deployed API returned the standard response envelope, security headers,
  and `401 UNAUTHENTICATED` for an unauthenticated protected request.
- The read-only owner release gate verified canonical `super_admin` authority,
  MFA enrollment, internal full-product entitlement, and the current daily and
  weekly access projection.
- The paired Firebase Hosting Preview presents the canonical client login.
- All 65 backend suites and 540 tests passed after deployment preparation.
- All 62 frontend suites and 356 tests passed, and the production frontend
  build completed successfully.
- The backend now retains only the npm `package-lock.json`. A stale tracked
  Yarn lockfile was removed after Firebase Cloud Build correctly rejected the
  conflicting frozen dependency graph. CI and main deployment workflows now
  fail early if that conflict is reintroduced.

## Phase 3 certification

Certified October 11, 2026.

- Stripe Test checkout sessions were generated from platform-owner-approved
  customer records for every standard price combination:
  - Entity Core monthly: $1,500, 1 included seat
  - Entity Core annual: $14,400, 1 included seat
  - Desk Intelligence monthly: $5,000, 5 included seats
  - Desk Intelligence annual: $48,000, 5 included seats
- Each session retained the staged organization, license, payment term, and
  seat limit in provider metadata. The three price-contract checks remained
  open and unpaid; no access was granted from session creation alone.
- One Entity Core monthly Test subscription completed successfully. Stripe
  reported the checkout paid and the subscription active without a live charge.
- The first signed deliveries exposed a Firebase runtime boundary: Firebase
  preserved the exact Stripe bytes on `rawBody`, while the controller verified
  the already-parsed request body. The controller now prefers Firebase's exact
  bytes and retains the Express raw-body fallback for local operation.
- A replacement Stripe Test webhook secret was stored in Secret Manager and
  deployed. A genuine `customer.subscription.updated` delivery returned HTTP
  200, reconciled billing and licensed access to Active, and advanced the test
  customer from 3 of 6 to 5 of 6 onboarding steps. The obsolete endpoint was
  disabled after successful verification.
- The checkout return correctly attempted the approved apex application origin,
  but `harpervanceqa.com` did not resolve. Payment and webhook processing still
  completed. Canonical apex and `www` DNS remain a production release blocker
  for Phase 8 rather than a reason to weaken billing controls.
- All 66 backend suites and 542 tests passed, including new Firebase raw-body
  regression coverage, and backend lint passed.

## Phase 4 certification

Certified October 11, 2026.

- Subscription webhooks now retrieve Stripe's current subscription before
  changing billing or product access. A delayed event payload therefore cannot
  overwrite the provider's newer active, past-due, recovered, or canceled state.
- A late checkout-completion event can record its provider references but cannot
  downgrade an account that subscription reconciliation already marked active,
  past due, suspended, or canceled.
- Duplicate event IDs are acknowledged without repeating side effects. Provider
  customer, license, payment-term, and seat mismatches continue to fail closed
  and leave licensed access unchanged.
- Automated transition evidence covers activation, past-due suspension,
  recovery, cancellation, duplicate delivery, mismatched contracts, late
  checkout completion, and out-of-order subscription payloads.
- If Stripe's current subscription cannot be read, the event is marked failed
  for retry and no access change is applied.
- A fresh Stripe Test `customer.subscription.updated` delivery exercised the
  deployed authoritative reconciliation path and returned HTTP 200 with no
  signature or processing error.
- All 66 backend suites and 547 tests passed, and backend lint passed.

## Phase 5 certification

Certified October 11, 2026.

- The licensed seat limits are enforced as exact product boundaries: Entity
  Core accepts 1 seat, Desk Intelligence accepts 5 seats, and Firm-Wide
  Enterprise accepts 15 seats. Values below those approved limits are rejected.
- Pending invitations reserve a seat before acceptance, preventing an
  organization from inviting beyond its licensed capacity.
- Customer owners and customer administrators can manage permitted membership
  workflows. Members retain product access without receiving customer-admin or
  platform-owner authority.
- Access remains isolated by organization. Cross-organization requests and
  attempts to use another organization's membership are denied.
- Active subscriptions permit licensed product access. Past-due suspension and
  cancellation deny customer access, while a valid recovery restores it without
  changing the underlying product data.
- Platform-owner access remains independent of customer seat consumption and
  customer billing state.
- All 66 backend suites and 555 tests passed, all 9 Firebase rules suites and 79
  rules tests passed, and backend lint passed.
- All 62 frontend suites and 358 tests passed, and the production frontend build
  completed successfully.

## Phase 6 certification

Certified October 11, 2026.

- The onboarding API now returns a role-safe account summary derived from the
  authoritative organization, subscription, billing, and entitlement records.
- Platform owners and customer administrators can see the assigned license,
  payment state, dashboard-access state, completed setup steps, and the next
  action appropriate to their role.
- Customer-facing progress omits billing-provider references, customer email
  addresses, internal organization details, and payment credentials.
- Suspended, canceled, closed, pending, and active dashboard states are
  presented explicitly without changing the underlying access decision.
- If progress cannot be loaded, the interface keeps account and team controls
  available, shows a safe fallback, and records the failed load for review.
- The updated Node.js 22 `sonaDashboard` function deployed successfully to
  `goldensetups-dev` with the existing protected secret bindings.
- All 66 backend suites and 561 tests passed, backend lint passed, all 62
  frontend suites and 359 tests passed, and the production frontend build
  completed successfully.

## Phase 7 certification

Certified October 11, 2026.

- The approved Firebase pull-request preview deployed successfully at
  `https://harpervanceqa--pr12-codex-enterprise-rea-l83sub5k.web.app`.
- The platform-owner walkthrough confirmed customer selection, the active Test
  subscription, licensed dashboard access, onboarding progress, and the next
  required customer-administrator action.
- Stripe return URLs now preserve the affected organization. The administration
  page reopens that customer after checkout without treating browser return as
  proof of payment.
- A submitted return states that provider confirmation is still pending. A
  canceled or abandoned return states that no payment completed and access did
  not change.
- The submitted and canceled return states were verified on the deployed
  preview, including a 390 by 844 mobile viewport. The customer table, status
  message, and progress content remained usable.
- The successful Stripe Test transaction, signed webhook activation,
  out-of-order recovery, role boundaries, seat limits, organization isolation,
  suspension, recovery, cancellation, and owner-access regression gates are
  covered by the combined Phase 3 through Phase 7 evidence.
- All 66 backend suites and 561 tests passed, backend lint passed, all 62
  frontend suites and 361 tests passed, and the production frontend build
  completed successfully.

## Live credential binding certification

Certified October 12, 2026.

- All six live Stripe secret names have an enabled version in Google Secret
  Manager. Verification checked version state only and did not read or expose
  secret values.
- Firebase granted the `sonaDashboard` runtime service account Secret Manager
  accessor permission for the six live Stripe secrets and deployed the updated
  Node.js 22 function successfully.
- The deployed function now has all six test and all six live Stripe secret
  names attached. Stripe remains in test mode because the deployed environment
  does not select live billing and the application fails safely to test mode.
- The deployed health endpoint returned the standard successful response, an
  unauthenticated protected request returned `401 UNAUTHENTICATED`, and the
  read-only owner release gate verified `super_admin` access and current daily
  and weekly product projections.
- Backend lint passed, all 68 backend suites and 569 tests passed, and all 9
  Firebase security-rule suites and 79 rules tests passed before deployment.
- No live checkout session, subscription, invoice, or charge was created.

## Test-mode billing lifecycle recertification

Certified October 12, 2026.

- The previously completed Stripe Test checkout, signed webhook activation,
  duplicate-event protection, delayed-event reconciliation, payment recovery,
  cancellation, and no-premature-access evidence remains the authoritative
  provider-level lifecycle proof.
- The current backend passed all 68 suites and 569 tests, including checkout
  terms, environment separation, webhook signature input, event idempotency,
  account matching, subscription transitions, and safe billing responses.
- The current frontend passed all 64 suites and 365 tests, including governed
  checkout creation, return-state handling, onboarding progress, billing
  summaries, and customer-administration failure states.
- The production frontend build completed successfully. The existing bundle
  size warning remains a performance improvement item and does not affect the
  certified billing or access behavior.
- No additional Stripe customer, checkout session, subscription, invoice, or
  charge was created during recertification.
