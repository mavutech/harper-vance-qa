# Landing page refinement review

## Summary

October 29, 2026. Owner approved the focused refinement and the proposed commercial direction: live-target webhooks for Desk and Enterprise, not Core; standard assisted setup without a separate webhook fee; one initial Desk live destination and Enterprise scope by agreement. Commercial approval is not proof of runtime enforcement or successful delivery. Preview only until final release approval.

## Key points

- Preserve navy backgrounds, blue buttons, Helvetica typography, existing section order, spacing tokens and original dashboard images.
- Reuse ReportGallery, useReportGallery, DeliveryOverview, locale files, existing video chapters and centralized analytics. No new events or dependencies.
- Apply the reviewed React, localization, JSDoc, unit-test, analytics and security standards. Existing locale JSON remains the approved pattern; no localization migration.
- Existing components are small and presentation-focused. New copy belongs in locale files. Existing gallery focus handling stays unchanged.

## Phase table

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Design baseline, standards and delivery facts | Source review complete; live delivery certification pending |
| 1 | Delivery, pricing descriptions and FAQ | Approved eligibility described with setup and delivery-verification conditions; no backend changes |
| 2 | Headline and visible target context | Approved headline, three visible explanations, focused detail before full image |
| 3 | Repetition and onboarding copy | Shortened opening, overview, gallery introduction, evidence, pricing and onboarding; necessary qualifications retained |
| 4 | Tests and desktop/mobile review | 103 suites / 546 tests passed; focused 28 tests passed; build and video range smoke test passed |
| 5 | Preview and release checklist | Preview uploaded and verified; production requires approval |

## Risks with mitigations

The backend live sender calls notifyAllWebhooks with signal/5m, but notificationControls/daily selects its route. The firestore route rejects non-daily events; paused suppresses sends. The legacy signal sender has no demonstrated enforcement of the newly approved per-plan live-destination limits. Managed integration REPORT_TYPES contains daily only. Do not switch routing, change entitlements or add live events in this website task.

The new live-target row will describe approved eligibility with activation subject to setup and successful delivery verification. Production release of an unconditional included-live-delivery promise remains blocked until entitlement enforcement, safe transport and an authorized receipt are verified. No resolution-event, timing guarantee or automated provisioning claim is approved.

## Recommendations

Keep daily-report destination limits at 5 Desk and 50 Enterprise. Treat live-target limits separately. Add no public developer link until a usable public destination exists. Preserve local qualifications beside historical examples while removing repeated feature summaries.

## Next steps

Commit each phase. Test content, gallery ordering and controls, all video chapters, access links without submissions, desktop/mobile wrapping and fixed-header offsets. Refresh the existing buyer PDF with the page. Provide a separate preview, before/after captures and a final acceptance record. Any new backend behavior requires a separate proposal.

## Validation results

Desktop and 390-by-844 mobile review confirmed readable headline and target context, unchanged image dimensions, aligned pricing-card heights/actions, and no page-level horizontal overflow. The delivery table retains its keyboard-focusable horizontal scroll container. Gallery next/previous and Escape work, with full images retained after the detail. Native FAQ expansion works. Gallery and pricing anchors settle below the fixed header (approximately 104px versus an 87px header on desktop). Access and sample link destinations were inspected without submitting requests.

All four video chapters sought to 21, 120, 206 and 289 seconds with playback paused. Existing tests cover gallery focus restoration, navigation, chapter loading and errors, and request behavior. Both pages of the refreshed buyer PDF were rendered and visually checked; a print fragmentation issue was fixed with an article break constraint. Production build passes with existing customer-admin cleanup warnings and outdated browser compatibility data. No claim of real-device Safari certification or external live-target delivery certification is made.

Local comparison captures: `/tmp/hv-refinement-before.png`, `/tmp/hv-refinement-after.png`, `/tmp/hv-refinement-mobile.png` (gallery), and `/tmp/hv-refinement-mobile-hero.png`. The existing document-writing workflow kept the record scoped to release decisions; the PDF workflow required visual inspection rather than trusting successful generation alone.

## Preview and release checklist

Review: https://harpervanceqa-dev--refinement-review-20261029-m2oa6m4c.web.app (expires November 5, 2026). Hosted headline verified after upload. Baseline remains on the separate clarity-review-20261029 channel. Live hosting was not changed; no Git push or merge was performed.

- Owner reviews copy, target explanations and placement on the preview.
- Before production publication, verify the approved live-target offering can be delivered safely with plan eligibility and destination limits enforced. Record an authorized successful receipt. Any required backend change needs a separate proposal; this task did not activate or modify integrations.
- Obtain final production approval, build with the approved v6 video artifact present, and verify the public page and links after release.
- No developer-documentation link was added because the existing integration guide is repository documentation, not a confirmed public customer destination.

Phase commits: 0 `7b656ff`, 1 `4d09671`, 2 `afbc903`, 3 `92a59c5`, 4 `2dd8b41`. Phase 5 is the commit containing this preview record. Existing unrelated media and backend work remain untouched.
