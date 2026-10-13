# Customer support and recovery guide

## Purpose

This guide gives the platform owner a safe, repeatable response when a customer
cannot sign in, accept an invitation, open licensed product data, or reconcile
a billing state. The objective is to restore the intended access without
granting broader authority, editing Firebase records directly, or losing audit
evidence.

Customer support uses `tkmavu@gmail.com`. Standard account, billing, and
product questions are covered Monday through Friday, 9:00 AM to 5:00 PM
Eastern, with an initial response within one business day. Critical access or
data incidents are monitored at all times and response begins within 30
minutes.

## Safe intake

Ask for only:

- the customer's organization name;
- the affected user's business email;
- the page and action that failed;
- the approximate time and time zone;
- the visible, non-sensitive error message; and
- the request ID when the page displays one.

Never ask for a password, authenticator code or setup key, invitation token,
payment card information, API secret, webhook address, or a screenshot that
contains one of those values.

## Triage guide

| Visible problem | Checks in order | Approved recovery | Stop condition |
| --- | --- | --- | --- |
| Cannot sign in | Confirm the exact invited email, email verification, password-reset result, and whether a six-digit challenge appears | Use the normal password-reset or MFA recovery path after identity verification | Do not handle a password or weaken MFA |
| Authenticator code fails or device is lost | Confirm the owner of the account and whether the user recently changed devices | Use the documented Firebase administrative MFA recovery, then require fresh enrollment and sign-in | Never grant a weaker role or bypass the second factor |
| Invitation does not work | Check exact email, organization status, expiry, revocation, duplicate membership, and available seats | Revoke the unusable invitation and issue a new one through the application | Never reuse an expired or revoked token or increase seats without approval |
| Licensed page will not open | Ask the user to sign out, sign in, and try once; then review organization membership, subscription, license, feature, and access projection | Correct the governed customer or license record through Platform Administration | Do not grant `super_admin` or edit Firebase directly |
| Permission denied | Confirm the requested action is included for the user's customer role | Assign only the approved customer role through the governed screen | Stop if the request would cross organizations or license limits |
| Platform owner cannot open administration | Confirm the canonical owner email, MFA enrollment, and the governed owner workflow result | Use the documented owner recovery workflow and require a fresh sign-in | Do not add claims or database records manually |
| Payment and access disagree | Preserve the provider event reference, application request ID, organization, and time | Reconcile the signed payment event and Harper Vance audit history | Keep access unchanged until the verified event is understood |
| Data is missing or looks wrong | Record page, organization, time, request ID, and expected result; verify the source record read-only | Correct the originating governed workflow or restore through the approved recovery process | Stop affected writes for suspected corruption or cross-customer exposure |
| Site says Site Not Found | Check the current Firebase Hosting incident and provider response | Continue local certification while waiting for Hosting restoration | Do not create a replacement project or site to bypass suspension |

## Severity and escalation

| Severity | Example | Required action |
| --- | --- | --- |
| Critical | Cross-customer exposure, unauthorized access, or payment applied to the wrong customer | Stop onboarding, contain the affected path, preserve evidence, and begin response immediately |
| High | Platform owner locked out, all customers denied, or billing event processing unavailable | Begin recovery within 30 minutes and keep customer state unchanged until verified |
| Medium | One customer report, invitation, or included feature unavailable | Begin investigation within four business hours |
| Low | Cosmetic issue with no access, data, or payment impact | Record and schedule through normal product work |

## Recovery rules

1. Start with read-only evidence and determine whether the failure followed a
   sign-in, customer change, payment event, deployment, or provider incident.
2. Retry a normal sign-in or page load once. Repeated retries can hide the
   original failure and do not replace diagnosis.
3. Use Platform Administration for customer, license, seat, invitation, and
   suspension changes.
4. Use the governed owner workflow for platform-owner recovery.
5. Use verified payment events for billing state. A checkout link or manual
   note is not payment.
6. Revert a code regression with a reviewed revert commit. Never reset shared
   history.
7. Preserve customer, access, payment, and recovery audit records.

## Closure evidence

A case closes only after the intended user signs in, sees only the approved
organization and features, and the relevant audit record is retained. Record
the customer, affected user, severity, request IDs, event references, action,
verification result, and closure time in the approved support system. Do not
store customer support records or sensitive values in the source repository.

