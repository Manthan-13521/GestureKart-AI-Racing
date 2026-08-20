/**
 * AIPersonality — bridge between the GDD identity model and the AI engine.
 *
 * P5.1: The engine's Personality type is retained verbatim (AIDecision/AICar
 * depend on it). What changed is the SOURCE: personalities are now derived
 * from the six GDD identities via identityFingerprint() + toEnginePersonality(),
 * and buildGrid() assigns identities per difficulty tier with deterministic
 * seeds instead of the old scalar difficulty bands.
 */

import {
  IDENTITY_FINGERPRINTS,
  IDENTITY_NAMES,
  TIER_DEFAULT_IDENTITIES,
  TIER_PACE,
  TIER_FORBIDS_MISTAKES,
  isNormalized,
  seedNoise,
} from './AIIdentity';
import type { DifficultyTier, IdentityFingerprint, IdentityId } from './AIIdentity';

export type PersonalityId = IdentityId;

/** The engine-facing personality. Shape is unchanged from before P5.1. */
export interface Personality {
  id: IdentityId;
  /** Display name shown in HUD / results. */
  name: string;
  /** Base speed relative to player max (0–1.2). */
  speedFactor: number;
  /** How quickly the AI reacts to changed conditions (seconds of lag). */
  reactionTime: number;
  /** 0 = cautious, 1 = reckless overtaker. */
  aggression: number;
  /** Probability per second of making a random mistake. */
  mistakeRate: number;
  /** How willing the AI is to block the player. 0 = never, 1 = always. */
  blockingFrequency: number;
  /** How aggressively the AI exploits the slipstream draft. */
  draftUsage: number;
  /** How fast the AI recovers from a mistake. */
  recoverySpeed: number;
  /** How tightly the AI follows the "ideal" offset vs wandering slightly. */
  cornerConfidence: number;
  /** How quickly they reach max boost when available. */
  boostStrategy: number;
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/**
 * Map a GDD identity fingerprint to engine personality coefficients.
 * Each GDD §9.2 parameter maps to one or two engine fields:
 *   aggression   → aggression, blockingFrequency (scaled)
 *   consistency  → recoverySpeed, reactionTime
 *   braking      → reactionTime (braking discipline lowers reaction lag)
 *   cornering    → cornerConfidence
 *   boostSense   → boostStrategy
 *   mistakeFreq  → mistakeRate (suppressed for Expert tier per GDD §9.4)
 *   draftSkill   → draftUsage
 */
export function toEnginePersonality(
  id: IdentityId,
  fp: IdentityFingerprint,
  tier: DifficultyTier,
  seed: number
): Personality {
  const noise = seedNoise(fp, seed, 0.02);
  const pace = TIER_PACE[tier];
  const forbidsMistakes = TIER_FORBIDS_MISTAKES[tier];

  return {
    id,
    name: IDENTITY_NAMES[id],
    // Base pace from fingerprint skill + tier multiplier. Blaze/Vector are
    // faster than Comet/Shield; Expert tier (Vector) is genuinely stronger.
    speedFactor: clamp01((0.55 + noise.cornering * 0.25 + noise.consistency * 0.25) * pace),
    reactionTime: clamp01(0.55 - noise.braking * 0.35 - noise.consistency * 0.05),
    aggression: clamp01(noise.aggression),
    mistakeRate: forbidsMistakes ? 0 : clamp01(noise.mistakeFreq),
    blockingFrequency: clamp01(noise.aggression * 0.7 + (id === 'shield' ? 0.3 : 0)),
    draftUsage: clamp01(noise.draftSkill),
    recoverySpeed: clamp01(0.4 + noise.consistency * 0.6),
    cornerConfidence: clamp01(noise.cornering),
    boostStrategy: clamp01(noise.boostSense),
  };
}

/**
 * Static baseline personalities for each identity (no per-race noise, medium
 * tier). Useful for tests and HUD identity display.
 */
export const PERSONALITIES: Record<IdentityId, Personality> = (
  Object.keys(IDENTITY_FINGERPRINTS) as IdentityId[]
).reduce(
  (acc, id) => {
    acc[id] = toEnginePersonality(id, IDENTITY_FINGERPRINTS[id], 'medium', 0);
    return acc;
  },
  {} as Record<IdentityId, Personality>
);

export const ALL_PERSONALITIES: Personality[] = (Object.keys(PERSONALITIES) as IdentityId[]).map(
  (id) => PERSONALITIES[id]
);

/**
 * Build a deterministic AI grid for a difficulty tier.
 * @param count Number of AI cars in the grid.
 * @param tier Difficulty tier (easy/medium/hard/expert/adaptive).
 * @param seed Deterministic seed; same inputs ⇒ same grid.
 * @param chameleonOverride Optional fingerprint for Chameleon (e.g. an adapted
 *        fingerprint from ChameleonAdapter). Defaults to the baseline.
 */
export function buildGrid(
  count: number,
  tier: DifficultyTier = 'medium',
  seed = 1,
  chameleonOverride?: IdentityFingerprint
): Personality[] {
  const ids = TIER_DEFAULT_IDENTITIES[tier];
  const grid: Personality[] = [];

  for (let i = 0; i < count; i++) {
    const id = ids[i % ids.length];
    const base = id === 'chameleon' && chameleonOverride ? chameleonOverride : IDENTITY_FINGERPRINTS[id];
    // Deterministic per-slot seed: derived from grid seed + slot index.
    grid.push(toEnginePersonality(id, seedNoise(base, seed * 31 + i), tier, seed * 31 + i));
  }
  return grid;
}

/** Convenience validation used by tests. */
export { isNormalized };
