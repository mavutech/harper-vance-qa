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
| Stripe Test lifecycle | Locally ready; deployed recheck pending | Checkout, signed webhooks, duplicate and delayed events, suspension, recovery, cancellation, and onboarding progress are covered; the current candidate still requires a deployed Test checkout and signed webhook recheck |
| Production domains | Blocked by provider suspension | Firebase Hosting suspended the `harpervanceqa` site on October 13, 2026. A Trust and Safety appeal is pending. No release may merge or deploy until Hosting is restored and both hostnames pass the full browser gates. |
| Email delivery | Existing service ready; candidate recheck pending | Secret-bound TLS email delivery was previously certified; the current candidate still requires deployed invitation delivery verification |
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
2. Obtain approval to push the matching local frontend and backend branches,
   then open or update their paired pull requests against `main`.
3. Require the frontend pull request to create a working Firebase preview,
   insert its URL into the pull-request description, and pass signed-out and
   authenticated browser checks.
4. Merge and verify the backend first, rerun the frontend preview against the
   deployed backend, then merge and verify the frontend. Follow
   `docs/enterprise-readiness/paired-release-checklist.md`.
5. Complete the final secure-integration cutover after all active TradingView
   alerts and Discord destinations are ready.
6. Obtain explicit platform-owner approval to switch billing from Test to Live.
7. Run a no-charge production smoke test.
8. Obtain separate explicit approval for one controlled real transaction and
   verify payment, webhook, entitlement, seats, dashboard access, email, and
   audit evidence.
9. Hand off the first customer using the documented owner and customer-admin
   checklists.

## October 13 local certification

The provider suspension does not represent a known application regression.
The current local release candidate passed the following paired local gates:

- 70 frontend test suites and 418 tests;
- 78 backend test suites and 639 tests;
- backend lint;
- 9 Firebase Rules suites and 79 emulator tests;
- 5 public and signed-out Chromium journeys;
- 12 isolated enterprise lifecycle journeys, including mobile customer and
  platform-owner keyboard operation;
- the optimized frontend production build; and
- the 400 KiB entry-bundle gate at 335.14 KiB gzip.

The expanded regression program specifically certifies organization creation,
invitations, 1/5/15-seat enforcement, role changes, last-owner protection,
member removal, tenant isolation, billing failures and retries, MFA recovery,
safe dashboard loading and retry states, Team and Seats, onboarding progress,
mobile profile navigation, readable busy states, and accessible customer
dialogs.

These checks certify the checked-out code only. They do not certify Firebase
Hosting, a preview URL, either production hostname, or a deployed release.
The certified application heads are frontend `1beb1c6` and backend `68e02e2`.
Subsequent evidence and reconciliation commits change documentation only, not
the certified runtime. The paired GitHub branches remain unchanged until
remote work is authorized.

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
