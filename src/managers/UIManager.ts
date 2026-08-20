import type { GamePhase } from '../core/AppState';

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element #${id}`);
  return node as T;
}

/**
 * Owns the in-game overlays only (ready / game-over / countdown / intro and
 * the gameplay HUD). Menu screens (landing / menu / howtoplay / settings) are
 * rendered by the UI framework's NavigationSystem.
 *
 * P2.3: this is the single presentation surface for the race-start sequence.
 * Everything is DERIVED from the authoritative StateMachine phase and the
 * Countdown beat hooks — no UI owns timing. `sync()` maps the phase machine
 * to deterministic overlay/HUD visibility so the HUD never pretends a race is
 * running before `racing`.
 */
export class UIManager {
  readonly ready = el('game-overlay');
  readonly gameover = el('game-over-overlay');
  readonly countdown = el('countdown-overlay');
  readonly countdownNum = el('countdown-num');
  readonly finalScore = el('final-score');
  readonly hud = el('game-hud');
  readonly intro = el('intro-overlay');
  readonly introSub = el('intro-sub');

  /** Derive overlay + HUD presentation from an authoritative phase change. */
  sync(state: GamePhase): void {
    this.hud.classList.toggle('hidden', state !== 'racing');
    this.setIntroVisible(state === 'ready' || state === 'intro');
    this.ready.classList.toggle('visible', state === 'ready');
    this.gameover.classList.toggle('visible', state === 'gameover');
    if (state === 'gameover') {
      // Move focus to the primary action so keyboard/screen-reader users aren't
      // left in the canvas viewport when the race ends.
      const retry = document.getElementById('results-retry') as HTMLButtonElement | null;
      retry?.focus();
    }
    if (state !== 'ready' && state !== 'intro') {
      this.hideCountdown();
    }
  }

  /** Label the pre-race presentation with the chosen track + mode. */
  setIntroInfo(track: string, mode: string): void {
    const t = track.replace(/-/g, ' ');
    const m = mode.replace(/-/g, ' ');
    this.introSub.textContent = `${t} · ${m}`;
  }

  setIntroVisible(visible: boolean): void {
    this.intro.classList.toggle('visible', visible);
    this.intro.setAttribute('aria-hidden', String(!visible));
  }

  /** Reveal the countdown surface (authoritative beat render follows). */
  showCountdown(): void {
    this.countdown.classList.remove('hidden');
    this.countdown.setAttribute('aria-hidden', 'false');
  }

  /** Fully retire the countdown surface; the live region goes quiet. */
  hideCountdown(): void {
    this.countdown.classList.add('hidden');
    this.countdown.setAttribute('aria-hidden', 'true');
  }
}
