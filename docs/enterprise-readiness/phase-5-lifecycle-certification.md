# Phase 5: Frontend lifecycle certification

## Scope

The frontend Phase 5 gate proves that a normal invited customer can use the
licensed dashboard and that the platform owner can operate the customer
lifecycle through Customer Organizations.

The authoritative test procedure and evidence checklist live in the paired
backend repository at
`docs/enterprise-customer-control/phase-5-lifecycle-certification.md`.

## Frontend controls

| Control | Expected behavior | Status |
| --- | --- | --- |
| Canonical login | Existing customers use `/login`. | Automated test passed |
| Invitation acceptance | New customers use `/pages/accept-invite` with a one-time invitation. | Automated test passed |
| Invitation-only signup | Legacy template signup URLs redirect to the public site. | Automated test passed |
| Platform administration | Customer Organizations is visible only to `super_admin`. | Automated test passed |
| Safe return path | Login returns only to an approved internal path. | Automated test passed |
| Customer errors | Product failures use safe copy and never expose Firebase paths. | Automated tests passed |
| Mobile presentation | Login, invitation, dashboard, and administration flows remain usable on mobile. | Pending live walkthrough |

## Preview rule

Every review action in the Firebase preview uses the shared development
backend. Use only the disposable Phase 5 organization and identity. Do not
create or modify a real customer record from the preview.

## Current verification

- 54 frontend test suites and 324 tests pass.
- The production build succeeds.
- The Firebase pull-request preview must pass before live acceptance begins.
- The frontend pull request remains unmerged until owner approval.
