# Automated end-to-end testing

## Purpose

The browser test suite protects the customer-facing journeys that unit tests do
not exercise. It uses a real Chromium browser and verifies the built Harper
Vance application through the same routes a visitor or signed-out customer
uses.

## Current automated coverage

- The landing page presents the approved product headline and included service.
- A visitor can reach the existing client login from the landing page.
- The login form exposes accessible email and password controls.
- Terms of Service and Privacy Policy routes are publicly available.
- Signed-out visitors cannot open the customer dashboard.
- Signed-out visitors cannot open platform-owner administration.
- The mobile menu opens, reaches licensing, and closes correctly.
- An isolated platform owner can create and configure customer organizations.
- Entity Core, Desk Intelligence, and Firm-Wide Enterprise enforce the approved
  1, 5, and 15 included-seat structure.
- New and existing customer accounts can accept governed invitations.
- Customer administrators can manage their team while standard members cannot.
- Suspension and cancellation remove licensed access, while governed
  reactivation restores it.
- A customer can log out and sign back in after reactivation.

This foundation intentionally does not store customer credentials, owner
passwords, MFA recovery details, or billing secrets in source control.
Authenticated owner, customer-administrator, customer-member, and Stripe Test
journeys must use dedicated test identities stored as protected automation
secrets.

## Running the suite

Install the supported Chromium browser once:

```bash
yarn test:e2e:install
```

Run against the local application:

```bash
yarn test:e2e
```

If port 3000 is already in use by another local service, choose an unused
loopback port without stopping that service:

```bash
PLAYWRIGHT_LOCAL_PORT=3200 yarn test:e2e
```

Run against an approved Firebase preview:

```bash
PLAYWRIGHT_BASE_URL=https://approved-preview.example yarn test:e2e
```

The configured URL must be an approved Harper Vance test deployment. Do not
point browser automation at an unknown site or a live customer tenant.

Run the isolated enterprise customer lifecycle against the paired local
frontend and backend repositories:

```bash
yarn test:e2e:enterprise
```

This command starts disposable Firebase emulators, creates random run-scoped
passwords, seeds test-only identities, exercises the browser lifecycle, and
stops the local services. It fails closed unless every Firebase product points
to a `demo-` project on loopback. It does not use production data, persisted
credentials, Stripe Live, or customer accounts.

## Release gates

- Pull requests deploy a Firebase preview and run the browser suite against the
  deployed preview.
- Pushes to `main` run the browser suite locally before Firebase Hosting is
  deployed.
- A browser-test failure blocks the workflow.
- Screenshots, traces, videos, and the HTML report are retained for 14 days only
  when a workflow fails.

## Authenticated coverage

The release workflow also signs in through the customer login using a dedicated
non-admin automation identity. The browser verifies licensed daily, weekly,
historical, live-target, and team routes, then proves the same identity cannot
open platform administration. The protected password exists only as a GitHub
secret, and the account does not belong to a real customer.

Platform-owner MFA and Stripe lifecycle integrity remain covered by backend
release gates and service-level tests. Browser automation does not store the
owner's password or authenticator seed and does not create a live charge.

## Enterprise lifecycle certification

Certified October 13, 2026.

- Ten Chromium journeys pass against the paired local Firebase emulator stack.
- The platform owner lands in customer administration rather than a customer
  dashboard that requires a license.
- Invitations preserve their one-time fallback link while the authoritative
  team record refreshes.
- Existing accounts refresh their access contract before entering the product.
- Suspension, cancellation, and reactivation are proven from the operator UI
  through the customer dashboard boundary.
- The complete browser inventory is 17 journeys: 5 public and signed-out, 2
  authenticated deployment checks, and 10 isolated enterprise lifecycle
  checks.

## Phase 1 certification

Certified October 12, 2026.

- The official Playwright package is locked to version 1.64.0 in the Yarn
  dependency graph.
- Five Chromium journeys pass against the local application.
- All 64 existing frontend suites and 367 tests pass.
- The production build completes successfully.
- Pull-request previews now run browser tests against the deployed preview URL.
- Main releases now run browser tests before Firebase Hosting deployment.
- Failure-only screenshots, traces, videos, and HTML reports are retained for
  14 days to support diagnosis without collecting routine browsing evidence.

## Authenticated certification

The authenticated increment is accepted only when the dedicated identity is
provisioned through the governed backend workflow, both repositories contain
the protected password secret, every licensed route renders without a
permission error, and platform administration remains forbidden.

## Known release risks

- Authenticated browser journeys still require dedicated test identities and
  protected automation secrets. They are not replaced by hardcoded or shared
  customer credentials.
- The older Create React App dependency graph reports inherited security
  advisories. A forced automated replacement would introduce breaking package
  changes, so dependency modernization remains a separate controlled phase.
- Protected routes are split from the entry bundle. A permanent 400 KiB gzip
  budget now blocks an entry-bundle regression in preview and production
  workflows.
