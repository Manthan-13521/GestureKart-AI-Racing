import { MotionTokens } from '../tokens';
import { ThemeManager } from '../ThemeManager';

export type AnimKind =
  | 'fade-in'
  | 'fade-out'
  | 'slide-in-left'
  | 'slide-in-right'
  | 'slide-in-up'
  | 'slide-out-left'
  | 'slide-out-right'
  | 'scale-in'
  | 'scale-out'
  | 'blur-in'
  | 'blur-out';

export interface AnimOptions {
  duration?: number;
  delay?: number;
  fill?: FillMode;
  easing?: string;
  distance?: number;
}

const EASE = MotionTokens.easing.out;

function keyframesFor(kind: AnimKind, distance: number): Keyframe[] {
  const d = `${distance}px`;
  switch (kind) {
    case 'fade-in':
      return [{ opacity: 0 }, { opacity: 1 }];
    case 'fade-out':
      return [{ opacity: 1 }, { opacity: 0 }];
    case 'slide-in-left':
      return [
        { opacity: 0, transform: `translateX(-${d})` },
        { opacity: 1, transform: 'translateX(0)' },
      ];
    case 'slide-in-right':
      return [
        { opacity: 0, transform: `translateX(${d})` },
        { opacity: 1, transform: 'translateX(0)' },
      ];
    case 'slide-in-up':
      return [
        { opacity: 0, transform: `translateY(${d})` },
        { opacity: 1, transform: 'translateY(0)' },
      ];
    case 'slide-out-left':
      return [
        { opacity: 1, transform: 'translateX(0)' },
        { opacity: 0, transform: `translateX(-${d})` },
      ];
    case 'slide-out-right':
      return [
        { opacity: 1, transform: 'translateX(0)' },
        { opacity: 0, transform: `translateX(${d})` },
      ];
    case 'scale-in':
      return [
        { opacity: 0, transform: 'scale(0.92)' },
        { opacity: 1, transform: 'scale(1)' },
      ];
    case 'scale-out':
      return [
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(0.94)' },
      ];
    case 'blur-in':
      return [
        { opacity: 0, filter: 'blur(12px)' },
        { opacity: 1, filter: 'blur(0)' },
      ];
    case 'blur-out':
      return [
        { opacity: 1, filter: 'blur(0)' },
        { opacity: 0, filter: 'blur(12px)' },
      ];
  }
}

export function isMotionReduced(): boolean {
  return ThemeManager.getInstance().reducedMotion;
}

function durationFor(duration: number | undefined): number {
  return isMotionReduced() ? 0 : (duration ?? MotionTokens.duration.base);
}

/**
 * Thin wrapper over the Web Animations API with the project's motion
 * vocabulary. Honours the reduced-motion preference globally.
 */
export const AnimationSystem = {
  async play(el: HTMLElement, kind: AnimKind, opts: AnimOptions = {}): Promise<void> {
    const duration = durationFor(opts.duration);
    if (duration === 0) return;
    const kf = keyframesFor(kind, opts.distance ?? 28);
    const anim = el.animate(kf, {
      duration,
      delay: opts.delay ?? 0,
      easing: opts.easing ?? EASE,
      fill: opts.fill ?? 'both',
    });
    await anim.finished.catch(() => undefined);
  },

  /**
   * Plays `kind` on each element, adding `step` ms of stagger per item.
   * `opts.delay` is ignored and replaced by the computed stagger delay.
   */
  async stagger(els: HTMLElement[], kind: AnimKind, opts: AnimOptions = {}, step = 60): Promise<void> {
    await Promise.all(els.map((el, i) => this.play(el, kind, { ...opts, delay: i * step })));
  },

  wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
};
