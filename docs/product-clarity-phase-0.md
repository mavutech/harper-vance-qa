# Harper Vance product clarity review

## Summary

October 29, 2026. Source review for the six-phase clarity initiative. This is not production delivery certification. The frontend is this repository; the backend is the sibling golden-setups-sona-alerts repository. Preserve the approved walkthrough and pricing. No runtime entitlements, delivery controls, or billing changes are authorized by this work.

## Key points

- React/JavaScript, SCSS, React Router, legacy Redux, Jest/React Testing Library and centralized Firebase analytics are the existing stack. Reuse the locale files, native player, gallery/modal, access URL helper and analytics callback; no dependencies needed.
- Apply the existing React, localization, JSDoc, tests, analytics and security standards. Backend work is documentation only. Existing approved walkthrough changes are captured as the baseline, including only v6 media, not superseded v3 assets.
- Add only a fixed chapter-selection analytics event with a predefined chapter ID; no visitor or account information.
- Test copy, plan values, chapter seeking/loading/errors, keyboard gallery controls and mobile layout. Human comprehension and real integration receipt require separate evidence.

## Capability inventory

| Capability | Evidence | Status and limitation |
| --- | --- | --- |
| Live dashboard targets and historical context | Backend ecTargets/daily/ecTargets.js attaches bucketContext and lateContext; existing public screenshots and walkthrough | Source and visual evidence; no delivery-time guarantee |
| Daily, weekly, monthly and historical views | Existing frontend gallery and walkthrough | Demonstrated; sample periods differ and must stay labeled |
| Live-target webhooks | Owner confirmation; ecTargets.js invokes notifyAllWebhooks with signal | Existing legacy path. Managed sender selects daily reports only. Current production control and commercial eligibility unresolved |
| Governed daily webhooks | customerOperations/integrationConstants.js, integrationService.js, integrationDelivery.js | Source verified: daily only, test before activation, explicit retry, entitlement checks |
| Paid report API | productData/product_api_routes.js | Daily, weekly and history routes; do not imply live-target API access |
| Plan limits | entitlements/entitlements_model.js | Core 1 seat/90 days/no paid API or webhook; Desk 5 seats/365 days/5 destinations/60 requests per minute; Enterprise 15 seats/50 destinations/600 requests per minute, history by agreement |
| Email recipients | Existing customer-admin workflow and public copy | Daily reports and verified seat-linked recipients; do not substitute obsolete generic email-destination instructions |

## Discrepancies

1. The blanket FAQ and post-draft statement that webhooks never deliver live targets ignores the legacy signal sender. Narrow statements to managed daily-report integrations. Do not assign live webhook eligibility to a plan without evidence.
2. notificationControls/daily also gates the legacy signal sender: paused suppresses it; firestore returns early for non-daily report types. This is a source finding, not proof of the deployed control value or of a customer outage. Do not change this control in a marketing task.
3. Integration setup instructions describe secret references, while managed creation accepts a private HTTPS URL and encrypts it server-side. Update the existing guide, not legal terms or generated historical PDFs.
4. Existing captions and recorded date already identify the walkthrough. Do not restore removed recording notes, trading notes or the direct-video link.
5. Screenshot descriptions list views but need to state the buyer question. Preserve original pixels and dates; add HTML explanations and a separately labeled magnified view.

## Risks with mitigations

- Keep live webhook plan claims unresolved until owner-confirmed configuration and a safe delivery test are available.
- Do not present a reconstructed example across different days as a single observed target history.
- Do not treat automated tests as customer feedback or production certification.

## Recommendations

Implement accurate channel descriptions, accessible gallery explanations, chapter navigation, corrected integration documentation and a same-session evidence reading guide. Hold deployment for the plan's final release approval. Do not alter the public subscription prices, existing access requirements, video narration or recorded results.

## Next steps

Commit each phase independently. Finish local verification and prepare the human comprehension exercise. Carry unresolved webhook eligibility, authorized integration receipt and owner release approval into the final acceptance record instead of marking them complete.
