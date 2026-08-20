/**
 * Collision juice (hit-stop + slow-mo) for Survival mode.
 * Deterministic timers that produce a timeScale for the world update.
 * hit-stop: full freeze (timeScale=0)
 * slow-mo: timeScale = SLOW_MO_SCALE (0.25)
 * Total crash window: HIT_STOP_DURATION + SLOW_MO_DURATION ≈ 0.48s
 */

export const HIT_STOP_DURATION = 0.08; // seconds of full freeze
export const SLOW_MO_DURATION = 0.4; // seconds of slow-motion
export const SLOW_MO_SCALE = 0.25; // world time scale during slow-mo

export type CrashPhase = 'idle' | 'hitstop' | 'slowmo' | 'done';

export interface CrashState {
  phase: CrashPhase;
  timeLeft: number;
  timeScale: number;
}

/**
 * Collision juice state machine for Survival mode.
 * Activated on collision (when not invulnerable).
 * Produces timeScale and phase for rendering/world update.
 * Does NOT set gameOver; the caller must transition after 'done' phase.
 */
export class CollisionJuice {
  private phase: CrashPhase = 'idle';
  private phaseTimeLeft = 0;

  get state(): CrashState {
    let timeScale = 1;
    let timeLeft = 0;
    if (this.phase === 'hitstop') {
      timeScale = 0;
      timeLeft = this.phaseTimeLeft;
    } else if (this.phase === 'slowmo') {
      timeScale = SLOW_MO_SCALE;
      timeLeft = this.phaseTimeLeft;
    } else if (this.phase === 'done') {
      timeScale = 1;
      timeLeft = 0;
    }
    return { phase: this.phase, timeLeft, timeScale };
  }

  /** Start the crash sequence. */
  activate(): void {
    this.phase = 'hitstop';
    this.phaseTimeLeft = HIT_STOP_DURATION;
  }

  /** Tick with real delta (seconds). Returns true if crash is active. */
  tick(realDelta: number): boolean {
    if (this.phase === 'idle') return false;

    let remainingDelta = realDelta;
    let currentPhase = this.phase;
    while (remainingDelta > 0 && currentPhase !== 'done') {
      if (currentPhase === 'hitstop') {
        const used = Math.min(this.phaseTimeLeft, remainingDelta);
        this.phaseTimeLeft -= used;
        remainingDelta -= used;
        if (this.phaseTimeLeft <= 0) {
          this.phase = 'slowmo';
          this.phaseTimeLeft = SLOW_MO_DURATION;
          currentPhase = 'slowmo';
        }
      } else if (currentPhase === 'slowmo') {
        const used = Math.min(this.phaseTimeLeft, remainingDelta);
        this.phaseTimeLeft -= used;
        remainingDelta -= used;
        if (this.phaseTimeLeft <= 0) {
          this.phase = 'done';
          this.phaseTimeLeft = 0;
          currentPhase = 'done';
        }
      }
    }
    return this.phase === 'hitstop' || this.phase === 'slowmo' || this.phase === 'done';
  }

  /** Called when the crash sequence completes and gameOver should be set. */
  consumeDone(): boolean {
    if (this.phase === 'done') {
      this.phase = 'idle';
      this.phaseTimeLeft = 0;
      return true;
    }
    return false;
  }

  reset(): void {
    this.phase = 'idle';
    this.phaseTimeLeft = 0;
  }

  isActive(): boolean {
    return this.phase === 'hitstop' || this.phase === 'slowmo' || this.phase === 'done';
  }
}
