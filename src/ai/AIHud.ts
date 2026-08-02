/**
 * AIHud — Race HUD overlay for AI Race mode.
 *
 * Renders position, gap to car ahead/behind, draft meter, and
 * overtake flash — all as DOM elements over the canvas.
 * No Three.js. Pure DOM manipulation with CSS-driven animation.
 */

export interface AIHudState {
  position: number;
  totalCars: number;
  gapAhead: number | null; // seconds, null if no car ahead
  gapBehind: number | null; // seconds, null if no car behind
  draftZone: 'none' | 'entry' | 'optimal' | 'dirty' | 'cooldown';
  draftBonus: number; // 0–0.18 fraction
  intent: string; // current AI of the car being chased (debug)
  isOvertaking: boolean;
  lapTime: number;
  lap: number;
  totalLaps: number;
}

export class AIHud {
  private container: HTMLElement;
  private posEl: HTMLElement;
  private gapAheadEl: HTMLElement;
  private gapBehindEl: HTMLElement;
  private draftBarFill: HTMLElement;
  private draftLabel: HTMLElement;
  private overtakeFlash: HTMLElement;
  private lapEl: HTMLElement;
  private visible = false;
  private overtakeTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'ai-hud';
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('aria-label', 'Race positions');
    this.container.innerHTML = `
      <div class="ai-hud-position" id="ai-hud-pos">
        <span class="ai-hud-rank-num">P1</span>
        <span class="ai-hud-rank-total">/6</span>
      </div>

      <div class="ai-hud-gaps">
        <div class="ai-hud-gap ai-hud-gap--ahead" id="ai-hud-gap-ahead">
          <span class="ai-hud-gap-label">▲ AHEAD</span>
          <span class="ai-hud-gap-val">—</span>
        </div>
        <div class="ai-hud-gap ai-hud-gap--behind" id="ai-hud-gap-behind">
          <span class="ai-hud-gap-label">▼ BEHIND</span>
          <span class="ai-hud-gap-val">—</span>
        </div>
      </div>

      <div class="ai-hud-draft" id="ai-hud-draft">
        <div class="ai-hud-draft-label" id="ai-hud-draft-label">DRAFT</div>
        <div class="ai-hud-draft-bar">
          <div class="ai-hud-draft-fill" id="ai-hud-draft-fill"></div>
        </div>
      </div>

      <div class="ai-hud-lap" id="ai-hud-lap">LAP 1/2</div>
      <div class="ai-hud-overtake-flash" id="ai-hud-overtake-flash">OVERTAKE!</div>
    `;

    this.posEl = this.container.querySelector('#ai-hud-pos')!;
    this.gapAheadEl = this.container.querySelector('#ai-hud-gap-ahead')!;
    this.gapBehindEl = this.container.querySelector('#ai-hud-gap-behind')!;
    this.draftBarFill = this.container.querySelector('#ai-hud-draft-fill')!;
    this.draftLabel = this.container.querySelector('#ai-hud-draft-label')!;
    this.overtakeFlash = this.container.querySelector('#ai-hud-overtake-flash')!;
    this.lapEl = this.container.querySelector('#ai-hud-lap')!;

    this.container.style.display = 'none';
    document.body.appendChild(this.container);
  }

  setVisible(v: boolean): void {
    this.visible = v;
    this.container.style.display = v ? 'flex' : 'none';
  }

  update(state: AIHudState): void {
    if (!this.visible) return;

    // Position
    const rankEl = this.posEl.querySelector('.ai-hud-rank-num')!;
    const totalEl = this.posEl.querySelector('.ai-hud-rank-total')!;
    rankEl.textContent = `P${state.position}`;
    totalEl.textContent = `/${state.totalCars}`;
    this.posEl.setAttribute('data-pos', `${state.position}`);

    // Gap ahead
    const gapAheadVal = this.gapAheadEl.querySelector('.ai-hud-gap-val')!;
    if (state.gapAhead !== null) {
      gapAheadVal.textContent = `+${state.gapAhead.toFixed(2)}s`;
      this.gapAheadEl.classList.remove('ai-hud-gap--hidden');
    } else {
      gapAheadVal.textContent = '—';
      this.gapAheadEl.classList.add('ai-hud-gap--hidden');
    }

    // Gap behind
    const gapBehindVal = this.gapBehindEl.querySelector('.ai-hud-gap-val')!;
    if (state.gapBehind !== null) {
      gapBehindVal.textContent = `-${state.gapBehind.toFixed(2)}s`;
      this.gapBehindEl.classList.remove('ai-hud-gap--hidden');
    } else {
      gapBehindVal.textContent = '—';
      this.gapBehindEl.classList.add('ai-hud-gap--hidden');
    }

    // Draft meter
    const draftPct = Math.max(0, Math.min(1, state.draftBonus / 0.18));
    this.draftBarFill.style.width = `${draftPct * 100}%`;
    this.container.setAttribute('data-draft', state.draftZone);
    this.draftLabel.textContent =
      state.draftZone === 'optimal'
        ? '⚡ SLIPSTREAM'
        : state.draftZone === 'entry'
          ? 'DRAFT ENTRY'
          : state.draftZone === 'dirty'
            ? '💨 DIRTY AIR'
            : 'DRAFT';

    // Lap
    this.lapEl.textContent = `LAP ${state.lap}/${state.totalLaps}`;

    // Overtake flash
    if (state.isOvertaking) {
      this.triggerOvertakeFlash();
    }
  }

  private triggerOvertakeFlash(): void {
    if (this.overtakeTimeout) return;
    this.overtakeFlash.classList.add('active');
    this.overtakeTimeout = setTimeout(() => {
      this.overtakeFlash.classList.remove('active');
      this.overtakeTimeout = null;
    }, 1200);
  }

  dispose(): void {
    if (this.overtakeTimeout) clearTimeout(this.overtakeTimeout);
    this.container.remove();
  }
}
