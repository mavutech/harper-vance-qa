# Billing operations checklist

## Operating model

Harper Vance is sales assisted. The platform owner stages the approved
commercial terms, and Stripe hosts payment. A customer cannot select a price,
change its included seats, or activate dashboard access from the browser.

Stripe Test remains the required certification environment. Stripe Live and a
real transaction require separate explicit approval.

## Before creating checkout

Confirm all of the following in the customer record:

- organization name matches the approved order;
- agreement is executed or an authorized waiver is recorded;
- Entity Core has 1 seat, Desk Intelligence has 5 seats, or Firm-Wide
  Enterprise has at least the 15 seats approved by its order;
- monthly, annual, or contract payment term matches the order;
- billing mode is commercial;
- billing contact is the approved address; and
- subscription is pending rather than manually activated.

If any value disagrees, stop and correct the customer record before creating a
checkout link.

## Standard checkout

1. Open **Platform Administration > Customer Organizations**.
2. Select and review the organization.
3. Confirm the agreement and onboarding progress.
4. Enter the approved billing contact and create the checkout link.
5. Send the link only through the approved customer channel.
6. Leave access pending while checkout is open or merely completed.
7. Wait for the signed active-subscription event.
8. Confirm payment and dashboard access become active for the same
   organization, license, term, and seat allowance.
9. Retain the Stripe references and Harper Vance audit export in the approved
   customer system, not in source control.

## Firm-Wide Enterprise

Firm-Wide Enterprise does not use a published self-service price. Use
**Prepare contract billing**, then create the Stripe subscription from the
executed order. The provider metadata must match the staged organization,
`firm_wide_enterprise` license, `contract` term, and approved seat allowance.

The customer receives access only after the signed subscription event matches
those staged terms.

## Status handling

| Visible state | Access result | Operator action |
| --- | --- | --- |
| Not configured | No paid access | Complete the customer and agreement record |
| Checkout pending | No paid access | Wait for the approved contact |
| Contract pending | No paid access | Complete the enterprise subscription from the order |
| Active | Licensed access | Verify dashboard and onboarding progress |
| Past due | Access suspended | Contact the billing owner and wait for verified recovery |
| Suspended | Access denied | Resolve the approved operational or billing hold |
| Canceled | Access denied | Confirm renewal or begin offboarding |

The browser return page is informational. It does not prove payment and cannot
activate access.

## Refunds and disputes

- Follow the executed order and approved legal terms.
- Process a refund or dispute decision in Stripe through the authorized owner.
- Preserve the provider reference and Harper Vance audit evidence.
- A refund does not independently change the license unless the Stripe
  subscription state also changes or an approved operator action suspends it.
- Never delete billing events or manually mark a payment successful to make
  the dashboard match a desired outcome.

## Test acceptance

Before enabling Live mode, prove in Stripe Test:

- monthly and annual checkout for both standard licenses;
- canceled and abandoned checkout leaves access pending;
- checkout completion alone does not activate access;
- active subscription activates exactly one organization;
- duplicate and delayed events do not repeat or reverse changes;
- past due suspends access and verified recovery restores it;
- cancellation removes access; and
- 1, 5, and 15-seat behavior remains enforced.

## Stop conditions

Stop billing work when the order, agreement, license, term, seats, customer,
provider metadata, payment state, or dashboard access disagrees. Do not work
around the mismatch with a direct Firebase edit, an unverified webhook replay,
or a manually selected Active status.

