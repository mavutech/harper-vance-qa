# Local release candidate manifest

## Status

Prepared October 13, 2026 while Firebase Hosting remains under Google review.
This repository is a local-only release candidate. The branch has not been
pushed since the work listed below, and nothing in this manifest authorizes a
merge or deployment.

| Item | Value |
| --- | --- |
| Repository | `mavutech/harper-vance-qa` |
| Role | Harper Vance frontend |
| Branch | `codex/enterprise-ready-phase-11-legal-tax-approval` |
| Main baseline | `7a63c92` |
| Certified candidate head | `1beb1c6` |
| Documentation evidence head before this reconciliation | `0f2aed4` |
| Remote branch checkpoint | `114b47a` |
| Local commits beyond remote checkpoint before this reconciliation | 21 |
| Paired backend branch | `codex/enterprise-ready-phase-11-legal-tax-approval` |

## Included changes

1. Approved Terms and Privacy publication updates.
2. Firebase Hosting suspension gates for preview and production workflows.
3. Public, authenticated, dashboard-state, MFA, and onboarding coverage.
4. Fail-closed Firebase emulator configuration for disposable browser tests.
5. Enterprise browser coverage for owner, administrator, member, and seat
   boundaries across the 1, 5, and 15-seat licenses.
6. Suspension, cancellation, reactivation, logout, and re-login coverage.
7. Owner login routing, invitation access refresh, and stable fallback-link
   behavior discovered and corrected through browser testing.
8. One-command paired local release certification.
9. Repeatable customer onboarding, billing, support, and recovery operations.
10. Mobile customer and owner coverage, readable busy states, and accessible
    customer-management dialogs.
11. A dependency-safe paired release, verification, and rollback checklist.

## Commit sequence after the remote branch checkpoint

Apply or review these commits in order:

1. `950b429` docs: record local hosting suspension gate
2. `e4e5e66` docs: record local browser certification
3. `da43311` ci: stop deploys during hosting suspension
4. `5449774` test: certify customer onboarding controls
5. `8efd868` test: certify MFA recovery paths
6. `50f0431` test: certify dashboard page states
7. `76ebef4` test: extend authenticated browser certification
8. `c2c4c41` docs: record expanded local certification
9. `d11d680` test: wire isolated enterprise browser runtime
10. `b98acef` test: certify customer onboarding in browser
11. `18c000f` test: certify enterprise roles and seat tiers
12. `1018168` test: certify customer access lifecycle
13. `69f6d35` docs: certify enterprise browser coverage
14. `5a26641` docs: record frontend release candidate
15. `573645a` test: add paired local release certification
16. `94b6d88` docs: complete customer onboarding operations
17. `4f051f7` docs: complete billing operations checklist
18. `b3c3434` docs: add customer support recovery guide
19. `03d6ac0` test: certify enterprise mobile usability
20. `1beb1c6` docs: add paired enterprise release checklist
21. `0f2aed4` docs: record final local release certification

The remote branch checkpoint already contains `114b47a`, which finalizes the
approved legal documents.

The certified candidate head is the exact application and operating-document
state exercised by the full paired test command. Later documentation-only
commits record and reconcile that evidence without changing runtime behavior.

## Dependency and release order

1. The paired backend release candidate must be reviewed and merged first.
2. Backend deployment and post-deployment checks must succeed before the
   frontend is merged.
3. A fresh Firebase preview must serve the application before frontend merge.
4. Public and authenticated preview browser checks must pass.
5. Frontend production deployment must originate from `main` only.
6. Both `harpervanceqa.com` and `www.harpervanceqa.com` must pass the same
   post-deployment checks.

## Rollback points

- Frontend source rollback baseline: `7a63c92`.
- Frontend certified candidate checkpoint: `1beb1c6`.
- If a merged release must be reversed, use a reviewed revert commit or revert
  pull request. Do not rewrite shared branch history.
- If only Hosting output is unhealthy, restore a previously verified Firebase
  Hosting release while preserving the source history and incident evidence.
- Do not roll the frontend forward against an unverified or older backend API.

## External gates still open

- Firebase Hosting must recover from the provider-side suspension.
- A working preview URL must be generated and added to the pull request.
- The two protected authenticated browser journeys must pass on the preview.
- Stripe Test checkout, signed webhooks, and invitation email delivery remain
  in the final secure-integration phase.
- No Stripe Live transaction is authorized by this release candidate.

## Local evidence

- Backend lint passed.
- 78 backend suites and 639 tests passed.
- 9 Firebase Rules suites and 79 tests passed.
- 70 frontend suites and 418 tests passed.
- 5 public and signed-out browser journeys passed locally.
- 12 isolated enterprise browser journeys passed locally, including mobile
  customer and platform-owner operation.
- The production build passed.
- The entry bundle measured 335.14 KiB gzip against a 400 KiB budget.
- The complete paired certification passed in 180.58 seconds without a push,
  deployment, production secret, or payment.
