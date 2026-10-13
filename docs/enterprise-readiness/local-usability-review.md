# Local usability review

## Outcome

The customer-administrator and platform-owner workflows remain usable at a
390 by 844 mobile viewport and with keyboard operation. The review found and
fixed two concrete presentation problems without changing authentication,
authorization, customer data, billing, or entitlement behavior.

## Corrections

| Area | Finding | Correction |
| --- | --- | --- |
| Account security | Authenticator and profile action buttons could show only an unlabeled spinner while a request was running | Keep a visible action label next to the spinner so the user knows what is happening |
| Customer administration | Create, license, and closure dialogs displayed a title visually but did not expose that title as the dialog's accessible name | Connect each dialog to its visible title for screen readers and reliable keyboard testing |

## Verified customer journey

- A customer administrator can sign in on a mobile viewport.
- **Team & Seats** displays the organization, seat information, invitation
  form, and action without switching roles or changing access rules.
- Profile sections remain in the intended horizontally scrollable row.
- The **Security** section can be selected and the two-step verification
  controls are visible.
- Busy security and profile actions retain readable text.

## Verified platform-owner journey

- The platform owner lands in **Customer Organizations** on a mobile viewport.
- The owner can reach **Add customer** with the keyboard and open the dialog
  with Enter.
- The dialog has a readable accessible name, contains the expected form, and
  closes with Escape.
- Existing customer lifecycle, isolation, seat, suspension, cancellation, and
  reactivation behavior remains unchanged.

## Local evidence

- 20 focused component tests passed across profile navigation, MFA, and the
  three governed customer dialogs.
- 12 isolated enterprise browser journeys passed against disposable Firebase
  emulators, including the two mobile and keyboard journeys.
- The suite used test identities and local emulators only. It did not contact
  production, Stripe, Firebase Hosting, or real customer data.

## Boundary

This review is not a substitute for the restored Firebase preview and the
required signed-out and authenticated preview checks. Those release gates
remain blocked until Firebase Hosting is restored.

