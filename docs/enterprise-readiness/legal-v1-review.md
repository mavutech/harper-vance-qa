# Harper Vance legal V1 review record

## Status

Drafted October 11, 2026. The platform owner approved the V1 direction and
content on October 12, 2026. Legal-counsel review remains pending, so these
documents are not yet approved for production customer acceptance.

The paired Firebase preview completed automated tests and production build.
Mobile-width visual review confirmed the shared Harper Vance presentation,
visible draft warning, version metadata, and document readability. Legal routes
reset to the document heading so a footer link cannot preserve an old page's
scroll position.

| Document | Version identifier | Public preview route |
| --- | --- | --- |
| Terms of Service | `terms_v1_0_draft_2026_10_11` | `/terms` |
| Privacy Policy | `privacy_v1_0_draft_2026_10_11` | `/privacy` |

The contracting entity is Mavu Technology Holdings, 931 Monroe Drive,
STE A102-481, Atlanta, Georgia 30308, United States. The drafts use Georgia law
and Fulton County courts based on that address. Counsel must confirm this
choice before the draft status is removed.

## Product facts represented

- Harper Vance is an approval-only, business-to-business market-intelligence
  service.
- The service provides intraday NQ target intelligence, retained daily and
  weekly records, historical review, and tier-gated delivery integrations.
- The service is non-advisory and does not provide execution, order routing,
  performance guarantees, or fiduciary services.
- Customer organizations control authorized users and seats within the
  purchased license.
- Firebase and Google Cloud support authentication, hosting, data, functions,
  analytics, logging, and monitoring.
- Stripe hosts standard payment checkout. Harper Vance retains payment status
  and business references, not full payment-card numbers.
- Browser storage retains limited authentication display fields and user
  preferences. Market data remains outside persisted Redux state.
- Agreement proof is recorded by version and external reference. Signed legal
  documents are not uploaded into Harper Vance.

## Approval record

- Platform-owner approval: recorded October 12, 2026.
- Legal-counsel approval: pending.
- Production customer acceptance: blocked until legal-counsel approval and the
  final-version release steps below are complete.

## Counsel decisions required

1. Confirm the legal entity name, any registered trade name, notice address,
   and authority to contract under the Harper Vance brand.
2. Approve Georgia law, Fulton County venue, and the thirty-day informal
   dispute process.
3. Approve the proposed mutual liability cap, exclusions, intellectual-property
   remedy, and indemnification language.
4. Approve renewal, cancellation, refund, tax, and late-payment language for
   each order type. The draft deliberately leaves those terms controlled by the
   applicable order.
5. Confirm whether a separate data-processing addendum and public subprocessor
   list are required for the target customer base.
6. Confirm privacy-law coverage, request and appeal procedures, international
   transfer language, retention commitments, and any required state notices.
7. Decide whether Firebase Analytics requires a consent or opt-out control for
   intended visitor locations before production launch.
8. Confirm that the market-intelligence disclaimer and automated-execution
   restriction match the approved regulatory position.

## Release gate

Do not remove the visible draft notice, change the version identifiers to final,
or represent the documents as accepted until legal-counsel approval is recorded.
After counsel approval, update the effective date, preserve the approved text as
a fixed version, link the exact version from the customer order, and verify the
public routes in the Firebase preview and production.
