/**
 * AIDecision — the AI's brain.
 *
 * Pure Perception → Decision → Action pipeline.
 * Returns desired speed and X offset — no Three.js, no DOM.
 *
 * Each AI car runs this independently every tick, giving organic,
 * non-synchronized behaviour across the grid.
 *
 * All randomness flows through an injected RNG (`rng`), so decisions
 * are fully deterministic for a given state + seed. Defaults to
 * Math.random for callers that don't need reproducibility.
 */
import type { Personality } from './AIPersonality';
import type { PerceptionResult } from './AIPerception';

export type AIIntent =
  'cruise' | 'attack' | 'defend' | 'draft' | 'block' | 'overtake' | 'recover' | 'mistake';

export interface AIDecisionOutput {
  intent: AIIntent;
  /** Desired normalised speed (0–1 scale of maxSpeed). */
  desiredSpeed: number;
  /** Desired lateral offset from track centre (metres). */
  desiredOffset: number;
  /** Apply boost this frame? */
  boost: boolean;
}

/** Valid lateral offsets — spline offsets, not hard lanes. */
const OFFSETS = [-2.8, -1.7, 0.0, 1.4, 2.5];

export interface AIMemory {
  /** Who overtook us last (entity id). */
  lastOvertakenBy: string | null;
  /** Who we are targeting. */
  chasingId: string | null;
  /** Race clock at last collision. */
  lastCollisionTime: number;
  /** Race clock at last mistake. */
  lastMistakeTime: number;
  /** Race clock at last boost usage. */
  lastBoostTime: number;
  /** Duration of current mistake manoeuvre. */
  mistakeDuration: number;
  /** Current mistake lateral target. */
  mistakeTargetOffset: number;
  /** Cooldown remaining on slipstream before next draft attempt (seconds). */
  draftCooldown: number;
  /** Current phase of an overtake manoeuvre. */
  overtakePhase: 'none' | 'move-out' | 'accelerate' | 'pass' | 'merge' | 'defend';
  overtakeTimer: number;
  overtakeTargetOffset: number;
  /** Seconds remaining before another overtake may be initiated. */
  overtakeCooldown: number;
  /** Seconds remaining before another block may be attempted. */
  blockCooldown: number;
  /** Current desired offset, carried over between frames for smooth interpolation. */
  currentDesiredOffset: number;
}

export function makeMemory(rng: () => number = Math.random): AIMemory {
  return {
    lastOvertakenBy: null,
    chasingId: null,
    lastCollisionTime: -999,
    lastMistakeTime: -999,
    lastBoostTime: -999,
    mistakeDuration: 0,
    mistakeTargetOffset: 0,
    draftCooldown: 0,
    overtakePhase: 'none',
    overtakeTimer: 0,
    overtakeTargetOffset: 0,
    overtakeCooldown: 0,
    blockCooldown: 0,
    currentDesiredOffset: pickRandomOffset(rng),
  };
}

function pickRandomOffset(rng: () => number): number {
  return OFFSETS[Math.floor(rng() * OFFSETS.length)];
}

function nearestOffset(x: number): number {
  return OFFSETS.reduce((prev, curr) => (Math.abs(curr - x) < Math.abs(prev - x) ? curr : prev));
}

function offsetToLeft(current: number): number {
  const idx = OFFSETS.indexOf(nearestOffset(current));
  return OFFSETS[Math.max(0, idx - 1)];
}

function offsetToRight(current: number): number {
  const idx = OFFSETS.indexOf(nearestOffset(current));
  return OFFSETS[Math.min(OFFSETS.length - 1, idx + 1)];
}

/** Clamp lateral offset to track bounds. */
function clampOffset(x: number): number {
  return Math.max(-3.2, Math.min(3.2, x));
}

const BOOST_COOLDOWN = 5.0; // seconds between boosts
const OVERTAKE_DURATION = 2.5; // seconds for a full overtake sequence
/** Hysteresis window after an overtake completes before the next is allowed. */
const OVERTAKE_COOLDOWN = 3.0;
/** Hysteresis window between block attempts. */
const BLOCK_COOLDOWN = 1.5;
/** Cooldown imposed on the slipstream once an AI exploits its draft. */
const DRAFT_USAGE_COOLDOWN = 4.0;
/** Minimum gap (metres) before an overtake is physically sensible. */
const MIN_OVERTAKE_GAP = 1.2;

