# Buyer positioning preview and comparison

## Summary

October 29, 2026. The existing landing page now explains how Harper Vance fits alongside a professional NQ team's current tools and how to select a license by intended use. This is a focused wording improvement, not evidence of superior research, a new product capability, or demonstrated sales lift.

Preview: https://harpervanceqa-dev--buyer-positioning-20261029-eg5aoz1e.web.app/

Preview expires November 5, 2026. Baseline: https://harpervanceqa-dev.web.app/ as inspected October 29. Product change commit: `f33ae01`, on `codex/first-five-evaluation-kit`. No merge, Git push, or live-channel deployment occurred.

## Key points

- Preserve the existing headline, layout, styling, logo, feature cards, screenshots, video, evidence, and access-request actions.
- Improve supporting copy in existing sections and add one question to the existing FAQ.
- Keep prices, plan limits, legal terms, setup conditions, form behavior, and product functionality unchanged.
- No private September research export was uploaded. The existing historical excerpt and governed sample-request flow remain unchanged.
- The buyer overview PDF was regenerated because its integrity check includes the landing copy source. Its visible scope and commercial content remain unchanged; both pages were checked.

## Table

| Location | Before | After | Assessment |
| --- | --- | --- | --- |
| Hero supporting paragraph | “Follow live NQ targets, compare their behavior with historical results, and review each session in one dashboard. Built for professional trading desks and research teams.” | “Follow live targets with historical context, then review timing, pullbacks, and misses in one dashboard. For professional NQ desks and research teams evaluating target behavior alongside their existing tools.” | More explicit audience and review task. Incremental improvement; the original headline was already clear and remains unchanged |
| Existing problem section heading | “You need more than a target. You need to understand what follows.” | “Keep your charts. Add a target record you can examine.” | Strongest improvement: directly addresses the buyer who already has tools, without requiring replacement or claiming competitors lack records |
| Existing problem section emphasis | “Use a shared record to decide whether the research fits your process.” | “Judge the research by the complete record, not just the targets that hit.” | Gives a concrete evaluation principle. The nearby excerpt remains explicitly labeled as an excerpt |
| Dashboard introduction | “Explore the dashboard views below. Each answers a different question about target behavior.” | “Inspect an open target during the session, review its recorded outcome afterward, then compare results across days and months. The examples below show each part of that workflow.” | Makes the relationship between views explicit. Existing dates still distinguish separate examples |
| Evidence introduction | “Follow one recorded session from target to outcome. Inspect both reached and unreached targets, then request the complete daily report if useful.” | “Start with the reached and unreached examples below. Request the complete daily report to inspect the session, then assess whether the record answers questions your team needs to review. One session is a starting point, not proof of typical results.” | Connects evidence to buyer usefulness. Longer than before, but preserves the necessary sample limitation |
| Pricing introduction | “Choose by team size, history, integrations, and internal-use rights. The core dashboard research is the same across plans.” | “Choose for individual review, a shared desk workflow, or licensed firm-wide use. Plans change users, history, delivery, and usage rights, not the underlying target research.” | Modest improvement: starts with intended use rather than a feature checklist. Does not establish willingness to pay |
| Core label | “Single desk” | “Individual review” | Better matches the existing one-seat allowance |
| Plan summaries | Individual dashboard/email use; team review and system connections; broad firm use | Individual target/session evaluation; shared target review with longer history and licensed report data; agreed firm-wide redistribution/access/service scope | Makes existing distinctions more concrete, without changing what is sold |
| FAQ | No direct existing-tools question | “Why use this alongside our existing tools?” | Makes the most relevant competitive objection explicit. Answer directs the buyer to evaluate fit, not accept an unsupported superiority claim |

New FAQ answer: “Harper Vance Intelligence brings its NQ targets, contextual statistics, and recorded outcomes into one review workflow. Use the dashboard walkthrough and sample report to check whether that adds something your team needs alongside its current charts and research. It does not replace your execution platform or claim better trading returns.”

## Risks with mitigations

- Feature overlap remains: these words explain fit; they do not establish exclusivity versus Edgeful, Acuity, or FoxAlgo. No new named-competitor claims or price comparisons were added.
- Stronger wording is not conversion evidence: compare actual buyer understanding and objections after an approved release. Do not promise a sales increase.
- Evidence gaps remain: independent research-quality validation, authorized integration receipt, and customer outcomes are not completed by this preview.
- Longer paragraphs can reduce scanability: desktop and 390-by-844 review found readable wrapping and no page-level horizontal overflow; no new sections were added.

## Recommendations

This is an improvement in clarity, especially for the “we already have tools” objection. It is not a dramatic repositioning or a demonstrated competitive advantage. Review the preview before release and use qualified prospect conversations to test whether the explanation identifies a real unmet need.

## Verification

- All 103 unit-test suites passed: 547 tests.
- All 25 public browser checks passed against the deployed preview, including the new FAQ, mobile navigation, access destinations, and existing evidence/report links.
- Production build passed with existing customer-admin hook-cleanup warnings and outdated Browserslist data. No warnings were introduced by the copy changes.
- Desktop and phone-width visual checks completed; temporary browser viewport override reset.
- Two-page buyer overview rendered and visually checked under the PDF workflow.
- Additional assertions confirmed unchanged prices, feature allowances, license codes, access actions, gallery records, methodology, and sample form.
- No new analytics event. The added FAQ uses the existing consent-controlled event with the static `existing_tools` question key.

## Next steps

Owner review of this preview. Merge and production release require a separate instruction. Complete integration verification and customer evidence through their own approved workflows; do not mark the full competitive-analysis recommendation complete from this wording update alone.
