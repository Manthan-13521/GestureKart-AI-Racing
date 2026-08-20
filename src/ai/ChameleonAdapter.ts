/**
 * ChameleonAdapter — GDD §9.3 Adaptive tier: Chameleon recalibrates from the
 * player's last 3 race deltas.
 *
 * Design constraints (P5.1):
 *  - Store only what's needed: the last 3 player finish positions + grid size.
 *  - Deterministic/testable: same input history ⇒ same adapted fingerprint.
 *  - Bounded: adaptation range is capped, so Chameleon never becomes
 *    instantly unbeatable.
 *  - No unbounded state: history is capped at 3 entries.
 *  - Isolated: a small typed adapter, not coupled to TournamentManager or UI.
 *
 * "Delta" is defined as the player's finishing position relative to a
 * mid-field baseline (gridSize/2 + 0.5). Negative delta = player finished
 * ahead of the pack; positive = player finished behind. Chameleon leans
 * toward the player's demonstrated level so the race stays close.
 */
import { clamp01, seedNoise } from './AIIdentity';
import type { IdentityFingerprint } from './AIIdentity';
import { IDENTITY_FINGERPRINTS } from './AIIdentity';

const MAX_HISTORY = 3;
const MAX_ADAPTATION = 0.15; // maximum per-parameter shift

export interface RaceDelta {
  /** Player's finish position (1 = first). */
  position: number;
  /** Total grid size (AI + player). */
  gridSize: number;
}

export class ChameleonAdapter {
  private history: RaceDelta[] = [];

  /** Record one finished race. History is capped at the last 3 races. */
  recordRace(delta: RaceDelta): void {
    this.history.push({
      position: delta.position,
      gridSize: delta.gridSize,
    });
    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
    }
  }

  get size(): number {
    return this.history.length;
  }

  clear(): void {
    this.history = [];
  }

  /**
   * Average signed delta vs mid-field baseline.
   * Negative = player consistently ahead of the pack → Chameleon should push.
   * Positive = player behind → Chameleon eases off.
   * Returns NaN when there is no history (callers must handle size===0).
   */
  averageDelta(): number {
    if (this.history.length === 0) return NaN;
    const sum = this.history.reduce((acc, d) => {
      const midField = d.gridSize / 2 + 0.5;
      return acc + (d.position - midField);
    }, 0);
    return sum / this.history.length;
  }

  /**
   * Produce an adapted Chameleon fingerprint from the recent history.
   * - No history: return the baseline fingerprint (neutral).
   * - Adaptation is a bounded shift toward the player's demonstrated level.
   * - Deterministic: identical history ⇒ identical output.
   */
  adapt(): IdentityFingerprint {
    const base = { ...IDENTITY_FINGERPRINTS.chameleon };
    const avg = this.averageDelta();
    if (this.history.length === 0 || Number.isNaN(avg)) {
      return base;
    }

    // avg < 0 (player ahead) → Chameleon pushes harder (positive shift).
    // avg > 0 (player behind) → Chameleon eases off (negative shift).
    const shift = Math.max(-MAX_ADAPTATION, Math.min(MAX_ADAPTATION, -avg));
    const adapted = seedNoise(base, 0, 0); // deterministic, zero noise
    adapted.aggression = clamp01(adapted.aggression + shift);
    adapted.boostSense = clamp01(adapted.boostSense + shift * 1.2);
    adapted.cornering = clamp01(adapted.cornering + shift * 0.8);
    adapted.consistency = clamp01(adapted.consistency + shift * 0.5);
    return adapted;
  }
}

/** Singleton used by the AI runtime. */
export const chameleonAdapter = new ChameleonAdapter();
