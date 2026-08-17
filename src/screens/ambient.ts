import { isMotionReduced } from '../ui/core/AnimationSystem';

/**
 * Spawns floating particle layer for cinematic backgrounds. Respects the
 * reduced-motion preference (creates nothing when enabled).
 */
export function spawnParticles(container: HTMLElement, count = 26): void {
  if (isMotionReduced()) return;
  const layer = document.createElement('div');
  layer.className = 'ambient-particles';
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    const size = 2 + Math.random() * 4;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDuration = `${6 + Math.random() * 9}s`;
    p.style.animationDelay = `${-Math.random() * 12}s`;
    layer.appendChild(p);
  }
  container.appendChild(layer);
}

/** Ambient perspective grid used on menu screens. */
export function spawnGrid(container: HTMLElement): HTMLElement {
  const grid = document.createElement('div');
  grid.className = 'hero-grid';
  container.appendChild(grid);
  return grid;
}

/** Soft aurora light blobs for depth on hero screens. */
export function spawnAurora(container: HTMLElement): void {
  if (isMotionReduced()) return;
  for (const variant of ['aurora--1', 'aurora--2'] as const) {
    const blob = document.createElement('div');
    blob.className = `aurora ${variant}`;
    container.appendChild(blob);
  }
}

/**
 * Racing lane layer: a perspective highway strip with animated centre lane
 * dashes on the home screen. Transform-only animation (no layout/paint
 * churn), created only when motion is allowed. `null` when reduced motion.
 */
export function spawnRoad(container: HTMLElement): HTMLElement | null {
  if (isMotionReduced()) return null;
  const road = document.createElement('div');
  road.className = 'home-road';
  road.setAttribute('aria-hidden', 'true');
  container.appendChild(road);
  return road;
}
