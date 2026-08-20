import type { ModeId, TrackId } from '../../game/GameModeConfig';
import type { InputFrame } from '../../input/InputFrame';

/**
 * P9 — input-based replay model.
 *
 * A replay is the NORMALIZED control timeline of one completed race:
 * one quantized `InputFrame` per game-loop iteration between GO and
 * game-over, plus the fixed metadata required to reproduce the setup
 * (seed, mode, track, sensitivity, traffic flag).
 *
 * Deliberately NOT recorded: DOM events, coordinates, landmarks,
 * sensor values — only the resolved control output, so playback is
 * device-agnostic and the timeline is exactly what the physics saw.
 */
export const INPUT_REPLAY_VERSION = 1;
/** Minimum frames for a replay to be worth playing (1 s at 60 Hz). */
export const INPUT_REPLAY_MIN_FRAMES = 60;
/** Absolute cap (240 s at 60 Hz) — a real race records far fewer. */
export const INPUT_REPLAY_MAX_FRAMES = 14400;

export interface InputReplayData {
  version: typeof INPUT_REPLAY_VERSION;
  /** Unique identity for this recording (not the race gate id). */
  replayId: string;
  mode: ModeId;
  track: TrackId;
  /** Race seed: AI grid + traffic/pickup RNG setup (1337 for AI races). */
  seed: number;
  /** Steering sensitivity applied during the original run. */
  sensitivity: number;
  /** Whether obstacle spawning was enabled during the original run. */
  trafficEnabled: boolean;
  /** Race-clock seconds at the moment the race ended. */
  duration: number;
  /** Final score (metadata only — never used by playback). */
  score: number;
  frames: number;
  /** Race-clock ticks (1/60 s) per recorded frame — monotonic non-decreasing. */
  ticks: Uint16Array;
  /** steer ×100, range -100..100. */
  steers: Int8Array;
  /** throttle ×100, range 0..100. */
  throttles: Uint8Array;
  /** brake ×100, range 0..100. */
  brakes: Uint8Array;
  /** boost flag (0/1). */
  boosts: Uint8Array;
}

export const NEUTRAL_INPUT_FRAME: InputFrame = { steer: 0, throttle: 0, brake: 0, boostButton: false };

let replayIdCounter = 0;

/** Collision-resistant-enough session identity (crypto UUID when available). */
export function createReplayId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  replayIdCounter += 1;
  return `replay-${Date.now().toString(36)}-${replayIdCounter}`;
}

export function quantizeSteer(steer: number): number {
  return Math.max(-100, Math.min(100, Math.round(steer * 100)));
}

export function dequantizeSteer(q: number): number {
  return q / 100;
}

export function quantizeUnit(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

export function dequantizeUnit(q: number): number {
  return q / 100;
}

/** Encode one normalized frame into its quantized storage form. */
export function encodeInputFrame(
  frame: InputFrame,
  steerQ: Int8Array,
  throttleQ: Uint8Array,
  brakeQ: Uint8Array,
  boostQ: Uint8Array,
  index: number
): void {
  steerQ[index] = quantizeSteer(frame.steer);
  throttleQ[index] = quantizeUnit(frame.throttle);
  brakeQ[index] = quantizeUnit(frame.brake);
  boostQ[index] = frame.boostButton ? 1 : 0;
}

/** Decode one stored frame back into a normalized control frame. */
export function decodeInputFrame(
  steerQ: Int8Array,
  throttleQ: Uint8Array,
  brakeQ: Uint8Array,
  boostQ: Uint8Array,
  index: number
): InputFrame {
  return {
    steer: dequantizeSteer(steerQ[index]),
    throttle: dequantizeUnit(throttleQ[index]),
    brake: dequantizeUnit(brakeQ[index]),
    boostButton: boostQ[index] !== 0,
  };
}

export interface InputReplayValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Boundary validation for replay payloads. Malformed data fails safely:
 * playback refuses to start and the UI never offers the replay.
 */
export function validateInputReplay(data: unknown): InputReplayValidation {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['replay is not an object'] };
  }
  const r = data as Partial<InputReplayData>;

  if (r.version !== INPUT_REPLAY_VERSION) errors.push(`unsupported version: ${String(r.version)}`);
  if (typeof r.replayId !== 'string' || r.replayId.length === 0) errors.push('replayId missing');

  if (r.mode !== 'versus' && r.mode !== 'multiplayer' && r.mode !== 'ai-race' && r.mode !== 'survival') {
    errors.push(`invalid mode: ${String(r.mode)}`);
  }
  if (r.track !== 'cyber-city' && r.track !== 'mountain-highway' && r.track !== 'space-highway') {
    errors.push(`invalid track: ${String(r.track)}`);
  }

  if (!Number.isInteger(r.seed) || (r.seed as number) < 0) errors.push('invalid seed');
  if (!Number.isFinite(r.sensitivity) || (r.sensitivity as number) < 0 || (r.sensitivity as number) > 100) {
    errors.push('invalid sensitivity');
  }
  if (typeof r.trafficEnabled !== 'boolean') errors.push('invalid trafficEnabled');
  if (!Number.isFinite(r.duration) || (r.duration as number) <= 0) errors.push('invalid duration');
  if (!Number.isFinite(r.score) || (r.score as number) < 0) errors.push('invalid score');

  const frames = r.frames;
  if (
    !Number.isInteger(frames) ||
    (frames as number) < INPUT_REPLAY_MIN_FRAMES ||
    (frames as number) > INPUT_REPLAY_MAX_FRAMES
  ) {
    errors.push(`invalid frame count: ${String(frames)}`);
  }

  const arraysOk =
    r.ticks instanceof Uint16Array &&
    r.steers instanceof Int8Array &&
    r.throttles instanceof Uint8Array &&
    r.brakes instanceof Uint8Array &&
    r.boosts instanceof Uint8Array;
  if (!arraysOk) {
    errors.push('frame arrays are missing or of the wrong type');
    return { valid: false, errors };
  }

  // Narrowed after the arraysOk guard above.
  const ticks = r.ticks as Uint16Array;
  const steers = r.steers as Int8Array;
  const throttles = r.throttles as Uint8Array;
  const brakes = r.brakes as Uint8Array;
  const boosts = r.boosts as Uint8Array;

  if (
    ticks.length < (frames as number) ||
    steers.length < (frames as number) ||
    throttles.length < (frames as number) ||
    brakes.length < (frames as number) ||
    boosts.length < (frames as number)
  ) {
    errors.push('frame arrays shorter than declared frame count');
    return { valid: false, errors };
  }

  let prevTick = -1;
  for (let i = 0; i < (frames as number); i++) {
    const tick = ticks[i];
    if (tick < prevTick) {
      errors.push(`non-monotonic tick at frame ${i}`);
      break;
    }
    prevTick = tick;
    if (steers[i] < -100 || steers[i] > 100) {
      errors.push(`out-of-range steer at frame ${i}`);
      break;
    }
    if (throttles[i] < 0 || throttles[i] > 100) {
      errors.push(`out-of-range throttle at frame ${i}`);
      break;
    }
    if (brakes[i] < 0 || brakes[i] > 100) {
      errors.push(`out-of-range brake at frame ${i}`);
      break;
    }
    if (boosts[i] !== 0 && boosts[i] !== 1) {
      errors.push(`invalid boost at frame ${i}`);
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}
