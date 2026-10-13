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

Run against an approved Firebase preview:

```bash
PLAYWRIGHT_BASE_URL=https://approved-preview.example yarn test:e2e
```

The configured URL must be an approved Harper Vance test deployment. Do not
point browser automation at an unknown site or a live customer tenant.

## Release gates

- Pull requests deploy a Firebase preview and run the browser suite against the
  deployed preview.
- Pushes to `main` run the browser suite locally before Firebase Hosting is
  deployed.
- A browser-test failure blocks the workflow.
- Screenshots, traces, videos, and the HTML report are retained for 14 days only
  when a workflow fails.

## Remaining authenticated coverage

The next automation increment must cover dedicated test accounts for:

- platform-owner sign-in with MFA;
- customer invitation acceptance;
- customer-owner and customer-administrator onboarding progress;
- licensed member dashboard access;
- cross-organization access denial;
- seat-limit enforcement; and
- Stripe Test checkout return and subscription state changes.

Those tests must remain in Stripe Test mode and must not use real customer
records or issue a live charge.

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
