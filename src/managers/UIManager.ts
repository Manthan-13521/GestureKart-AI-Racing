import type { AppState } from '../core/StateMachine';

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element #${id}`);
  return node as T;
}

export class UIManager {
  readonly landing = el('landing');
  readonly menu = el('menu-overlay');
  readonly howtoplay = el('howtoplay-overlay');
  readonly settings = el('settings-overlay');
  readonly ready = el('game-overlay');
  readonly gameover = el('game-over-overlay');
  readonly countdown = el('countdown-overlay');
  readonly countdownNum = el('countdown-num');
  readonly finalScore = el('final-score');

  sync(state: AppState): void {
    this.landing.classList.toggle('visible', state === 'landing');
    this.menu.classList.toggle('visible', state === 'menu');
    this.howtoplay.classList.toggle('visible', state === 'howtoplay');
    this.settings.classList.toggle('visible', state === 'settings');
    this.ready.classList.toggle('visible', state === 'ready');
    this.gameover.classList.toggle('visible', state === 'gameover');
  }
}
