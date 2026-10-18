# Firebase Hosting recovery gate

## Purpose

This runbook prevents release activity from being mistaken for a code fix when
Firebase Hosting has suspended the `harpervanceqa` site. A provider suspension
affects the live site, custom domains, and preview channels even when the
application builds and runs correctly locally.

## Current incident

- Firebase Hosting suspended the site on October 13, 2026 after an automated
  suspected-phishing classification.
- Google Cloud Trust and Safety received the platform-owner appeal on October
  13, 2026.
- Local unit, Rules, build, bundle, signed-out browser, and authenticated
  browser gates pass.
- No replacement Firebase project or site will be created to bypass review.
- No pull request will merge and no Hosting deployment will run until the
  canonical Firebase site serves the Harper Vance application again.

## Automated stop gate

The preview and `main` workflows verify
`https://harpervanceqa.web.app` before invoking Firebase deployment. The check
requires a successful response containing the Harper Vance application title.
A provider error, Firebase `Site Not Found` response, timeout, or unrelated
page stops the workflow before deployment.

This preflight supplements rather than replaces the deployed preview,
authenticated browser, production browser, and two-hostname gates.

## Recovery sequence

1. Wait for Google Cloud Trust and Safety to confirm restoration. Do not file
   duplicate appeals unless Google requests another submission.
2. Open the canonical Firebase URL and confirm it serves Harper Vance rather
   than a provider error page.
3. Synchronize the rotated `E2E_BROWSER_PASSWORD` from local macOS Keychain to
   the paired GitHub repository secrets when remote work is authorized.
4. Push the paired local branches only after explicit approval.
5. Require the frontend pull request to produce a working Firebase preview and
   pass signed-out and authenticated browser coverage.
6. Confirm the preview URL is embedded in the pull request.
7. Merge backend before frontend, then monitor every `main` deployment and
   post-deployment check.
8. Verify `https://harpervance.com` serves the application over HTTPS and
   `https://harpervanceqa-dev.web.app` remains available as the operational
   fallback.

## Stop conditions

Stop if Hosting remains unavailable, the production hostname fails, the preview does
not load Harper Vance, authentication fails, licensed data is unavailable,
platform administration opens for the test user, or any release gate fails.
Do not weaken authentication, change customer records, switch Stripe to Live,
or perform a real transaction to obtain a passing release.
