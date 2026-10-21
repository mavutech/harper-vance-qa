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
| 6. Platform UI | Signed-in administrator acceptance passed with dedicated test records |
| 7. Migration | Backend exclusion implemented; example unchanged |
| 8. Acceptance | Public browser checks, administrator acceptance, and controlled daily/weekly queue delivery passed; final customer browser run pending |
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

Platform-wide filtering and reassignment acceptance passed. Encryption is configured,
and controlled daily/weekly queue delivery passed. Finish the final hosted customer
browser run, then merge backend before frontend and verify production gates.
The schema example remains unchanged. No launch readiness claim yet.

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

## Approved launch refinements

Phases 1 through 3 are implemented using existing React Bootstrap forms, warning
alerts, cards, confirmation dialogs and an accessible setup accordion. No new
styling library or landing-page redesign. Organization allowance comes from the
server, not the currently filtered list. Only licensed report types are selectable.
Activation requires accepted sample evidence plus an unchecked licensed-use
acknowledgment; backend enforcement is authoritative. The guide documents JSON,
unsupported custom auth headers/signatures, destination responsibility, and mapping
dashboardUrl/dashboardLinkLabel/licensedUseNotice into automation messages.

Phase 4 local verification: 83 suites / 475 frontend tests, production build,
340.33 KiB entry bundle under the 400 KiB budget, and 19 production-build public
Playwright checks passed. Backend recorded 879 unit tests and five emulator lifecycle
tests passing. Authenticated daily/weekly login-return browser cases are added but
not executed with hosted credentials. Signed-in desktop/mobile visual acceptance
and live Make-to-Telegram verification remain open. Phase 5 merge/deployment is held
until these gates pass. No claim of launch readiness or downstream receipt.

Final release-plan update: Make-specific formatting is no longer a launch gate.
The acceptance target is provider-neutral JSON delivery to a controlled receiver,
plus signed-in customer/platform workflows. Reconciled the feature branch with
current production main and retargeted draft PR29 to main. A compatible candidate
backend and test environment remain prerequisites. The owner has been asked to
choose isolated staging versus dedicated test records in the live Firebase project;
no candidate deployment or new privileged test identity has been created.
# Hosted acceptance checkpoint, October 20, 2026

The owner approved dedicated test records in the live Firebase project. Production
API routing and scheduled delivery remain unchanged. A separate healthy
`sonaDashboardCandidate` serves the PR preview through an explicitly configured
preview-only rewrite. The committed production Firebase configuration still uses
`sonaDashboard`.

Preview CI now runs password/TOTP customer checks and an opt-in synthetic webhook
lifecycle covering creation, test-before-activation, licensed-use acknowledgment,
activation, pause, delivery history and removal. This is real UI/API testing, not a
mocked response. Its first hosted run is pending, so it is not yet release evidence.
The controlled receiver has no database permissions and rejects real report data.
An administrator sign-in is still required for the platform-side acceptance pass.

Release follow-through must also correct the main workflow's predeployment target:
it currently tests the old live frontend, which cannot certify an undeployed route.
Keep the gate, but run it against the candidate build before deploying that build.
Do not merge until customer/admin acceptance, controlled queue delivery, and this
predeployment gate are resolved. Clear CANDIDATE_API_FUNCTION and retire temporary
candidate/receiver resources after acceptance and production verification.

## Final acceptance checkpoint, October 20, 2026

The signed-in administrator created a paused test-only destination, sent an accepted
sample, reassigned its responsible user, confirmed activation requires the licensed-use
acknowledgment, activated and paused it, checked history and responsible-user/status
filters, then removed it. Mobile and desktop widths showed no horizontal overflow.
The removed destination retains its audit history and no longer consumes allowance.

Controlled queue workflow 39527709102 passed daily and weekly synthetic delivery,
persisted acceptance, and duplicate suppression through real Firestore and HTTPS.
It restored the dedicated destination to paused before administrator removal. No
customer report was sent and the legacy example was not migrated. This verifies
the queue path, not an automatically fired production schedule.

Candidate request capacity was corrected after the hosted browser suite exposed
429 responses. Default daily session dates and current ISO week now use New York
time, including regression tests for UTC day/week boundaries. The main workflow
now tests the new release-preflight build before publishing, then repeats checks
on production. Authenticated failure artifacts no longer publish entered MFA codes.

The final hosted customer run and production merge/deployment remain gates. This
checkpoint does not claim those unfinished steps passed.

## Production release follow-up

Backend PR32 and frontend PR29 were merged and deployed. The automatic delivery
worker completed its first scheduled run with delivery enabled and no queued
reports. The live administrator integration listing loads successfully.

The first production post-deploy browser run failed two fresh-login checks, while
both report-link sign-ins passed. A separate production run with credential-safe
MFA response diagnostics then passed all four read-only customer checks without
retry. The intermittent login failure remains unexplained, not claimed fixed.

Production logs also exposed an existing current-week request containing future
dates. The weekly hook now requests only dates through today in New York, retaining
the complete five-day chart layout. Regression coverage includes retry. Report-link
browser checks now require a successful daily-data response as well as the heading.
PR30 carries this follow-up and must pass the full release gates before final
readiness certification. Its separate diagnostic workflow covers fresh sign-in and
access only; the main release workflow retains every report-link/data check.

## MFA readiness investigation

PR30 deployed the current-week fix. Both report-data checks and licensed access
passed on production, but fresh mobile sign-in received HTTP 400 from Firebase
MFA verification. A bounded repeat diagnostic identified INVALID_CODE and then
QUOTA_EXCEEDED. Further automated login attempts were stopped. The project quota
listing does not expose which MFA-specific limit was reached; no quota increase,
billing change, MFA bypass, or customer authentication change was made.

PR31 improves only test infrastructure: generate codes at least three seconds
inside a fresh time window, avoid its last five seconds, stop protected tests on
the first failure without automatic retries, and make the standalone diagnostic
manual-only. The complete predeployment and postdeployment gates are retained.
The timing helper is covered by boundary cases and an RFC 6238 vector. All 488
frontend unit tests pass. These changes are not proof that the external limit has
cleared. A clean final production acceptance run remains outstanding.

Temporary candidate API and synthetic receiver functions, receiver-only service
account, and acceptance-only repository variables have been removed. Test
destinations remain removed with audit history retained. Production delivery is
enabled and the scheduled worker has completed normally with no queued reports.
