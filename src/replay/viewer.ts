/**
 * P10 — Replay viewer camera controller.
 *
 * Pure math with zero THREE/WebGL dependency so it is trivially unit-testable.
 * Drives the FREE camera (WASD translate + pointer yaw/pitch) and the slow-mo
 * time scale used by the replay viewer. `main.ts` copies the resulting state
 * into `Game.freeCameraPos` / `Game.freeCameraRot` each frame.
 */

export interface FreeCameraState {
  x: number;
  y: number;
  z: number;
  /** Yaw around the world Y axis, radians. */
  yaw: number;
  /** Pitch around the world X axis, radians. */
  pitch: number;
}

/** Movement intents projected from WASD / arrow keys. */
export interface ViewerKeys {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
}

/** Slow-mo playback rate when active (0.35 = just over a third speed). */
export const SLOW_MO_SCALE = 0.35;

const MOVE_SPEED = 8;
const YAW_SPEED = 0.004;
const PITCH_SPEED = 0.004;
const PITCH_LIMIT = 1.35;
const BOUNDS = { xMin: -30, xMax: 30, yMin: 0.5, yMax: 20, zMin: -120, zMax: 6 };

export const VIEWER_DEFAULTS: FreeCameraState = {
  x: 0,
  y: 3,
  z: -8,
  yaw: 0,
  pitch: -0.15,
};

/**
 * Deterministic free-camera step. Translates along the yaw-rotated ground
 * plane (pitch only tilts the view, it never alters movement), clamps the
 * position into the world bounds and clamps pitch.
 */
export function stepFreeCamera(state: FreeCameraState, keys: ViewerKeys, dt: number): FreeCameraState {
  const forward = (keys.forward ? 1 : 0) - (keys.back ? 1 : 0);
  const strafe = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (forward === 0 && strafe === 0) return state;

  // Camera looks down -Z at yaw=0, so forward = (-sin, 0, -cos), right = (cos, 0, -sin).
  const sy = Math.sin(state.yaw);
  const cy = Math.cos(state.yaw);
  const fx = -sy;
  const fz = -cy;
  const rx = cy;
  const rz = -sy;

  const d = MOVE_SPEED * Math.max(0, Math.min(0.1, dt));
  const nx = state.x + (fx * forward + rx * strafe) * d;
  const nz = state.z + (fz * forward + rz * strafe) * d;

  return {
    ...state,
    x: clamp(nx, BOUNDS.xMin, BOUNDS.xMax),
    z: clamp(nz, BOUNDS.zMin, BOUNDS.zMax),
    y: clamp(state.y, BOUNDS.yMin, BOUNDS.yMax),
  };
}

/** Pointer-drag look: dx/yaw and dy/pitch, both clamped. */
export function lookFreeCamera(state: FreeCameraState, dx: number, dy: number): FreeCameraState {
  return {
    ...state,
    yaw: wrapYaw(state.yaw + dx * YAW_SPEED),
    pitch: clamp(state.pitch - dy * PITCH_SPEED, -PITCH_LIMIT, PITCH_LIMIT),
  };
}

/** Apply slow-mo time scale to a per-frame delta (identity when inactive). */
export function slowMoDelta(dt: number, active: boolean): number {
  return dt * (active ? SLOW_MO_SCALE : 1);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function wrapYaw(yaw: number): number {
  const tau = Math.PI * 2;
  return ((yaw % tau) + tau) % tau;
}
