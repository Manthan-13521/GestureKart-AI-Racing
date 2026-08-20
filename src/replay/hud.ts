import { formatDelta, formatClock } from './logic';

export interface GhostHudState {
  now: number;
  best: number;
  delta: number;
  ahead: boolean;
  sectors: (number | null)[];
}

const DEFAULTS: Required<GhostHudState> = {
  now: 0,
  best: 0,
  delta: 0,
  ahead: true,
  sectors: [null, null, null],
};

/**
 * Ghost duel HUD: delta (+/− seconds), ahead/behind state, per-sector
 * comparison, best time vs current time. DOM writes are gated on value
 * changes to avoid layout thrash. Self-contained and null-guarded — a
 * missing element degrades to a silent no-op.
 */
export class GhostHud {
  private root: HTMLElement | null;
  private deltaEl: HTMLElement | null;
  private stateEl: HTMLElement | null;
  private bestEl: HTMLElement | null;
  private nowEl: HTMLElement | null;
  private sectorEls: (HTMLElement | null)[];
  private last: Required<GhostHudState> = { ...DEFAULTS };
  /** Presentation hook: fired when the |delta| crosses a whole second or ahead/behind flips. */
  private onDeltaTick: ((ahead: boolean) => void) | null = null;

  constructor(rootId = 'ghost-hud', onDeltaTick?: (ahead: boolean) => void) {
    this.onDeltaTick = onDeltaTick ?? null;
    this.root = document.getElementById(rootId);
    this.deltaEl = this.byId('ghost-delta');
    this.stateEl = this.byId('ghost-state');
    this.bestEl = this.byId('ghost-best');
    this.nowEl = this.byId('ghost-now');
    this.sectorEls = [0, 1, 2].map((i) => this.byId(`ghost-sec-${i}`));
  }

  private byId(id: string): HTMLElement | null {
    return this.root ? (this.root.querySelector<HTMLElement>(`#${id}`) ?? document.getElementById(id)) : null;
  }

  setVisible(on: boolean): void {
    this.root?.classList.toggle('hidden', !on);
  }

  reset(best: number): void {
    this.update({ ...DEFAULTS, best }, true);
  }

  update(state: Partial<GhostHudState>, force = false): void {
    const next = { ...this.last, ...state };
    // Ghost delta tick: fire when the whole-second boundary or ahead/behind
    // state flips (GDD §12.2 ghost delta tick). Presentation-only.
    if (this.onDeltaTick) {
      const prevSec = Math.floor(Math.abs(this.last.delta));
      const nextSec = Math.floor(Math.abs(next.delta));
      if (next.ahead !== this.last.ahead || (nextSec !== prevSec && next.delta !== this.last.delta)) {
        this.onDeltaTick(next.ahead);
      }
    }
    if (force || next.delta !== this.last.delta) {
      if (this.deltaEl) {
        this.deltaEl.textContent = formatDelta(next.delta);
        this.deltaEl.classList.toggle('ahead', next.ahead);
      }
    }
    if (force || next.ahead !== this.last.ahead) {
      if (this.stateEl) this.stateEl.textContent = next.ahead ? 'AHEAD' : 'BEHIND';
    }
    if (force || (next.best !== this.last.best && this.bestEl)) {
      if (this.bestEl) this.bestEl.textContent = formatClock(next.best);
    }
    if (next.now !== this.last.now && this.nowEl) {
      this.nowEl.textContent = formatClock(next.now);
    }
    for (let i = 0; i < 3; i++) {
      const s = next.sectors[i];
      const el = this.sectorEls[i];
      if (s !== this.last.sectors[i] && el) {
        el.textContent = s === null ? `S${i + 1} —` : `S${i + 1} ${formatDelta(s)}`;
        if (s !== null) el.classList.toggle('ahead', s > 0);
      }
    }
    this.last = next;
  }

  dispose(): void {
    this.root = null;
    this.deltaEl = null;
    this.stateEl = null;
    this.bestEl = null;
    this.nowEl = null;
    this.sectorEls = [null, null, null];
    this.onDeltaTick = null;
  }
}