export function decide(
  perc: PerceptionResult,
  pers: Personality,
  mem: AIMemory,
  raceTime: number,
  playerBaseSpeed: number,
  dt: number,
  rng: () => number = Math.random
): AIDecisionOutput {
  // ─── Tick memory cooldowns ─────────────────────────────────────────
  mem.draftCooldown = Math.max(0, mem.draftCooldown - dt);
  mem.overtakeTimer = Math.max(0, mem.overtakeTimer - dt);
  mem.overtakeCooldown = Math.max(0, mem.overtakeCooldown - dt);
  mem.blockCooldown = Math.max(0, mem.blockCooldown - dt);
  mem.mistakeDuration = Math.max(0, mem.mistakeDuration - dt);

  const baseDesiredSpeed = playerBaseSpeed * pers.speedFactor;

  // ─── Mistake override ──────────────────────────────────────────────
  if (mem.mistakeDuration > 0) {
    return {
      intent: 'mistake',
      desiredSpeed: baseDesiredSpeed * 0.7,
      desiredOffset: clampOffset(mem.mistakeTargetOffset),
      boost: false,
    };
  }

  // ─── Random mistake trigger ────────────────────────────────────────
  const timeSinceMistake = raceTime - mem.lastMistakeTime;
  if (timeSinceMistake > 5 && rng() < pers.mistakeRate * dt) {
    mem.lastMistakeTime = raceTime;
    mem.mistakeDuration = 0.4 + rng() * 0.8;
    mem.mistakeTargetOffset = clampOffset(mem.currentDesiredOffset + (rng() - 0.5) * 4);
    return {
      intent: 'mistake',
      desiredSpeed: baseDesiredSpeed * 0.7,
      desiredOffset: mem.mistakeTargetOffset,
      boost: false,
    };
  }

  // ─── Ongoing overtake manoeuvre ────────────────────────────────────
  if (mem.overtakePhase !== 'none' && mem.overtakeTimer > 0) {
    return resolveOvertake(mem, baseDesiredSpeed, pers, rng);
  }

  // ─── Collision avoidance (highest priority after mistakes) ────────
  if (perc.collisionImminent && perc.carAhead) {
    const targetX = perc.carAhead.x;
    const sideOffset =
      targetX > 0 ? offsetToLeft(mem.currentDesiredOffset) : offsetToRight(mem.currentDesiredOffset);

    return {
      intent: 'overtake',
      desiredSpeed: baseDesiredSpeed * 0.88,
      desiredOffset: clampOffset(sideOffset),
      boost: false,
    };
  }

  // ─── Blocking (player directly behind within threshold) ──────────
  if (
    perc.player &&
    perc.distToPlayer < 0 && // player is behind
    Math.abs(perc.distToPlayer) < 5 &&
    mem.blockCooldown === 0 &&
    // Yield: never block a player who is clearly faster — that is an
    // unfair permanent block, not defence.
    perc.speedDeltaToPlayer > -0.15 &&
    rng() < pers.blockingFrequency * dt * 2
  ) {
    // Move to same lateral as player to block
    const blockOffset = nearestOffset(perc.player.x);
    mem.currentDesiredOffset = blockOffset;
    mem.blockCooldown = BLOCK_COOLDOWN; // anti-spam hysteresis
    return {
      intent: 'block',
      desiredSpeed: baseDesiredSpeed * 0.95,
      desiredOffset: clampOffset(blockOffset),
      boost: false,
    };
  }

  // ─── Draft exploitation ────────────────────────────────────────────
  const draftChance =
    perc.draftZone === 'optimal'
      ? pers.draftUsage * dt * 4
      : perc.draftZone === 'entry' && pers.draftUsage > 0.7
        ? pers.draftUsage * dt * 2.5
        : 0;

  if (draftChance > 0 && mem.draftCooldown === 0 && !perc.collisionImminent && rng() < draftChance) {
    mem.draftCooldown = DRAFT_USAGE_COOLDOWN; // consume the slipstream window
    return {
      intent: 'draft',
      desiredSpeed: baseDesiredSpeed * (1 + perc.draftBonus),
      desiredOffset: clampOffset(mem.currentDesiredOffset),
      boost: false,
    };
  }

  // ─── Overtake initiation ───────────────────────────────────────────
  // Requires a real, safe gap (not an already-overlapping bumper) plus
  // an open hysteresis window so overtakes don't flip-flop every frame.
  if (
    perc.carAhead !== null &&
    perc.distAhead >= MIN_OVERTAKE_GAP &&
    perc.distAhead < 6 &&
    mem.overtakeCooldown === 0 &&
    rng() < pers.aggression * dt * 3
  ) {
    initiateOvertake(mem, perc);
    return resolveOvertake(mem, baseDesiredSpeed, pers, rng);
  }

  // ─── Attack / catch player ─────────────────────────────────────────
  if (perc.player && perc.distToPlayer < -8 && pers.aggression > 0.5) {
    return {
      intent: 'attack',
      desiredSpeed: baseDesiredSpeed * 1.06,
      desiredOffset: clampOffset(mem.currentDesiredOffset),
      boost: shouldBoost(mem, raceTime, pers, rng),
    };
  }

  // ─── Boost logic ───────────────────────────────────────────────────
  const useBoost = shouldBoost(mem, raceTime, pers, rng);

  // ─── Cruise ───────────────────────────────────────────────────────
  return {
    intent: 'cruise',
    desiredSpeed: baseDesiredSpeed * (1 + perc.draftBonus),
    desiredOffset: clampOffset(mem.currentDesiredOffset),
    boost: useBoost,
  };
}

