/**
 * AI Fairness & Robustness — unit tests
 *
 * Covers rubber-band catch-up (CatchUp), deterministic seeded decisions,
 * guarded blocking (yield + cooldown), overtake hysteresis/cooldown,
 * drafting fairness, and the "expert never mistakes" invariant.
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { computePerception } from '../ai/AIPerception';
import { decide, makeMemory } from '../ai/AIDecision';
import type { AIMemory, AIDecisionOutput } from '../ai/AIDecision';
import { PERSONALITIES, buildGrid } from '../ai/AIPersonality';
import type { Personality } from '../ai/AIPersonality';
import { catchUpMultiplier, DEFAULT_CATCH_UP } from '../ai/CatchUp';
import { mulberry32 } from '../ai/AIIdentity';
import { AICar } from '../ai/AICar';
import { AIRuntime } from '../ai/AIRuntime';
import type { EntityState } from '../ai/RaceEntity';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEntity(id: string, x: number, distance: number, speed: number, isPlayer = false): EntityState {
  return { id, x, speed, distance, lap: 1, isPlayer, isAI: !isPlayer, isGhost: false, isFinished: false };
}

/** Personality clone with mistake-free (expert-style) settings, so forced-RNG
 *  tests never get derailed by a random mistake branch. */
function clean(pers: Personality): Personality {
  return { ...pers, mistakeRate: 0 };
}

// ─── CatchUp (rubber-band) ───────────────────────────────────────────────────

describe('catchUpMultiplier', () => {
  it('gives no bonus while leading or close behind the leader', () => {
    expect(catchUpMultiplier(0)).toBe(1);
    expect(catchUpMultiplier(-50)).toBe(1);
    expect(catchUpMultiplier(DEFAULT_CATCH_UP.triggerGap)).toBe(1);
  });

  it('gives a bigger bonus the further behind the leader', () => {
    const mid = catchUpMultiplier(DEFAULT_CATCH_UP.triggerGap + 100);
    const far = catchUpMultiplier(DEFAULT_CATCH_UP.triggerGap + 200);
    expect(far).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(1);
  });

  it('never exceeds the configured maximum bonus', () => {
    expect(catchUpMultiplier(1e9)).toBe(1 + DEFAULT_CATCH_UP.maxBonus);
    expect(catchUpMultiplier(DEFAULT_CATCH_UP.maxGap)).toBeCloseTo(1 + DEFAULT_CATCH_UP.maxBonus, 5);
  });

  it('never reduces a car speed (no penalty, player-safe)', () => {
    for (const gap of [0, 10, 50, 100, 300, 1000, 1e6]) {
      expect(catchUpMultiplier(gap)).toBeGreaterThanOrEqual(1);
    }
  });

  it('is monotonic non-decreasing in gap', () => {
    let prev = 0;
    for (let gap = -100; gap <= 800; gap += 10) {
      const m = catchUpMultiplier(gap);
      expect(m).toBeGreaterThanOrEqual(prev);
      prev = m;
    }
  });

  it('is deterministic — same inputs, same output', () => {
    for (const gap of [0, 77, 200, 999999]) {
      expect(catchUpMultiplier(gap)).toBe(catchUpMultiplier(gap));
    }
  });
});

// ─── Seeded determinism ──────────────────────────────────────────────────────

describe('seeded decisions', () => {
  function overtakePerc() {
    const self = makeEntity('ai-0', 0, 100, 1.2);
    const ahead = makeEntity('ai-1', 0.3, 104, 1.0); // 4m ahead, same-ish speed
    const player = makeEntity('player', 0, 80, 1.0, true);
    return computePerception(self, [ahead, player], 2400, 0);
  }

  /** Run one deterministic decision stream (single stateful RNG, like AICar). */
  function run(seed: number): AIDecisionOutput[] {
    const pers = clean(PERSONALITIES['blaze']);
    const mem = makeMemory(mulberry32(seed));
    const rng = mulberry32(seed);
    const outputs: AIDecisionOutput[] = [];
    for (let i = 0; i < 120; i++) {
      outputs.push(decide(overtakePerc(), pers, mem, 5 + i * 0.1, 1.0, 0.016, rng));
    }
    return outputs;
  }

  it('same state + same seed ⇒ identical decision streams', () => {
    expect(run(7)).toEqual(run(7));
  });

  it('different seeds produce different decision streams', () => {
    const a = run(1);
    const b = run(9999);
    expect(a.length).toBe(b.length);
    let differ = false;
    for (let i = 0; i < a.length && !differ; i++) {
      differ =
        a[i].intent !== b[i].intent ||
        a[i].boost !== b[i].boost ||
        Math.abs(a[i].desiredOffset - b[i].desiredOffset) > 1e-9 ||
        Math.abs(a[i].desiredSpeed - b[i].desiredSpeed) > 1e-9;
    }
    expect(differ).toBe(true);
  });
});

