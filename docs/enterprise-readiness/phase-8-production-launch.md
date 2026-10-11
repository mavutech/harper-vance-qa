# Phase 8: production launch readiness

## Objective

Move the approved billing and onboarding foundation into production without
regressing platform-owner access, existing analytics, or customer isolation.
`main` remains the production source of truth. Frontend and backend changes use
the matching `codex/enterprise-ready-phase-7-billing-onboarding` branch until
the current pull requests are accepted.

## Checkpoint 0: reconciled baseline

Reconciled October 11, 2026.

- Backend pull request 12 contains nine focused commits on top of `main` and
  has a successful Backend CI check.
- Frontend pull request 12 contains nine focused commits on top of `main` and
  has a successful Firebase Hosting Preview check.
- Both working trees are clean and match their GitHub branches.
- Both pull requests target `main` and report a clean merge state.
- The rejected JEV open-target experiment is not part of either pull request.
- Existing target generation and analytics calculations are outside the
  billing and onboarding change boundary.
- Payment remains disabled for production acceptance until the required Stripe
  configuration and application origin are present and test mode is certified.

## Retained scope

- License-specific included seats of 1, 5, and 15 or more.
- Governed agreements, billing accounts, onboarding status, and Stripe event
  reconciliation.
- Organization-scoped team administration and pending-invitation seat
  reservations.
- Platform-owner and customer-administrator progress views.
- Existing owner-access release checks and product-access projections.

## Checkpoint 1: access and regression certification

Certified October 11, 2026.

- The read-only platform-owner release gate verified canonical `super_admin`
  authority, MFA enrollment, the internal owner relationship, full product
  entitlement, and the current daily and weekly access projection.
- The owner gate reported the current projection date and week without changing
  identity, organization, entitlement, or product records.
- All 63 backend test suites and 529 backend tests passed.
- All 9 Firebase rules suites and 79 rules tests passed.
- Backend lint passed.
- All 62 frontend test suites and 349 frontend tests passed.
- The production frontend build completed successfully.
- The production dependency audit reported no high-severity finding. Eight
  moderate transitive findings remain in the Firebase and Google dependency
  chain. The automated recommendation requires a breaking Firebase Admin
  downgrade and is deferred to controlled dependency remediation.

These checks certify the current owner-access contract and the branch's
automated regression boundary. Interactive browser acceptance remains part of
the final preview and production smoke tests.

## Explicit exclusions

- No migration of historical analytics data.
- No change to target generation, target evaluation, or report calculations.
- No anonymous public checkout.
- No signed legal documents stored in Harper Vance.
- No live Stripe values before test-mode certification.

## Release order

1. Certify existing owner access and analytics against the paired preview.
2. Complete and certify the payment and legal configuration in test mode.
3. Approve the frontend Firebase preview.
4. Merge and deploy the backend pull request.
5. Verify backend health and owner access.
6. Merge and deploy the frontend pull request.
7. Run production smoke tests and monitor the release.

Any failed access, data, payment, or isolation check stops the release. The
rollback is to revert the affected pull request from `main`; no destructive
data rollback is permitted.

## Checkpoint 2: approved commercial model

Approved October 11, 2026.

- Entity Core includes 1 seat and supports $1,500 monthly or $14,400 annually.
- Desk Intelligence includes 5 seats and supports $5,000 monthly or $48,000
  annually.
- Firm-Wide Enterprise includes 15 seats, starts at $15,000 monthly under an
  annual agreement, and remains sales-assisted and contract-controlled.
- Public self-service checkout is outside the product boundary.
- The executed order controls commercial terms, Stripe controls payment state,
  and Harper Vance entitlements control product access.
- Trials, renewal notice, cancellation timing, refunds, and early termination
  require approved legal terms and are not invented by application code.

See `docs/enterprise-readiness/commercial-model.md`.

## Checkpoint 3: payment-term implementation

Implemented October 11, 2026.

- Entity Core and Desk Intelligence stage an explicit monthly or annual payment
  term with the approved license and seat allowance.
- The backend maps license and payment term to four server-only Stripe price
  secrets. The browser cannot submit a Stripe price identifier.
- Checkout, billing-account records, audit evidence, and Stripe metadata retain
  the staged payment term.
- Verified Stripe events must match the staged customer, license, payment term,
  and seat allowance before access can change.
- Firm-Wide Enterprise is excluded from standard checkout and remains governed
  by its executed order. The platform owner can prepare the Stripe customer
  without exposing or selecting the negotiated price in Harper Vance.
- The platform owner dashboard displays and edits the payment term and provides
  safe guidance when Enterprise requires contract-managed payment.
- Automated coverage includes monthly and annual selection, contract-controlled
  Enterprise handling, safe analytics, and governed API requests.

Code acceptance does not activate payments. Stripe test secrets, approved
prices, the webhook secret, and the canonical application origin remain
deployment gates.

Verification: all 62 frontend suites and 356 tests passed, and the production
frontend build completed successfully.

## Outstanding launch gates

- Configure the approved billing intervals and Stripe prices.
- Add the required Stripe test secrets and canonical application origin.
- Supply counsel-approved legal document versions and public policy links.
- Pass the complete checkout, webhook, activation, suspension, cancellation,
  and renewal test lifecycle.
- Connect and certify the apex and `www` domains.
- Complete monitoring, recovery, incident, and first-customer runbooks.
