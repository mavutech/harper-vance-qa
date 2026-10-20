# Authoritative sales journey plan

Approved October 19, 2026 following owner reconciliation. This checklist supersedes earlier sales-phase instructions; historical documents remain evidence, not current direction.

## Summary

One branded, understandable, working sales journey. Preserve existing design, pricing and completed assets. Promote session targets, completed-session reports and weekly statistics. No monthly-statistics or dashboard changes.

## Key points

- Request Access is the commercial action. The approved launch policy is a public excerpt and a full report delivered only after work-email verification and owner approval.
- The launch evaluation report is the corrected October 12, 2026 session, not an automatically selected latest session. Keep the buyer overview public.
- Use the actual Harper Vance logo and established navy/blue palette on connected customer pages.
- Keep refresh timing in product details and FAQ, not beneath hero buttons.
- Keep new customer copy free of em dashes.
- No production deployment, customer charge or legal acceptance without separate approval.

## Table

| Phase | Status and completion gate |
| --- | --- |
| 1 Offer and report policy | Locked: existing offer, fixed reviewed report, owner-reviewed delivery, no recurring subscription from a request |
| 2 Public excerpt | Implemented and committed. Full PDF and full-page image removed from public build. Public Git history exposure remains |
| 3 Report request journey | Backend deployed October 20. Authorized browser submission returned HTTP 201 and the email-confirmation prompt. Actual inbox receipt, verification, owner review and attachment delivery remain pending |
| 4 Buying clarity | Implemented and committed. Two-page buyer overview regenerated and visually verified; pricing and design unchanged |
| 5 Customer journey verification | Automated checks passing; live email, real test-mode checkout and activated-user acceptance remain pending |
| 6 Launch preparation | Test mailbox authorized. Owner accepted public excerpt plus gated full report as lead capture, not confidentiality. Inquiry ownership and remaining acceptance checks below still require confirmation |
| 7 Launch and freeze | Not launched. Final approval and hosted acceptance required |

## Risks with mitigations

Older hosted content is not the current candidate. Test exact deployed revisions. Local static previews are not complete backend environments. Never infer delivery, agreement acceptance or paid activation from a link or form receipt.

## Recommendations

Retain completed work. Use one shared backend page shell for branding, actual logo assets, safe fixed links and unchanged business controls. Verify source behavior and all public CTA destinations, then obtain deployment approval.

## Next steps

Complete the open gates above. Ask buyers to explain audience, offer, delivery, weekly statistics, evidence limits, pricing and purchase steps. Do not reopen accepted work for optional preferences.

### Local verification record, October 19, 2026

- Backend revision `1c054aa`: 117 test suites and 784 tests passed; changed JavaScript files passed lint; whitespace checks passed.
- Browser checks confirmed branded access and application pages, mobile application fit, Desk and Enterprise selection, and the sample link reaching the landing evidence section.
- Missing-token onboarding retains the branded header and explains why access cannot continue. These checks do not prove successful onboarding or payment.
- Read-only customer-page preview: `http://127.0.0.1:3219/pages/client-access`. The preview cannot submit applications, send emails, accept agreements or take payment.
- The supplied logo was reused unchanged. Its existing tagline spells “Quantative Analysis”; any correction requires an approved replacement asset, not a silent redesign.
- Historical status at that checkpoint: production deployment was unapproved and report gating undecided. No customer transaction or live lead-delivery test was performed.

### Subsequent decisions and evidence

- Owner approved the shared backend deployment. PR 26 merged; release run `39290301120` succeeded. All 14 public browser tests then passed against the Firebase PR 27 preview.
- Owner subsequently approved the seven-phase gated-report launch plan above. This supersedes the earlier public-full-report policy.
- Previously downloaded reports cannot be recalled. Old hosting channels and direct URLs must be checked before claiming the full report is no longer public.
- Live email testing requires an owner-designated test inbox. Inquiry ownership and response commitment must be confirmed before launch.
- No live payment, agreement acceptance, or final frontend production launch is authorized by an implementation checklist alone.

### Current readiness evidence

- Backend: 117 suites, 787 tests; full lint passes.
- Frontend: 79 suites, 456 tests passed before the deep-link fix; all 14 affected landing tests passed after it.
- Firebase security: 9 emulator suites, 87 tests pass.
- Isolated customer lifecycle and intake capacity: 2 tests pass. Stripe and email are simulated, not live delivery evidence.
- Public browser checks: all 15 passed, including direct entry to the report form/evidence. Local static pages redirect access-page checks to the deployed backend, so they do not verify the new report-delivery backend.
- Production build and bundle budget pass. Buyer PDF is two pages, visually reviewed after regenerating.
- Existing warnings: outdated browser compatibility data and test-environment navigation warning. Neither was treated as evidence of a customer failure.

