/**
 * Pulls the leading number out of a stat string like "91.7% Accuracy",
 * "3.0 mins", "18.4 pts", or a raw number. Returns null when unparseable.
 *
 * @param {string|number} v
 * @returns {number|null}
 */
export const parseLeadingNumber = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const m = v.match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
};

/**
 * Builds a tile comparison line ("this week vs the recent baseline") for the
 * KpiTile `comparison` prop. Color (tone) reflects favorability, not direction:
 * for retraction "deeper" is neither good nor bad, so pass `neutral: true`.
 *
 * Returns null when either value is missing, so the caller simply omits the
 * comparison rather than showing a meaningless delta.
 *
 * @param {Object} args
 * @param {string|number} args.thisWeek - This week's value (string or number)
 * @param {string|number} args.baseline - The 20-session baseline value
 * @param {string} args.unit - Unit shown in the line (e.g. "pts", "min")
 * @param {boolean} [args.betterWhenHigher=true] - Whether a higher value is favorable
 * @param {boolean} [args.neutral=false] - Force neutral (grey) tone
 * @param {string} [args.refLabel='20-session avg'] - What it is compared against
 * @returns {{ text: string, direction: ('up'|'down'|null), tone: ('positive'|'negative'|'neutral') }|null}
 */
export const buildComparison = ({ thisWeek, baseline, unit, betterWhenHigher = true, neutral = false, refLabel = '20-session avg' }) => {
  const a = parseLeadingNumber(thisWeek);
  const b = parseLeadingNumber(baseline);
  if (a === null || b === null) return null;

  // "%" reads better with no space between number and unit; every other unit
  // uses a space (e.g. "14.6 pts", "4.3 min").
  const fmt = (n) => (unit === '%' ? `${n.toFixed(1)}%` : `${n.toFixed(1)} ${unit}`);
  const baselineLabel = fmt(b);

  const delta = a - b;
  const mag = Math.abs(delta);

  if (mag < 0.05) {
    return { text: `in line with ${refLabel} (${baselineLabel})`, direction: null, tone: 'neutral' };
  }

  const direction = delta > 0 ? 'up' : 'down';
  let tone = 'neutral';
  if (!neutral) {
    const favorable = betterWhenHigher ? delta > 0 : delta < 0;
    tone = favorable ? 'positive' : 'negative';
  }

  return { text: `${fmt(mag)} vs ${refLabel} (${baselineLabel})`, direction, tone };
};

/**
 * Comparison for whole-number counts (e.g. targets created/hit). A fractional
 * delta against a per-week average ("0.8 targets") reads as nonsense, so this
 * shows the rounded typical-week figure and lets the tile's own value carry the
 * actual count. Higher is treated as favorable.
 *
 * @param {Object} args
 * @param {string|number} args.thisWeek - This week's count
 * @param {string|number} args.baselinePerWeek - Recent average per week (may be fractional)
 * @param {string} [args.refLabel='a typical week']
 * @returns {{ text: string, direction: ('up'|'down'|null), tone: ('positive'|'negative'|'neutral') }|null}
 */
export const buildCountComparison = ({ thisWeek, baselinePerWeek, refLabel = 'a typical week' }) => {
  const a = parseLeadingNumber(thisWeek);
  const b = parseLeadingNumber(baselinePerWeek);
  if (a === null || b === null) return null;

  const typical = Math.round(b);
  if (Math.round(a) === typical) {
    return { text: `in line with ${refLabel}`, direction: null, tone: 'neutral' };
  }
  const direction = a > typical ? 'up' : 'down';
  const tone = direction === 'up' ? 'positive' : 'negative';
  return { text: `vs ${typical} in ${refLabel}`, direction, tone };
};
