/**
 * P7.3 — Race Feedback Watcher.
 *
 * Pure edge-detection over per-frame race state. The game has no race-domain
 * events (everything is polled in `gameLoop`), so this class derives the
 * one-shot presentation triggers (position change, first place, draft
 * enter/exit, boost activation, lap change) by comparing consecutive ticks.
 *
 * Presentation-only: it never writes to the game, the AI, or the DOM itself —
 * callbacks do that. This keeps the trigger logic unit-testable.
 */
export type DraftZone = 'none' | 'entry' | 'optimal' | 'dirty' | 'cooldown';
export type PositionDir = 'gain' | 'loss';

export interface RaceFeedbackInput {
  position: number;
  totalCars: number;
  lap: number;
  totalLaps: number;
  draftZone: DraftZone;
  boostActive: boolean;
  racing: boolean;
}

export interface RaceFeedbackCallbacks {
  /** Player's standing changed; dir reflects the player's gain or loss. */
  onPositionChange?: (from: number, to: number, dir: PositionDir) => void;
  /** Player entered or left first place. */
  onLeadChange?: (leading: boolean) => void;
  /** Player entered a drafting zone (entry or optimal). */
  onDraftEnter?: (zone: 'entry' | 'optimal') => void;
  /** Player left a drafting zone (entry/optimal → none/cooldown). */
  onDraftExit?: (from: 'entry' | 'optimal', to: 'none' | 'cooldown') => void;
  /** Boost pickup activation (rising edge of boostActive). */
  onBoostStart?: () => void;
  /** Lap counter advanced (future-proof; races currently run a single lap). */
  onLapChange?: (from: number, to: number, totalLaps: number) => void;
}

export class RaceFeedbackWatcher {
  private prevPosition: number | null = null;
  private prevLap: number | null = null;
  private prevDraftZone: DraftZone | null = null;
  private prevBoostActive = false;
  private prevRacing = false;

  constructor(private callbacks: RaceFeedbackCallbacks) {}

  /** Clear all edge state. Call when a race begins so stale edges never fire. */
  reset(): void {
    this.prevPosition = null;
    this.prevLap = null;
    this.prevDraftZone = null;
    this.prevBoostActive = false;
    this.prevRacing = false;
  }

  tick(input: RaceFeedbackInput): void {
    if (!input.racing) {
      // Outside a race nothing may fire; drop any half-tracked state.
      this.prevRacing = false;
      return;
    }
    if (!this.prevRacing) {
      // First racing frame: record baseline, never fire phantom edges.
      this.prevPosition = input.position;
      this.prevLap = input.lap;
      this.prevDraftZone = input.draftZone;
      this.prevBoostActive = input.boostActive;
      this.prevRacing = true;
      return;
    }

    // Position change
    if (this.prevPosition !== null && input.position !== this.prevPosition) {
      this.callbacks.onPositionChange?.(
        this.prevPosition,
        input.position,
        input.position < this.prevPosition ? 'gain' : 'loss'
      );
      // First place transitions
      if (input.position === 1 && this.prevPosition !== 1) this.callbacks.onLeadChange?.(true);
      else if (input.position !== 1 && this.prevPosition === 1) this.callbacks.onLeadChange?.(false);
    }

    // Lap change (only forward progress counts)
    if (this.prevLap !== null && input.lap > this.prevLap) {
      this.callbacks.onLapChange?.(this.prevLap, input.lap, input.totalLaps);
    }

    // Draft zone edges
    if (this.prevDraftZone !== null && input.draftZone !== this.prevDraftZone) {
      const prev = this.prevDraftZone;
      const next = input.draftZone;
      if (
        (prev === 'none' || prev === 'cooldown' || prev === 'dirty') &&
        (next === 'entry' || next === 'optimal')
      ) {
        this.callbacks.onDraftEnter?.(next);
      } else if ((prev === 'entry' || prev === 'optimal') && (next === 'none' || next === 'cooldown')) {
        this.callbacks.onDraftExit?.(prev, next);
      }
    }

    // Boost activation (rising edge only)
    if (!this.prevBoostActive && input.boostActive) {
      this.callbacks.onBoostStart?.();
    }

    this.prevPosition = input.position;
    this.prevLap = input.lap;
    this.prevDraftZone = input.draftZone;
    this.prevBoostActive = input.boostActive;
  }
}
