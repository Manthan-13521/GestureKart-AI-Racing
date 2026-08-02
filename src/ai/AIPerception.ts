/**
 * AIPerception — the AI's sensory layer.
 *
 * Computes everything an AI needs to make a decision from raw entity
 * snapshots. Zero Three.js. Zero DOM. Pure logic.
 */
import type { EntityState } from './RaceEntity';

export type DraftZone = 'none' | 'entry' | 'optimal' | 'dirty' | 'cooldown';

export interface PerceptionResult {
  /** Closest car directly ahead (within lateral tolerance). */
  carAhead: EntityState | null;
  /** Distance in metres to car ahead (Infinity if none). */
  distAhead: number;
  /** Closest car directly behind. */
  carBehind: EntityState | null;
  /** Distance in metres to car behind (Infinity if none). */
  distBehind: number;
  /** Player entity state. */
  player: EntityState | null;
  /** Distance to player (signed: negative = player is behind). */
  distToPlayer: number;
  /** Speed delta relative to player (positive = AI faster). */
  speedDeltaToPlayer: number;
  /** Current draft zone status for this AI. */
  draftZone: DraftZone;
  /** Speed bonus fraction from drafting (0–0.18). */
  draftBonus: number;
  /** Whether the AI is on a collision course with the car ahead. */
  collisionImminent: boolean;
  /** Metres remaining to finish line (estimate). */
  distToFinish: number;
}

/** Lateral window within which two cars are considered "on the same line". */
const LATERAL_TOLERANCE = 1.6;

/** Drafting zone thresholds in metres behind a car. */
const DRAFT_ENTRY = 4.5;
const DRAFT_OPTIMAL = 2.5;
const DRAFT_DIRTY_END = 7.5;

export function computePerception(
  self: EntityState,
  others: EntityState[],
  totalDistance: number,
  draftCooldownRemaining: number
): PerceptionResult {
  let carAhead: EntityState | null = null;
  let distAhead = Infinity;
  let carBehind: EntityState | null = null;
  let distBehind = Infinity;
  let player: EntityState | null = null;

  for (const other of others) {
    if (other.id === self.id) continue;

    const dDist = other.distance - self.distance;
    const dLat = Math.abs(other.x - self.x);

    if (other.isPlayer) {
      player = other;
    }

    if (dLat < LATERAL_TOLERANCE) {
      if (dDist > 0 && dDist < distAhead) {
        distAhead = dDist;
        carAhead = other;
      } else if (dDist < 0 && -dDist < distBehind) {
        distBehind = -dDist;
        carBehind = other;
      }
    }
  }

  // Drafting
  let draftZone: DraftZone = 'none';
  let draftBonus = 0;

  if (draftCooldownRemaining > 0) {
    draftZone = 'cooldown';
  } else if (carAhead !== null) {
    const gap = distAhead;
    if (gap <= DRAFT_OPTIMAL) {
      draftZone = 'optimal';
      draftBonus = 0.18 * (1 - gap / DRAFT_OPTIMAL);
    } else if (gap <= DRAFT_ENTRY) {
      draftZone = 'entry';
      draftBonus = 0.06 * ((DRAFT_ENTRY - gap) / (DRAFT_ENTRY - DRAFT_OPTIMAL));
    } else if (gap <= DRAFT_DIRTY_END) {
      draftZone = 'dirty';
      draftBonus = -0.03; // Dirty air penalty
    }
  }

  const distToPlayer = player ? player.distance - self.distance : Infinity;
  const speedDeltaToPlayer = player ? self.speed - player.speed : 0;

  const collisionImminent = carAhead !== null && distAhead < 3.5 && self.speed > carAhead.speed + 0.05;

  const distToFinish = Math.max(0, totalDistance - self.distance);

  return {
    carAhead,
    distAhead,
    carBehind,
    distBehind,
    player,
    distToPlayer,
    speedDeltaToPlayer,
    draftZone,
    draftBonus,
    collisionImminent,
    distToFinish,
  };
}
