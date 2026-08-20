import { Screen } from '../ui/components/Screen';
import { Button } from '../ui/components/Button';
import { AnimationSystem } from '../ui/core/AnimationSystem';
import type { TransitionKind } from '../ui/core/TransitionSystem';
import { spawnParticles, spawnGrid, spawnAurora, spawnRoad } from './ambient';
import { profileManager } from '../managers/ProfileManager';
import { xpProgress, formatCurrency } from '../progression/ProgressionView';
import { titleForLevel } from '../progression/ContentCatalog';

/**
 * Cinematic main menu with Three.js hero car, animated racing line,
 * premium glass action cards, and driver profile strip.
 */
export class MainMenuScreen extends Screen {
  bestScore = 0;
  onPlay: (() => void) | null = null;
  onSettings: (() => void) | null = null;
  onHowToPlay: (() => void) | null = null;
  onGarage: (() => void) | null = null;
  onAchievements: (() => void) | null = null;
  onProfile: (() => void) | null = null;
  onLeaderboard: (() => void) | null = null;

  private heroCar: HTMLElement | null = null;
  private racingLine: SVGSVGElement | null = null;

  constructor() {
    super('menu');
  }

  protected build(_params: Record<string, unknown>): void {
    const { bestScore } = this;
    spawnGrid(this.el);
    spawnAurora(this.el);
    spawnParticles(this.el);
    spawnRoad(this.el);

    // Hero car container (Three.js canvas will be injected)
    this.heroCar = document.createElement('div');
    this.heroCar.className = 'menu-hero-car';
    this.heroCar.setAttribute('aria-hidden', 'true');
    this.el.appendChild(this.heroCar);

    // Racing line SVG (shared-element transition)
    this.racingLine = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.racingLine.setAttribute('class', 'racing-line');
    this.racingLine.setAttribute('width', '100%');
    this.racingLine.setAttribute('height', '100%');
    this.racingLine.style.position = 'absolute';
    this.racingLine.style.top = '0';
    this.racingLine.style.left = '0';
    this.racingLine.style.width = '100%';
    this.racingLine.style.height = '100%';
    this.racingLine.style.pointerEvents = 'none';
    this.racingLine.style.zIndex = '5';
    this.racingLine.innerHTML = `
      <path
        class="racing-line-path"
        stroke="var(--accent-primary)"
        stroke-width="2"
        fill="none"
        stroke-dasharray="1000"
        stroke-dashoffset="1000"
      />
    `;
    this.el.appendChild(this.racingLine);

    const wrap = document.createElement('div');
    wrap.className = 'screen-inner menu-wrap';
    wrap.style.alignItems = 'center';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'menu-title-wrap';
    const title = document.createElement('h1');
    title.className = 'menu-title';
    title.textContent = 'Virtual Steering';
    titleWrap.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.className = 'menu-subtitle';
    subtitle.textContent = bestScore > 0 ? `Best Score  ${bestScore}` : 'The road is calling';
    titleWrap.appendChild(subtitle);
    wrap.appendChild(titleWrap);

    // Driver profile strip with XP arc
    const state = profileManager.currentState;
    const progress = xpProgress(state.xp);
    const driverTitle = titleForLevel(state.level);
    const profile = document.createElement('div');
    profile.className = 'menu-profile';
    profile.innerHTML = `
      <div class="menu-profile-row">
        <span class="menu-profile-level">LEVEL ${state.level}</span>
        ${driverTitle ? `<span class="menu-profile-title">${driverTitle.toUpperCase()}</span>` : ''}
        <span class="menu-profile-coins">${formatCurrency(state.coins)} COINS</span>
      </div>
      <div class="menu-profile-xpbar" role="progressbar" aria-valuenow="${progress.into}" aria-valuemin="0" aria-valuemax="1000" aria-label="XP progress">
        <div class="menu-profile-xpfill" style="width: ${progress.pct}%"></div>
      </div>
      <div class="menu-profile-row menu-profile-meta">
        <span>${progress.into} / ${progress.needed} XP TO LEVEL ${state.level + 1}</span>
        <span>${state.lifetimeStats.racesFinished} RACES</span>
      </div>
    `;
    wrap.appendChild(profile);

    // Premium glass action cards - KEEP .menu-actions for test compatibility
    const actions = document.createElement('div');
    actions.className = 'menu-actions';
    const playBtn = new Button('Race', { size: 'lg', variant: 'primary' });
    const garageBtn = new Button('Garage', { variant: 'ghost', size: 'md' });
    const profileBtn = new Button('Profile', { variant: 'ghost', size: 'md' });
    const leaderboardBtn = new Button('Leaderboards', { variant: 'ghost', size: 'md' });
    const achievementsBtn = new Button('Achievements', { variant: 'ghost', size: 'md' });
    const settingsBtn = new Button('Settings', { variant: 'ghost', size: 'md' });
    const howBtn = new Button('How to Play', { variant: 'ghost', size: 'md' });

    playBtn.el.addEventListener('click', () => this.onPlay?.());
    garageBtn.el.addEventListener('click', () => this.onGarage?.());
    profileBtn.el.addEventListener('click', () => this.onProfile?.());
    leaderboardBtn.el.addEventListener('click', () => this.onLeaderboard?.());
    achievementsBtn.el.addEventListener('click', () => this.onAchievements?.());
    settingsBtn.el.addEventListener('click', () => this.onSettings?.());
    howBtn.el.addEventListener('click', () => this.onHowToPlay?.());

    actions.append(
      playBtn.el,
      garageBtn.el,
      profileBtn.el,
      leaderboardBtn.el,
      achievementsBtn.el,
      settingsBtn.el,
      howBtn.el
    );
    wrap.appendChild(actions);

    const note = document.createElement('div');
    note.className = 'menu-footer-note';
    note.textContent = 'Hands off the keyboard — you are the controller';
    wrap.appendChild(note);

    this.el.appendChild(wrap);

    // Initialize Three.js hero car (lazy-loaded, only in browser)
    if (typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.initHeroCar().catch(() => {});
    }

    // Animate racing line
    this.animateRacingLine();

    // Entrance choreography
    void AnimationSystem.play(title, 'blur-in', { duration: 700 });
    void AnimationSystem.play(subtitle, 'fade-in', { delay: 200 });
    void AnimationSystem.play(profile, 'fade-in', { delay: 250 });
    void AnimationSystem.stagger(
      [
        playBtn.el,
        garageBtn.el,
        profileBtn.el,
        leaderboardBtn.el,
        achievementsBtn.el,
        settingsBtn.el,
        howBtn.el,
      ],
      'slide-in-up',
      { duration: 460 },
      60
    );
    void AnimationSystem.play(note, 'fade-in', { delay: 500 });
  }

