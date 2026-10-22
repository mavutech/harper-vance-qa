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

## Phase 1 — Message hierarchy

Lead with the buyer's ability to follow and evaluate targets in one dashboard. Explain delivery in this order: intraday targets/status, daily statistics, daily email, weekly dashboard reports, licensed historical/rolling analysis. Retain the existing research-first headline and the buyer's control over trading decisions.

| Deliverable | Consistent language |
|---|---|
| Intraday | Targets and status in the dashboard; checks every 60 seconds |
| Daily | Daily performance statistics in the dashboard; completed-session report by email |
| Weekly | Weekly reports and statistics viewed in the dashboard; no weekly report download |
| History | Historical and rolling analysis within licensed history |
| Evaluation | One historical session sample PDF; separate from subscription access |
| Integrations | Licensed API access to data; distinct from report downloads |

Keep Request Access as the primary action. The hero's secondary action becomes See What's Included and points to the existing product section. Add marketing_product_explored through the existing trackEvent utility so this action is not misreported as a report preview. Sample-request analytics retain their existing meaning. No visitor details are added to events.

## Phases 2–5 — Completed

- Hero now names dashboard access, daily/weekly statistics, history, and daily email. Secondary action links to the product section with its own centralized event.
- Existing product and dashboard sections explain the delivery split without adding another large section.
- Licensing, FAQ, footer, and landing search description now distinguish daily email from dashboard-only weekly reports and licensed API data.
- Historical daily sample remains available through the existing reviewed request flow and is explicitly separate from subscription access.
- Landing feature checks: 21 tests passed. Production build passed with existing warnings in customer-admin hooks and an outdated Browserslist database.

## Phase 6 — Decision needed before implementation

No public ten-week data source was found. Protected stats must remain protected. Backend weekly generation has both `targetAccuracyOverall` (pooled reached / created) and legacy `targetAccuracySum` (mean of daily rates). The dashboard's WeeklyKpiCards correctly leads with the pooled field. Its weekly fallback also calculates a pooled rate, but available records alone do not establish complete session coverage.

`getWeeklyStatList` currently filters missing daily documents out. A public table therefore cannot treat the stored aggregate alone as evidence of a complete week. Public publication needs reconciled daily counts, explicit missing/zero-target session handling, unresolved/excluded counts, and approved summary fields. No sample or fabricated performance data has been added.

Pending choice: proceed with a backend-supported, validated public summary feed using the pooled rate and explicit completeness checks, or defer the ten-week table and finish the homepage clarity release first. Backend publication work goes beyond copy edits and needs an explicit decision about the data boundary. Phases 7–8 remain open until that choice and final desktop/mobile review.
