# Harper Vance Domain Migration

## Scope

Move `harpervanceqa.com` and `www.harpervanceqa.com` from the legacy Firebase
Hosting site to `harpervanceqa-dev`. The Namecheap registration, nameservers,
email configuration, and unrelated DNS records remain unchanged.

## Verified starting state

- The destination Hosting site is available at
  `https://harpervanceqa-dev.web.app`.
- The destination site is deployed from `main` by
  `.github/workflows/firebase-hosting-main.yml`.
- The backend is deployed independently from the backend repository.
- Namecheap hosts the DNS zone and the registration is active through
  August 6, 2027.
- The apex already uses Firebase's shared Hosting address
  `199.36.158.100`, but its ownership TXT record selects the legacy
  `harpervanceqa` site.
- `www.harpervanceqa.com` points to the legacy
  `harpervanceqa.web.app` site.
- The destination Firebase project already contains an active certificate and
  custom-domain mapping for `www.harpervanceqa.com`; the DNS target is the
  remaining mismatch.
- The destination custom-domain mapping for the apex was created after a
  successful validation-only check.
- Existing email and unrelated DNS records must not be modified during the
  migration.

## Deployment sequence

1. Certify the Firebase-provided destination URL.
2. Permit `https://harpervanceqa.com` in Firebase Authentication and backend
   CORS configuration while retaining the Firebase-provided fallback origin.
3. Create the Firebase Hosting custom-domain mapping and record the exact DNS
   changes requested by Firebase.
4. Replace only the legacy Firebase ownership TXT and `www` CNAME records in
   Namecheap. Keep the apex A record and all mail records unchanged.
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

## DNS cutover configuration

Firebase created the `harpervanceqa.com` custom-domain mapping and requested
the following DNS changes:

| Record | Previous value | Destination value |
| --- | --- | --- |
| A `@` | `199.36.158.100` | unchanged |
| TXT `@` | `hosting-site=harpervanceqa` | `hosting-site=harpervanceqa-dev` |
| CNAME `www` | `harpervanceqa.web.app` | `harpervanceqa-dev.web.app` |

The Namecheap Private Email MX, SPF, DKIM, and verification records are not
part of the Hosting migration and must remain unchanged.

## Rollback

If the custom domain becomes unhealthy after activation:

1. Keep the Firebase Hosting deployment available at
   `https://harpervanceqa-dev.web.app`.
2. Revert the apex website records to their recorded pre-cutover values, if any.
3. Keep `https://harpervanceqa.com` in the backend allowlist during diagnosis so
   clients with cached DNS are not rejected.
4. Do not remove Firebase ownership verification records until certificate and
   domain status have been reviewed.
5. Do not modify nameservers, MX records, or unrelated TXT records as part of a
   website rollback.

## Completion evidence

Record the following before closing the migration:

- Firebase custom-domain ownership is active.
- Firebase certificate status is active.
- Public browser tests pass at `https://harpervanceqa.com`.
- Authenticated password plus TOTP tests pass at `https://harpervanceqa.com`.
- `https://www.harpervanceqa.com` serves the same release.
- The backend accepts the apex origin and rejects unapproved origins.
- A merge to `main` deploys and verifies the apex domain.
- Email service and unrelated DNS records remain unchanged.
