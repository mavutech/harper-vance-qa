# Harper Vance customer onboarding guide

The operational handoff and final role-by-role acceptance steps are maintained
in `docs/enterprise-readiness/operational-handoff.md`.

Harper Vance onboarding is administrator led. A visitor cannot buy a license
or create a customer organization from the public website. The platform owner
creates the customer record, and every customer account begins with a governed
invitation.

## Before creating the customer

Collect and approve these items in the customer system of record:

- legal organization name;
- approved license and payment term;
- included product seats: 1 for Entity Core, 5 for Desk Intelligence, or at
  least 15 for Firm-Wide Enterprise as stated in the executed order;
- approved business-email domains;
- billing contact and first customer-administrator email;
- agreement version, external signature reference, and effective date; and
- whether payment is commercial, internal, complimentary, or contract
  invoiced.

Do not store customer contracts, personal information, payment details,
passwords, authenticator codes, or invitation tokens in the source-code
repository.

## Onboarding progress shown to both parties

The progress display is derived from the actual organization, license,
agreement, billing, membership, and entitlement records. It is not a separate
checklist that an operator can mark complete manually.

| Step | Platform-owner meaning | Customer meaning |
| --- | --- | --- |
| Customer record created | Legal organization exists | Harper Vance has opened the account |
| License and seats assigned | Approved license is recorded | Purchased license and seat allowance are visible |
| Approved agreement recorded | Executed agreement or approved waiver is recorded | Agreement review is complete |
| Payment confirmed or not required | Verified payment is active or an approved non-commercial decision exists | No billing action remains |
| Customer administrator active | The invited administrator accepted and has active access | The administrator account is ready |
| Licensed dashboard access active | Organization, subscription, and entitlement are active | Included dashboard pages can be used |

If the owner and customer screens disagree, stop onboarding. Do not repair the
difference by editing Firebase directly. Preserve the visible request
reference and use the governed administration or incident process.

## Platform owner checklist

1. Open **Platform Administration > Customer Organizations**.
2. Create the customer's legal organization record.
3. Assign the approved license, payment term, and seat count. Entity Core is
   fixed at 1 product seat and Desk Intelligence is fixed at 5 for their
   published prices. Firm-Wide Enterprise includes 15 and may use a larger
   limit only when the executed order approves it.
4. Complete the approved signature process in the contract system, then record
   the agreement version, external reference, effective date, and executed or
   waived status in Harper Vance.
5. For Entity Core or Desk Intelligence, create the secure checkout link and
   send it to the approved billing contact. For Firm-Wide Enterprise, follow
   the executed order, prepare contract billing, and complete the approved
   subscription in Stripe using the returned customer reference.
6. Wait for payment status and licensed access to become active. A created
   checkout link is not proof of payment.
7. Invite the customer's first administrator.
8. Confirm the administrator accepts the invitation and can sign in.
9. Confirm the customer sees only the features included in the license.
10. Export the audit history and retain it with the customer record.

Before declaring the customer ready, the progress display must show all 6
steps complete. The customer administrator must independently confirm the
licensed dashboard and Team & Seats experience.

The platform owner controls organization creation, licensing, billing setup,
suspension, reactivation, integrations, and final closure. Routine onboarding
must not require a database edit or access to a customer's password.

Production invitation email delivery must be tested before onboarding the first
customer. The one-time fallback link is for an approved secure recovery channel
and must not replace normal invitation email delivery.

## Customer administrator checklist

1. Open the one-time invitation link and create an account or sign in with the
   invited email address.
2. Open **Organization > Team & Seats**.
3. Review the number of assigned seats and the purchased limit.
4. Invite administrators or members using their business email addresses.
5. Send the one-time fallback invitation link only through an approved secure
   channel if the email is not received.
6. Revoke invitations that are no longer required.
7. Change permitted member roles or remove people who no longer need access.
8. Confirm the included analytics pages open and save the approved Harper
   Vance support address.

Customer administrators cannot change billing, licensing, platform-wide
settings, other organizations, or organization ownership. Contact Harper Vance
support for those changes.

## First-session handoff

Complete these checks with the customer administrator:

1. Confirm **Client Login** opens the approved sign-in page.
2. Accept the invitation using the exact invited email address.
3. Complete any required two-step verification challenge.
4. Open every included dashboard page and confirm no permission error appears.
5. Open **Organization > Team & Seats** and confirm the purchased seat limit.
6. Invite one approved member, confirm acceptance, and verify the seat count
   updates.
7. Confirm the member cannot open Team & Seats or Platform Administration.
8. Confirm the administrator cannot open Platform Administration.
9. Record the handoff date, outcome, and audit-export location in the approved
   customer record.

Do not complete handoff with a platform-owner account standing in for the
customer. That would bypass the organization and role boundaries being
accepted.

## Access outcomes

| Situation | What the customer sees | Next action |
| --- | --- | --- |
| Invitation pending | Invitation page only | Accept using the invited email |
| Payment pending | No licensed dashboard access | Billing contact completes checkout |
| License active | Purchased dashboard features | Begin normal use |
| Seat limit reached | New invitation cannot become an active seat | Remove an unused member or contact Harper Vance |
| Payment past due or account suspended | Licensed pages are unavailable | Contact billing or Harper Vance support |
| Account closed | Product access remains unavailable | Contact Harper Vance if closure was unexpected |

## Offboarding

1. Confirm the approved business decision and effective time.
2. Export the organization audit history.
3. Revoke pending invitations and customer delivery credentials.
4. Suspend the license first when investigation or payment recovery remains
   possible.
5. Use **Close organization** only for final offboarding and enter the exact
   organization slug when prompted.
6. Verify the former customer cannot open licensed product pages.
7. Retain the closure decision and audit export outside the source repository.

Closure preserves evidence. Do not delete organization, entitlement, billing,
or audit records to make a customer inactive.

## Support information to collect

When reporting an onboarding problem, provide the organization name, affected
user email, page name, approximate time, and the visible request reference if
one is shown. Do not send passwords, authenticator codes, invitation tokens,
API secrets, payment details, or screenshots containing those values.
