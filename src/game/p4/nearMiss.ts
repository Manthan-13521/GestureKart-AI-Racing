/**
 * Near-miss detection for Survival mode.
 * A near-miss is awarded when an obstacle passes the player with
 * minimum lateral clearance < NEAR_MISS_CLEARANCE (1.5m) and no collision occurred.
 */

export const NEAR_MISS_CLEARANCE = 1.5;
export const NEAR_MISS_BASE_REWARD = 50;

/**
 * Returns true if the given minimum lateral clearance constitutes a near-miss.
 * Boundary behavior: clearance strictly less than NEAR_MISS_CLEARANCE (1.5) counts.
 * 1.49 -> near-miss, 1.50 -> not a near-miss, 1.51 -> not a near-miss.
 */
export function isNearMiss(minClearance: number): boolean {
  return minClearance < NEAR_MISS_CLEARANCE;
}

/**
 * Computes the score reward for a near-miss at the given combo multiplier.
 */
export function nearMissReward(multiplier: number): number {
  return Math.round(NEAR_MISS_BASE_REWARD * multiplier);
}
