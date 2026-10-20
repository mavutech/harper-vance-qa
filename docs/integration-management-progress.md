# Integration management implementation

## Summary

Customer and platform integration UI, approved October 20, 2026. Uses existing
dashboard styling, role guards, shared authenticated API client, localized copy,
and customer operations hooks. Backend plan is maintained in the backend repo at
docs/enterprise-customer-control/integrations-implementation.md.

## Key points

- Legacy Make.com record is a schema/test example, not an automatic migration target.
- No landing-page redesign.
- New webhook setup starts paused; sample sending requires confirmation.
- Never display the full saved webhook address.
- API credential controls reuse the existing governed endpoints.

## Phase table

| Phase | Local state |
| --- | --- |
| 5. Customer UI | Implemented; focused tests and production build passed |
| 6. Platform UI | Implemented locally; acceptance pending |
| 7. Migration | Backend exclusion implemented; example unchanged |
| 8. Acceptance | Local suite/build and 17 public browser checks passed; hosted/live checks pending |
| 9. Release | Not merged or deployed |

## Risks with mitigations

- Local UI tests are not real customer login or real outbound delivery evidence.
- Dedicated server key configuration is required before webhook setup works.
- History labels reflect acceptance by the endpoint, not Telegram receipt.
- Keep deployment blocked until backend compatibility, concurrency, browser tests,
and explicitly authorized real delivery acceptance are complete.

Platform view now supports all organizations, responsible-user and status filters,
paginated integration results, organization selection and roster-based user filters,
scoped setup and API credential management, and responsible-user reassignment.
Backend list responses include safe organization/responsible-user names.

## Recommendations

Use one management component set for customer and platform scope. Preserve backend
authorization even where controls are hidden by the frontend.

## Next steps

Platform-wide filtering and reassignment controls are implemented. Finish hosted
customer and platform-admin acceptance, configure the backend encryption secret,
and verify delivery to a separately approved destination before release.
The schema example is excluded from live testing. No launch readiness claim yet.

## Verification

Phase 5: 3 focused suites, 8 tests passed. Production build passed. A hook lint
warning found by the build was subsequently addressed; final build remains an
acceptance gate. No test messages or database writes were performed.

Phase 8: 83 frontend suites with 470 tests and the final production build passed, with bundle budget
passing. Seventeen public browser checks passed, including signed-out protection
for both integration routes. Hosted MFA checks now cover the customer integration
page and platform-route denial, but were not executed locally. These are not
substitutes for signed-in visual and end-to-end acceptance.

Added explicit duplicate-aware manual retries, render error boundaries, and hook
tests for scope/secret-safe failures. Legacy admin webhook controls direct to the
new integration area. No production deployment, real test message, or migration.
Backend configuration and remaining acceptance gates are tracked in its plan.

Reverification: production-build browser checks passed 17/17 using
`CI=true PLAYWRIGHT_LOCAL_PORT=3228 npm run test:e2e`. The development-server run
showed 404 pages on static purchase routes and did not pass; it is not the release
acceptance result. No source changes were made to the landing page for this check.
Draft review: https://github.com/mavutech/harper-vance-qa/pull/29.
