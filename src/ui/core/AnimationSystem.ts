import { MotionTokens } from '../tokens';
import { ThemeManager } from '../ThemeManager';

export type AnimKind =
  | 'fade-in'
  | 'fade-out'
  | 'slide-in-left'
  | 'slide-in-right'
  | 'slide-in-up'
  | 'slide-in-down'
  | 'slide-out-left'
  | 'slide-out-right'
  | 'slide-out-up'
  | 'slide-out-down'
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
  force?: boolean; // bypass reduced-motion
}

const EASE = MotionTokens.easing.out;
const SPRING = MotionTokens.easing.spring;
const SNAP = MotionTokens.easing.snap;
const IN_OUT = MotionTokens.easing.inOut;

const EASE_BY_KIND: Record<AnimKind, string> = {
  'fade-in': EASE,
  'fade-out': EASE,
  'slide-in-left': EASE,
  'slide-in-right': EASE,
  'slide-in-up': EASE,
  'slide-in-down': EASE,
  'slide-out-left': SNAP,
  'slide-out-right': SNAP,
  'slide-out-up': SNAP,
  'slide-out-down': SNAP,
  'scale-in': SPRING,
  'scale-out': SNAP,
  'blur-in': IN_OUT,
  'blur-out': IN_OUT,
};

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
    case 'slide-in-down':
      return [
        { opacity: 0, transform: `translateY(-${d})` },
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
    case 'slide-out-up':
      return [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: `translateY(-${d})` },
      ];
    case 'slide-out-down':
      return [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: `translateY(${d})` },
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
  return (
    ThemeManager.getInstance().reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function durationFor(duration: number | undefined): number {
  if (isMotionReduced()) return 0;
  return duration ?? MotionTokens.duration.base;
}

export const AnimationSystem = {
  async play(el: HTMLElement, kind: AnimKind, opts: AnimOptions = {}): Promise<void> {
    if (!opts.force && isMotionReduced()) {
      // Apply end state immediately
      const kf = keyframesFor(kind, opts.distance ?? 28);
      Object.assign(el.style, kf[kf.length - 1]);
      return;
    }
    const duration = durationFor(opts.duration);
    if (duration === 0) return;
    const kf = keyframesFor(kind, opts.distance ?? 28);
    if (typeof el.animate !== 'function') return;
    const anim = el.animate(kf, {
      duration,
      delay: opts.delay ?? 0,
      easing: opts.easing ?? EASE_BY_KIND[kind],
      fill: opts.fill ?? 'both',
    });
    await anim.finished.catch(() => undefined);
  },

  async stagger(
    els: HTMLElement[],
    kind: AnimKind,
    opts: AnimOptions = {},
    step = MotionTokens.stagger.interval
  ): Promise<void> {
    const maxItems = MotionTokens.stagger.maxItems;
    const limited = Array.from(els).slice(0, maxItems);
    await Promise.all(limited.map((el, i) => this.play(el, kind, { ...opts, delay: i * step })));
  },

  wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /** Create ripple effect on button click. */
  ripple(event: MouseEvent, element: HTMLElement): void {
    if (isMotionReduced()) return;
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    const size = Math.max(element.clientWidth, element.clientHeight);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    element.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  },
};
