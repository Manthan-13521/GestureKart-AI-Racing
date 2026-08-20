import { describe, it, expect, beforeEach } from 'vitest';
import { ComboSystem, LaneSwitchTracker, nearestLaneIndex } from './combo';
import { LANE_X } from '../Game';

describe('ComboSystem', () => {
  let combo: ComboSystem;

  beforeEach(() => {
    combo = new ComboSystem({ maxMultiplier: 10, laneSwitchDwellFrames: 4 });
  });

  it('starts at ×1', () => {
    expect(combo.multiplier).toBe(1);
    expect(combo.streakCount).toBe(0);
  });

  it('increments on near-miss', () => {
    combo.registerNearMiss();
    expect(combo.multiplier).toBe(2);
    expect(combo.streakCount).toBe(1);

    combo.registerNearMiss();
    expect(combo.multiplier).toBe(3);
    expect(combo.streakCount).toBe(2);
  });

  it('caps at maxMultiplier (10)', () => {
    for (let i = 0; i < 15; i++) {
      combo.registerNearMiss();
    }
    expect(combo.multiplier).toBe(10);
    expect(combo.streakCount).toBe(15);
  });

  it('resets on reset()', () => {
    combo.registerNearMiss();
    combo.registerNearMiss();
    expect(combo.multiplier).toBe(3);

    combo.reset();
    expect(combo.multiplier).toBe(1);
    expect(combo.streakCount).toBe(0);
  });
});

describe('LaneSwitchTracker', () => {
  let tracker: LaneSwitchTracker;

  beforeEach(() => {
    tracker = new LaneSwitchTracker(LANE_X, 4);
  });

  it('initial lane assignment is silent', () => {
    // Start in lane 0 (left)
    const switched = tracker.update(LANE_X[0] + 0.1);
    expect(switched).toBe(false);
    expect(tracker.lastCommittedLane).toBe(0);
  });

  it('commits lane switch after dwellFrames', () => {
    // Start in lane 0
    tracker.update(LANE_X[0]);
    // Move to lane 1 (center) and hold
    for (let i = 0; i < 3; i++) {
      expect(tracker.update(LANE_X[1])).toBe(false);
    }
    // 4th frame commits
    expect(tracker.update(LANE_X[1])).toBe(true);
    expect(tracker.lastCommittedLane).toBe(1);
  });

  it('does not commit on jitter at boundary', () => {
    tracker.update(LANE_X[0]); // Start in lane 0
    // Jitter around boundary between lane 0 and 1
    for (let i = 0; i < 10; i++) {
      const x = i % 2 === 0 ? LANE_X[0] + 0.1 : LANE_X[1] - 0.1;
      expect(tracker.update(x)).toBe(false);
    }
    // Should still be in lane 0, no switch committed
    expect(tracker.lastCommittedLane).toBe(0);
  });

  it('commits switch back after dwell', () => {
    tracker.update(LANE_X[0]); // Start lane 0
    // Move to lane 1
    for (let i = 0; i < 4; i++) tracker.update(LANE_X[1]);
    expect(tracker.lastCommittedLane).toBe(1);
    // Move back to lane 0
    for (let i = 0; i < 4; i++) {
      const switched = tracker.update(LANE_X[0]);
      if (i === 3) expect(switched).toBe(true);
      else expect(switched).toBe(false);
    }
    expect(tracker.lastCommittedLane).toBe(0);
  });

  it('resets cleanly', () => {
    tracker.update(LANE_X[0]);
    for (let i = 0; i < 4; i++) tracker.update(LANE_X[1]);
    expect(tracker.lastCommittedLane).toBe(1);

    tracker.reset();
    expect(tracker.lastCommittedLane).toBe(-1);
  });
});

describe('ComboSystem lane switch integration', () => {
  let combo: ComboSystem;

  beforeEach(() => {
    combo = new ComboSystem({ maxMultiplier: 10, laneSwitchDwellFrames: 4 });
  });

  it('increments combo on committed lane switch', () => {
    combo.updateLaneSwitch(LANE_X[0]); // Start lane 0
    for (let i = 0; i < 4; i++) {
      const switched = combo.updateLaneSwitch(LANE_X[1]);
      if (i === 3) expect(switched).toBe(true);
      else expect(switched).toBe(false);
    }
    expect(combo.multiplier).toBe(2);
    expect(combo.streakCount).toBe(1);
  });

  it('jitter does not increment combo', () => {
    combo.updateLaneSwitch(LANE_X[0]);
    for (let i = 0; i < 20; i++) {
      const x = i % 2 === 0 ? LANE_X[0] + 0.1 : LANE_X[1] - 0.1;
      combo.updateLaneSwitch(x);
    }
    expect(combo.multiplier).toBe(1);
    expect(combo.streakCount).toBe(0);
  });
});

describe('nearestLaneIndex', () => {
  it('maps to nearest lane', () => {
    expect(nearestLaneIndex(LANE_X[0])).toBe(0);
    expect(nearestLaneIndex(LANE_X[1])).toBe(1);
    expect(nearestLaneIndex(LANE_X[2])).toBe(2);
    // Midpoints
    expect(nearestLaneIndex((LANE_X[0] + LANE_X[1]) / 2)).toBe(0);
    expect(nearestLaneIndex((LANE_X[1] + LANE_X[2]) / 2)).toBe(1);
  });
});
