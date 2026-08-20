/**
 * AI module barrel — imports for the AI Race subsystem.
 */
export { AIRuntime } from './AIRuntime';
export { AIHud } from './AIHud';
export type { AIHudState } from './AIHud';
export { RaceEntity } from './RaceEntity';
export type { EntityState } from './RaceEntity';
export { PERSONALITIES, buildGrid, toEnginePersonality } from './AIPersonality';
export type { Personality, PersonalityId } from './AIPersonality';
export {
  IDENTITY_ORDER,
  IDENTITY_FINGERPRINTS,
  IDENTITY_NAMES,
  TIER_ORDER,
  TIER_DEFAULT_IDENTITIES,
  TIER_PACE,
  TIER_FORBIDS_MISTAKES,
  isNormalized,
  mulberry32,
  seedNoise,
  identityFingerprint,
} from './AIIdentity';
export type { IdentityId, IdentityFingerprint, DifficultyTier } from './AIIdentity';
export { ChameleonAdapter, chameleonAdapter } from './ChameleonAdapter';
export type { RaceDelta } from './ChameleonAdapter';
export { computePerception } from './AIPerception';
export type { PerceptionResult, DraftZone } from './AIPerception';
export { decide, makeMemory } from './AIDecision';
export type { AIDecisionOutput, AIIntent, AIMemory } from './AIDecision';
export { catchUpMultiplier, DEFAULT_CATCH_UP } from './CatchUp';
export type { CatchUpConfig } from './CatchUp';
