import type { ModeId, TrackId } from '../../game/GameModeConfig';
import type { InputFrame } from '../../input/InputFrame';
import { clampFrame } from '../../input/InputFrame';
import {
  INPUT_REPLAY_MAX_FRAMES,
  INPUT_REPLAY_MIN_FRAMES,
  INPUT_REPLAY_VERSION,
  createReplayId,
  encodeInputFrame,
  type InputReplayData,
} from './types';

export interface InputReplayMeta {
  mode: ModeId;
  track: TrackId;
  seed: number;
  sensitivity: number;
  trafficEnabled: boolean;
  /** Race-clock seconds budget (Game.RACE_DURATION). */
  duration: number;
}

/**
 * P9 — input replay recorder.
 *
 * Captures the resolved normalized `InputFrame` once per game-loop
 * iteration, from GO until the authoritative game-over observation.
 * Storage is preallocated typed arrays (zero per-frame allocation),
 * frames are clamped to the contract ranges, and the finished payload
 * is a fresh defensive copy — a subsequent `begin()` can never corrupt
 * an already returned replay.
 *
 * Recording is passive: it never touches RaceResultGate, never persists
 * anything, and an abandoned race is simply discarded via `abort()`.
 */
export class InputReplayRecorder {
  private active = false;
  private meta: InputReplayMeta | null = null;
  private count = 0;

  private ticks = new Uint16Array(INPUT_REPLAY_MAX_FRAMES);
  private steers = new Int8Array(INPUT_REPLAY_MAX_FRAMES);
  private throttles = new Uint8Array(INPUT_REPLAY_MAX_FRAMES);
  private brakes = new Uint8Array(INPUT_REPLAY_MAX_FRAMES);
  private boosts = new Uint8Array(INPUT_REPLAY_MAX_FRAMES);

  get isActive(): boolean {
    return this.active;
  }

  get frameCount(): number {
    return this.count;
  }

  /** Start a fresh recording. Resets all state — safe to call between races. */
  begin(meta: InputReplayMeta): void {
    this.active = true;
    this.meta = meta;
    this.count = 0;
  }

  /**
   * Capture one normalized frame + its race-clock tick. No-op unless a
   * recording is active; frames beyond the cap are dropped safely.
   */
  record(frame: InputFrame, raceTime: number): void {
    if (!this.active || this.count >= INPUT_REPLAY_MAX_FRAMES) return;
    const f = clampFrame(frame);
    const tick = Math.max(0, Math.min(0xffff, Math.round(raceTime * 60)));
    this.ticks[this.count] = tick;
    encodeInputFrame(f, this.steers, this.throttles, this.brakes, this.boosts, this.count);
    this.count += 1;
  }

  /**
   * Finalize the recording. Returns a defensive copy of the replay, or
   * null when too short to be useful. Finalizes exactly once — the
   * second call returns null.
   */
  finish(score: number, duration: number): InputReplayData | null {
    if (!this.active) return null;
    this.active = false;
    const meta = this.meta;
    if (!meta || this.count < INPUT_REPLAY_MIN_FRAMES) {
      this.meta = null;
      return null;
    }

    const n = this.count;
    const data: InputReplayData = {
      version: INPUT_REPLAY_VERSION,
      replayId: createReplayId(),
      mode: meta.mode,
      track: meta.track,
      seed: meta.seed,
      sensitivity: meta.sensitivity,
      trafficEnabled: meta.trafficEnabled,
      duration,
      score: Math.max(0, Math.floor(score)),
      frames: n,
      ticks: this.ticks.slice(0, n),
      steers: this.steers.slice(0, n),
      throttles: this.throttles.slice(0, n),
      brakes: this.brakes.slice(0, n),
      boosts: this.boosts.slice(0, n),
    };
    this.meta = null;
    return data;
  }

  /** Discard the in-progress recording (abandoned race / navigation away). */
  abort(): void {
    this.active = false;
    this.meta = null;
    this.count = 0;
  }
}
