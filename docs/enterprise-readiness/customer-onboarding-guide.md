# Harper Vance customer onboarding guide

## Platform owner checklist

1. Open **Platform Administration > Customer Organizations**.
2. Create the customer's legal organization record.
3. Assign the approved license and seat count. Entity Core includes 1 product
   seat, Desk Intelligence includes 5, and Firm-Wide Enterprise includes 15
   with larger limits recorded from the approved contract.
4. Complete the approved signature process in the contract system, then record
   the agreement version, external reference, effective date, and executed or
   waived status in Harper Vance.
5. For a commercial agreement, create the secure checkout link and send it to
   the approved billing contact.
6. Wait for payment status and licensed access to become active. A created
   checkout link is not proof of payment.
6. Invite the customer's first administrator.
7. Confirm the administrator accepts the invitation and can sign in.
8. Confirm the customer sees only the features included in the license.
9. Export the audit history and retain it with the customer record.

The platform owner controls organization creation, licensing, billing setup,
suspension, reactivation, integrations, and final closure. Routine onboarding
must not require a database edit or access to a customer's password.

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

Customer administrators cannot change billing, licensing, platform-wide
settings, other organizations, or organization ownership. Contact Harper Vance
support for those changes.

## Access outcomes

| Situation | What the customer sees | Next action |
| --- | --- | --- |
| Invitation pending | Invitation page only | Accept using the invited email |
| Payment pending | No licensed dashboard access | Billing contact completes checkout |
| License active | Purchased dashboard features | Begin normal use |
| Seat limit reached | New invitation cannot become an active seat | Remove an unused member or contact Harper Vance |
| Payment past due or account suspended | Licensed pages are unavailable | Contact billing or Harper Vance support |
| Account closed | Product access remains unavailable | Contact Harper Vance if closure was unexpected |

## Support information to collect

When reporting an onboarding problem, provide the organization name, affected
user email, page name, approximate time, and the visible request reference if
one is shown. Do not send passwords, authenticator codes, invitation tokens,
API secrets, payment details, or screenshots containing those values.
