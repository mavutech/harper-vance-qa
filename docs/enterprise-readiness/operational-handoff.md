# Phase 6: platform and customer operational handoff

## Outcome

This guide gives the platform owner and each customer administrator a single,
screen-based path for operating Harper Vance. It does not change dashboard,
access, billing, or integration behavior.

## Platform-owner workspace

Open **Platform Administration > Customer Organizations**. Use the selected
organization's review page as the source of truth for:

- onboarding progress;
- license, subscription, and payment status;
- included dashboard features and history;
- contracted seats, assigned seats, and pending invitations;
- customer users and roles;
- delivery, API, and support capabilities; and
- audit export and governed closure.

Do not use Firebase consoles or customer passwords for routine customer work.
If a screen and a signed order disagree, stop and correct the staged customer
record before continuing.

## Platform-owner customer handoff

1. Confirm the legal organization name and approved license.
2. Confirm the onboarding progress identifies the next incomplete step.
3. Confirm the payment state is active or an approved non-commercial decision
   is recorded. A checkout link alone is not payment.
4. Invite the first customer administrator using the approved business email.
5. Confirm the administrator accepts the invitation and can sign in.
6. Confirm the administrator sees **Organization > Team & Seats**.
7. Confirm the customer sees only the dashboard features and history included
   in the license.
8. Confirm a different organization remains inaccessible.
9. Export the audit history and retain it with the approved customer record.
10. Provide the support address and customer-administrator checklist below.

The platform owner keeps control of licensing, billing setup, suspension,
reactivation, integrations, and final closure.

Use `docs/enterprise-readiness/billing-operations-checklist.md` for the
screen-by-screen payment states, Stripe Test acceptance, refunds, disputes,
and stop conditions.

Use `docs/enterprise-readiness/support-and-recovery.md` when sign-in, MFA,
invitation, permission, billing, product data, or platform-owner access fails.
It defines safe intake, escalation, approved recovery paths, and case closure.

## Customer-administrator handoff

The customer administrator should complete these steps during handoff:

1. Sign in through **Client login** and complete any required second-factor
   challenge.
2. Open each licensed analytics page and confirm the expected access.
3. Open **Organization > Team & Seats**.
4. Confirm the displayed seat allowance matches the order.
5. Invite one approved team member and confirm the invitation can be accepted.
6. Revoke any test invitation that is no longer needed.
7. Confirm normal members cannot open platform administration.
8. Save `tkmavu@gmail.com` as the Harper Vance support destination.

Customers must not send passwords, authenticator codes, invitation tokens,
payment details, API secrets, or screenshots containing those values to
support.

## What to record

The platform owner records the organization identifier, approved license,
seat allowance, completed onboarding result, customer-administrator handoff
date, licensed-page check, isolation check, and audit-export location in the
approved customer system.

The source-code repository must not contain customer personal information,
contracts, payment details, or credentials.

## Stop conditions

Stop the handoff and keep access unchanged when:

- onboarding progress is incomplete or unavailable;
- the license, seat allowance, payment state, or signed order disagrees;
- the customer cannot open an included dashboard feature;
- the customer can open a feature outside its license;
- the customer can access another organization's records;
- the first administrator cannot manage the team within the seat limit; or
- any page exposes an internal Firebase error, secret, or payment detail.

Use the customer administration guide for correction. Escalate access or data
incidents through the production operations process rather than weakening a
role or database rule.

## Acceptance result

Phase 6 is accepted when both roles can follow the same customer status,
handoff, evidence, and stop-condition model using the existing application.
No access or billing behavior is changed by this documentation phase.
