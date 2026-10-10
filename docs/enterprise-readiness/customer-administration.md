# Customer administration console

## What the console is for

Customer Organizations is the platform owner's workspace for onboarding,
licensing, supporting, suspending, reactivating, and offboarding Harper Vance
customers.

Only a user with the canonical `super_admin` platform role can see or open the
console. Normal product access remains based on organization membership and an
active license. A dashboard user is not made a platform administrator merely
to restore or test product access.

## Onboard a customer

1. Open **Platform Administration > Customer Organizations**.
2. Select **Add customer**.
3. Enter the legal organization name, stable slug, and optional approved email
   domains. The record begins in onboarding status.
4. Select **Review** for the new organization.
5. Select **Manage license** and assign the approved license, seat limit,
   billing mode, status, and change reason. Commercial agreements start at 25
   seats.
6. Confirm that the customer record shows the expected enabled capabilities.
7. For a commercial agreement, create the secure checkout link and wait for a
   verified active payment state. Creating the link does not activate access.
8. Invite the first customer administrator from **Customer users**.
9. Confirm email receipt. If email delivery is unavailable, transfer the
   one-time fallback link through an approved secure channel.
10. Have the customer validate the invitation and create an account or sign in.
11. Ask the customer administrator to add remaining users from
    **Organization > Team & Seats**.

Organization creation and licensing are separate, deliberate steps. If
licensing fails, the organization remains in onboarding and can be corrected
without deleting or recreating it.

## Customer invitation behavior

The invitation page validates the token before showing account actions. The
backend enforces the invited email, expiration, organization status, and seat
limit.

New users create a password only after the invitation is validated. Existing
users sign in and return to the pending invitation. After acceptance, the app
refreshes the Firebase access token before opening the dashboard.

Passwords and invitation tokens are never stored in Redux, local storage,
session storage, analytics, or logs.

## Integrations and API access

Integration controls appear only for an active subscription and only when the
license includes the capability.

- Email delivery uses an approved recipient address.
- Slack, Teams, and webhook destinations use an existing Google Secret Manager
  reference. Endpoint URLs are not entered into or stored by the browser.
- API credentials are displayed once. Transfer the secret through an approved
  secure channel before leaving the record.
- Disable or revoke integrations instead of deleting evidence.

## Suspend, reactivate, or close

Use **Manage license** and status **Suspended** for a reversible stop. Use an
appropriate change reason and verify that customer product access is denied.
Reactivate with status **Active** and verify only the licensed features return.

Use **Close organization** only for final offboarding. The dialog requires the
exact organization slug. Closure revokes customer access and preserves the
organization and audit evidence.

## Audit evidence

**Export audit history** downloads structured JSON for the selected customer.
Retain the onboarding, license, invitation, membership, integration, access,
and offboarding events with the customer record.

## Phase 5 acceptance boundary

Phase 4 provides the management workflow. The first paying customer is not
certified until Phase 5 proves the full lifecycle using a non-administrator
customer account:

- onboarding and invitation acceptance;
- licensed dashboard access;
- history and integration limits;
- suspension and reactivation;
- cross-organization denial;
- audit evidence; and
- evidence-preserving closure.

The Firebase pull-request preview is used to review the frontend. Backend
customer-control endpoints must also be deployed from the approved backend
pull request before live customer-management actions can succeed in that
preview.
