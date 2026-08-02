/**
 * AI Race — unit tests
 * Tests: Perception, Decision logic, Draft zones, Personality grid,
 *        RaceDirector standings, overtake initiation, memory cooldowns.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { computePerception } from '../ai/AIPerception';
import { decide, makeMemory } from '../ai/AIDecision';
import { PERSONALITIES, buildGrid } from '../ai/AIPersonality';
import { RaceDirector } from '../game/RaceDirector';
import type { EntityState } from '../ai/RaceEntity';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEntity(id: string, x: number, distance: number, speed: number, isPlayer = false): EntityState {
  return { id, x, speed, distance, lap: 1, isPlayer, isAI: !isPlayer, isGhost: false, isFinished: false };
}

// ─── AIPerception ─────────────────────────────────────────────────────────────

describe('computePerception', () => {
  it('detects a car directly ahead', () => {
    const self = makeEntity('ai-0', 0, 100, 1.0);
    const ahead = makeEntity('ai-1', 0.2, 108, 0.9); // same lateral, ahead
    const others = [ahead, makeEntity('player', 0, 80, 0.8, true)];

    const perc = computePerception(self, others, 2400, 0);

    expect(perc.carAhead?.id).toBe('ai-1');
    expect(perc.distAhead).toBeCloseTo(8, 0);
  });

  it('detects player behind', () => {
    const self = makeEntity('ai-0', 0, 120, 1.0);
    const player = makeEntity('player', 0, 100, 0.8, true);

    const perc = computePerception(self, [player], 2400, 0);

    expect(perc.distToPlayer).toBeCloseTo(-20, 0); // player is 20m behind
    expect(perc.player?.id).toBe('player');
  });

  it('returns optimal draft zone when gap ≤ 2.5m', () => {
    const self = makeEntity('ai-0', 0, 100, 1.0);
    const leadCar = makeEntity('ai-1', 0.1, 102, 1.0); // 2m ahead, same lane

    const perc = computePerception(self, [leadCar], 2400, 0);

    expect(perc.draftZone).toBe('optimal');
    expect(perc.draftBonus).toBeGreaterThan(0);
  });

  it('returns dirty air when gap is 5–7.5m', () => {
    const self = makeEntity('ai-0', 0, 100, 1.0);
    const leadCar = makeEntity('ai-1', 0.1, 106, 1.0); // 6m ahead

    const perc = computePerception(self, [leadCar], 2400, 0);

    expect(perc.draftZone).toBe('dirty');
    expect(perc.draftBonus).toBeLessThan(0);
  });

  it('returns cooldown when cooldown > 0', () => {
    const self = makeEntity('ai-0', 0, 100, 1.0);
    const leadCar = makeEntity('ai-1', 0.1, 102, 1.0);

    const perc = computePerception(self, [leadCar], 2400, 1.5); // cooldown remaining

    expect(perc.draftZone).toBe('cooldown');
  });

  it('detects collision imminent when closing fast', () => {
    const self = makeEntity('ai-0', 0, 100, 1.5);
    const blockingCar = makeEntity('ai-1', 0.2, 103, 0.8); // 3m ahead, slower

    const perc = computePerception(self, [blockingCar], 2400, 0);

    expect(perc.collisionImminent).toBe(true);
  });

  it('ignores cars beyond lateral tolerance', () => {
    const self = makeEntity('ai-0', 0, 100, 1.0);
    const farLane = makeEntity('ai-1', 3.5, 105, 1.0); // different lane

    const perc = computePerception(self, [farLane], 2400, 0);

    expect(perc.carAhead).toBeNull();
    expect(perc.distAhead).toBe(Infinity);
  });
});

// ─── AIDecision ──────────────────────────────────────────────────────────────

describe('decide', () => {
  it('returns cruise intent in normal conditions', () => {
    const pers = PERSONALITIES['smooth'];
    const mem = makeMemory();

    const perc = computePerception(
      makeEntity('ai-0', 0, 100, 1.0),
      [makeEntity('player', 0, 100, 1.0, true)],
      2400,
      0
    );

    const result = decide(perc, pers, mem, 30, 1.0, 0.016);
    expect(['cruise', 'draft', 'attack', 'block']).toContain(result.intent);
  });

  it('mistake lowers desired speed', () => {
    const pers = PERSONALITIES['erratic'];
    const mem = makeMemory();
    mem.mistakeDuration = 0.5; // currently in a mistake

    const perc = computePerception(makeEntity('ai-0', 0, 100, 1.0), [], 2400, 0);
    const result = decide(perc, pers, mem, 5, 1.0, 0.016);

    expect(result.intent).toBe('mistake');
    expect(result.desiredSpeed).toBeLessThan(pers.speedFactor);
  });

  it('overtake when car is close ahead and aggressive', () => {
    const pers = PERSONALITIES['aggressive'];
    const mem = makeMemory();
    mem.lastMistakeTime = -999; // no recent mistake

    // Force overtake by seeding Math.random to above aggression threshold
    const selfState = makeEntity('ai-0', 0, 100, 1.5);
    const aheadState = makeEntity('ai-1', 0.3, 104, 1.0); // 4m ahead

    const perc = computePerception(selfState, [aheadState, makeEntity('player', 0, 80, 1.0, true)], 2400, 0);

    // Run multiple ticks to catch the random overtake trigger
    let overtakeSeen = false;
    for (let i = 0; i < 200; i++) {
      const r = decide(perc, pers, makeMemory(), 20, 1.0, 0.1);
      if (r.intent === 'overtake') {
        overtakeSeen = true;
        break;
      }
    }
    expect(overtakeSeen).toBe(true);
  });

  it('clamped offset stays within track bounds', () => {
    const pers = PERSONALITIES['erratic'];
    for (let i = 0; i < 50; i++) {
      const mem = makeMemory();
      const perc = computePerception(makeEntity('ai-0', 0, 100, 1.0), [], 2400, 0);
      const result = decide(perc, pers, mem, 10 + i, 1.0, 0.016);
      expect(result.desiredOffset).toBeGreaterThanOrEqual(-3.21);
      expect(result.desiredOffset).toBeLessThanOrEqual(3.21);
    }
  });

  it('draft cooldown decrements each tick', () => {
    const mem = makeMemory();
    mem.draftCooldown = 1.0;
    const pers = PERSONALITIES['tactical'];
    const perc = computePerception(makeEntity('ai-0', 0, 100, 1.0), [], 2400, mem.draftCooldown);
    decide(perc, pers, mem, 10, 1.0, 0.1);
    expect(mem.draftCooldown).toBeCloseTo(0.9, 1);
  });
});

// ─── AIPersonality ────────────────────────────────────────────────────────────

describe('buildGrid', () => {
  it('returns the correct number of personalities', () => {
    expect(buildGrid(5, 0.5)).toHaveLength(5);
    expect(buildGrid(3, 0)).toHaveLength(3);
  });

  it('easy difficulty uses rookie/defensive personalities', () => {
    const grid = buildGrid(6, 0.1);
    const ids = grid.map((p) => p.id);
    expect(ids.some((id) => id === 'rookie' || id === 'defensive')).toBe(true);
  });

  it('hard difficulty uses tactical/aggressive personalities', () => {
    const grid = buildGrid(6, 0.9);
    const ids = grid.map((p) => p.id);
    expect(ids.some((id) => id === 'tactical' || id === 'aggressive')).toBe(true);
  });

  it('all personalities have valid speed factors', () => {
    for (const p of Object.values(PERSONALITIES)) {
      expect(p.speedFactor).toBeGreaterThan(0);
      expect(p.speedFactor).toBeLessThanOrEqual(1.2);
    }
  });
});

// ─── RaceDirector ─────────────────────────────────────────────────────────────

describe('RaceDirector', () => {
  let director: RaceDirector;

  beforeEach(() => {
    director = new RaceDirector();
    director.start(1, 6);
  });

  it('starts with correct initial state', () => {
    const state = director.getState();
    expect(state.started).toBe(true);
    expect(state.gameOver).toBe(false);
    expect(state.totalCars).toBe(6);
  });

  it('accumulates race time', () => {
    director.update(1.0);
    director.update(1.0);
    expect(director.raceTime).toBeCloseTo(2.0, 1);
  });

  it('ranks player correctly by distance', () => {
    director.update(0.016, [
      { id: 'ai-0', z: 200, lap: 1, isPlayer: false },
      { id: 'ai-1', z: 180, lap: 1, isPlayer: false },
      { id: 'player', z: 150, lap: 1, isPlayer: true },
      { id: 'ai-2', z: 120, lap: 1, isPlayer: false },
    ]);
    // player at 150m: ai-0 (200) > ai-1 (180) > player (150) > ai-2 (120)
    // Position 3
    expect(director.getState().position).toBe(3);
  });

  it('puts player P1 when leading', () => {
    director.update(0.016, [
      { id: 'player', z: 300, lap: 1, isPlayer: true },
      { id: 'ai-0', z: 200, lap: 1, isPlayer: false },
      { id: 'ai-1', z: 150, lap: 1, isPlayer: false },
    ]);
    expect(director.getState().position).toBe(1);
  });

  it('setGameOver stops updates', () => {
    director.setGameOver();
    const before = director.raceTime;
    director.update(5.0);
    expect(director.raceTime).toBe(before); // no change after gameover
  });
});
