/**
 * XpProgression — deterministic XP/level math.
 *
 * Curve: flat 1000 XP per level (preserved from the original profile code so
 * existing saves keep their meaning).
 *
 *   level  = 1 + floor(xp / 1000)
 *   into   = xp mod 1000
 *   needed = 1000 - into
 *
 * Level is always derived from total XP; overflow from a reward that crosses
 * one or more thresholds is therefore carried implicitly — nothing is
 * discarded. Rebalancing later only requires changing LEVEL_XP.
 */
import type { XpApplyResult } from './types';

export const LEVEL_XP = 1000;

export function isValidXpAmount(n: number): boolean {
  return Number.isFinite(n) && Number.isInteger(n) && n >= 0;
}

/** Integer coins/XP amounts are the only legal currency values. */
export function isValidCurrencyAmount(n: number): boolean {
  return isValidXpAmount(n);
}

export function levelForXp(xp: number): number {
  return 1 + Math.floor(Math.max(0, Math.floor(xp)) / LEVEL_XP);
}

export function xpIntoLevel(xp: number): number {
  return Math.floor(Math.max(0, Math.floor(xp))) % LEVEL_XP;
}

export function xpForNextLevel(xp: number): number {
  return LEVEL_XP - xpIntoLevel(xp);
}

/**
 * Apply a validated XP gain and report the level delta.
 * Negative or non-integer gains are rejected (return null, no mutation).
 */
export function applyXp(xp: number, gain: number): XpApplyResult | null {
  if (!isValidXpAmount(xp) || !isValidXpAmount(gain)) return null;
  const levelBefore = levelForXp(xp);
  const next = xp + gain;
  const levelAfter = levelForXp(next);
  return {
    levelBefore,
    levelAfter,
    levelsGained: levelAfter - levelBefore,
    xp: next,
  };
}
