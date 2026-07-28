# SONA Weekly — Roadmap

Tracks the weekly stats feature work. Phases 0–3 shipped the parity pass
(weekly on par with daily) plus a dark-mode tooltip fix. Phase 4+ captures the
remaining work to turn the page from *descriptive* into an *entry-prediction*
tool, where retraction drives the suggested entry.

## Shipped

- **Phase 0** — Extracted a shared `KpiTile` component (icon, value, secondary
  lines, click/tap explainer) used by both the daily and weekly pages.
- **Phase 1** — Corrected the weekly headline numbers: accuracy now uses the
  volume-weighted `targetAccuracyOverall` (not the simple daily average), and
  the time tile leads with the pooled median (`targetMedianTimeWeek`). The
  Week-over-Week trend chart was switched to the same volume-weighted figure.
- **Phase 2** — Added the retraction story to weekly: Typical Pullback (median),
  Deepest Pullback (max), Ran Straight to Target (% within 10 pts), plus
  Best/Worst Day. All read straight from the weekly doc.
- **Phase 3** — Plain-language explainer popovers on every weekly tile, and a
  coverage / small-sample flag ("based on N of 5 sessions", "n=… small sample")
  derived client-side from the daily docs already fetched.
- **Tooltip fix** — Shared `utils/chartTheme.js` so ApexCharts tooltips follow
  the active skin; resolves white-on-white tooltips in dark mode across all SONA
  charts.

## Phase 4+ — Entry prediction (not started)

The three legs are now visible: target (where), hit rate (odds), retraction
(entry zone). These items make the entry zone actionable.

1. **Distance → level.** Render retraction as an actual entry level, not just a
   distance ("Target 21,450; typical entry ≈ 18 pts into the pullback"). Needs
   per-target direction (backend already stores it). Primarily a daily /
   per-target feature; weekly shows the aggregate distance. *(~2–3 days)*
2. **Retraction distribution (p25/median/p75).** Biggest gap for entry choice —
   lets a trader pick a conservative vs aggressive entry. Daily has it
   (RetractionProfile); the weekly doc carries only avg/median/max. Cheap
   backend add — the weekly generator already loops every hit row. *(~½–1 day)*
3. **Fill-vs-miss curve.** For a chosen entry depth, what % of hits would have
   filled and what was their hit rate? Removes the arbitrary 10-pt threshold and
   is the real optimization (deeper entry = better price, fewer fills).
   Computable client-side from the daily per-target rows, or in the backend.
   *(~1 day)*
4. **Does depth predict the outcome?** Apply the distance-vs-hit-rate idea to
   retraction: when price pulls back deeper, is it still likely to reverse and
   hit? Validates the whole strategy. *(analysis + feature)*
5. **Split entry zone by direction.** Bullish vs bearish targets may retrace
   differently; the weekly aggregate currently blends them. *(~½ day backend)*

Suggested next: items 2 and 3 together — they turn "here's the typical pullback"
into "here's the entry that fills most often and still hits."
