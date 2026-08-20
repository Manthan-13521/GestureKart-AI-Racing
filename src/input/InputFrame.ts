/**
 * Unified normalized control frame produced by the Input Manager (GDD §6.2).
 *
 * All gameplay input flows through this single contract. Raw device state
 * (keys, touch buttons, tilt, hand landmarks, phone packets) is projected
 * into a normalized frame by an `InputSource`; `InputManager.frame()`
 * composes the active sources into one frame per game tick.
 *
 * `throttle` is encoded as handsDetected / 2 (0 → 0 hands, 0.5 → 1 hand,
 * 1 → 2 hands) so the existing `Game.setHandData()` adapter round-trips
 * exactly. `brake` and `boostButton` are reserved by the contract and are
 * currently unused by the physics.
 */
export interface InputFrame {
  /** Steering, -1 (hard left) .. 1 (hard right). */
  steer: number;
  /** Throttle, 0..1 (0, 0.5, 1 map to 0 / 1 / 2 detected hands). */
  throttle: number;
  /** Brake, 0..1 (reserved — unused by current physics). */
  brake: number;
  /** Boost button (reserved — unused by current physics). */
  boostButton: boolean;
}

export type InputSourceId = 'keyboard' | 'touch' | 'gyro' | 'hand' | 'phone' | 'gamepad' | 'replay';

/** The layer that produced the most recent frame — drives loop side effects. */
export type InputLayer = 'phone' | 'auto' | 'gyro' | 'base' | 'replay';

/** A device input adapter: projects raw device state into a normalized frame. */
export interface InputSource {
  readonly id: InputSourceId;
  /** Whether the source can currently contribute (e.g. phone connected). */
  isAvailable(): boolean;
  /** Project the source's current device state into a normalized frame. */
  read(): InputFrame;
}

export const NEUTRAL_FRAME: InputFrame = { steer: 0, throttle: 0, brake: 0, boostButton: false };

/**
 * Center-of-screen gain for the phone/gyro sources (×0.4 each side).
 * Preserves the legacy `centerX = 0.5 + value * 0.4` mapping: steer = value * 0.8.
 */
export const STEER_GAIN = 0.8;

export function steerFromCenterX(centerX: number): number {
  return (centerX - 0.5) * 2;
}

export function centerFromSteer(steer: number): number {
  return Math.max(0, Math.min(1, steer * 0.5 + 0.5));
}

/** Inverse of the throttle encoding: 0/0.5/1 → 0/1/2 hands. */
export function handsFromThrottle(throttle: number): number {
  const t = Number.isFinite(throttle) ? Math.max(0, Math.min(1, throttle)) : 0;
  return Math.round(t * 2);
}

export function frameFromHandData(centerX: number, handsDetected: number): InputFrame {
  return {
    steer: steerFromCenterX(centerX),
    throttle: Math.max(0, Math.min(2, handsDetected)) / 2,
    brake: 0,
    boostButton: false,
  };
}

const clamp = (v: number, min: number, max: number): number =>
  Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : min;

/** Normalize a frame into its valid ranges (steer -1..1, throttle/brake 0..1). */
export function clampFrame(frame: InputFrame): InputFrame {
  return {
    steer: clamp(frame.steer, -1, 1),
    throttle: clamp(frame.throttle, 0, 1),
    brake: clamp(frame.brake, 0, 1),
    boostButton: !!frame.boostButton,
  };
}
