# Harper Vance Dashboard Capability Matrix

## Purpose

This document records what the current client dashboard actually provides so the landing page can describe the product accurately. It is based on the frontend code reviewed on October 7, 2026.

## Confirmed client experience

| Dashboard area | What the client can review | Public-safe description |
| --- | --- | --- |
| Today's Targets | Current and unresolved targets, original direction and price, issue time, resolution time, retraction, session status, and recorded outcome | Review current and unresolved targets with their original issue details, live session status, and recorded outcomes. |
| Daily Performance | Complete daily target log, session context, session replay, hit rate, timing, retraction, direction, session-period behavior, and metric definitions | Examine the complete daily target record, including session replay, timing, retraction, and session-period behavior. |
| Weekly Summary | Weekly outcomes, timing, retraction patterns, day-by-day variation, direction and session comparisons, late-resolution analysis, and recent weekly trends | Review week-level outcomes, timing, retraction patterns, daily variation, and sample-aware comparisons. |
| Historical & Rolling | Selectable recent-history windows, rolling accuracy, directional behavior, streak context, and daily records linked to the full daily view | Compare rolling trends, directional behavior, and day-by-day records across retained history. |

## Confirmed product safeguards

- The dashboard identifies partial weeks and small samples.
- Missing daily records are excluded rather than presented as zero-performance days.
- If a weekly aggregate is unavailable, the dashboard can calculate a summary from available daily records and clearly label the fallback.
- Open targets are shown as unresolved after the session closes.
- Metric definitions and methodology notes are available in the product.
- Historical analysis can be viewed over recent 10-, 20-, or 40-trading-day windows.

Public-safe supporting statement:

> Partial periods, small samples, unresolved targets, and unavailable aggregates remain visible so teams can interpret the record with its limitations intact.

## Access and license findings

| Item | What the code confirms | Landing-page treatment |
| --- | --- | --- |
| Authentication | All dashboard routes require a signed-in client | Describe the dashboard as secure and authenticated. |
| Dashboard views | Every authenticated client can currently access all four dashboard views | Present the four views as part of the shared offering unless commercial policy changes. |
| Tier controls | The frontend does not restrict dashboard views by license tier | Do not imply that a dashboard view is unlocked only by a higher tier. |
| History limits | The interface offers 10-, 20-, and 40-trading-day views | Keep contract-level retention terms in pricing, but do not claim the frontend itself enforces them. |
| API and webhooks | Not implemented in this frontend repository | Keep as commercial delivery options only after confirming the service outside this codebase. |
| Email, Slack, and Teams | Not implemented in this frontend repository | Keep as commercial delivery claims only after confirming the service outside this codebase. |

## Details that should remain off the landing page

- The internal chart interval and related storage paths.
- Exact recent percentages or isolated best-day results.
- Win/loss language that makes the product sound like a retail signal service.
- Browser notifications, because the available notification code is not connected to the production dashboard flow.
- The stale-levels panel, because it is disabled by default.
- Claims of an immutable record, tier enforcement, or feature availability that the reviewed frontend does not prove.

## Messaging boundary

The landing page should sell an authenticated intelligence record that helps professional trading, research, and oversight teams evaluate target behavior over time. It should not present Harper Vance as an execution system, trading recommendation service, or performance promise.