// ─── Overtake fairness ──────────────────────────────────────────────────────

describe('overtake fairness', () => {
  /** Run decide ticks with one stateful RNG stream (mirrors production AICar)
   *  and return the mem plus count of overtake intents. */
  function runOvertake(seed: number, pers: Personality, distAhead: number): { mem: AIMemory; count: number } {
    const self = makeEntity('ai-0', 0, 100, 1.0);
    const ahead = makeEntity('ai-1', 0.3, 100 + distAhead, 1.0);
    const player = makeEntity('player', 0, 80, 1.0, true);
    const mem = makeMemory(mulberry32(seed));
    const rng = mulberry32(seed);
    let count = 0;
    for (let i = 0; i < 300; i++) {
      const perc = computePerception(self, [ahead, player], 2400, 0);
      const r = decide(perc, pers, mem, 5 + i * 0.016, 1.0, 0.016, rng);
      if (r.intent === 'overtake') count++;
    }
    return { mem, count };
  }

  it('does not initiate an overtake on an already-overlapping bumper', () => {
    const pers = clean(PERSONALITIES['blaze']);
    const { count } = runOvertake(42, pers, 0.5); // 0.5m gap — physically impossible to pass
    expect(count).toBe(0);
  });

  it('initiates an overtake with a real, safe gap', () => {
    const pers = clean(PERSONALITIES['blaze']);
    const { count } = runOvertake(42, pers, 4);
    expect(count).toBeGreaterThan(0);
  });

  it('sets an overtake cooldown once the manoeuvre merges', () => {
    const pers = clean(PERSONALITIES['blaze']);
    const { mem } = runOvertake(42, pers, 4);
    expect(mem.overtakePhase).toBe('merge');
    expect(mem.overtakeCooldown).toBeGreaterThan(0);
  });

  it('cooldown blocks immediate re-initiation (hysteresis)', () => {
    const pers = clean(PERSONALITIES['blaze']);
    const self = makeEntity('ai-0', 0, 100, 1.0);
    const ahead = makeEntity('ai-1', 0.3, 104, 1.0);
    const player = makeEntity('player', 0, 80, 1.0, true);
    const perc = computePerception(self, [ahead, player], 2400, 0);

    // Keep the hysteresis window active for the whole sample: while it lasts,
    // an overtake can never be (re)initiated even under a luck-impossible rng.
    const mem = makeMemory(() => 0);
    let sawOvertake = false;
    for (let i = 0; i < 60; i++) {
      mem.overtakeCooldown = 2.0;
      const r = decide(perc, pers, mem, 5 + i * 0.1, 1.0, 0.1, () => 0);
      if (r.intent === 'overtake') sawOvertake = true;
    }
    expect(sawOvertake).toBe(false);
  });

  it('aggressive (blaze) overtakes more often than defensive (shield)', () => {
    // Constant rng 0.02 sits between the two roll thresholds: blaze
    // (aggression ~0.89) fires, shield (aggression ~0.14) never does.
    const self = makeEntity('ai-0', 0, 100, 1.0);
    const ahead = makeEntity('ai-1', 0.3, 104, 1.0);
    const player = makeEntity('player', 0, 80, 1.0, true);

    const overtakes = (p: Personality): number => {
      const mem = makeMemory(() => 0.02);
      let count = 0;
      for (let i = 0; i < 300; i++) {
        const r = decide(
          computePerception(self, [ahead, player], 2400, 0),
          p,
          mem,
          5 + i * 0.016,
          1.0,
          0.016,
          () => 0.02
        );
        if (r.intent === 'overtake') count++;
      }
      return count;
    };
    expect(overtakes(clean(PERSONALITIES['blaze']))).toBeGreaterThan(
      overtakes(clean(PERSONALITIES['shield']))
    );
  });

  it('expert grid personalities never randomly mistake, with any rng', () => {
    const grid = buildGrid(6, 'expert', 3);
    for (const p of grid) {
      const mem = makeMemory(mulberry32(11));
      const perc = computePerception(makeEntity('ai-0', 0, 100, 1.0), [], 2400, 0);
      let mistake = false;
      for (let i = 0; i < 5000; i++) {
        const r = decide(perc, p, mem, 1 + i * 0.016, 1.0, 0.016, mulberry32(99));
        if (r.intent === 'mistake') mistake = true;
      }
      expect(mistake).toBe(false);
    }
  });
});

