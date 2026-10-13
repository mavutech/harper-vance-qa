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
| Local release head | `69f6d35` |
| Remote branch checkpoint | `114b47a` |
| Local commits beyond remote checkpoint | 13 |
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

The remote branch checkpoint already contains `114b47a`, which finalizes the
approved legal documents.

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
- Frontend release candidate checkpoint: `69f6d35`.
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

- 69 frontend suites and 416 tests passed.
- 5 public and signed-out browser journeys passed locally.
- 10 isolated enterprise browser journeys passed locally.
- The production build passed.
- The entry bundle measured 335.13 KiB gzip against a 400 KiB budget.

