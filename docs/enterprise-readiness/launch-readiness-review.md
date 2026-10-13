# Enterprise launch readiness review

## Purpose

This is the current source of truth for taking Harper Vance from a certified
Stripe Test operation to the first paying customer. Older phase records remain
historical evidence and must not be interpreted as the current launch status.

## Current readiness

| Area | Status | Evidence or decision |
| --- | --- | --- |
| Platform-owner access | Ready | Every backend deployment verifies canonical `super_admin`, MFA, internal entitlement, and current product access before and after release |
| Customer administration | Ready | The owner can create, license, invite, support, suspend, reactivate, and close organizations through the protected administration interface |
| Customer isolation | Ready | Rules, services, lifecycle tests, and release gates deny cross-organization access |
| Standard licenses | Ready | The 1, 5, and 15-seat offers and the initial 100-organization envelope are certified |
| Stripe Test lifecycle | Ready | Checkout, signed webhooks, duplicate and delayed events, suspension, recovery, cancellation, and onboarding progress are certified |
| Production domains | Blocked by provider suspension | Firebase Hosting suspended the `harpervanceqa` site on October 13, 2026. A Trust and Safety appeal is pending. No release may merge or deploy until Hosting is restored and both hostnames pass the full browser gates. |
| Email delivery | Ready | Secret-bound TLS email delivery and a harmless delivery to the approved owner address are certified |
| Backup recovery | Ready | Both Firestore databases were restored to isolated drill databases, verified, and safely cleaned up |
| Monitoring | Ready with accepted exception | Health and failure alerts are enabled; the owner accepted one alert recipient for the initial operating period |
| Performance baseline | Ready | Protected routes are split and the initial bundle has a permanent 400 KiB gzip budget |
| Live legal approval | Ready | Platform owner recorded counsel approval of the current customer-facing legal package and agreement process on October 12, 2026 |
| Stripe tax treatment | Ready | Platform owner recorded qualified tax-adviser approval of the current Stripe product tax treatment on October 12, 2026 |
| Live billing | Awaiting owner approval | Live secret names are present, but Test mode remains active and no live charge is authorized |
| Secure integrations | Deferred final technical phase | Rotate previously exposed Discord endpoints and move TradingView from observe to enforce only after every active alert is signed |

## Remaining sequence

1. Wait for Firebase Hosting to restore the `harpervanceqa` site. Do not create
   replacement sites, weaken release gates, or deploy around the suspension.
2. Re-run the signed-out and authenticated browser suites against the approved
   Firebase preview, confirm both production hostnames, and preserve the
   successful workflow evidence.
3. Merge the paired legal and tax approval pull requests in dependency-safe
   order, then monitor both `main` deployment workflows and post-deployment
   checks.
4. Complete the final secure-integration cutover after all active TradingView
   alerts and Discord destinations are ready.
5. Obtain explicit platform-owner approval to switch billing from Test to Live.
6. Run a no-charge production smoke test.
7. Obtain separate explicit approval for one controlled real transaction and
   verify payment, webhook, entitlement, seats, dashboard access, email, and
   audit evidence.
8. Hand off the first customer using the documented owner and customer-admin
   checklists.

## October 13 local certification

The provider suspension does not represent a known application regression.
The current legal and tax approval branch passed the following local gates:

- 68 frontend test suites and 408 tests;
- 75 backend test suites and 634 tests;
- backend lint;
- 9 Firebase Rules suites and 79 emulator tests;
- five signed-out and two authenticated Chromium journeys;
- the optimized frontend production build; and
- the 400 KiB entry-bundle gate at 334.63 KiB gzip.

The expanded regression program specifically certifies organization creation,
invitations, 1/5/15-seat enforcement, role changes, last-owner protection,
member removal, tenant isolation, billing failures and retries, MFA recovery,
safe dashboard loading and retry states, Team and Seats, onboarding progress,
and horizontally scrollable mobile profile navigation. Organization-service
coverage is 86.6% of statements and billing-service coverage is 96.06% of
statements.

These checks certify the checked-out code only. They do not certify Firebase
Hosting, a preview URL, either production hostname, or a deployed release.
The rotated browser-test password is available only in local macOS Keychain;
the paired GitHub Actions secrets remain intentionally unchanged until remote
work is authorized.

## Stop conditions

Stop launch activity if owner access is reduced, product data is missing,
organization isolation fails, a hostname fails, billing and access disagree,
a secret is exposed, an automated gate fails, or a required external approval
is absent. Recovery uses a normal revert through `main`; shared history and
live customer records are never rewritten to force a pass.

## Accepted non-blocking risks

- The initial operating period has one alert recipient. A second person or
  managed on-call destination is required before broad customer rollout.
- The older Create React App dependency tree is a controlled modernization
  item. High-severity production dependency gates and the bundle budget remain
  enforced in the meantime.
- Secure integration cutover is intentionally last so it cannot interrupt the
  certified dashboard, billing Test lifecycle, or customer administration
  foundation.
