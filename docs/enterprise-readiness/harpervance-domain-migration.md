# Harper Vance Domain Migration

## Scope

Move the apex domain `harpervance.com` to the Firebase Hosting site
`harpervanceqa-dev`. The domain registrar, nameservers, email configuration,
backend services, and `www` subdomain are outside the migration scope.

## Verified starting state

- The destination Hosting site is available at
  `https://harpervanceqa-dev.web.app`.
- The destination site is deployed from `main` by
  `.github/workflows/firebase-hosting-main.yml`.
- The backend is deployed independently from the backend repository.
- The apex domain does not currently resolve to an IPv4 address, IPv6 address,
  or CNAME.
- The registrar delegates DNS to `ns5.sygnifi.com` and `ns6.sygnifi.com`.
- The delegated nameservers do not currently return a usable zone for the
  apex domain.
- The domain registration is active through February 14, 2027.
- The destination Firebase project does not currently contain a custom-domain
  mapping for `harpervance.com`.
- Existing email and unrelated DNS records must not be modified during the
  migration.

## Deployment sequence

1. Certify the Firebase-provided destination URL.
2. Permit `https://harpervance.com` in Firebase Authentication and backend
   CORS configuration while retaining the Firebase-provided fallback origin.
3. Create the Firebase Hosting custom-domain mapping and record the exact DNS
   changes requested by Firebase.
4. Restore authoritative DNS service for the domain and apply only the records
   required for the apex website and Firebase ownership verification.
5. Wait for Firebase ownership and certificate status to become active.
6. Verify public navigation, password plus TOTP authentication, backend access,
   and direct-route refreshes through the apex domain.
7. Make the apex domain the post-deployment verification target while retaining
   the Firebase-provided URL as an operational fallback.

## Destination certification

Certified on October 18, 2026 before custom-domain configuration:

- The latest `main` Hosting workflow completed successfully for commit
  `3a477c7e59a6ce075694c8c764aa4ec47809e472`.
- The Firebase-provided Hosting URL returned the expected application.
- The deployed backend health endpoint returned an OK response.
- All 73 frontend test suites passed, covering 437 tests.
- The production build completed successfully.
- The production entry bundle was 337.01 KiB compressed against a 400 KiB
  budget.
- All seven public browser journeys passed.

## Rollback

If the custom domain becomes unhealthy after activation:

1. Keep the Firebase Hosting deployment available at
   `https://harpervanceqa-dev.web.app`.
2. Revert the apex website records to their recorded pre-cutover values, if any.
3. Keep `https://harpervance.com` in the backend allowlist during diagnosis so
   clients with cached DNS are not rejected.
4. Do not remove Firebase ownership verification records until certificate and
   domain status have been reviewed.
5. Do not modify nameservers, MX records, or unrelated TXT records as part of a
   website rollback.

## Completion evidence

Record the following before closing the migration:

- Firebase custom-domain ownership is active.
- Firebase certificate status is active.
- Public browser tests pass at `https://harpervance.com`.
- Authenticated password plus TOTP tests pass at `https://harpervance.com`.
- The backend accepts the apex origin and rejects unapproved origins.
- A merge to `main` deploys and verifies the apex domain.
- Email service and unrelated DNS records remain unchanged.
