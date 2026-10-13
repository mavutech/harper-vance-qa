# Test-mode release readiness

## Document status

Historical certification record for pull request 12 on October 12, 2026. Its
pull-request numbers and test totals describe that checkpoint and are not the
current candidate status. Use `launch-readiness-review.md`,
`local-release-candidate-manifest.md`, and `paired-release-checklist.md` for
current release decisions.

## Status

Certified October 12, 2026 for a controlled deployment from `main` while
Stripe remains in Test mode.

This certification does not approve a live charge or waive the remaining
legal, tax, or integration-security launch gates.

## Reconciled evidence

| Area | Required state | Certified state |
| --- | --- | --- |
| Backend pull request | Targets `main`, mergeable, Backend CI successful | Pull request 12 is mergeable and Backend CI passed |
| Frontend pull request | Targets `main`, mergeable, Firebase preview successful | Pull request 12 is mergeable and the preview passed |
| Browser acceptance | Public product, login, legal, mobile, and signed-out guards pass in a real browser | Five Playwright journeys passed locally and on the deployed preview |
| Backend regression | Lint, service tests, rules tests, and dependency gate pass | Most recent branch certification passed 72 suites, 587 tests, and all 79 rules tests |
| Frontend regression | Existing tests and production build pass | All 64 suites and 367 tests passed; production build succeeded |
| Billing mode | Test only | `STRIPE_ENVIRONMENT` is `test` |
| Application origin | Canonical production hostname | `APP_BASE_URL` is `https://www.harpervanceqa.com` |
| TradingView transition | Non-disruptive observation | `TRADINGVIEW_INGEST_MODE` is `observe` |
| Customer email | Secure transport available | SMTP delivery is secret-bound, TLS-verified, and certified |
| Recovery | Restore process proven without overwriting live data | Firestore restore drill and protected cleanup are certified |

## Required merge and deployment order

1. Confirm the backend pull request check is green and merge backend pull
   request 12 into `main`.
2. Monitor the backend `main` workflow through tests, rules, dependency audit,
   secret-name checks, owner access before deployment, Firebase deployment,
   access refresh, health check, and owner access after deployment.
3. Stop if any backend gate fails. Do not merge the frontend while the backend
   release is unhealthy.
4. Confirm the frontend preview and browser checks are green and merge frontend
   pull request 12 into `main`.
5. Monitor the frontend `main` workflow through unit tests, production build,
   browser tests, Firebase Hosting deployment, and both hostname checks.
6. Run the post-deployment test-mode checks below before accepting the release.

## Post-deployment test-mode checks

- The public health endpoint returns HTTP 200 without customer data.
- An unauthenticated protected API request returns HTTP 401.
- The read-only owner gate retains `super_admin`, MFA, internal entitlement,
  and current daily and weekly product access.
- The landing page, client login, Terms, Privacy, customer dashboard route, and
  platform administration route load from the deployed site.
- The existing Stripe Test organization retains its subscription, license,
  seat limit, onboarding progress, and dashboard access.
- No live Stripe checkout, invoice, subscription, or charge is created.
- Both approved hostnames serve the same Harper Vance application over HTTPS.

## Stop conditions

Stop the release and preserve evidence when any of these occur:

- platform-owner access is lost or reduced;
- customer data crosses an organization boundary;
- product data is missing after the release;
- billing leaves Test mode;
- payment state and product access disagree;
- a required secret binding or deployment check fails;
- either approved hostname fails; or
- the browser or regression suite fails.

## Rollback

Use a normal revert pull request against `main`. Do not reset shared history,
force-push, delete customer records, overwrite a live database, or manually
mark a payment active. The same automated deployment and acceptance gates apply
to the revert.

## Gates intentionally retained for live customers

- Legal counsel must approve the final Terms, Privacy Policy, and applicable
  customer agreement package.
- A qualified tax adviser must approve the Stripe product tax treatment.
- Previously exposed Discord webhook endpoints must be rotated.
- All active TradingView alerts must send the protected ingestion value before
  enforcement is approved.
- Live Stripe activation and the first real transaction each require explicit
  platform-owner approval.
