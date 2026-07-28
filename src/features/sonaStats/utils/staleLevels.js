/**
 * @fileoverview Stale-level filtering for the live "Stale Levels In Range"
 * panel on the SONA Targets page.
 *
 * A "stale level" is an unreached target from a prior session that (a) is
 * still open (no post-hoc resolution), (b) sits within a proximity band of
 * the current live price, and (c) passes the directional gate — bull targets
 * only surface when price is at or below the level (still approaching from
 * beneath), bear targets only when price is at or above.
 *
 * All constants exported here are the source of truth for the panel; do not
 * hardcode elsewhere.
 */

import { BULLISH_COLOR } from './sonaStatsConstants';

/**
 * Trading sessions of history to consider when building the stale-level pool.
 * Small by design — the panel is a "recent unresolved levels" feature, not
 * an archive browser. Rolling window; sessions older than this drop out.
 *
 * @type {number}
 */
export const STALE_LEVELS_WINDOW_SESSIONS = 6;

/**
 * Maximum distance in points between current price and a stale level for it
 * to be surfaced in the panel. Chosen to match the original product spec
 * (NQ 100pts ≈ 0.4% at current price ranges).
 *
 * @type {number}
 */
export const STALE_LEVELS_PROXIMITY_POINTS = 100;

/**
 * When true, a stale bull target is only surfaced if current price is at or
 * below its level (approach direction matches); bear targets only when at or
 * above. Cuts noise from price passing through a level and moving away.
 *
 * @type {boolean}
 */
export const STALE_LEVELS_DIRECTIONAL_GATE = true;

/**
 * Returns true if a target is bullish, based on its backend colorHighlight.
 *
 * @param {Object} target - Single target from engulfingCandleList
 * @returns {boolean}
 */
const isBullishTarget = (target) => target.colorHighlight === BULLISH_COLOR;

/**
 * Filters a pool of unreached targets down to the subset that qualifies as a
 * stale level in range of the current price.
 *
 * Each surviving target is decorated with derived display fields:
 *   - `direction` — 'bullish' | 'bearish'
 *   - `targetPriceNum` — targetPrice parsed as a number
 *   - `distancePoints` — absolute distance in points from currentPrice
 *   - `approaching` — true when direction and price relation match the gate
 *
 * @param {Object[]} targets - Unreached targets (`targetReached !== true`)
 * @param {number|null} currentPrice - Latest observed NQ price
 * @param {Object} [options]
 * @param {number} [options.proximityPoints=STALE_LEVELS_PROXIMITY_POINTS]
 * @param {boolean} [options.directionalGate=STALE_LEVELS_DIRECTIONAL_GATE]
 * @returns {Array<Object>} Sorted ascending by `distancePoints`
 */
export const filterStaleLevelsInRange = (
  targets,
  currentPrice,
  {
    proximityPoints = STALE_LEVELS_PROXIMITY_POINTS,
    directionalGate = STALE_LEVELS_DIRECTIONAL_GATE,
  } = {}
) => {
  if (!Array.isArray(targets) || currentPrice === null || currentPrice === undefined) {
    return [];
  }

  const price = Number(currentPrice);
  if (!Number.isFinite(price)) return [];

  const decorated = [];

  for (const target of targets) {
    const targetPriceNum = parseFloat(target.targetPrice);
    if (!Number.isFinite(targetPriceNum)) continue;

    const distancePoints = Math.abs(targetPriceNum - price);
    if (distancePoints > proximityPoints) continue;

    const bullish = isBullishTarget(target);
    const direction = bullish ? 'bullish' : 'bearish';

    // Approaching = price moving toward the level from the "correct" side.
    // Bull target = expected up-move → approach from below (price ≤ level)
    // Bear target = expected down-move → approach from above (price ≥ level)
    const approaching = bullish ? price <= targetPriceNum : price >= targetPriceNum;

    if (directionalGate && !approaching) continue;

    decorated.push({
      ...target,
      direction,
      targetPriceNum,
      distancePoints,
      approaching,
    });
  }

  decorated.sort((a, b) => a.distancePoints - b.distancePoints);
  return decorated;
};
