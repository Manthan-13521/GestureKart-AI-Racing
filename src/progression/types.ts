/**
 * P8 — Progression domain types.
 *
 * The progression layer sits between the authoritative race result and the
 * persistence layer. It knows nothing about the DOM and the race simulation
 * knows nothing about it.
 */
import type { ModeId } from '../game/GameModeConfig';
import type { DivisionId } from '../game/TournamentManager';

/** A finished race, expressed in terms the reward layer understands. */
export interface RaceResult {
  /** Unique per race attempt; the idempotency key (see RaceResultGate). */
  raceId: string;
  mode: ModeId;
  /** Finishing position (1..6). 0 means the mode has no standing. */
  position: number;
  /** Score/distance for score-based modes (survival, versus). */
  score: number;
  /** Active division for AI races (drives the reward multiplier). */
  division: DivisionId | null;
}

/** XP + currency payout for a finished race. */
export interface RewardBreakdown {
  xp: number;
  coins: number;
}

/** Result of applying an XP gain (levels gained, overflow carried). */
export interface XpApplyResult {
  levelBefore: number;
  levelAfter: number;
  levelsGained: number;
  xp: number;
}

/** Progression counters that are not derivable from XP/coins. */
export interface LifetimeStats {
  racesFinished: number;
}

/**
 * Persisted player progression (profile save version 2).
 *
 * `level` is always derived from `xp` on load (level = 1 + floor(xp / LEVEL_XP));
 * it is only written for display convenience and never trusted on input.
 */
export interface PlayerProfile {
  version: number;
  xp: number;
  coins: number;
  unlockedSkins: string[];
  selectedSkin: string;
  unlockedNeons: string[];
  selectedNeon: string;
  lifetimeStats: LifetimeStats;
  /** Consumed race-result ids (idempotency tokens, FIFO-capped). */
  completedRaces: string[];
}

/** Authoritative result of a completed race, returned to presentation. */
export interface RaceCompletion {
  rewards: RewardBreakdown;
  xpBefore: number;
  xpAfter: number;
  levelBefore: number;
  levelAfter: number;
  levelsGained: number;
  coinsBefore: number;
  coinsAfter: number;
  title: string | null;
  unlocked: string[];
  racesFinished: number;
}
