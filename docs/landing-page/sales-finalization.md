# Sales finalization acceptance record

## Summary

Approved scope: preserve design and pricing; explain session targets, completed-session reports, and weekly statistics; deliver a two-page buyer overview and an honest assisted-purchase handoff. Monthly statistics and dashboard changes are excluded by owner direction on October 19, 2026.

## Key points

- Today's Targets polls the authenticated product service every 60 seconds (`sonaTargetsService.js`). Real-time wording must include this refresh disclosure, not imply instant arrival.
- Daily and weekly statistics are served by `sonaStatsService.js`. Paid API routes provide daily, weekly, and history data, not live targets.
- Entity Core: 1 seat, rolling 90 days, $1,500 monthly or $14,400 annually. Desk Intelligence: 5 seats, rolling 365 days, $5,000 monthly or $48,000 annually, API 60 requests/minute and up to 5 approved webhooks. Enterprise: 15 seats, from $15,000/month under annual agreement, API 600 requests/minute, up to 50 approved webhooks; expanded rights and history by Order Form.
- Backend access-request, onboarding, and billing flows require qualification and agreement/payment checks. Do not bypass these or promise immediate activation.
- Existing October 19 Live billing release record reports a successful no-charge verification. This task does not authorize charges, customer creation, or production deployment.

## Table

| Phase | Acceptance |
| --- | --- |
| Offer | Verify channels, license terms, and purchase path without inventing policies |
| Evidence | Inspect PDF content and metadata; preserve complete sample and limitations |
| Page | Clear customer, problem, offer, guide, three-step plan, purchase action and sample alternative |
| Buyer overview | Two readable pages matching website and verified terms |
| Handoff | Accurate approved application, agreement, payment, and access expectations |
| Verification | Tests, build, browser review, PDF rendering; preview owner acceptance before production |

## Risks with mitigations

- Public target prices and times provide clues even without calculation rules. No promise of zero reverse-engineering risk.
- Target outcomes are not customer profits. No return, execution, or latency guarantees.
- Preserve unrelated backend working-tree changes and existing request validation.
- Follow existing React/JavaScript/SCSS, React Router, Redux, Jest/Testing Library and Playwright patterns. Reuse centralized analytics without PII. No new runtime dependencies.
- Rechecked react-web, JSDoc, localization, unit-tests, analytics and security standards. Retain the documented scoped localization exception: centralized English JSON, not a new i18next installation.

## Recommendations

Evidence review: the three-page PDF contains results, timestamps, session context, and outcome measurement definitions, but no explicit target-generation formula. Metadata contains report title, Chromium/Skia producer and dates; no embedded attachments. Public outputs still allow hypothesis testing against market data. Existing sample is retained unchanged. Replace the miniature page image with an accessible text excerpt from the actual report, explicitly retaining the full-session count and miss. Existing report typography is not rewritten in this sales pass.

Primary commercial action: Request Access. Secondary: View Sample Report. A recent-report request remains distinct. Reuse existing request-access and sample-open events; buyer-overview downloads use a static event with placement only.

## Next steps

Implement and commit each phase. Freeze when buyers can explain audience, deliverables, access timing, weekly statistics, evidence limits, license cost and purchase steps. Reopen only for defects, factual errors or observed customer confusion.