// ─── Blocking fairness ──────────────────────────────────────────────────────

describe('blocking fairness', () => {
  function blockedPerc(playerSpeed: number, selfSpeed: number) {
    const self = makeEntity('ai-0', 0, 100, selfSpeed);
    const player = makeEntity('player', 0, 96, playerSpeed, true); // 4m behind
    return computePerception(self, [player], 2400, 0);
  }

  it('yields (no block) against a clearly faster player', () => {
    // Player 1.0 vs AI 0.5 → speedDelta = -0.5 ⇒ player faster ⇒ yield.
    const pers = clean({ ...PERSONALITIES['shield'], blockingFrequency: 1.0 });
    const perc = blockedPerc(1.0, 0.5);
    const mem = makeMemory(() => 0); // would always pass the frequency gate
    const r: AIDecisionOutput = decide(perc, pers, mem, 10, 1.0, 0.016, () => 0);
    expect(r.intent).not.toBe('block');
  });

  it('blocks when pace is matched and player is close behind', () => {
    const pers = clean({ ...PERSONALITIES['shield'], blockingFrequency: 1.0 });
    const perc = blockedPerc(1.0, 1.0);
    const mem = makeMemory(() => 0);
    const r = decide(perc, pers, mem, 10, 1.0, 0.016, () => 0);
    expect(r.intent).toBe('block');
    expect(r.desiredOffset).toBeGreaterThanOrEqual(-3.21);
    expect(r.desiredOffset).toBeLessThanOrEqual(3.21);
  });

  it('imposes a block cooldown so blocking cannot spam every frame', () => {
    const pers = clean({ ...PERSONALITIES['shield'], blockingFrequency: 1.0 });
    const perc = blockedPerc(1.0, 1.0);
    const mem = makeMemory(() => 0);
    decide(perc, pers, mem, 10, 1.0, 0.016, () => 0);
    expect(mem.blockCooldown).toBeGreaterThan(0);
    const next = decide(perc, pers, mem, 10.17, 1.0, 0.016, () => 0);
    expect(next.intent).not.toBe('block'); // gated by cooldown
  });

  it('Shield personality blocks more readily than Vector (config invariant)', () => {
    expect(PERSONALITIES.shield.blockingFrequency).toBeGreaterThan(PERSONALITIES.vector.blockingFrequency);
  });
});

// ─── Drafting fairness ──────────────────────────────────────────────────────

