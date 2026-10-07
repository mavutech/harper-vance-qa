# Phase 9: Frontend release checks

Every frontend pull request now runs the complete test suite, builds with CI
warnings treated as errors, and publishes a Firebase Hosting preview. The
preview URL is written into the pull-request description and is refreshed after
every push.

Every merge to `main` repeats the complete test and build process before
deploying the `harpervanceqa` Firebase Hosting site in `goldensetups-dev`.

## Review checklist

- Sign in with a provisioned non-administrator account.
- Confirm the navigation shows only licensed product areas.
- Confirm unlicensed routes show the account-access explanation.
- Confirm current targets update in real time.
- Confirm daily, weekly, and historical pages load through the authenticated
  backend and enforce the licensed history window.
- Confirm the product date follows New York time when the reviewer is in a
  different time zone.
- Confirm sign-up does not write identity data from the browser.
- Confirm sign-out removes access state and returns to the public experience.
