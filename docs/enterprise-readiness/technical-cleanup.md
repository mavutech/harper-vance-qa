# Phase 8: technical cleanup

## Outcome

The dashboard loads substantially less JavaScript before the first page can
appear, while all existing routes remain available. Release workflows also use
the supported Node 24 generation of GitHub's checkout and Node setup actions.

## Changes

- Protected product, administration, profile, template, and reference pages
  now load only when their route is opened.
- The production entry bundle decreased from about 1.19 MB gzip to about
  339 KB gzip, a reduction of roughly 71 percent.
- An automated 400 KB gzip budget now blocks future entry-bundle regressions
  in preview and production workflows.
- Route loading has an accessible status message inside the existing
  application shell.
- GitHub workflows moved from checkout and setup-node version 4 to version 5,
  which use the Node 24 action runtime. Application builds remain on Node 22.

## Safety boundary

This phase does not remove routes, change customer permissions, change
Firebase data, change billing, enable integrations, or update customer-facing
content. Route-level files are delivered on demand from the same tested build.

## Verification

Phase 8 requires:

- the complete frontend test suite;
- a successful production build and bundle-budget check;
- deployed-preview browser journeys;
- the complete backend suite, Firebase rules, lint, and dependency audit; and
- production owner, Test customer, live browser, and hostname checks after
  merge.

## Deferred cleanup

Large dependency upgrades, removal of legacy routes, and replacement of the
current build system are separate changes. They must not be bundled into this
release because each can change product behavior. Secure integration changes
also remain at the end of the enterprise-readiness sequence.
