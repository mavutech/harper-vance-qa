# Paired enterprise release checklist

## Purpose

This is the final operator checklist for releasing matching Harper Vance
frontend and backend branches. It keeps the backend change ahead of the
frontend that depends on it, requires a reviewable Firebase preview, and stops
the release when any customer, owner, payment, or hosting check fails.

## Current release boundary

Firebase Hosting is suspended while the Google appeal is pending. Local work
and local commits may continue, but no branch is pushed, pull request is
merged, or deployment is attempted until the canonical Firebase site serves
the Harper Vance application again. A Firebase Site Not Found page is a failed
gate, not an application release.

## Before remote release work

- [ ] Both repositories are on the same feature-branch name.
- [ ] Both repositories have clean working trees.
- [ ] The final local paired certification passes on Node.js 22 or newer.
- [ ] No credential, customer record, payment data, invitation token, or MFA
      value exists in either commit history or test evidence.
- [ ] `https://harpervanceqa.web.app` serves the Harper Vance application title.
- [ ] The approved service-account and browser-test secrets exist in GitHub.
- [ ] Stripe remains in the approved Test environment unless a separate Live
      launch has been explicitly approved.

## Pull requests and preview

1. Push the matching backend and frontend branches only after explicit remote
   work approval.
2. Open both pull requests against `main` and link them to one another.
3. Require Backend CI to pass lint, service tests, Firebase Rules tests, and
   the production dependency audit.
4. Require the frontend preview workflow to pass the full frontend suite,
   production build, bundle budget, Firebase provider check, public browser
   tests, and authenticated licensed-customer tests.
5. Confirm the workflow inserts the unique Firebase preview URL into the
   frontend pull-request description.
6. Review the preview as a signed-out visitor, licensed customer, customer
   administrator, and platform owner as applicable to the change.
7. Stop if the preview is missing, displays a provider page, exposes an
   internal error, loses licensed data, or crosses a role or organization
   boundary.

## Dependency-safe merge and deployment

1. Merge the backend pull request into `main` first.
2. Wait for both Backend CI and **Deploy Firebase Backend from Main** to finish.
3. Confirm deployed API health, owner access before and after deployment,
   refreshed access projections, and the Stripe Test customer gate.
4. Rerun the frontend preview workflow when the frontend depends on the newly
   deployed backend. Require every preview check to pass again.
5. Review the same preview URL after the rerun and record owner approval.
6. Merge the frontend pull request into `main`.
7. Wait for **Deploy Firebase Hosting from Main** to finish, including its
   pre-deployment tests, deployed browser tests, authenticated journey, and
   two-hostname check.
8. Delete the short-lived remote branches only after both releases are
   verified. Keep local history until release evidence is recorded.

## Production verification

- [ ] Backend health returns a successful `status: ok` response.
- [ ] `https://www.harpervanceqa.com` and `https://harpervanceqa.com` both
      serve the same Harper Vance application over HTTPS.
- [ ] Client login, MFA challenge, licensed analytics, and logout work.
- [ ] The platform owner can open Customer Organizations.
- [ ] A normal customer cannot open platform administration.
- [ ] The approved Terms and Privacy versions display correctly.
- [ ] No internal Firebase error, secret, raw provider response, or customer
      record appears in the browser or workflow evidence.
- [ ] Both local repositories are clean and current with GitHub `main`.

## Stop and rollback

Stop immediately for owner lockout, failed health, missing licensed data,
cross-customer access, payment disagreement, failed authenticated coverage,
wrong legal version, Site Not Found, or either hostname failing.

Use reviewed revert pull requests. Revert a failing frontend first when it
depends on backend behavior that must remain available. Revert the backend
after dependent frontend behavior is safely removed. Do not reset `main`,
force-push, weaken access controls, edit Firebase records directly, or create a
replacement Firebase project to bypass the provider incident.

## Release evidence

Record both pull-request links, both merge commits, workflow run links, preview
URL, local certification result, owner approval, production verification time,
and any rollback decision in the approved release record. Do not place
credentials or customer data in that record.