describe('drafting fairness', () => {
  function optimalPerc() {
    const self = makeEntity('ai-0', 0, 100, 1.0);
    const lead = makeEntity('ai-1', 0.1, 102, 1.0); // 2m ahead → optimal
    return computePerception(self, [lead], 2400, 0);
  }

  function entryPerc() {
    const self = makeEntity('ai-0', 0, 100, 1.0);
    const lead = makeEntity('ai-1', 0.1, 104, 1.0); // ~3.5m ahead → entry
    return computePerception(self, [lead], 2400, 0);
  }

  it('consumes the slipstream with a cooldown after exploiting the optimal zone', () => {
    const pers = clean({ ...PERSONALITIES['risky'], draftUsage: 1.0 });
    const mem = makeMemory(() => 0);
    const perc = optimalPerc();
    expect(perc.draftZone).toBe('optimal');

    const r = decide(perc, pers, mem, 10, 1.0, 0.016, () => 0);
    expect(r.intent).toBe('draft');
    expect(mem.draftCooldown).toBeGreaterThan(0);

    // Perception must now report the cooldown zone until it drains.
    const perc2 = computePerception(
      makeEntity('ai-0', 0, 100, 1.0),
      [makeEntity('ai-1', 0.1, 102, 1.0)],
      2400,
      mem.draftCooldown
    );
    expect(perc2.draftZone).toBe('cooldown');
  });

  it('high draft-skill uses the draft more effectively than low', () => {
    const high = clean({ ...PERSONALITIES['risky'], draftUsage: 1.0 });
    const low = clean({ ...PERSONALITIES['risky'], draftUsage: 0.2 });
    const countFor = (p: Personality): number => {
      const mem = makeMemory(mulberry32(3));
      const rng = mulberry32(3);
      let c = 0;
      for (let i = 0; i < 1000; i++) {
        mem.draftCooldown = 0; // measure intrinsic per-frame propensity, not cooldown cap
        const r = decide(optimalPerc(), p, mem, 5 + i * 0.016, 1.0, 0.016, rng);
        if (r.intent === 'draft') c++;
      }
      return c;
    };
    expect(countFor(high)).toBeGreaterThan(countFor(low));
  });

  it('low draft-skill cannot exploit the entry zone', () => {
    const pers = clean({ ...PERSONALITIES['risky'], draftUsage: 0.5 });
    const mem = makeMemory(() => 0);
    expect(entryPerc().draftZone).toBe('entry');
    const r = decide(entryPerc(), pers, mem, 10, 1.0, 0.016, () => 0);
    expect(r.intent).not.toBe('draft');
  });
});

// ─── Runtime integration (catch-up + seeded determinism) ────────────────────

describe('AICar runtime', () => {
  function tickTimes(car: AICar, seconds: number, others: EntityState[]): void {
    const steps = Math.round(seconds / 0.016);
    for (let i = 0; i < steps; i++) {
      car.setPlayerState(100, 1.0);
      car.update(0.016, others);
    }
  }

  it('wheels further ahead when the leader is far ahead (rubber band)', () => {
    const sceneA = new THREE.Scene();
    const sceneB = new THREE.Scene();
    const carNoLeader = new AICar('a', PERSONALITIES['comet'], 30, 2400, sceneA, 1);
    const carWithLeader = new AICar('b', PERSONALITIES['comet'], 30, 2400, sceneB, 1);

    const nobody: EntityState[] = [];
    tickTimes(carNoLeader, 4, nobody);
    tickTimes(carWithLeader, 4, nobody);

    // Now: carWithLeader knows the leader is 400m ahead → extra pace.
    carNoLeader.setPackLeader(carNoLeader.distance + 2); // basically leading → no bonus
    carWithLeader.setPackLeader(carWithLeader.distance + 400); // far behind → bonus

    const beforeA = carNoLeader.distance;
    const beforeB = carWithLeader.distance;
    tickTimes(carNoLeader, 2, []);
    tickTimes(carWithLeader, 2, []);

    const gainedA = carNoLeader.distance - beforeA;
    const gainedB = carWithLeader.distance - beforeB;
    expect(gainedB).toBeGreaterThan(gainedA);
  });

  it('same seed reproduces an identical race through AIRuntime', () => {
    const mk = (seed: number) => {
      const scene = new THREE.Scene();
      const rt = new AIRuntime({ scene, carCount: 3, tier: 'medium', seed, trackDistance: 2400 });
      rt.start();
      return rt;
    };
    const run = (rt: AIRuntime): number[] => {
      for (let i = 0; i < 150; i++) {
        rt.tick(0.016, 40 + i, 1.0, 0.0);
      }
      return rt
        .getSnapshots(40 + 150, 1)
        .filter((s) => !s.isPlayer)
        .map((s) => s.z);
    };
    const a = run(mk(1234));
    const b = run(mk(1234));
    const c = run(mk(5678));

    expect(a).toEqual(b);
    // Different seed ⇒ a different race (deterministic divergence).
    expect(c).not.toEqual(a);
  });
});
