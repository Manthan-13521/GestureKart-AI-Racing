import { describe, it, expect } from 'vitest';
import { xpProgress, formatCurrency, levelUpText, rewardSummary } from './ProgressionView';
import type { RaceCompletion } from './types';

describe('xpProgress (P8.4)', () => {
  it('0 XP → level 1, 0/1000, 0%', () => {
    const p = xpProgress(0);
    expect(p.level).toBe(1);
    expect(p.into).toBe(0);
    expect(p.needed).toBe(1000);
    expect(p.ratio).toBe(0);
    expect(p.pct).toBe(0);
  });

  it('999 XP → level 1, 999/1000, 99%', () => {
    const p = xpProgress(999);
    expect(p.level).toBe(1);
    expect(p.into).toBe(999);
    expect(p.needed).toBe(1);
    expect(p.pct).toBe(100);
  });

  it('1000 XP → level 2, 0/1000, 0%', () => {
    const p = xpProgress(1000);
    expect(p.level).toBe(2);
    expect(p.into).toBe(0);
    expect(p.needed).toBe(1000);
    expect(p.pct).toBe(0);
  });

  it('1001 XP → level 2, 1/1000, 0%', () => {
    const p = xpProgress(1001);
    expect(p.level).toBe(2);
    expect(p.into).toBe(1);
    expect(p.pct).toBe(0);
  });

  it('1999 XP → level 2, 999/1000, 100%', () => {
    const p = xpProgress(1999);
    expect(p.level).toBe(2);
    expect(p.into).toBe(999);
    expect(p.pct).toBe(100);
  });

  it('2000 XP → level 3, 0/1000, 0%', () => {
    const p = xpProgress(2000);
    expect(p.level).toBe(3);
    expect(p.into).toBe(0);
  });

  it('large XP values stay correct', () => {
    const p = xpProgress(250000);
    expect(p.level).toBe(251);
    expect(p.into).toBe(0);
    expect(p.needed).toBe(1000);
  });

  it('invalid inputs sanitize to 0', () => {
    expect(xpProgress(-5).xp).toBe(0);
    expect(xpProgress(Number.NaN).xp).toBe(0);
    expect(xpProgress(Number.POSITIVE_INFINITY).xp).toBe(0);
    expect(xpProgress(12.9).xp).toBe(12);
  });
});

describe('formatCurrency (P8.4)', () => {
  it('formats integers with thousand separators', () => {
    expect(formatCurrency(0)).toBe('0');
    expect(formatCurrency(7)).toBe('7');
    expect(formatCurrency(999)).toBe('999');
    expect(formatCurrency(1250)).toBe('1,250');
    expect(formatCurrency(1234567)).toBe('1,234,567');
  });

  it('never renders negative, fractional or invalid balances', () => {
    expect(formatCurrency(-100)).toBe('0');
    expect(formatCurrency(12.9)).toBe('12');
    expect(formatCurrency(Number.NaN)).toBe('0');
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe('0');
  });
});

describe('levelUpText (P8.4)', () => {
  it('null when no level-up', () => {
    expect(levelUpText(1, 1)).toBeNull();
    expect(levelUpText(4, 3)).toBeNull();
  });

  it('single level-up', () => {
    expect(levelUpText(1, 2)).toBe('LEVEL 1 → LEVEL 2');
  });

  it('multiple levels in one reward', () => {
    expect(levelUpText(1, 4)).toBe('LEVEL 1 → LEVEL 4');
  });
});

describe('rewardSummary (P8.4)', () => {
  const completion: RaceCompletion = {
    rewards: { xp: 700, coins: 350 },
    xpBefore: 950,
    xpAfter: 1650,
    levelBefore: 1,
    levelAfter: 2,
    levelsGained: 1,
    coinsBefore: 200,
    coinsAfter: 550,
    title: 'Street Racer',
    unlocked: ['Street Racer'],
    racesFinished: 1,
  };

  it('summarizes gate values without recalculating rewards', () => {
    const s = rewardSummary(completion);
    expect(s.xpEarned).toBe(700);
    expect(s.coinsEarned).toBe(350);
    expect(s.totalXp).toBe(1650);
    expect(s.totalCoins).toBe(550);
    expect(s.levelBefore).toBe(1);
    expect(s.levelAfter).toBe(2);
    expect(s.levelsGained).toBe(1);
    expect(s.title).toBe('Street Racer');
    expect(s.unlocked).toEqual(['Street Racer']);
    expect(s.levelUp).toBe('LEVEL 1 → LEVEL 2');
  });

  it('no level-up → null banner', () => {
    const flat: RaceCompletion = {
      ...completion,
      levelBefore: 2,
      levelAfter: 2,
      levelsGained: 0,
      unlocked: [],
    };
    expect(rewardSummary(flat).levelUp).toBeNull();
  });

  it('multi-level rewards surface the final level', () => {
    const multi: RaceCompletion = { ...completion, levelBefore: 1, levelAfter: 4, levelsGained: 3 };
    expect(rewardSummary(multi).levelUp).toBe('LEVEL 1 → LEVEL 4');
  });
});