### Launch operations and remaining gates

1. Confirm the inquiry owner and notification inbox. The owner has designated a mailbox for the authorized test; do not publish that address in this public repository.
2. Fixed-report backend deployment is complete with approval. Confirm the reviewed attachment's date and hash after actual receipt.
3. Test request receipt, email verification, owner review, delivery, duplicate/expired links and the report-to-access continuation. Do not substitute mock results for inbox evidence.
4. Complete approved test-mode checkout and authenticated access verification. No real charges or contract acceptance by the agent without specific authority.
5. Confirm that analytics receive the existing privacy-safe preview, request-started, submitted, access-clicked and buyer-overview events. Use verified/delivered lead records and approved access requests for later funnel stages; do not label a form receipt a sale.
6. Owner accepted the recommendation to use gating for lead capture, not confidentiality. The frontend repository is public and contains the former PDF in history. The backend repository is private. Moving current files does not revoke old commits, previous downloads, forks or cached copies. Do not rewrite history or change repository visibility without approval.
7. Check old direct PDF/image URLs on the main site and active preview channels. Updated hosting redirects the known URLs to the form/excerpt. Older channels require separate verification.
8. Final go/no-go: both deployed revisions, lead ownership, real delivery, test checkout/access and exposure decision must be recorded before outreach.

### Live verification record, October 20, 2026

- Backend PR 27 merged at `8cdee713b41fb13e9495a23457d60bb64c03679e`. Deployment run `39370508970` succeeded, including backend tests, security-rule tests, production dependency audit and API health.
- The initial authorized preview submission failed because its exact Firebase origin was missing from the backend allowlist. Fix `4975f7b` adds only the configured Harper Vance preview origin with a constrained validation check. No wildcard origin access was added.
- After deployment, the preview preflight returned HTTP 204 with the exact allowed origin. The API health response was successful.
- One subsequent browser submission of the clearly labeled internal test returned HTTP 201 and displayed the email-confirmation prompt. This proves request acceptance, not inbox receipt or PDF delivery. Do not create duplicate test requests while awaiting confirmation.
- The owner was asked to confirm receipt and click the verification email. Owner review and delivery must be tested after that step.
- Latest frontend revision `7413a64`: all 79 suites and 456 tests passed again. The existing simulated-browser navigation warning remains; actual browser navigation to the business application succeeded.
- The refreshed preview displays Request Access as the primary action, a historical excerpt, the full-report request form and the public buyer overview. The known old PDF URL redirects to `/#sample` on this preview.
- The same old PDF path on the main Firebase and custom domains returned HTML, not a PDF, but did not use the candidate's explicit redirect. Main frontend deployment and older hosting-channel checks remain open.
- Billing remains configured for live payments. Configuration checks are not checkout evidence. No charge, billing-mode switch, agreement acceptance or customer subscription was performed.
- Launch status: hold for inbox verification, owner-reviewed report delivery, payment/access acceptance, analytics receipt and final frontend release approval. Preserve the agreed design and copy while closing these gates.

### Rollback and freeze

- Stop launch if the form, delivery, application, payment-state handling or access checks fail.
- Do not restore a frontend version that republishes the full report as a casual rollback. Roll forward a scoped repair or deploy a sanitized known-good version.
- Do not silently revert the backend to latest-session delivery while the page promises October 12. Keep the offer and actual attachment aligned.
- Do not delete leads, alter billing settings, accept agreements or change customer access as a rollback shortcut.
- Once accepted, freeze design and sales copy. Reopen only for a demonstrated defect, inaccurate claim, or agreed buyer evidence.

### Email reliability repair checkpoint, October 20, 2026

The owner reported that the original confirmation email never arrived. Its old
`sent` status is not inbox evidence. The root cause of that missing message is
still unconfirmed. The approved repair preserves the existing sales design,
offer, sender account, report approval and payment controls.

