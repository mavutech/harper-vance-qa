# Sales clarity implementation

> Historical record. Current scope and acceptance gates: [current-sales-plan.md](current-sales-plan.md). Earlier headlines, CTA choices and completion claims below are not current instructions.

Phase 4, October 19, 2026.

## Summary

The landing page now leads with research evaluation and a working report request.
Format exploration is immediate and explicitly illustrative. Actual PDF evidence
is still awaiting the owner's attachment; no fake booking flow was added.

## Key points

- Preserved existing React, SCSS, routing, language-file and service architecture.
- Reused existing components, shared API client and central event recorder.
- Added plain-language methodology, native expandable FAQ, and operator identity.
- Removed undefined visual percentage bars and unexplained validation-review claims.
- Reordered sections to move from buyer problem to product, evidence and licensing.
- Extracted report-request logic into a documented hook, with trimmed validation,
  duplicate-submit protection, disabled pending/received forms, retained inputs on
  failure, and accurate sent/manual-follow-up/unknown-delivery confirmations.
- Scoped the standard 10-second timeout to report requests without changing the
  shared client's timeout for unrelated product functions.
- Fixed missing navigation at tablet widths and added fixed-header anchor offsets.

## Table

| Measurement | Meaning |
| --- | --- |
| marketing_report_format_opened | Visitor follows the immediate example link |
| marketing_faq_opened | Visitor expands a question; only a static question key is recorded |
| Existing report request events | Interest, first interaction, validation failure, receipt, or failure |
| Existing plan/access events | Pricing exposure and plan-specific application interest |

No booking-completed or report-delivered event is inferred from a click or request.
Existing explicit analytics enablement is preserved. Personal data never enters
marketing events, local storage or error messages.

## Risks with mitigations

The shared language-file pattern remains in use. A translation library migration
is outside this change; the standards recommendation is explicitly recorded in
the offer document. Real evidence and walkthrough booking remain input-dependent.

## Recommendations

Review the built page and run the full existing checks before preview publication.

## Next steps

Complete phase 5 verification, integrate the supplied PDF when received, and
prepare the phase 6 buyer-feedback and measurement process.
