import { describe, it, expect } from 'vitest';
import { TournamentManager } from '../game/TournamentManager';
import { calculateRaceRewards, positionRewards, scoreRewards } from './RewardCalculator';
import type { RaceResult } from './types';

function aiResult(position: number, division: RaceResult['division']): RaceResult {
  return { raceId: 'r1', mode: 'ai-race', position, score: 0, division };
}

describe('RewardCalculator — AI races (parity with TournamentManager)', () => {
  it('every division resolves a finite, non-negative payout', () => {
    const divisions = ['rookie', 'pro', 'elite', 'champion'] as const;
    for (const division of divisions) {
      for (let pos = 1; pos <= 6; pos++) {
        const res = calculateRaceRewards(aiResult(pos, division));
        expect(res.xp).toBeGreaterThanOrEqual(0);
        expect(res.coins).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(res.xp)).toBe(true);
        expect(Number.isInteger(res.coins)).toBe(true);
      }
    }
  });

  it('higher divisions always pay more for the same position', () => {
    const order = ['rookie', 'pro', 'elite', 'champion'] as const;
    for (let i = 1; i < order.length; i++) {
      const lower = calculateRaceRewards(aiResult(3, order[i - 1]));
      const higher = calculateRaceRewards(aiResult(3, order[i]));
      expect(higher.xp).toBeGreaterThan(lower.xp);
      expect(higher.coins).toBeGreaterThan(lower.coins);
    }
  });

  it('P1 rookie pays 900 XP / 450 coins (10-1 scaled)', () => {
    const res = calculateRaceRewards(aiResult(1, 'rookie'));
    expect(res).toEqual({ xp: 900, coins: 450 });
  });

  it('P6 rookie still pays partial rewards (400 XP / 200 coins)', () => {
    const res = calculateRaceRewards(aiResult(6, 'rookie'));
    expect(res).toEqual({ xp: 400, coins: 200 });
  });

  it('division multiplier scales payouts (champion P2 = 3x rookie P2)', () => {
    const rookie = calculateRaceRewards(aiResult(2, 'rookie'));
    const champion = calculateRaceRewards(aiResult(2, 'champion'));
    expect(rookie).toEqual({ xp: 800, coins: 400 });
    expect(champion).toEqual({ xp: 3200, coins: 1600 });
  });

  it('clamps out-of-range positions (0 and 20 → clamped like 1 and 6)', () => {
    const low = calculateRaceRewards(aiResult(0, 'rookie'));
    const high = calculateRaceRewards(aiResult(20, 'rookie'));
    expect(low).toEqual({ xp: 900, coins: 450 });
    expect(high).toEqual({ xp: 400, coins: 200 });
  });

  it('missing division falls back to multiplier 1', () => {
    const res = calculateRaceRewards(aiResult(3, null));
    expect(res).toEqual({ xp: 700, coins: 350 });
  });

  it('tournament parity: recordFinish numbers equal the calculator', () => {
    const positions = [1, 2, 3, 4, 5, 6];
    for (const pos of positions) {
      // Fresh tournament per position: a single rookie finish never promotes,
      // so division stays pinned at rookie for the comparison.
      const tm = new TournamentManager();
      tm.startNew();
      const tourney = tm.recordFinish(pos);
      const calc = calculateRaceRewards(aiResult(pos, 'rookie'));
      expect(calc.xp).toBe(tourney.xpAwarded);
      expect(calc.coins).toBe(tourney.coinsAwarded);
    }
  });
});

describe('RewardCalculator — score modes', () => {
  it('survival pays score-based XP/coins', () => {
    const res = calculateRaceRewards({
      raceId: 'r2',
      mode: 'survival',
      position: 0,
      score: 4500,
      division: null,
    });
    expect(res).toEqual({ xp: 10 + 45, coins: 5 + 90 });
  });

  it('versus uses the same score-based formula', () => {
    const res = calculateRaceRewards({
      raceId: 'r3',
      mode: 'versus',
      position: 0,
      score: 1200,
      division: null,
    });
    expect(res).toEqual({ xp: 22, coins: 29 });
  });

  it('a lost race (0 score) still pays the floor (GDD: every race pays out)', () => {
    const res = calculateRaceRewards({
      raceId: 'r4',
      mode: 'survival',
      position: 0,
      score: 0,
      division: null,
    });
    expect(res).toEqual({ xp: 10, coins: 5 });
  });

  it('negative score is clamped to 0 before calculation', () => {
    const res = calculateRaceRewards({
      raceId: 'r5',
      mode: 'survival',
      position: 0,
      score: -500,
      division: null,
    });
    expect(res).toEqual({ xp: 10, coins: 5 });
  });

  it('multiplayer pays position rewards without division multiplier', () => {
    const res = calculateRaceRewards({
      raceId: 'r6',
      mode: 'multiplayer',
      position: 2,
      score: 0,
      division: null,
    });
    expect(res).toEqual({ xp: 800, coins: 400 });
  });

  it('positionRewards and scoreRewards are pure and deterministic', () => {
    expect(positionRewards(4, 2)).toEqual({ xp: 1200, coins: 600 });
    expect(positionRewards(4, 2)).toEqual({ xp: 1200, coins: 600 });
    expect(scoreRewards(1234)).toEqual({ xp: 22, coins: 29 });
    expect(scoreRewards(1234)).toEqual({ xp: 22, coins: 29 });
  });
});
