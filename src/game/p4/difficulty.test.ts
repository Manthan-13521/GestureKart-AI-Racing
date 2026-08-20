import { describe, it, expect } from 'vitest';
import {
  waveIntensity,
  difficultyFactor,
  milestoneFor,
  maxSpeedFor,
  spawnIntervalFor,
  WAVE_DURATION,
  WAVE_INTENSE_START,
  WAVE_INTENSE_END,
  MIN_SPAWN_INTERVAL,
  BASE_SPAWN_INTERVAL,
  WAVE_SPAWN_BONUS,
  MAX_SPEED_BASE,
  SPEED_CAP_PER_MILESTONE,
  MILESTONE_DISTANCE,
  MAX_SPEED_CAP,
} from './difficulty';

describe('waveIntensity', () => {
  it('starts at 0 in calm phase', () => {
    expect(waveIntensity(0)).toBe(0);
    expect(waveIntensity(WAVE_INTENSE_START / 2)).toBeCloseTo(0.5, 2);
  });

  it('ramps to 1 at intense start', () => {
    expect(waveIntensity(WAVE_INTENSE_START)).toBe(1);
  });

  it('holds 1 during intense phase', () => {
    expect(waveIntensity(WAVE_INTENSE_START + 1)).toBe(1);
    expect(waveIntensity((WAVE_INTENSE_START + WAVE_INTENSE_END) / 2)).toBe(1);
  });

  it('ramps down after intense end', () => {
    expect(waveIntensity(WAVE_INTENSE_END)).toBe(1);
    expect(waveIntensity(WAVE_INTENSE_END + 1)).toBeLessThan(1);
    // At t = WAVE_DURATION - 1, 1 frame before wave end
    // Ramp down from WAVE_INTENSE_END to WAVE_DURATION (8 frames)
    // At frame 7 of 8: 1 - 7/8 = 0.125
    expect(waveIntensity(WAVE_DURATION - 1)).toBeCloseTo(0.125, 3);
  });

  it('repeats each wave', () => {
    expect(waveIntensity(WAVE_DURATION)).toBe(0);
    expect(waveIntensity(WAVE_DURATION + WAVE_INTENSE_START / 2)).toBeCloseTo(0.5, 2);
  });
});

describe('difficultyFactor', () => {
  it('base 0.2 in calm', () => {
    expect(difficultyFactor(0)).toBe(0.2);
  });

  it('max 1.0 during intense', () => {
    expect(difficultyFactor(WAVE_INTENSE_START)).toBe(1.0);
  });

  it('never exceeds 1.0', () => {
    for (let t = 0; t < 100; t++) {
      expect(difficultyFactor(t)).toBeLessThanOrEqual(1.0);
    }
  });
});

describe('milestoneFor', () => {
  it('0 at start', () => {
    expect(milestoneFor(0)).toBe(0);
    expect(milestoneFor(MILESTONE_DISTANCE - 1)).toBe(0);
  });

  it('increments at each milestone', () => {
    expect(milestoneFor(MILESTONE_DISTANCE)).toBe(1);
    expect(milestoneFor(MILESTONE_DISTANCE * 2 - 1)).toBe(1);
    expect(milestoneFor(MILESTONE_DISTANCE * 2)).toBe(2);
    expect(milestoneFor(MILESTONE_DISTANCE * 5)).toBe(5);
  });
});

describe('maxSpeedFor', () => {
  it('base speed at milestone 0', () => {
    expect(maxSpeedFor(0)).toBe(MAX_SPEED_BASE);
  });

  it('increases by SPEED_CAP_PER_MILESTONE per milestone', () => {
    expect(maxSpeedFor(MILESTONE_DISTANCE)).toBe(MAX_SPEED_BASE + SPEED_CAP_PER_MILESTONE);
    expect(maxSpeedFor(MILESTONE_DISTANCE * 5)).toBe(MAX_SPEED_BASE + SPEED_CAP_PER_MILESTONE * 5);
  });

  it('hard caps at MAX_SPEED_CAP', () => {
    const hugeDist = MILESTONE_DISTANCE * 100;
    expect(maxSpeedFor(hugeDist)).toBe(MAX_SPEED_CAP);
  });
});

describe('spawnIntervalFor', () => {
  it('base interval at calm + milestone 0', () => {
    // difficultyFactor(0) = 0.2, so interval = 120 - 0.2*60 = 108
    expect(spawnIntervalFor(0, 0)).toBe(BASE_SPAWN_INTERVAL - Math.round(0.2 * WAVE_SPAWN_BONUS));
  });

  it('reduces during intense wave', () => {
    const calm = spawnIntervalFor(0, 0);
    const intense = spawnIntervalFor(WAVE_INTENSE_START, 0);
    expect(intense).toBeLessThan(calm);
  });

  it('reduces with milestones', () => {
    const m0 = spawnIntervalFor(0, 0);
    const m5 = spawnIntervalFor(0, MILESTONE_DISTANCE * 5);
    expect(m5).toBeLessThan(m0);
  });

  it('never below MIN_SPAWN_INTERVAL', () => {
    // Even with max wave and many milestones
    const intenseManyMilestones = spawnIntervalFor(WAVE_INTENSE_START, MILESTONE_DISTANCE * 20);
    expect(intenseManyMilestones).toBeGreaterThanOrEqual(MIN_SPAWN_INTERVAL);
  });
});

describe('Determinism', () => {
  it('waveIntensity is deterministic', () => {
    for (let t = 0; t < 100; t++) {
      expect(waveIntensity(t)).toBe(waveIntensity(t));
    }
  });

  it('difficultyFactor is deterministic', () => {
    for (let t = 0; t < 100; t++) {
      expect(difficultyFactor(t)).toBe(difficultyFactor(t));
    }
  });

  it('spawnIntervalFor is deterministic', () => {
    for (let t = 0; t < 50; t++) {
      for (let d = 0; d < 1000; d += 100) {
        expect(spawnIntervalFor(t, d)).toBe(spawnIntervalFor(t, d));
      }
    }
  });
});
