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
| Production domains | Ready | Apex and `www` are permanent post-deployment gates and serve the same application over HTTPS |
| Email delivery | Ready | Secret-bound TLS email delivery and a harmless delivery to the approved owner address are certified |
| Backup recovery | Ready | Both Firestore databases were restored to isolated drill databases, verified, and safely cleaned up |
| Monitoring | Ready with accepted exception | Health and failure alerts are enabled; the owner accepted one alert recipient for the initial operating period |
| Performance baseline | Ready | Protected routes are split and the initial bundle has a permanent 400 KiB gzip budget |
| Live legal approval | Ready | Platform owner recorded counsel approval of the current customer-facing legal package and agreement process on October 12, 2026 |
| Stripe tax treatment | Ready | Platform owner recorded qualified tax-adviser approval of the current Stripe product tax treatment on October 12, 2026 |
| Live billing | Awaiting owner approval | Live secret names are present, but Test mode remains active and no live charge is authorized |
| Secure integrations | Deferred final technical phase | Rotate previously exposed Discord endpoints and move TradingView from observe to enforce only after every active alert is signed |

## Remaining sequence

1. Complete the final secure-integration cutover after all active TradingView
   alerts and Discord destinations are ready.
2. Obtain explicit platform-owner approval to switch billing from Test to Live.
3. Run a no-charge production smoke test.
4. Obtain separate explicit approval for one controlled real transaction and
   verify payment, webhook, entitlement, seats, dashboard access, email, and
   audit evidence.
5. Hand off the first customer using the documented owner and customer-admin
   checklists.

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
