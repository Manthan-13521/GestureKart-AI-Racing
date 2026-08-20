/**
 * AIIdentity — GDD §9 named identities, GDD §9.2 personality parameter model,
 * GDD §9.3 difficulty tiers, and deterministic per-race seeding.
 *
 * P5.1: replaces the generic archetype identity model with the six GDD
 * identities (Blaze, Shield, Vector, Risky, Chameleon, Comet). All identity
 * fingerprints are 0..1 normalized and seeded deterministically so that
 * tournament races are reproducible.
 *
 * The engine-facing Personality type (src/ai/AIPersonality.ts) is derived
 * from these fingerprints via toEnginePersonality(), keeping the existing
 * perception → decision → action loop untouched.
 */

export const IDENTITY_ORDER = ['blaze', 'shield', 'vector', 'risky', 'chameleon', 'comet'] as const;

export type IdentityId = (typeof IDENTITY_ORDER)[number];

export type DifficultyTier = 'easy' | 'medium' | 'hard' | 'expert' | 'adaptive';

/**
 * GDD §9.2 personality parameter model. All values normalized 0..1.
 * Aggression is NOT "hard-coded trickery": each identity has a stable
 * baseline fingerprint; per-race seeding adds bounded noise.
 */
export interface IdentityFingerprint {
  /** Aggressiveness of overtaking / attacking / lane-blocking. */
  aggression: number;
  /** Race-to-race reliability of the identity's driving signature. */
  consistency: number;
  /** Braking discipline (high = brakes early/clean, low = late brakes). */
  braking: number;
  /** Cornering precision / apex accuracy. */
  cornering: number;
  /** How aggressively the identity exploits boost opportunities. */
  boostSense: number;
  /** Frequency of random mistakes (0 = never, 1 = constantly). */
  mistakeFreq: number;
  /** Skill at exploiting the slipstream draft. */
  draftSkill: number;
}

/**
 * GDD §9.1 baseline fingerprints. These are the stable, authoritative values;
 * per-race noise is applied on top via seedNoise().
 *
 * GDD-specified characteristics (GDD §9.1):
 *  - Blaze     aggressive — late brakes, blocks lanes, frequent overtakes
 *  - Shield    defensive  — inside line, defends position, rarely attacks
 *  - Vector    precision  — consistent apexes, near-perfect lines, low mistake
 *  - Risky     risky      — late dives, boost gambles, occasional crashes
 *  - Chameleon adaptive   — calibrates to player speed every race
 *  - Comet     rookie     — wide corners, hesitates, learns through the race
 */
export const IDENTITY_FINGERPRINTS: Record<IdentityId, IdentityFingerprint> = {
  blaze: {
    aggression: 0.9,
    consistency: 0.55,
    braking: 0.3,
    cornering: 0.7,
    boostSense: 0.85,
    mistakeFreq: 0.06,
    draftSkill: 0.7,
  },
  shield: {
    aggression: 0.15,
    consistency: 0.9,
    braking: 0.95,
    cornering: 0.75,
    boostSense: 0.4,
    mistakeFreq: 0.03,
    draftSkill: 0.5,
  },
  vector: {
    aggression: 0.4,
    consistency: 0.95,
    braking: 0.85,
    cornering: 0.95,
    boostSense: 0.6,
    mistakeFreq: 0.0,
    draftSkill: 0.6,
  },
  risky: {
    aggression: 0.85,
    consistency: 0.45,
    braking: 0.35,
    cornering: 0.65,
    boostSense: 0.8,
    mistakeFreq: 0.25,
    draftSkill: 0.55,
  },
  chameleon: {
    aggression: 0.5,
    consistency: 0.5,
    braking: 0.5,
    cornering: 0.5,
    boostSense: 0.5,
    mistakeFreq: 0.1,
    draftSkill: 0.5,
  },
  comet: {
    aggression: 0.2,
    consistency: 0.35,
    braking: 0.3,
    cornering: 0.4,
    boostSense: 0.2,
    mistakeFreq: 0.35,
    draftSkill: 0.25,
  },
};

/** Human-readable display names for HUD/results. */
export const IDENTITY_NAMES: Record<IdentityId, string> = {
  blaze: 'Blaze',
  shield: 'Shield',
  vector: 'Vector',
  risky: 'Risky',
  chameleon: 'Chameleon',
  comet: 'Comet',
};

/**
 * GDD §9.3 difficulty tiers. Each tier maps to a set of identity baselines
 * and an overall grid strength multiplier.
 */
export const TIER_ORDER: DifficultyTier[] = ['easy', 'medium', 'hard', 'expert', 'adaptive'];

/**
 * GDD §9.3 difficulty tier default grids. Each list contains all six distinct
 * identities (so grids of up to 6 AI cars have no duplicates), ordered so the
 * tier's defining identity leads. For grids larger than 6 the list cycles.
 */
export const TIER_DEFAULT_IDENTITIES: Record<DifficultyTier, IdentityId[]> = {
  easy: ['comet', 'shield', 'risky', 'chameleon', 'blaze', 'vector'],
  medium: ['risky', 'shield', 'blaze', 'comet', 'vector', 'chameleon'],
  hard: ['blaze', 'vector', 'risky', 'shield', 'comet', 'chameleon'],
  expert: ['vector', 'blaze', 'shield', 'chameleon', 'risky', 'comet'],
  adaptive: ['chameleon', 'comet', 'shield', 'risky', 'blaze', 'vector'],
};

/** Overall pace multiplier applied to grid personalities per tier. */
export const TIER_PACE: Record<DifficultyTier, number> = {
  easy: 0.9,
  medium: 1.0,
  hard: 1.08,
  expert: 1.16,
  adaptive: 1.0,
};

/** Whether the tier forbids random mistakes (GDD §9.4: "Expert never randomly mistakes"). */
export const TIER_FORBIDS_MISTAKES: Record<DifficultyTier, boolean> = {
  easy: false,
  medium: false,
  hard: false,
  expert: true,
  adaptive: false,
};

/** Validate that every fingerprint parameter is within 0..1. */
export function isNormalized(fp: IdentityFingerprint): boolean {
  return Object.values(fp).every((v) => v >= 0 && v <= 1);
}

/**
 * Deterministic PRNG (mulberry32). Given the same seed it always returns the
 * same sequence, so identity noise is reproducible across races/runs.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOISE_FIELD_KEYS: (keyof IdentityFingerprint)[] = [
  'aggression',
  'consistency',
  'braking',
  'cornering',
  'boostSense',
  'mistakeFreq',
  'draftSkill',
];

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
export { clamp01 };

/**
 * Apply bounded per-race noise to a fingerprint for a deterministic seed.
 * The same (fingerprint, seed) always produces the same result; the noise is
 * small (±noise) so the identity's signature is preserved.
 */
export function seedNoise(fp: IdentityFingerprint, seed: number, noise = 0.04): IdentityFingerprint {
  const rng = mulberry32(seed);
  const out: IdentityFingerprint = { ...fp };
  for (const key of NOISE_FIELD_KEYS) {
    out[key] = clamp01(fp[key] + (rng() - 0.5) * 2 * noise);
  }
  return out;
}

/**
 * Build a fingerprint for a named identity with a deterministic seed:
 * baseline + bounded noise. Same identity + same seed ⇒ same fingerprint.
 */
export function identityFingerprint(id: IdentityId, seed: number): IdentityFingerprint {
  return seedNoise(IDENTITY_FINGERPRINTS[id], seed);
}
