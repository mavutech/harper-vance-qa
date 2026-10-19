# Sales clarity: offer reconciliation

> Historical record. Current scope and acceptance gates: [current-sales-plan.md](current-sales-plan.md). Earlier headlines, CTA choices and completion claims below are not current instructions.

Phase 1, October 19, 2026. Source-verified commercial boundaries; this record
does not certify delivery operations or approve public use of private data.

## Summary

The primary buyer is a trading or research leader at a professional NQ desk.
The service publishes qualifying target observations and retains their context
and outcomes for evaluation. It does not monitor the buyer's trades or execute
orders. Prices remain unchanged.

## Key points

- Backend `onboarding_catalog.js` and `entitlements_model.js` define commercial
  prices and limits; signed enterprise terms define negotiated rights.
- The newer local page already corrects several older live claims. Preserve
  those corrections and verify the published version after release.
- Remove the unexplained quarterly validation review from marketing until a
  service definition and delivery owner are confirmed. This does not amend contracts.
- Team-notification entitlement is not proof of operational Slack/Teams delivery.
  Do not advertise these channels without operational certification.
- Keep public report requests on the existing verified, reviewed delivery path.
  Do not relabel a report request as a booked walkthrough.

## Table

| License | Users | History | Integrations | Price |
| --- | --- | --- | --- | --- |
| Entity Core | 1 | Rolling 90 days | Dashboard and email; no API/webhooks | $1,500 monthly / $14,400 annually |
| Desk Intelligence | 5 | Rolling 365 days | Read-only daily, weekly and history API; 60 requests/minute; up to 5 webhooks | $5,000 monthly / $48,000 annually |
| Firm-Wide Enterprise | 15 included; expansion by agreement | Defined in Order Form | Read-only API; 600 requests/minute; up to 50 webhooks | From $15,000 monthly under annual agreement |

Enterprise redistribution and service commitments require explicit agreement.
No unlimited-seat, full-archive, automatic SLA, dedicated-account-management,
return, trading-success, or delivery-latency promises are authorized by this record.

## Risks with mitigations

- Original source timestamps can identify the source observation rather than
  the instant a customer received it. Avoid claiming verified receipt times.
- Outcome timing depends on the available source bars. Do not promise tick-level
  precision. Reached is a recorded market observation, not a customer return.
- No public-use approval for a real report or dashboard image was located.
  Keep invented examples explicitly illustrative and offer reviewed real reports.
- No confirmed booking destination was located. Use report review as the working
  first step unless the owner supplies a confirmed walkthrough destination.

## Recommendations

Preserve the current React/JavaScript, SCSS, React Router, shared language-file,
service and analytics architecture. Reuse existing components and services.
Keep strings centralized; do not introduce a translation library solely for copy
changes. The standards recommend a library when absent; introducing one remains
a separately approved dependency change. Use documented functions, named config,
keyboard-accessible controls, validated forms, and privacy-safe event parameters.
Test changed behavior with Jest/Testing Library and browser checks; retain the
80% feature coverage target and required release gates.

## Next steps

Write the customer story, prepare bounded product evidence, build and verify the
revised journey. The October 19 backend production-release-hold record supersedes
the historical Google hosting hold. Publication still follows preview review.

Sources: paired backend `functions/features/onboarding/onboarding_catalog.js`,
`functions/features/entitlements/entitlements_model.js`,
`docs/sales/methodology-and-data-integrity.md`, and
`docs/client-readiness/internal/production-release-hold.md`.
