import { describe, it, expect } from 'vitest';
import { NEAR_MISS_BASE_REWARD, isNearMiss, nearMissReward } from './nearMiss';

describe('Near-miss detection', () => {
  it('1.49m -> near-miss (true)', () => {
    expect(isNearMiss(1.49)).toBe(true);
  });

  it('1.50m -> NOT a near-miss (false, strict inequality)', () => {
    expect(isNearMiss(1.5)).toBe(false);
  });

  it('1.51m -> NOT a near-miss (false)', () => {
    expect(isNearMiss(1.51)).toBe(false);
  });

  it('0m -> near-miss', () => {
    expect(isNearMiss(0)).toBe(true);
  });

  it('2.0m -> NOT a near-miss', () => {
    expect(isNearMiss(2.0)).toBe(false);
  });
});

describe('Near-miss reward', () => {
  it('base reward at ×1', () => {
    expect(nearMissReward(1)).toBe(NEAR_MISS_BASE_REWARD);
  });

  it('scales with multiplier', () => {
    expect(nearMissReward(2)).toBe(NEAR_MISS_BASE_REWARD * 2);
    expect(nearMissReward(5)).toBe(NEAR_MISS_BASE_REWARD * 5);
    expect(nearMissReward(10)).toBe(NEAR_MISS_BASE_REWARD * 10);
  });

  it('rounds correctly', () => {
    // NEAR_MISS_BASE_REWARD = 50, so all integer multipliers give exact
    expect(nearMissReward(1.5)).toBe(Math.round(50 * 1.5));
  });
});
