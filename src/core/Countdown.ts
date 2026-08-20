/**
 * Authoritative pre-race countdown (P2.2).
 *
 * Single owner of the 3..2..1..GO tick. Deliberately UI-agnostic: the app
 * shell injects `tick`/`go`/`clear` hooks so this module stays testable without
 * DOM. Guarantees:
 *   - one active timer per instance (no duplicate timers),
 *   - `start()` is a no-op while already running (no double-start),
 *   - `cancel()` disposes the timer and never fires `onDone`,
 *   - `onDone` fires exactly once, after GO, only from the final beat.
 */

export interface CountdownHooks {
  /** Render a numbered beat (3 → 1). */
  tick(step: number): void;
  /** Render the GO marker. */
  go(): void;
  /** Hide/release the countdown surface. */
  clear(): void;
}

export interface CountdownOptions {
  /** Milliseconds between beats. Defaults to 250. */
  intervalMs?: number;
  /** Scheduler override (tests). Defaults to the platform `setInterval`. */
  schedule?: (fn: () => void, ms: number) => unknown;
  /** Scheduler-cancel override (tests). Defaults to the platform `clearInterval`. */
  cancelSchedule?: (id: unknown) => void;
}

export class Countdown {
  private readonly intervalMs: number;
  private readonly schedule: (fn: () => void, ms: number) => unknown;
  private readonly cancelSchedule: (id: unknown) => void;

  private timerId: unknown = null;
  private _active = false;
  private beat = 3;
  private onDone: (() => void) | null = null;

  constructor(
    private readonly hooks: CountdownHooks,
    options: CountdownOptions = {}
  ) {
    this.intervalMs = options.intervalMs ?? 250;
    this.schedule = options.schedule ?? ((fn, ms) => setInterval(fn, ms));
    this.cancelSchedule =
      options.cancelSchedule ?? ((id) => clearInterval(id as ReturnType<typeof setInterval>));
  }

  get isActive(): boolean {
    return this._active;
  }

  /** Begin a fresh countdown. No-op if one is already running. */
  start(onDone: () => void): void {
    if (this._active) return;
    this._active = true;
    this.onDone = onDone;
    this.beat = 3;
    this.hooks.tick(this.beat);
    this.timerId = this.schedule(() => this.advance(), this.intervalMs);
  }

  /** Stop immediately; `onDone` is never called and the timer is released. */
  cancel(): void {
    if (!this._active && this.timerId === null) {
      this.hooks.clear();
      return;
    }
    this.release();
  }

  private advance(): void {
    this.beat--;
    if (this.beat > 0) {
      this.hooks.tick(this.beat);
    } else if (this.beat === 0) {
      this.hooks.go();
    } else {
      const done = this.onDone;
      this.release();
      done?.();
    }
  }

  private release(): void {
    if (this.timerId !== null) {
      this.cancelSchedule(this.timerId);
      this.timerId = null;
    }
    this._active = false;
    this.onDone = null;
    this.hooks.clear();
  }
}
