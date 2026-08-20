/**
 * Deterministic pre-race camera/vehicle staging timeline (P2.1).
 *
 * Owns the cinematic sweep that plays after `ready` and before the countdown.
 * The timeline is pure: it does not render or own timers, so it can be driven
 * from the existing render loop (one `update(now)` call per frame) and can be
 * cancelled without leaked callbacks.
 *
 *   begin()        → target.prepare(), timeline armed (reduced motion skips
 *                    straight to settle/complete on the same logical path).
 *   update(now)    → target.frame(p) with p ∈ [0, 1] following the clock.
 *   completion     → target.settle() + onComplete() exactly once.
 *   cancel()       → target.settle(), onComplete() is never called.
 *
 * Determinism: progress is derived from an injectable clock, and `begin()`
 * is a no-op while already active, so staging can never start twice.
 */

export interface RaceIntroTarget {
  /** One-time setup when staging begins (switch camera, place the vehicle). */
  prepare(): void;
  /** Per-frame staging update; `p` is eased-less progress in [0, 1]. */
  frame(p: number): void;
  /** Restore the racing camera/vehicle once staging settles or is cancelled. */
  settle(): void;
}

export interface RaceIntroOptions {
  /** Staging length in ms for a full sweep. Defaults to 1600. */
  duration?: number;
  /** Clock override (tests). Defaults to `performance.now`. */
  now?: () => number;
  /** Shorten/skip the camera movement while preserving the same sequence. */
  reducedMotion?: boolean;
}

export class RaceIntro {
  private readonly defaultDuration: number;
  private readonly defaultNow: () => number;
  private readonly defaultReducedMotion: boolean;

  private _active = false;
  private _progress = 0;
  private onComplete: (() => void) | null = null;
  private startTime = 0;
  private duration = 1600;
  private reducedMotion = false;
  private now: () => number;

  constructor(
    private readonly target: RaceIntroTarget,
    options: RaceIntroOptions = {}
  ) {
    this.defaultDuration = options.duration ?? 1600;
    this.defaultNow = options.now ?? (() => performance.now());
    this.defaultReducedMotion = options.reducedMotion ?? false;
    this.now = this.defaultNow;
  }

  get isActive(): boolean {
    return this._active;
  }

  get progress(): number {
    return this._progress;
  }

  get lengthMs(): number {
    return this.duration;
  }

  begin(onComplete: () => void, options: RaceIntroOptions = {}): void {
    if (this._active) return;
    this._active = true;
    this.onComplete = onComplete;
    this.duration = Math.max(1, options.duration ?? this.defaultDuration);
    this.reducedMotion = options.reducedMotion ?? this.defaultReducedMotion;
    this.now = options.now ?? this.defaultNow;
    this._progress = 0;

    this.target.prepare();

    if (this.reducedMotion) {
      this.complete();
      return;
    }
    this.startTime = this.now();
    this.target.frame(0);
  }

  /** Advance the staging timeline. Safe to call every render frame. */
  update(now?: number): void {
    if (!this._active || this.reducedMotion) return;
    const t = now ?? this.now();
    this._progress = Math.min(1, Math.max(0, (t - this.startTime) / this.duration));
    this.target.frame(this._progress);
    if (this._progress >= 1) this.complete();
  }

  /** Stop staging. `onComplete` is never called; the target is settled. */
  cancel(): void {
    if (!this._active) return;
    this._active = false;
    this.onComplete = null;
    this.target.settle();
  }

  private complete(): void {
    this._active = false;
    const done = this.onComplete;
    this.onComplete = null;
    this.target.settle();
    done?.();
  }
}
