# Missed Target Resolution — Data Contract

**Phase 0 deliverable.** Documents the Firebase RTDB schema and definitions the
frontend will consume when surfacing "eventual resolution" analytics for missed
SONA targets.

**Status:** Field shapes confirmed against `goldensetups-dev`. Definitions of
`thresholdMin`, `share`, `windowSessions`, `minSample` require sign-off from
the backend author (`lateResolverStats` generator).

---

## Source paths

| Path | Purpose |
|---|---|
| `/stats/nq/5m/daily/{YYYY-MM}/{DD}/lateResolverStats` | Per-day resolution aggregate |
| `/stats/nq/5m/weekly/{YYYY}/{weekNumber}/lateResolverStats` | Per-week resolution aggregate |
| `/stats/nq/5m/daily/{YYYY-MM}/{DD}/engulfingCandleList` | Per-target detail (source of "unreached list") |
| `/stats/nq/5m/daily/{YYYY-MM}/{DD}/historyTargetsUnreached` | Human-readable summary string only — not a data source |
| `/stats/nq/5m/daily/{YYYY-MM}/{DD}/historyTargetsReached` | Human-readable summary string only — not a data source |

---

## `lateResolverStats` — top-level shape

```json
{
  "groups":         { ... },
  "minSample":      8,
  "thresholdMin":   5,
  "share":          92.6,
  "totalLate":      126,
  "totalTargets":   136,
  "windowSessions": 19
}
```

### Meta fields (needs backend confirmation)

| Field | Observed values | Working definition | Confirmed? |
|---|---|---|---|
| `minSample` | Constant `8` | Minimum sample size before a group's rate is considered meaningful. Groups with `n < minSample` should be shown with a "low sample" indicator, not a headline percentage. | Needs backend confirmation |
| `thresholdMin` | Constant `5` | Minutes after target creation. A target is classified as "late" if it did not resolve within this window (i.e., needs cross-session resolution to hit). | Needs backend confirmation |
| `share` | 88.9 – 100 | Percentage of `totalTargets` that met the "late" criterion (`totalLate / totalTargets * 100`). Verified against sample data. | Verified from data |
| `totalLate` | 55 – 128 | Count of targets in the rolling window meeting the late criterion. | Verified from data |
| `totalTargets` | 55 – 144 | Count of all targets in the rolling window (late or not). | Verified from data |
| `windowSessions` | 10 – 20, growing over time | Number of prior sessions included in the rolling aggregate. Appears to grow session by session, presumably up to a cap. | Needs backend confirmation — what is the cap? |

---

## `lateResolverStats.groups`

Nine groups per document. Group naming convention: `direction` or `direction|session`.

| Group key | Meaning |
|---|---|
| `all` | All late targets |
| `bullish` | Late bullish targets |
| `bearish` | Late bearish targets |
| `bullish\|morning` | Late bullish targets from the morning session |
| `bullish\|midday` | Late bullish targets from the midday session |
| `bullish\|afternoon` | Late bullish targets from the afternoon session |
| `bearish\|morning` | Late bearish targets from the morning session |
| `bearish\|midday` | Late bearish targets from the midday session |
| `bearish\|afternoon` | Late bearish targets from the afternoon session |

Session cutoffs (morning / midday / afternoon) are backend-defined. Need
confirmation of the exact clock boundaries.

### Group fields — always present

```json
{
  "eventualHitRate": 4.1,
  "hits":            5,
  "n":               123,
  "neverResolved":   118
}
```

| Field | Type | Meaning |
|---|---|---|
| `eventualHitRate` | number | Percentage (0–100). `hits / n * 100`, rounded to 1 decimal. |
| `hits` | integer | Number of late targets in the group that were eventually resolved. |
| `n` | integer | Group sample size. |
| `neverResolved` | integer | `n - hits`. Targets still open. |

### Group fields — present only when `hits > 0`

When a group has at least one resolved target, the following percentile block
is added. When `hits === 0`, these fields are **absent** — client code must
handle both shapes.

```json
{
  "maxRetraction":    56.3,
  "meanRetraction":   34.9,
  "medianRetraction": 35.8,
  "p25Retraction":    24.8,
  "p75Retraction":    42.8,
  "p90Retraction":    50.9,
  "maxTimeMin":       30,
  "meanTimeMin":      21,
  "medianTimeMin":    25,
  "p90TimeMin":       28
}
```

