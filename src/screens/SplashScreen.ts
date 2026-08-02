import { Screen } from '../ui/components/Screen';
import { AnimationSystem } from '../ui/core/AnimationSystem';
import { SoundHooks } from '../ui/core/SoundHooks';
import type { TransitionKind } from '../ui/core/TransitionSystem';
import { spawnParticles, spawnGrid, spawnAurora } from './ambient';

/**
 * Cinematic brand splash: title reveal with blur, orbiting glow, ambient
 * particles and grid. Any key press or tap advances.
 */
export class SplashScreen extends Screen {
  onContinue: (() => void) | null = null;
  private cleanup: (() => void) | null = null;

  constructor() {
    super('splash');
  }

  protected transition(): TransitionKind {
    return 'blur';
  }

  protected build(_params: Record<string, unknown>): void {
    const onContinue = this.onContinue;
    spawnGrid(this.el);
    spawnAurora(this.el);
    spawnParticles(this.el);

    const wrap = document.createElement('div');
    wrap.className = 'screen-inner';
    wrap.style.alignItems = 'center';
    wrap.style.gap = 'clamp(10px, 2vh, 20px)';

    const logo = document.createElement('div');
    logo.className = 'splash-logo';
    logo.textContent = 'Virtual Steering';
    wrap.appendChild(logo);

    const tagline = document.createElement('div');
    tagline.className = 'splash-tagline';
    tagline.textContent = 'Gesture Racing Experience';
    wrap.appendChild(tagline);

    const hint = document.createElement('div');
    hint.className = 'splash-hint';
    hint.textContent = 'Tap or press any key to start';
    wrap.appendChild(hint);

    this.el.appendChild(wrap);

    const advance = (): void => {
      SoundHooks.confirm();
      cleanup();
      onContinue?.();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'F5' || e.key === 'F12') return;
      e.preventDefault();
      advance();
    };
    const onPointer = (): void => advance();
    this.el.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    const cleanup = (): void => {
      this.el.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
    this.cleanup = cleanup;

    void AnimationSystem.play(logo, 'blur-in', { duration: 700 });
    void AnimationSystem.play(tagline, 'fade-in', { delay: 260 });
    void AnimationSystem.play(hint, 'fade-in', { delay: 520 });
  }

  override dispose(): void {
    this.cleanup?.();
    super.dispose();
  }
}
