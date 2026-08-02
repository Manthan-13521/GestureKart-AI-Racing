import { Breakpoints, type BreakpointName } from '../tokens';

export interface ViewportState {
  width: number;
  height: number;
  breakpoint: BreakpointName;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  landscape: boolean;
}

export function readViewport(): ViewportState {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const breakpoint: BreakpointName =
    width < Breakpoints.mobile ? 'mobile' : width < Breakpoints.tablet ? 'tablet' : 'desktop';
  return {
    width,
    height,
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    landscape: width > height,
  };
}

/** Build a `clamp()` value for fluid type/spacing across viewports. */
export function clampSize(min: number, preferred: number, max: number): string {
  return `clamp(${min}px, ${preferred}px, ${max}px)`;
}

export type ViewportListener = (state: ViewportState) => void;

const listeners = new Set<ViewportListener>();

let current = readViewport();

function recompute(): void {
  const next = readViewport();
  if (next.width === current.width && next.height === current.height) return;
  current = next;
  for (const fn of [...listeners]) fn(current);
}

window.addEventListener('resize', recompute);
window.addEventListener('orientationchange', recompute);

/**
 * Shared viewport observer. Components subscribe once and get updates on
 * resize / orientation change; unsubscribing returns an unsubscribe fn.
 */
export function watchViewport(fn: ViewportListener): () => void {
  listeners.add(fn);
  fn(current);
  return () => listeners.delete(fn);
}

export function currentViewport(): ViewportState {
  return current;
}
