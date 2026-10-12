# Commercial model

## Approved offer

Harper Vance uses an approval-only, sales-assisted purchasing process. A public
visitor cannot create an organization or buy dashboard access without Harper
Vance approval.

| License | Included seats | Standard payment choices | Commercial handling |
| --- | ---: | --- | --- |
| Entity Core | 1 | $1,500 monthly or $14,400 annually | Standard Stripe price selected by the platform owner |
| Desk Intelligence | 5 | $5,000 monthly or $48,000 annually | Standard Stripe price selected by the platform owner |
| Firm-Wide Enterprise | 15 | From $15,000 monthly under an annual agreement | Price and payment schedule come from the executed order |

A published Entity Core subscription includes exactly 1 seat and a published
Desk Intelligence subscription includes exactly 5 seats. Additional seats
require an approved license change or executed enterprise order; they cannot be
added to a published standard price from the dashboard.

A larger Firm-Wide Enterprise seat allowance is recorded from the executed
order. Increasing the seat allowance does not cause the browser to calculate or
alter a price.

## Purchasing boundary

1. The platform owner approves the organization and license.
2. The platform owner records the executed agreement or an authorized waiver.
3. The platform owner selects an allowed standard price or the approved
   enterprise order.
4. The backend creates the Stripe payment session.
5. Only a verified Stripe event can activate paid access.
6. The customer administrator manages users within the active seat allowance.

Customers never submit a Stripe price identifier, alter a charge, or activate
their own access. Stripe credentials and price mappings remain server-side.

## Term rules

- Entity Core and Desk Intelligence support monthly or annual payment.
- Firm-Wide Enterprise remains contract-controlled and is not a public
  self-service checkout.
- Annual standard prices are charged as the published annual amount.
- Trials, refunds, renewal notice, cancellation timing, and early termination
  are governed by the executed order and approved legal terms rather than
  invented by the application.
- Canceling payment removes or schedules removal of product access according to
  the verified provider state and the executed order.
- Complimentary and internal accounts do not enter the commercial Stripe flow.

## Source-of-truth rules

The executed order is the commercial authority. Stripe is the payment authority.
Harper Vance entitlements are the product-access authority. If those records do
not agree, access fails closed and the platform owner receives a next action;
the browser does not attempt to repair the mismatch.