function initiateOvertake(mem: AIMemory, perc: PerceptionResult): void {
  if (!perc.carAhead) return;
  mem.overtakePhase = 'move-out';
  mem.overtakeTimer = OVERTAKE_DURATION;
  // Pick the side with most clearance (deterministic given same state)
  mem.overtakeTargetOffset =
    perc.carAhead.x > 0 ? offsetToLeft(perc.carAhead.x) : offsetToRight(perc.carAhead.x);
}

function resolveOvertake(
  mem: AIMemory,
  baseSpeed: number,
  pers: Personality,
  rng: () => number
): AIDecisionOutput {
  const progress = 1 - mem.overtakeTimer / OVERTAKE_DURATION;

  if (progress < 0.25) {
    mem.overtakePhase = 'move-out';
    return {
      intent: 'overtake',
      desiredSpeed: baseSpeed * 0.92,
      desiredOffset: clampOffset(mem.overtakeTargetOffset),
      boost: false,
    };
  } else if (progress < 0.6) {
    mem.overtakePhase = 'accelerate';
    return {
      intent: 'overtake',
      desiredSpeed: baseSpeed * (1.0 + pers.aggression * 0.12),
      desiredOffset: clampOffset(mem.overtakeTargetOffset),
      boost: true,
    };
  } else if (progress < 0.8) {
    mem.overtakePhase = 'pass';
    return {
      intent: 'overtake',
      desiredSpeed: baseSpeed * (1.0 + pers.aggression * 0.1),
      desiredOffset: clampOffset(mem.overtakeTargetOffset),
      boost: false,
    };
  } else {
    // Merge back and defend — impose a cooldown so the overtaker
    // doesn't immediately re-initiate into a new passing move.
    mem.overtakePhase = 'merge';
    mem.currentDesiredOffset = pickRandomOffset(rng);
    mem.overtakeCooldown = OVERTAKE_COOLDOWN;
    return {
      intent: 'overtake',
      desiredSpeed: baseSpeed,
      desiredOffset: clampOffset(mem.currentDesiredOffset),
      boost: false,
    };
  }
}

function shouldBoost(mem: AIMemory, raceTime: number, pers: Personality, rng: () => number): boolean {
  const timeSinceBoost = raceTime - mem.lastBoostTime;
  if (timeSinceBoost < BOOST_COOLDOWN / pers.boostStrategy) return false;
  if (rng() < pers.boostStrategy * 0.02) {
    mem.lastBoostTime = raceTime;
    return true;
  }
  return false;
}
