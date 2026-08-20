/**
 * CatchUp — rubber-band pacing for the AI grid.
 *
 * Cars that fall far behind the race leader get a modest, bounded pace
 * bonus so the field stays competitive without ever teleporting or
 * exceeding car physics. The bonus is a pure multiplier on desired
 * speed, converges smoothly through the existing speed lerp, and can
 * never slow a car down (bounded to [1, 1 + maxBonus]).
 *
 * The player is NEVER modified — the bonus is applied only inside the
 * AI cars' own update loop.
 */

export interface CatchUpConfig {
  /** Metres behind the leader before any bonus applies. */
  triggerGap: number;
  /** Metres behind the leader at which the bonus saturates. */
  maxGap: number;
  /** Max fractional pace bonus (0.10 ⇒ up to +10% desired speed). */
  maxBonus: number;
}

export const DEFAULT_CATCH_UP: CatchUpConfig = {
  triggerGap: 60,
  maxGap: 320,
  maxBonus: 0.1,
};

/**
 * Returns the pace multiplier for a car `gapBehindLeader` metres behind
 * the race leader. Deterministic, smooth, and strictly non-negative.
 *   gap <= triggerGap        ⇒ 1.0 (no bonus while leading or close)
 *   triggerGap < gap < maxGap ⇒ 1.0..1+maxBonus (eased)
 *   gap >= maxGap            ⇒ 1 + maxBonus (saturated)
 */
export function catchUpMultiplier(gapBehindLeader: number, cfg: CatchUpConfig = DEFAULT_CATCH_UP): number {
  if (gapBehindLeader <= cfg.triggerGap) return 1;
  const t = Math.min(1, (gapBehindLeader - cfg.triggerGap) / (cfg.maxGap - cfg.triggerGap));
  const eased = t * t * (3 - 2 * t); // smoothstep easing
  return 1 + cfg.maxBonus * eased;
}
