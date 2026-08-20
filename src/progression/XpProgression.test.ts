import { describe, it, expect } from 'vitest';
import {
  applyXp,
  levelForXp,
  xpIntoLevel,
  xpForNextLevel,
  isValidXpAmount,
  isValidCurrencyAmount,
  LEVEL_XP,
} from './XpProgression';

describe('XpProgression', () => {
  it('starts at level 1 with 0 XP', () => {
    expect(levelForXp(0)).toBe(1);
    expect(xpIntoLevel(0)).toBe(0);
    expect(xpForNextLevel(0)).toBe(LEVEL_XP);
  });

  it('derives level from total XP (flat 1000/level)', () => {
    expect(levelForXp(999)).toBe(1);
    expect(levelForXp(1000)).toBe(2);
    expect(levelForXp(1999)).toBe(2);
    expect(levelForXp(2000)).toBe(3);
    expect(levelForXp(9500)).toBe(10);
  });

  it('normal XP gain without a level-up', () => {
    const r = applyXp(500, 250);
    expect(r).toEqual({
      levelBefore: 1,
      levelAfter: 1,
      levelsGained: 0,
      xp: 750,
    });
  });

  it('exact threshold produces exactly one level-up', () => {
    const r = applyXp(950, 50);
    expect(r?.levelsGained).toBe(1);
    expect(r?.levelAfter).toBe(2);
    expect(r?.xp).toBe(1000);
  });

  it('overflow XP is carried into the next level, not discarded', () => {
    const r = applyXp(950, 250);
    expect(r?.levelsGained).toBe(1);
    expect(r?.levelAfter).toBe(2);
    expect(r?.xp).toBe(1200);
    expect(xpIntoLevel(r!.xp)).toBe(200);
  });

  it('handles multiple level-ups from a single reward', () => {
    const r = applyXp(950, 2500);
    expect(r?.levelsGained).toBe(3);
    expect(r?.levelAfter).toBe(4);
    expect(r?.xp).toBe(3450);
    expect(xpIntoLevel(r!.xp)).toBe(450);
  });

  it('rejects negative XP state and negative gains', () => {
    expect(applyXp(-5, 100)).toBeNull();
    expect(applyXp(100, -5)).toBeNull();
    expect(applyXp(-5, -5)).toBeNull();
  });

  it('rejects non-integer and non-finite amounts', () => {
    expect(applyXp(100, 1.5)).toBeNull();
    expect(applyXp(100, NaN)).toBeNull();
    expect(applyXp(100, Infinity)).toBeNull();
    expect(applyXp(NaN, 100)).toBeNull();
  });

  it('zero-gain is legal and returns current state', () => {
    const r = applyXp(999, 0);
    expect(r?.levelsGained).toBe(0);
    expect(r?.xp).toBe(999);
  });

  it('validity guards match integer/non-negative semantics', () => {
    expect(isValidXpAmount(0)).toBe(true);
    expect(isValidXpAmount(12345)).toBe(true);
    expect(isValidXpAmount(-1)).toBe(false);
    expect(isValidXpAmount(1.5)).toBe(false);
    expect(isValidCurrencyAmount(0)).toBe(true);
    expect(isValidCurrencyAmount(999)).toBe(true);
    expect(isValidCurrencyAmount(-10)).toBe(false);
    expect(isValidCurrencyAmount(10.5)).toBe(false);
  });
});
