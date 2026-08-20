import { Screen } from '../ui/components/Screen';
import { Loading } from '../ui/components/Loading';
import { AnimationSystem } from '../ui/core/AnimationSystem';
import type { TransitionKind } from '../ui/core/TransitionSystem';

export interface LoadingScreenParams {
  label?: string;
  onProgress?: (progress: number) => number | void;
}

/**
 * Transitional loading screen with progress bar. `onProgress` returns a
 * ratio (0..1) each frame; the screen advances when it reaches 1.
 */
export class LoadingScreen extends Screen {
  private progress = 0;
  private raf: number | null = null;
  private tick: () => void = () => {};
  onDone: (() => void) | null = null;

  constructor() {
    super('loading');
  }

  protected transition(): TransitionKind {
    return 'fade';
  }

  protected build(params: Record<string, unknown>): void {
    const { label = 'Loading', onProgress } = params as LoadingScreenParams;
    const wrap = document.createElement('div');
    wrap.className = 'screen-inner';
    wrap.style.alignItems = 'center';

    const loading = new Loading({ label, progress: true });
    loading.setProgress(0);
    wrap.appendChild(loading.el);
    this.el.appendChild(wrap);

    void AnimationSystem.play(loading.el, 'scale-in', { duration: 420 });

    this.tick = (): void => {
      const next = onProgress?.(this.progress) ?? this.progress + 0.04;
      this.progress = Math.min(1, next);
      loading.setProgress(this.progress);
      if (this.progress < 1) {
        this.raf = requestAnimationFrame(this.tick);
      } else {
        loading.setLabel('Ready');
        this.raf = null;
        this.onDone?.();
      }
    };
  }

  /**
   * Start advancing progress only once the enter transition has finished.
   * `build()` runs before the mount swap completes, so starting the rAF tick
   * there can fire `onDone` while `NavigationSystem.navigating` is still true —
   * the resulting `nav.go()` would be dropped and the app stranded here.
   */
  override onAfterEnter(): void {
    this.raf = requestAnimationFrame(this.tick);
  }

  override dispose(): void {
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
    super.dispose();
  }
}
