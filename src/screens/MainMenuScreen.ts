import { Screen } from '../ui/components/Screen';
import { Button } from '../ui/components/Button';
import { AnimationSystem } from '../ui/core/AnimationSystem';
import type { TransitionKind } from '../ui/core/TransitionSystem';
import { spawnParticles, spawnGrid, spawnAurora, spawnRoad } from './ambient';

/**
 * Cinematic main menu: animated title glow, ambient grid + particles +
 * racing lane, staggered action buttons, best-score line.
 */
export class MainMenuScreen extends Screen {
  bestScore = 0;
  onPlay: (() => void) | null = null;
  onSettings: (() => void) | null = null;
  onHowToPlay: (() => void) | null = null;
  onGarage: (() => void) | null = null;

  constructor() {
    super('menu');
  }

  protected transition(): TransitionKind {
    return 'fade';
  }

  protected build(_params: Record<string, unknown>): void {
    const { bestScore } = this;
    spawnGrid(this.el);
    spawnAurora(this.el);
    spawnParticles(this.el);
    spawnRoad(this.el);

    const wrap = document.createElement('div');
    wrap.className = 'screen-inner';
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

    const actions = document.createElement('div');
    actions.className = 'menu-actions';
    const playBtn = new Button('Race', { size: 'lg' });
    const garageBtn = new Button('Garage', { variant: 'ghost', size: 'md' });
    const settingsBtn = new Button('Settings', { variant: 'ghost', size: 'md' });
    const howBtn = new Button('How to Play', { variant: 'ghost', size: 'md' });

    playBtn.el.addEventListener('click', () => this.onPlay?.());
    garageBtn.el.addEventListener('click', () => this.onGarage?.());
    settingsBtn.el.addEventListener('click', () => this.onSettings?.());
    howBtn.el.addEventListener('click', () => this.onHowToPlay?.());

    actions.append(playBtn.el, garageBtn.el, settingsBtn.el, howBtn.el);
    wrap.appendChild(actions);

    const note = document.createElement('div');
    note.className = 'menu-footer-note';
    note.textContent = 'Hands off the keyboard — you are the controller';
    wrap.appendChild(note);

    this.el.appendChild(wrap);

    void AnimationSystem.play(title, 'blur-in', { duration: 700 });
    void AnimationSystem.play(subtitle, 'fade-in', { delay: 200 });
    void AnimationSystem.stagger(
      [playBtn.el, garageBtn.el, settingsBtn.el, howBtn.el],
      'slide-in-up',
      { duration: 460 },
      90
    );
    void AnimationSystem.play(note, 'fade-in', { delay: 500 });
  }
}
