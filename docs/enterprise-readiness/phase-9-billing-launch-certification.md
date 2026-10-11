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
