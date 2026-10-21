# Sales evidence inventory

Phase 3 completion, October 19, 2026. Corrected real report integrated.

## Summary

The owner supplied the October 12 PDF and approved correcting reporting errors
before publication. The evidence section now links a corrected three-page export
and shows its actual first page. All nine target records and the session's price
records were checked against the report. The original attachment is preserved.

## Key points

- The report request already uses work-email verification and manual review.
- No cleared dashboard screenshots or confirmed booking URL have been supplied.
- Remove decorative percentage bars from the illustrative report: they have no
  defined measure and could suggest confidence or performance.
- Company identity comes from the existing public Terms: Mavu Technology Holdings.
- Methodology copy describes source observations and avoids tick-level timing,
  customer receipt, execution or return claims.

## Table

| Evidence | State | Publication condition |
| --- | --- | --- |
| Owner's PDF | Corrected export integrated | All three pages visually checked; dated and labeled as a corrected edition; no client information in public asset |
| Actual dashboard screenshots | Not supplied | Clean authorized product capture with no customer or credential data |
| Illustrative record | Available | Keep invented-data disclosure adjacent to the example |
| Methodology explanation | Source-grounded draft | Match target/outcome behavior; disclose source limitations |
| Company identity | Present in existing Terms | Reuse identity only; no invented credentials or testimonials |
| Walkthrough booking | Destination not confirmed | Confirm actual booking/request service and responsible owner |

## Risks with mitigations

Do not silently substitute a simulated dashboard for real evidence. Do not
publish the attached PDF until its contents and intended public scope are clear.
One dated session demonstrates the deliverable, not typical performance.

## Recommendations

Use the ungated public PDF for immediate inspection. Keep the existing reviewed
report request for buyers who want a recent session. Do not turn the sample's
8-of-9 outcome into a headline claim about expected performance.

## Next steps

Review the preview before production release. Actual dashboard screenshots and a
confirmed walkthrough destination remain separate optional evidence improvements.

## Correction provenance

- Public asset: `public/reports/Harper-Vance-Daily-Report-2026-10-12-corrected.pdf`.
- Preview image: first-page Poppler render of that exact PDF, not a mockup.
- Backend branch: `codex/report-sample-corrections` in golden-setups-sona-alerts.
- Backend correction commit: `6d2752f`; review PR: mavutech/golden-setups-sona-alerts#26.
- Corrected PDF SHA-256: `ddaf61473be3d92ef0b01c5c3dbe9674ccfc261d6d45ef459368dbedc99ebda0`.
- Morning count corrected from 2 to 3; morning median from 2 minutes to 1.
- Last target has 5 minutes remaining, not 10. Closest miss before 16:00 is
  2.75 points, not the 0.75-point observation after session close.
- Summer timezone labels corrected to EDT; real page counters replace fixed totals.
- No historical database writes, customer resends or production deployments occurred.
- Click tracking uses `marketing_sample_report_opened`, with only the static
  evidence placement and the existing consent/default-off analytics behavior.