| Repair phase | Evidence and status |
| --- | --- |
| 1 Delivery tracking | Backend commit `797dea6`: restricted acceptance receipts, message reference, numeric SMTP response, safe failure code and uncertain outcomes |
| 2 Sender configuration | Backend commit `577832c`: explicit sender and secure SMTP settings. Existing effective port 587 made explicit; connection, TLS and authentication verified without sending a message |
| 3 Recovery | Backend commit `af303da`: existing-request resend, cooldown, attempt cap, concurrent-send reservation and token replacement |
| 4 Customer and owner feedback | Backend `fc96871`, frontend `171ccf6`: localized recovery action, owner diagnostics and timeout-safe feedback. Renewed links are protected from expiry-cleanup races |
| 5 Actual delivery | Backend repair deployed. One tracked recovery email accepted by the mail server; actual inbox receipt and verification await owner confirmation |
| 6 Launch acceptance | Local checks pass, but real inbox receipt, owner review, report attachment delivery, checkout/access and analytics receipt remain unverified |
| 7 Release and freeze | Not launched. Do not bypass release checks or treat the frontend preview as a working deployed recovery endpoint until backend release succeeds |

#### Additional verification

- Latest full backend run: 120 suites and 817 tests pass; full lint passes.
- Latest full frontend run: 80 suites and 463 tests pass. The existing simulated
  browser navigation warning does not replace the real-browser checks.
- The new backend mail/configuration/recovery modules have 98.73% line coverage
  and 88.75% branch coverage.
- Three emulator-backed lifecycle tests pass, including concurrent report
  recovery, old-link rejection and newest-link verification. Email and payment
  providers are simulated in these tests.
- All nine security-rule suites, 87 tests, pass.
- Production frontend build and bundle budget pass.
- Recovery disclosure inspected in a real browser at desktop and 390-pixel
  mobile widths. No local form was submitted to a live service.
- The support link reuses the existing configured address; mailbox ownership
  and receipt must still be confirmed as part of launch operations.

#### Resume point

The owner resolved the GitHub billing restriction. Backend PR 28 checks passed
on rerun `39374219905`. PR 28 merged at
`afcd9726b0fbcf283508933852c4d1680de66100`, and deployment `39382838210`
succeeded. The API health check and exact preview-origin preflight passed.
The new existing-request lookup index reached READY. The deployed service has
an explicit sender and the corrected SMTP port secret version.

One recovery submission from the hosted preview reused the original authorized
test request at 06:58:38 UTC on October 20. Its restricted receipt records SMTP
acceptance, response 250, recipient accepted and no rejection. The attempt count
is two including the original attempt. The request remains pending verification.
The public acknowledgement correctly avoids claiming delivery.

The owner subsequently confirmed that this recovery email also did not arrive.
The old provider's acceptance did not prove delivery. The owner approved moving
website email to the existing Harper Vance Namecheap mailbox and supplied its
password through Google Cloud Secret Manager, not chat.

#### Namecheap repair, October 20

- Backend PR 29 contains branded report-confirmation, owner-review and
  report-delivery emails with matching plain text and readable fallback links.
- The main mailbox and required aliases are configured. Report email uses the
  reports alias, access email uses support, and owner notifications go to the
  shared business mailbox. No personal inbox address is published here.
- Both the staged credential and the application's complete SMTP configuration
  passed encrypted authentication checks without sending messages.
- Old secret versions are preserved for rollback. Backend commits `14567f5`,
  `40b5d40`, and `0c4c4e0` record connection verification, sender configuration,
  and the protected owner-review link.
- Lint, 121 backend suites / 824 tests, and PR CI passed. Eight existing moderate
  transitive dependency findings remain; no high-severity audit failures.
- Namecheap SPF, MX and DKIM records are present. DMARC policy remains absent.
  DNS records alone do not prove recipient-side authentication or delivery.
- Backend PR 29 merged at `8119280`; deployment `39388095068` succeeded.
  Active revision `sonadashboard-00014-zid` has the verified Namecheap settings.
  The API health check passed.
- One recovery was submitted through the hosted landing-page form at
  `2026-10-20T07:44:52.469Z`. Namecheap accepted the recipient and message with
  response 250. The page correctly avoided claiming inbox delivery.
- The existing test request now has three attempts and is pending verification.
  The owner was asked to confirm actual receipt and use the newest link.
  Do not reset the attempt cap, create a duplicate lead, or repeatedly resend.
- Actual inbox receipt, verification, owner approval, attachment receipt and
  report-to-access continuation remain open. Checkout/access, analytics and
  final frontend release gates also remain open. No sales redesign, customer
  charge, or final frontend launch is part of this repair.
