# Dashboard clarity implementation

## Phase 0 — Standards and product review

Authorized on October 22, 2026: implement the phased homepage plan and commit each completed phase. Deployment remains a separate approval step.

The public homepage was reviewed from hero through footer, including all product FAQs and report details. Dashboard access is already described, but delivery wording is scattered and the sample PDF dominates the evaluation path.

Detected: React 18, JavaScript, React Router 6, Sass/Bootstrap, legacy Redux, Jest/React Testing Library, Playwright, centralized trackEvent analytics. This feature uses static JSON localization; retain that convention and existing components. No state-management migration or new dependencies are needed.

Standards reviewed: master instructions, react-web, localization, jsdoc, unit-tests, analytics, and security. Reuse LandingHero, LandingSections, SalesEvidenceSection, the localized catalog, and existing request routes. New interactions use the centralized tracking utility with static placement values only. Validate relevant existing tests and desktop/mobile rendering; new calculation logic requires boundary and status tests with the standards' 80% feature coverage target.

Product evidence:

- Today's Targets checks every 60 seconds (existing frontend and public FAQ).
- Backend daily reporting job: `functions/features/ecTargetStats/daily/ecTargetsStats_scheduled.js`, weekday 16:05, America/New_York. This is scheduling evidence, not a guaranteed inbox arrival time.
- Daily report window: `functions/helpers/reportSession.js`, target generation through the session close; calendar context can override the default 16:00 close.
- Every license includes daily email for verified licensed recipients, with opt-out. Keep existing seat/history limits.
- Weekly reports are dashboard-only; licensed weekly API data is a separate integration capability.
- The historical sample PDF and buyer overview are separate evaluation materials, not weekly reports.

Security boundary: preserve authentication and request approvals. Do not expose protected reports or publish raw weekly records. The ten-week section requires verified summary data and a reconciled denominator before any performance numbers can be shown.

## Remaining phases

1. Define consistent dashboard/delivery terminology.
2. Clarify the hero and its exploration action.
3. Strengthen the existing dashboard and product sections.
4. Reconcile licensing and FAQ wording.
5. Distinguish the historical sample from the subscription.
6. Add the ten-week evidence section only with verified, approved summary data.
7. Review the complete story flow.
8. Verify the build, interactions, and desktop/mobile presentation.
