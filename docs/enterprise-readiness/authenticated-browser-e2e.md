# Authenticated browser release gate

## Purpose

This phase verifies the deployed licensed-customer experience in a real browser
without using the platform owner's password, MFA seed, or a real customer's
credentials.

## Protected identity

- The automation account is provisioned and marked by the governed backend.
- Its password exists only as the `E2E_BROWSER_PASSWORD` GitHub secret.
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
