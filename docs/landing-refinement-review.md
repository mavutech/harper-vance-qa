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
| 1 | Delivery, pricing descriptions and FAQ | Pending |
| 2 | Headline and visible target context | Pending |
| 3 | Repetition and onboarding copy | Pending |
| 4 | Tests and desktop/mobile review | Pending |
| 5 | Preview and release checklist | Pending; production requires approval |

## Risks with mitigations

The backend live sender calls notifyAllWebhooks with signal/5m, but notificationControls/daily selects its route. The firestore route rejects non-daily events; paused suppresses sends. The legacy signal sender has no demonstrated enforcement of the newly approved per-plan live-destination limits. Managed integration REPORT_TYPES contains daily only. Do not switch routing, change entitlements or add live events in this website task.

The new live-target row will describe approved eligibility with activation subject to setup and successful delivery verification. Production release of an unconditional included-live-delivery promise remains blocked until entitlement enforcement, safe transport and an authorized receipt are verified. No resolution-event, timing guarantee or automated provisioning claim is approved.

## Recommendations

Keep daily-report destination limits at 5 Desk and 50 Enterprise. Treat live-target limits separately. Add no public developer link until a usable public destination exists. Preserve local qualifications beside historical examples while removing repeated feature summaries.

## Next steps

Commit each phase. Test content, gallery ordering and controls, all video chapters, access links without submissions, desktop/mobile wrapping and fixed-header offsets. Refresh the existing buyer PDF with the page. Provide a separate preview, before/after captures and a final acceptance record. Any new backend behavior requires a separate proposal.
