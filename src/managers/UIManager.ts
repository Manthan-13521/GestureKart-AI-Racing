import type { GamePhase } from '../core/AppState';

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element #${id}`);
  return node as T;
}

/**
 * Owns the in-game overlays only (ready / game-over / countdown).
 * Menu screens (landing / menu / howtoplay / settings) are rendered by
 * the UI framework's NavigationSystem.
 */
export class UIManager {
  readonly ready = el('game-overlay');
  readonly gameover = el('game-over-overlay');
  readonly countdown = el('countdown-overlay');
  readonly countdownNum = el('countdown-num');
  readonly finalScore = el('final-score');

  sync(state: GamePhase): void {
    this.ready.classList.toggle('visible', state === 'ready');
    this.gameover.classList.toggle('visible', state === 'gameover');
  }
}
