/**
 * AIDecision — the AI's brain.
 *
 * Pure Perception → Decision → Action pipeline.
 * Returns desired speed and X offset — no Three.js, no DOM.
 *
 * Each AI car runs this independently every tick, giving organic,
 * non-synchronized behaviour across the grid.
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
  /** Current desired offset, carried over between frames for smooth interpolation. */
  currentDesiredOffset: number;
}

export function makeMemory(): AIMemory {
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
    currentDesiredOffset: pickRandomOffset(),
  };
}

function pickRandomOffset(): number {
  return OFFSETS[Math.floor(Math.random() * OFFSETS.length)];
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

export function decide(
  perc: PerceptionResult,
  pers: Personality,
  mem: AIMemory,
  raceTime: number,
  playerBaseSpeed: number,
  dt: number
): AIDecisionOutput {
  // ─── Tick memory cooldowns ─────────────────────────────────────────
  mem.draftCooldown = Math.max(0, mem.draftCooldown - dt);
  mem.overtakeTimer = Math.max(0, mem.overtakeTimer - dt);
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
  if (timeSinceMistake > 5 && Math.random() < pers.mistakeRate * dt) {
    mem.lastMistakeTime = raceTime;
    mem.mistakeDuration = 0.4 + Math.random() * 0.8;
    mem.mistakeTargetOffset = clampOffset(mem.currentDesiredOffset + (Math.random() - 0.5) * 4);
    return {
      intent: 'mistake',
      desiredSpeed: baseDesiredSpeed * 0.7,
      desiredOffset: mem.mistakeTargetOffset,
      boost: false,
    };
  }

  // ─── Ongoing overtake manoeuvre ────────────────────────────────────
  if (mem.overtakePhase !== 'none' && mem.overtakeTimer > 0) {
    return resolveOvertake(mem, baseDesiredSpeed, pers);
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
    Math.random() < pers.blockingFrequency * dt * 2
  ) {
    // Move to same lateral as player to block
    const blockOffset = nearestOffset(perc.player.x);
    mem.currentDesiredOffset = blockOffset;
    return {
      intent: 'block',
      desiredSpeed: baseDesiredSpeed * 0.95,
      desiredOffset: clampOffset(blockOffset),
      boost: false,
    };
  }

  // ─── Draft exploitation ────────────────────────────────────────────
  if (perc.draftZone === 'optimal' && mem.draftCooldown === 0 && Math.random() < pers.draftUsage * dt * 4) {
    return {
      intent: 'draft',
      desiredSpeed: baseDesiredSpeed * (1 + perc.draftBonus),
      desiredOffset: clampOffset(mem.currentDesiredOffset),
      boost: false,
    };
  }

  // ─── Overtake initiation ───────────────────────────────────────────
  if (perc.carAhead !== null && perc.distAhead < 6 && Math.random() < pers.aggression * dt * 3) {
    initiateOvertake(mem, perc, raceTime);
    return resolveOvertake(mem, baseDesiredSpeed, pers);
  }

  // ─── Attack / catch player ─────────────────────────────────────────
  if (perc.player && perc.distToPlayer < -8 && pers.aggression > 0.5) {
    return {
      intent: 'attack',
      desiredSpeed: baseDesiredSpeed * 1.06,
      desiredOffset: clampOffset(mem.currentDesiredOffset),
      boost: shouldBoost(mem, raceTime, pers),
    };
  }

  // ─── Boost logic ───────────────────────────────────────────────────
  const useBoost = shouldBoost(mem, raceTime, pers);

  // ─── Cruise ───────────────────────────────────────────────────────
  return {
    intent: 'cruise',
    desiredSpeed: baseDesiredSpeed * (1 + perc.draftBonus),
    desiredOffset: clampOffset(mem.currentDesiredOffset),
    boost: useBoost,
  };
}

function initiateOvertake(mem: AIMemory, perc: PerceptionResult, _raceTime: number): void {
  if (!perc.carAhead) return;
  mem.overtakePhase = 'move-out';
  mem.overtakeTimer = OVERTAKE_DURATION;
  // Pick the side with most clearance
  mem.overtakeTargetOffset =
    perc.carAhead.x > 0 ? offsetToLeft(perc.carAhead.x) : offsetToRight(perc.carAhead.x);
}

function resolveOvertake(mem: AIMemory, baseSpeed: number, pers: Personality): AIDecisionOutput {
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
    // Merge back and defend
    mem.overtakePhase = 'merge';
    mem.currentDesiredOffset = pickRandomOffset();
    return {
      intent: 'overtake',
      desiredSpeed: baseSpeed,
      desiredOffset: clampOffset(mem.currentDesiredOffset),
      boost: false,
    };
  }
}

function shouldBoost(mem: AIMemory, raceTime: number, pers: Personality): boolean {
  const timeSinceBoost = raceTime - mem.lastBoostTime;
  if (timeSinceBoost < BOOST_COOLDOWN / pers.boostStrategy) return false;
  if (Math.random() < pers.boostStrategy * 0.02) {
    mem.lastBoostTime = raceTime;
    return true;
  }
  return false;
}
