import { NO_OUTCOME, type ReplayOutcome } from './types';
import type { ReplayPlayer } from './player';

export interface OutcomeInput {
  score: number;
  raceTime: number;
  playerDist: number;
  ghost: ReplayPlayer | null;
  prevBestScore: number | null;
}

/**
 * Pure race-math for ghost duels. Delta is positive when the player is
 * ahead: the ghost needed MORE time to reach the player's current distance
 * than the player has spent racing.
 */
export function computeOutcome(input: OutcomeInput): ReplayOutcome {
  const ghost = input.ghost;
  if (!ghost) {
    return {
      ...NO_OUTCOME,
      newBest: input.prevBestScore === null || input.score > input.prevBestScore,
    };
  }

  const timeDelta = playerLeadTime(input.raceTime, input.playerDist, ghost);
  const distDelta = input.playerDist - ghost.totalDist;

  return {
    newBest: input.prevBestScore === null || input.score > input.prevBestScore,
    beatGhost: input.playerDist > ghost.totalDist,
    ghostPresent: true,
    timeDelta,
    distDelta,
  };
}

export function playerLeadTime(raceTime: number, playerDist: number, ghost: ReplayPlayer): number {
  if (playerDist >= ghost.totalDist) {
    return ghost.duration - raceTime;
  }
  return ghost.timeAtDistance(playerDist) - raceTime;
}

/**
 * Live sector delta: how much faster/slower the player was compared to the
 * ghost at the same track distance. Positive = ahead.
 */
export function sectorDelta(raceTime: number, ghostBoundaryTime: number): number {
  return raceTime - ghostBoundaryTime;
}

export function formatDelta(seconds: number): string {
  const clamped = Math.max(-99.9, Math.min(99.9, seconds));
  return `${clamped >= 0 ? '+' : '−'}${Math.abs(clamped).toFixed(2)}s`;
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}:${rest.toString().padStart(2, '0')}`;
}
