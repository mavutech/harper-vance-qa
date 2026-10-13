# Local release certification

## Purpose

This certification provides one repeatable local gate while Firebase Hosting
is unavailable. It verifies the paired backend and frontend without pushing,
deploying, reading production secrets, or creating a payment.

## Requirements

- Node.js 22 or newer
- The paired frontend and backend repositories available locally
- Installed locked dependencies in both repositories
- Playwright Chromium installed
- Java available for the Firebase Firestore emulator
- Local ports used by Firebase emulators, the test API, and browser servers
  available

The default paired backend directory is
`../../../../golden-setups-sona-alerts` relative to the frontend script. Set
`HARPER_VANCE_BACKEND_DIR` to an explicit local checkout when the repositories
use a different layout.

## Run

From the frontend repository under Node.js 22:

```bash
yarn certify:local
```

If port 3200 is already in use, select another unprivileged loopback port:

```bash
CERTIFICATION_PUBLIC_PORT=3201 yarn certify:local
```

## Gates

The command stops at the first failure and runs:

1. Backend lint.
2. Backend service tests.
3. Firebase Firestore and Realtime Database rules tests.
4. Frontend unit and component tests.
5. Frontend production build.
6. Entry-bundle budget verification.
7. Public and signed-out Chromium journeys.
8. The isolated enterprise customer lifecycle in Firebase emulators.

The enterprise lifecycle creates only disposable emulator identities with
random run-scoped passwords. Its demo-project and loopback guards prevent it
from using a real Firebase project.

## Exclusions

Local certification does not replace:

- Firebase preview deployment.
- Authenticated browser verification on the deployed preview.
- Custom-domain verification.
- Invitation email deliverability.
- Stripe Test checkout and signed public webhook verification.
- Production smoke testing.

Those remain mandatory external gates after Firebase Hosting recovers.

## Latest certified result

On October 13, 2026, the complete command passed against frontend candidate
`1beb1c6` and backend candidate `68e02e2`:

- backend lint;
- 78 backend suites and 639 tests;
- 9 Firebase Rules suites and 79 tests;
- 70 frontend suites and 418 tests;
- production build and 335.14 KiB entry bundle against the 400 KiB budget;
- 5 public and signed-out browser journeys; and
- 12 isolated enterprise lifecycle journeys.

The run took 180.58 seconds and did not push, deploy, read production secrets,
or create a payment.
