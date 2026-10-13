# Authenticated browser release gate

## Purpose

This phase verifies the deployed licensed-customer experience in a real browser
without using the platform owner's password, MFA seed, or a real customer's
credentials.

## Protected identity

- The automation account is provisioned and marked by the governed backend.
- Its password is stored in the protected GitHub secret for release
  automation. During local-only certification, the rotated value is held in
  macOS Keychain under service `com.mavutech.harper-vance.e2e-browser` and is
  never written to a repository environment file.
- It receives full internal product access with the normal `user` platform
  role and cannot open platform administration.
- It is not a Stripe customer and must never be used for a live transaction.

## Permanent release gates

Preview and `main` workflows now test:

1. customer sign-in through the public login form;
2. Today's Targets;
3. Daily Performance;
4. Weekly Summary;
5. Historical and Rolling analysis;
6. Organization Team and Seats; and
7. denial of Platform Administration.

Signed-out access controls remain a separate browser gate. Owner authority,
MFA, Test billing, and customer lifecycle integrity remain backend release
gates, so browser automation never needs the owner's credentials.

## Stop conditions

Stop the release if the protected password is absent, sign-in fails, a licensed
route redirects to unavailable access, a route renders a permission error, or
the non-admin identity can open platform administration. Failure artifacts are
retained for 14 days and must not contain credentials.

## October 13 local-only certification

- The dedicated identity was verified as an ordinary `user` with access only
  to the internal test organization.
- The authenticated Chromium journey passed every licensed route and denied
  Platform Administration.
- Five signed-out Chromium journeys passed independently.
- No code was pushed and no GitHub secret was changed. The paired GitHub
  secrets must be synchronized from the local Keychain before any remote
  release gate is expected to pass.

Run the local authenticated browser gate without creating an environment file:

```bash
E2E_BROWSER_PASSWORD="$(security find-generic-password \
  -a 'tkmavu+harper-vance-e2e@gmail.com' \
  -s 'com.mavutech.harper-vance.e2e-browser' -w)" \
  yarn test:e2e:authenticated
```
