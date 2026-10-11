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

## Outstanding launch gates

- Decide and configure the approved billing intervals and Stripe prices.
- Add the required Stripe test secrets and canonical application origin.
- Supply counsel-approved legal document versions and public policy links.
- Pass the complete checkout, webhook, activation, suspension, cancellation,
  and renewal test lifecycle.
- Connect and certify the apex and `www` domains.
- Complete monitoring, recovery, incident, and first-customer runbooks.

