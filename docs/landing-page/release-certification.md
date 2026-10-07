# Landing Page Release Certification

## Release scope

- Branch: `codex/clarify-dashboard-offering`
- Pull request: `#4`
- Target branch: `dev`
- Review state: must remain unmerged until the Firebase preview is approved
- Certification date: October 7, 2026

## Completed checks

| Check | Result | Notes |
| --- | --- | --- |
| Dashboard capability review | Pass | Public descriptions trace to the four authenticated dashboard views. |
| Public messaging review | Pass | The product, retained record, evaluation path, and buyer are stated directly. |
| License hierarchy review | Pass | Shared dashboard features appear once; higher tiers inherit lower-tier access. |
| Timeframe masking | Pass | The landing-page test prevents the internal timeframe from appearing. |
| Unsupported-claim guardrails | Pass | Tests prevent real-time, winning-trades, and immutable-record language. |
| Client login route | Pass | All three client-login links point to `/login`. |
| Focused landing-page tests | Pass | 6 of 6 tests pass. |
| Production build | Pass with existing warnings | The optimized build completes. Existing lint and bundle-size warnings are outside this landing-page change. |
| Full repository test run | Existing failures documented | 247 tests pass. Two unrelated failures remain: date-fixed weekly tests and a third-party map module in the app smoke test. |

## Preview review checklist

- Confirm the hero explains the product without exposing the internal timeframe.
- Confirm the three-stage product sequence reads clearly on desktop and mobile.
- Confirm all four dashboard areas are easy to scan.
- Confirm the shared offering appears before license-specific differences.
- Confirm the pricing cards communicate inheritance correctly.
- Confirm Client Login opens `/login`.
- Confirm Request the latest report reaches the request form.
- Confirm no dashboard screenshot or sensitive client data appears.

## Release boundary

This certification covers the public frontend landing page. It does not certify external delivery services, API or webhook operation, commercial entitlement enforcement, or backend data production. Those claims remain subject to separate operational confirmation.
