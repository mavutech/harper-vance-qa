# Phase 7: billing and onboarding operations

## Objective

Give Harper Vance a repeatable, auditable process for converting an approved
organization into a paying customer without direct database edits or customer
password access.

Harper Vance remains an admin-led enterprise service. Customers do not purchase
anonymous access from the public website. The platform owner approves the
organization, configures its contract, and starts onboarding. A customer
administrator then manages the organization's users within the purchased seat
limit.

## Delivery checkpoints

1. Make profile sections horizontally scrollable and usable on narrow screens.
2. Add the billing data model and payment-provider boundary, with a 25-seat
   minimum and safe test-mode behavior.
3. Connect owner-led customer setup to billing and onboarding status.
4. Give customer administrators governed user and seat management.
5. Document and certify account creation, payment, onboarding, suspension,
   reactivation, renewal, and cancellation.

Each checkpoint is committed and pushed independently. Backend and frontend use
the matching `codex/enterprise-ready-phase-7-billing-onboarding` branch.

## Checkpoint 1: profile navigation

- Profile sections stay in a single horizontal row.
- Touch, trackpad, and keyboard users can reach every section.
- Selecting a section brings the active option into view.
- The change does not alter profile, security, or notification behavior.

## Acceptance boundary

Phase 7 is complete only when:

- the owner can record and manage a customer's commercial agreement;
- billing status controls licensed access through the governed backend;
- no payment secret is exposed to the browser or stored in source control;
- organizations cannot exceed purchased seats;
- customer administrators can manage their own members but cannot cross
  organization boundaries;
- the complete customer lifecycle is covered by automated tests and an operator
  runbook; and
- the Firebase preview is approved before merge.

## Checkpoint 3: owner-led onboarding

- The customer record shows license, payment, customer-administrator, and
  product-access readiness in one checklist.
- Commercial seat entry defaults to 25 and cannot be submitted below 25.
- The owner can create a server-generated Stripe checkout link only after the
  license and seats are staged.
- Creating or copying a checkout link does not imply that payment succeeded or
  that product access is active.