  private async initHeroCar(): Promise<void> {
    if (!this.heroCar) return;
    // Skip in test environment (no WebGL)
    if (typeof process !== 'undefined' && process.env && process.env.VITEST) return;
    try {
      const { createHeroCar } = await import('./heroCar');
      await createHeroCar(this.heroCar!);
    } catch (e) {
      console.warn('Hero car failed to load:', e);
      // Fallback: static car image
      this.heroCar!.innerHTML = `
        <div class="hero-car-fallback" aria-hidden="true">
          <svg viewBox="0 0 200 100" width="200" height="100" style="filter: drop-shadow(0 0 20px rgba(0,255,102,0.3));">
            <path d="M20 70 L30 50 L170 50 L180 70 Z" fill="var(--surface-elevated)" stroke="var(--accent-primary)" stroke-width="2"/>
            <circle cx="50" cy="70" r="15" fill="var(--bg)" stroke="var(--accent-primary)" stroke-width="1"/>
            <circle cx="150" cy="70" r="15" fill="var(--bg)" stroke="var(--accent-primary)" stroke-width="1"/>
            <rect x="40" y="45" width="120" height="10" rx="3" fill="var(--accent-primary)" opacity="0.3"/>
          </svg>
        </div>
      `;
    }
  }

  private animateRacingLine(): void {
    if (!this.racingLine) return;
    const path = this.racingLine.querySelector('.racing-line-path') as SVGPathElement;
    if (!path) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const pathEl = this.racingLine.querySelector('.racing-line-path') as SVGPathElement;
    if (!pathEl) return;

    const startX = w * 0.1;
    const startY = h * 0.9;
    const endX = w * 0.9;
    const endY = h * 0.1;

    path.setAttribute('d', `M ${startX} ${startY} Q ${w * 0.5} ${h * 0.5} ${endX} ${endY}`);
    path.style.strokeDasharray = '1000';
    path.style.strokeDashoffset = '1000';
    path.style.transition = 'stroke-dashoffset 800ms cubic-bezier(0.22, 1, 0.36, 1)';

    // Trigger draw animation
    requestAnimationFrame(() => {
      path.style.strokeDashoffset = '0';
    });

    // Loop the animation
    setInterval(() => {
      path.style.strokeDashoffset = '1000';
      requestAnimationFrame(() => {
        path.style.strokeDashoffset = '0';
      });
    }, 4000);
  }

  protected transition(): TransitionKind {
    return 'fade';
  }

  override dispose(): void {
    super.dispose();
    this.heroCar = null;
    this.racingLine = null;
  }
}
