/**
 * ProgressionView — pure presentation helpers for the progression UI.
 *
 * All display math for XP progress, currency formatting and reward/level-up
 * summaries lives here so the UI never re-implements progression formulas.
 * The module is side-effect free (no DOM, no storage) and fully testable.
 * Authoritative values always come from ProfileManager / RaceResultGate —
 * this module only formats them.
 */
import { LEVEL_XP, levelForXp, xpIntoLevel, xpForNextLevel } from './XpProgression';
import type { RaceCompletion } from './types';

export interface XpProgress {
  /** Total XP (authoritative). */
  xp: number;
  /** Current derived level. */
  level: number;
  /** XP earned inside the current level. */
  into: number;
  /** XP still needed to reach the next level. */
  needed: number;
  /** 0..1 progress inside the current level. */
  ratio: number;
  /** 0..100 progress inside the current level. */
  pct: number;
}

/**
 * XP progress for the profile UI. `needed` is 0 at max level (no cap exists,
 * so 0 only occurs when the display requests it); at level 1 with 0 XP the
 * bar shows 0% of 1000.
 */
export function xpProgress(xp: number): XpProgress {
  const safe = Number.isFinite(xp) && xp >= 0 ? Math.floor(xp) : 0;
  const into = xpIntoLevel(safe);
  return {
    xp: safe,
    level: levelForXp(safe),
    into,
    needed: xpForNextLevel(safe),
    ratio: into / LEVEL_XP,
    pct: Math.round((into / LEVEL_XP) * 100),
  };
}

/**
 * Integer currency formatting with thousand separators. Input is sanitized:
 * non-finite, fractional or negative values render as 0 — the UI can never
 * show a negative or fractional balance.
 */
export function formatCurrency(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '0';
  const n = Math.floor(value);
  return n.toLocaleString('en-US').replace(/,/g, ',');
}

/** Level-up banner text: `LEVEL 7 → LEVEL 8`; null when no level-up. */
export function levelUpText(levelBefore: number, levelAfter: number): string | null {
  if (levelAfter <= levelBefore) return null;
  return `LEVEL ${levelBefore} → LEVEL ${levelAfter}`;
}

export interface RewardSummary {
  xpEarned: number;
  coinsEarned: number;
  totalXp: number;
  totalCoins: number;
  levelBefore: number;
  levelAfter: number;
  levelsGained: number;
  title: string | null;
  unlocked: string[];
  levelUp: string | null;
}

/**
 * Flat presentation summary of a RaceCompletion. Numbers come straight from
 * the gate outcome — nothing is recalculated here.
 */
export function rewardSummary(completion: RaceCompletion): RewardSummary {
  return {
    xpEarned: completion.rewards.xp,
    coinsEarned: completion.rewards.coins,
    totalXp: completion.xpAfter,
    totalCoins: completion.coinsAfter,
    levelBefore: completion.levelBefore,
    levelAfter: completion.levelAfter,
    levelsGained: completion.levelsGained,
    title: completion.title,
    unlocked: completion.unlocked,
    levelUp: levelUpText(completion.levelBefore, completion.levelAfter),
  };
}
