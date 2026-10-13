# Phase 7: scale certification

## Purpose

This phase certifies that the existing administration experience matches the
published commercial model at the initial operating scale. It does not create
production customers or change licensed access.

## Certified experience

| Area | Certified baseline |
| --- | --- |
| Customer portfolio | Paginated administration for the initial 100 organizations |
| Entity Core | 1 fixed product seat |
| Desk Intelligence | 5 fixed product seats |
| Firm-Wide Enterprise | 15 included product seats, with larger orders governed by contract |
| Customer roster | All 15 included Enterprise seats remain reviewable and manageable |
| Customer progress | The owner and customer administrator see the same six-step onboarding state |

## Automated proof

The frontend suite now verifies that:

- the Desk Intelligence seat field is fixed at five for a commercial license;
- the submitted subscription preserves that approved seat count;
- all 15 included Firm-Wide Enterprise members render with governed role
  controls; and
- existing pagination, onboarding progress, role protection, mobile, and
  signed-out access tests continue to pass.

The backend repository separately certifies 100 independent organization
entitlements, the 1, 5, and 15-seat model, API and webhook ceilings, and a
PII-free multi-organization access projection.

## Operator guidance

- Use **Load more customers** rather than expecting the first page to represent
  the full customer portfolio.
- Treat the summary cards as the loaded view, not a billing or company-wide
  count.
- Use the selected customer record for authoritative license, payment, seat,
  and onboarding status.
- Do not approve more than five Desk Intelligence seats at its published price.
- Do not approve more than 15 Enterprise seats without a matching executed
  order and staged seat allowance.

## Stop conditions

Stop onboarding when the requested customer size or throughput exceeds the
certified envelope, when a roster is incomplete, when a fixed-seat license can
be edited, or when one customer's record appears in another customer's view.

## Acceptance result

Phase 7 passes after the focused scale tests, full frontend suite, production
build, backend suite, Firebase rules tests, and preview browser journeys pass.
No production customer or billing record is modified by this phase.
