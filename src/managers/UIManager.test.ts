import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { UIManager } from './UIManager';

function mountUi(): void {
  for (const id of ['game-overlay', 'game-over-overlay', 'countdown-overlay', 'final-score']) {
    const el = document.createElement('div');
    el.id = id;
    if (id === 'countdown-overlay') {
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      el.setAttribute('aria-hidden', 'true');
    }
    document.body.appendChild(el);
  }
  const num = document.createElement('div');
  num.id = 'countdown-num';
  document.getElementById('countdown-overlay')!.appendChild(num);

  const hud = document.createElement('div');
  hud.id = 'game-hud';
  hud.classList.add('hidden');
  document.body.appendChild(hud);

  const intro = document.createElement('div');
  intro.id = 'intro-overlay';
  intro.setAttribute('aria-hidden', 'true');
  const introSub = document.createElement('div');
  introSub.id = 'intro-sub';
  intro.appendChild(introSub);
  document.body.appendChild(intro);
}

describe('UIManager (P2.3 presentation)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    mountUi();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('intro overlay exists exactly once', () => {
    expect(document.querySelectorAll('#intro-overlay').length).toBe(1);
  });

  it('intro appears during ready', () => {
    const ui = new UIManager();
    ui.sync('ready');
    expect(ui.intro.classList.contains('visible')).toBe(true);
    expect(ui.intro.getAttribute('aria-hidden')).toBe('false');
  });

  it('intro appears during intro', () => {
    const ui = new UIManager();
    ui.sync('intro');
    expect(ui.intro.classList.contains('visible')).toBe(true);
    expect(ui.hud.classList.contains('hidden')).toBe(true);
  });

  it('HUD is hidden before racing (idle/ready/intro/gameover)', () => {
    const ui = new UIManager();
    ui.sync('idle');
    expect(ui.hud.classList.contains('hidden')).toBe(true);
    ui.sync('ready');
    expect(ui.hud.classList.contains('hidden')).toBe(true);
    ui.sync('intro');
    expect(ui.hud.classList.contains('hidden')).toBe(true);
    ui.sync('gameover');
    expect(ui.hud.classList.contains('hidden')).toBe(true);
  });

  it('HUD is visible during racing and hidden again after', () => {
    const ui = new UIManager();
    ui.sync('racing');
    expect(ui.hud.classList.contains('hidden')).toBe(false);
    ui.sync('gameover');
    expect(ui.hud.classList.contains('hidden')).toBe(true);
  });

  it('overlay disappears after racing', () => {
    const ui = new UIManager();
    ui.sync('intro');
    ui.sync('racing');
    expect(ui.intro.classList.contains('visible')).toBe(false);
    expect(ui.intro.getAttribute('aria-hidden')).toBe('true');
  });

  it('countdown overlay is an accessible live region with aria semantics', () => {
    const ui = new UIManager();
    expect(ui.countdown.getAttribute('role')).toBe('status');
    expect(ui.countdown.getAttribute('aria-live')).toBe('polite');
    expect(ui.countdown.getAttribute('aria-atomic')).toBe('true');
    expect(ui.countdown.getAttribute('aria-hidden')).toBe('true');
    ui.showCountdown();
    expect(ui.countdown.classList.contains('hidden')).toBe(false);
    expect(ui.countdown.getAttribute('aria-hidden')).toBe('false');
  });

  it('hideCountdown makes the surface inaccessible again (no stale countdown)', () => {
    const ui = new UIManager();
    ui.showCountdown();
    ui.hideCountdown();
    expect(ui.countdown.classList.contains('hidden')).toBe(true);
    expect(ui.countdown.getAttribute('aria-hidden')).toBe('true');
  });

  it('phase-driven sync retires the countdown when leaving ready/intro', () => {
    const ui = new UIManager();
    ui.showCountdown();
    ui.sync('racing');
    expect(ui.countdown.classList.contains('hidden')).toBe(true);
    expect(ui.countdown.getAttribute('aria-hidden')).toBe('true');
  });

  it('cancellation clears the presentation (idle after cancel path)', () => {
    const ui = new UIManager();
    ui.sync('intro');
    ui.showCountdown();
    ui.sync('idle'); // nav/cancel handlers reset the machine
    expect(ui.intro.classList.contains('visible')).toBe(false);
    expect(ui.countdown.classList.contains('hidden')).toBe(true);
    expect(ui.hud.classList.contains('hidden')).toBe(true);
  });

  it('retry does not duplicate overlay DOM across repeated cycles', () => {
    const ui = new UIManager();
    for (let i = 0; i < 4; i++) {
      ui.sync('intro');
      ui.showCountdown();
      ui.sync('racing');
      ui.sync('gameover');
      ui.sync('idle');
    }
    expect(document.querySelectorAll('#intro-overlay').length).toBe(1);
    expect(document.querySelectorAll('#countdown-overlay').length).toBe(1);
    expect(document.querySelectorAll('#game-hud').length).toBe(1);
  });

  it('live region is not re-announced per render frame', () => {
    const ui = new UIManager();
    ui.showCountdown();
    for (let i = 0; i < 120; i++) ui.showCountdown(); // ~2s of frames
    expect(ui.countdown.getAttribute('aria-hidden')).toBe('false');
    // Only the beat text changes — the region's hidden state is stable.
    ui.countdownNum.textContent = '3';
    expect(ui.countdown.getAttribute('aria-hidden')).toBe('false');
  });

  it('setIntroInfo formats raw track/mode ids', () => {
    const ui = new UIManager();
    ui.setIntroInfo('cyber-city', 'ai-race');
    expect(ui.introSub.textContent).toBe('cyber city · ai race');
  });

  it('ready overlay stays on its own phase and results layout is preserved', () => {
    const ui = new UIManager();
    ui.sync('ready');
    expect(ui.ready.classList.contains('visible')).toBe(true);
    expect(ui.gameover.classList.contains('visible')).toBe(false);
    ui.sync('gameover');
    expect(ui.ready.classList.contains('visible')).toBe(false);
    expect(ui.gameover.classList.contains('visible')).toBe(true);
    expect(ui.finalScore).toBeTruthy();
  });

  it('responsive CSS cannot introduce horizontal overflow', () => {
    const css = readFileSync(join(process.cwd(), 'src', 'style.css'), 'utf8');

    // Intro overlay is full-bleed and flex-centered (never fixed-width).
    expect(css).toMatch(/\.intro-overlay\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;/s);
    expect(css).toMatch(/\.intro-content\s*\{[^}]*max-width:\s*90vw;/s);

    // Compact sizes exist for narrow + short viewports.
    expect(css).toMatch(/@media \(max-width: 600px\)[\s\S]*?\.intro-title\s*\{[^}]*font-size:\s*18px;/);
    expect(css).toMatch(/@media \(max-height: 500px\)[\s\S]*?\.intro-title\s*\{[^}]*font-size:\s*14px;/);

    // Uses the canonical design-system token namespace (no second token set).
    expect(css).toContain('var(--font-display)');
    expect(css).toContain('var(--text-muted)');
    expect(css).toContain('var(--accent-red)');
    expect(css).toContain('var(--accent-gold)');
    expect(css).toContain('var(--ease-out)');
  });
});
