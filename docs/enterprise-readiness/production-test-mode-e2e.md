# Production end-to-end verification in Test mode

## Purpose

This release gate proves that a successful deployment preserves both the
platform owner and the designated Stripe Test customer. It is read-only and
does not create a checkout, contact Stripe, update Firebase, send an email, or
issue a charge.

## Backend customer canary

The backend `main` workflow now runs two separate post-deployment checks:

1. The existing owner gate verifies canonical `super_admin` authority, MFA,
   internal entitlement, and current daily and weekly product access.
2. The Stripe Test customer gate verifies the designated canary organization
   has:
   - explicit Test billing mode;
   - an active Entity Core subscription;
   - the required dashboard entitlement;
   - active Stripe Test payment state;
   - all 6 onboarding steps complete; and
   - exactly 1 used seat, no pending invitation, and a 1-seat limit.

The customer identifier is stored as the non-secret GitHub repository variable
`E2E_TEST_ORG_ID`. The verifier returns only license, status, progress, and seat
counts. It does not return the organization identifier, customer name, email,
provider references, or payment details.

## Frontend production journeys

The frontend `main` workflow runs the Playwright suite before deployment and
again against the deployed `PRODUCTION_BASE_URL`. The approved value is
`https://www.harpervanceqa.com`.

The deployed-browser gate verifies:

- the product promise and included service;
- client login access;
- public Terms and Privacy routes;
- mobile navigation to licensing; and
- signed-out denial for the customer dashboard and platform administration.

Both approved hostnames are checked after the browser suite.

## Stop and rollback behavior

A failed owner, customer, browser, or hostname check fails the release. Because
the deployed-browser checks run after Hosting deployment, the operator must
open a revert pull request, allow the same release gates to deploy the revert,
and preserve the failed workflow evidence. Do not repair the failure by editing
customer records, weakening MFA, changing payment state, or bypassing tests.

## Current evidence

- The read-only customer verifier passed against the deployed Test customer on
  October 12, 2026: Test mode, Entity Core, active subscription, active
  payment, active access, 6 of 6 onboarding steps, and 1 of 1 seat.
- Backend verifier tests cover healthy, live-mode refusal, missing canary,
  incomplete onboarding, subscription drift, billing drift, and seat drift.
- Production HTTP checks return 200 over IPv4 and IPv6 for the canonical site.
- No live Stripe object or charge was created.

Final automated certification is the successful backend and frontend `main`
workflow record containing these post-deployment gates.
