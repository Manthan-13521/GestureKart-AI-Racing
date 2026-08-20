/**
 * RewardCalculator — deterministic payout formulas for finished races.
 *
 * Two families, matching the game's existing result semantics:
 *
 * Position modes (ai-race, multiplayer):
 *   xp    = (10 - pos) * 100 * divisionMultiplier
 *   coins = (10 - pos) * 50  * divisionMultiplier
 *   divisionMultiplier: rookie 1 · pro 2 · elite 3 · champion 4
 *   These exact numbers are preserved from TournamentManager.recordFinish so
 *   AI-race payouts are unchanged; multiplayer has no division (multiplier 1).
 *
 * Score modes (survival, versus):
 *   xp    = 10 + floor(score / 100)
 *   coins = 5  + floor(score / 50)
 *   The 10/5 floor guarantees GDD §P6 "every race pays out — even a lost race".
 *
 * Pure and deterministic: same input → same output, no storage, no DOM.
 */
import type { DivisionId } from '../game/TournamentManager';
import type { RaceResult, RewardBreakdown } from './types';

const DIVISION_MULTIPLIER: Record<DivisionId, number> = {
  rookie: 1,
  pro: 2,
  elite: 3,
  champion: 4,
};

function clampPosition(position: number): number {
  return Math.max(1, Math.min(6, Math.floor(position)));
}

export function positionRewards(position: number, multiplier: number): RewardBreakdown {
  const pos = clampPosition(position);
  const pay = 10 - pos;
  return {
    xp: pay * 100 * multiplier,
    coins: pay * 50 * multiplier,
  };
}

export function scoreRewards(score: number): RewardBreakdown {
  const s = Math.max(0, Math.floor(score));
  return {
    xp: 10 + Math.floor(s / 100),
    coins: 5 + Math.floor(s / 50),
  };
}

export function calculateRaceRewards(result: RaceResult): RewardBreakdown {
  if (result.mode === 'ai-race') {
    const multiplier = result.division ? DIVISION_MULTIPLIER[result.division] : 1;
    return positionRewards(result.position, multiplier);
  }
  if (result.mode === 'multiplayer') {
    return positionRewards(result.position, 1);
  }
  return scoreRewards(result.score);
}
