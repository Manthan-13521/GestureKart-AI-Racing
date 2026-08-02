/**
 * AI module barrel — imports for the AI Race subsystem.
 */
export { AIRuntime } from './AIRuntime';
export { AIHud } from './AIHud';
export type { AIHudState } from './AIHud';
export { RaceEntity } from './RaceEntity';
export type { EntityState } from './RaceEntity';
export { PERSONALITIES, buildGrid } from './AIPersonality';
export type { Personality, PersonalityId } from './AIPersonality';
export { computePerception } from './AIPerception';
export type { PerceptionResult, DraftZone } from './AIPerception';
export { decide, makeMemory } from './AIDecision';
export type { AIDecisionOutput, AIIntent, AIMemory } from './AIDecision';
