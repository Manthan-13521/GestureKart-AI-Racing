/**
 * Dynamic difficulty for Survival mode.
 * Replaces the linear time-based ramp with deterministic wave cycles
 * and distance-milestone speed cap progression.
 */

export const WAVE_DURATION = 30; // seconds per full wave cycle
export const WAVE_INTENSE_START = 12; // intense phase begins (seconds into wave)
export const WAVE_INTENSE_END = 22; // intense phase ends
export const MIN_SPAWN_INTERVAL = 18;
export const BASE_SPAWN_INTERVAL = 120;
export const WAVE_SPAWN_BONUS = 60; // max spawn reduction during intense
export const MILESTONE_SPAWN_BONUS = 12; // spawn reduction per milestone

export const MAX_SPEED_BASE = 2.0;
export const SPEED_CAP_PER_MILESTONE = 0.4;
export const MILESTONE_DISTANCE = 500; // playerDistance units per milestone
export const MAX_SPEED_CAP = 6.0; // hard cap

/**
 * Returns the wave intensity at time t (seconds), 0..1.
 * Trapezoidal: 0..1 ramp during calm→intense, hold 1, 1..0 ramp during intense→calm.
 */
export function waveIntensity(t: number): number {
  const phase = t % WAVE_DURATION;
  if (phase < WAVE_INTENSE_START) {
    return phase / WAVE_INTENSE_START; // 0 -> 1
  }
  if (phase < WAVE_INTENSE_END) {
    return 1;
  }
  return 1 - (phase - WAVE_INTENSE_END) / (WAVE_DURATION - WAVE_INTENSE_END); // 1 -> 0
}

/**
 * Returns the composite difficulty factor at time t (0..1+).
 * Base 0.2 + waveIntensity * 0.8, capped at 1.0 for spawn calculations.
 */
export function difficultyFactor(t: number): number {
  const wave = waveIntensity(t);
  return Math.min(1.0, 0.2 + wave * 0.8);
}

/**
 * Returns the milestone index for the given cumulative distance.
 * Milestones are at multiples of MILESTONE_DISTANCE.
 */
export function milestoneFor(distance: number): number {
  return Math.floor(distance / MILESTONE_DISTANCE);
}

/**
 * Returns the maximum speed cap for the given distance.
 * Progressively raises the cap using distance milestones.
 */
export function maxSpeedFor(distance: number): number {
  const milestone = milestoneFor(distance);
  return Math.min(MAX_SPEED_CAP, MAX_SPEED_BASE + milestone * SPEED_CAP_PER_MILESTONE);
}

/**
 * Returns the obstacle spawn interval at time t and distance.
 * Combines wave-based intensity and distance milestones.
 * Deterministic and smooth.
 */
export function spawnIntervalFor(t: number, distance: number): number {
  const wave = difficultyFactor(t);
  const milestone = milestoneFor(distance);
  const interval = BASE_SPAWN_INTERVAL - wave * WAVE_SPAWN_BONUS - milestone * MILESTONE_SPAWN_BONUS;
  return Math.max(MIN_SPAWN_INTERVAL, interval);
}