| Field | Type | Unit | Meaning |
|---|---|---|---|
| `maxRetraction` | number | points | Largest retraction distance across resolved targets in group. |
| `meanRetraction` | number | points | Mean retraction across resolved targets. |
| `medianRetraction` | number | points | Median retraction. |
| `p25Retraction` | number | points | 25th percentile retraction. |
| `p75Retraction` | number | points | 75th percentile retraction. |
| `p90Retraction` | number | points | 90th percentile retraction. |
| `maxTimeMin` | number | minutes | Longest time-to-resolve. |
| `meanTimeMin` | number | minutes | Mean time-to-resolve. |
| `medianTimeMin` | number | minutes | Median time-to-resolve. |
| `p90TimeMin` | number | minutes | 90th percentile time-to-resolve. |

Note: absence of `p25TimeMin` and `p75TimeMin` — asymmetric with retraction
fields. Backend author should confirm this is intentional.

---

## `engulfingCandleList` — per-target shape (Feature B source)

Array of target objects on each daily doc. Relevant fields for the "stale
levels in range" panel:

```json
{
  "alertId":                "m56yeidm",
  "alertDate":              "12/27/2024",
  "title":                  "NQ1! 5m Bearish Target",
  "colorHighlight":         16711680,
  "dateTimestamp":          "1735315800",
  "entryPrice":             "21541.25",
  "targetPrice":            "21538.25",
  "high":                   "21580.5",
  "low":                    "21538.25",
  "targetDistancePoints":   3,
  "targetReached":          true,
  "targetReachedTimestamp": 1735318200,
  "targetReachedDuration":  "40 mins",
  "retractionPoints":       113,
  "dayContext":             { "session": { "open": "09:30", "close": "16:00" } }
}
```

### Feature B derivation rules

- **Unreached filter:** `t.targetReached !== true`
- **Direction:** `colorHighlight === 16711680` → bearish, `colorHighlight === 7004928` → bullish. Backup: parse `title` for "Bullish" / "Bearish".
- **Price level:** `targetPrice` (string — parse to float).
- **Age:** derived from `dateTimestamp` (unix seconds, string).
- **Session lookback window:** match `lateResolverStats.windowSessions` from the most recent daily doc so Feature B and Feature A stay consistent.

---

## Human-readable summary strings (do not consume)

`historyTargetsUnreached` and `historyTargetsReached` are pre-formatted display
strings written by the backend for legacy display purposes.

Example:
```
"(1) NQ1! 5m Bullish Target - 21535.75, (2) NQ1! 5m Bearish Target - 21543.5, ..."
```

Fragile to parse. Missing timestamps, IDs, and resolution info. **Do not use as
a data source.** Use `engulfingCandleList` filtered on `targetReached !== true`.

If UX ever needs a display string, generate it client-side from structured
data.

---

## Retention

- Daily docs retained back to at least `2024-12`. Full retention policy needs
  backend confirmation.
- Weekly docs available for years `2024`, `2025`, `2026`.
- Weekly week keys are ISO week numbers (verified: week `51` of 2024 exists).

---

## Open questions for backend author

1. What is the cap on `windowSessions`? Data shows it growing 10 → 20; is
   there a maximum?
2. What exactly does `thresholdMin: 5` mean — minutes since target creation,
   or minutes since session close, or something else?
3. What are the clock boundaries for the `morning`, `midday`, `afternoon`
   session splits?
4. Is `share = totalLate / totalTargets * 100` correct? Any edge cases?
5. Why do time fields include `p90TimeMin` but not `p25TimeMin` / `p75TimeMin`?
   Intentional?
6. What retention window applies to daily and weekly docs?
7. Is `generatorVersion` bumped whenever `lateResolverStats` semantics change?
   If yes, frontend can key display copy off it for backward compatibility.

---

## Frontend consumption plan

### Feature A — Weekly Resolution Section

Data source: `stats/nq/5m/weekly/{year}/{weekNumber}/lateResolverStats`
(already fetched by existing `fetchWeeklyStats` thunk — extract and pass
through).

Fallback: aggregate daily `lateResolverStats` across the week if weekly doc
missing.

### Feature A — Daily Compact Card

Data source: `stats/nq/5m/daily/{YYYY-MM}/{DD}/lateResolverStats` (already
fetched by existing `fetchDailyStats` thunk).

### Feature B — Stale Levels In Range (live)

Data source: last N daily docs' `engulfingCandleList`, filtered
`targetReached !== true`, cross-referenced against live price from the
existing live-targets subscription. N = `windowSessions` from the most
recent daily doc.

Fetched once on live-page mount (bounded, small payload), not subscribed.
Refresh on session date change.
