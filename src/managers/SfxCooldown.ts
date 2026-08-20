/**
 * Per-kind one-shot SFX cooldown guard (GDD §12: no duplicate audio
 * playback). Pure and clock-injectable so the dedup contract is testable
 * without a WebAudio context.
 */
export class SfxCooldown {
  private last: Record<string, number> = {};
  private readonly now: () => number;

  constructor(now: () => number = () => performance.now()) {
    this.now = now;
  }

  /** Returns true when `kind` may play; false when still inside its cooldown. */
  tryAcquire(kind: string, cooldownMs: number): boolean {
    const t = this.now();
    if (t - (this.last[kind] ?? -Infinity) < cooldownMs) return false;
    this.last[kind] = t;
    return true;
  }

  reset(): void {
    this.last = {};
  }
}
