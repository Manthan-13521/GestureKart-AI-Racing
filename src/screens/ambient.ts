import { isMotionReduced } from '../ui/core/AnimationSystem';

/**
 * Spawns floating particle layer for cinematic backgrounds. Respects the
 * reduced-motion preference (creates nothing when enabled).
 */
export function spawnParticles(container: HTMLElement, count = 20): void {
  if (isMotionReduced()) return;
  const layer = document.createElement('div');
  layer.className = 'ambient-particles';
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    const size = 2 + Math.random() * 3;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDuration = `${8 + Math.random() * 12}s`;
    p.style.animationDelay = `${-Math.random() * 15}s`;
    layer.appendChild(p);
  }
  container.appendChild(layer);
}

/** Enhanced perspective grid with animated scanlines. */
export function spawnGrid(container: HTMLElement): HTMLElement {
  const grid = document.createElement('div');
  grid.className = 'hero-grid';
  container.appendChild(grid);

  if (!isMotionReduced()) {
    // Add animated scanline overlay
    const scanlines = document.createElement('div');
    scanlines.className = 'grid-scanlines';
    scanlines.setAttribute('aria-hidden', 'true');
    container.appendChild(scanlines);
  }
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

/** Scanline overlay for CRT/monitor aesthetic. Mounted once on app root. */
export function spawnScanlines(root: HTMLElement): HTMLElement {
  if (isMotionReduced()) return root;
  const scanlines = document.createElement('div');
  scanlines.className = 'scanlines-overlay';
  scanlines.setAttribute('aria-hidden', 'true');
  root.appendChild(scanlines);
  return scanlines;
}

/** Vignette overlay for depth. Mounted once on app root. */
export function spawnVignette(root: HTMLElement): HTMLElement {
  const vignette = document.createElement('div');
  vignette.className = 'vignette-overlay';
  vignette.setAttribute('aria-hidden', 'true');
  root.appendChild(vignette);
  return vignette;
}

/** Animated noise texture overlay. Mounted once on app root. */
export function spawnNoiseOverlay(root: HTMLElement): HTMLElement {
  if (isMotionReduced()) return root;
  const noise = document.createElement('div');
  noise.className = 'noise-overlay';
  noise.setAttribute('aria-hidden', 'true');
  root.appendChild(noise);
  return noise;
}

/** Hero background for main menu: gradient sky + grid + scanlines. */
export function spawnHeroBackground(root: HTMLElement): void {
  spawnGrid(root);
  spawnAurora(root);
  spawnParticles(root, 15);
  spawnRoad(root);
  if (!isMotionReduced()) {
    spawnScanlines(root);
    spawnNoiseOverlay(root);
  }
  spawnVignette(root);
}

/** Clean up all ambient effects from a container. */
export function clearAmbient(container: HTMLElement): void {
  const selectors = [
    '.ambient-particles',
    '.hero-grid',
    '.aurora',
    '.home-road',
    '.grid-scanlines',
    '.scanlines-overlay',
    '.vignette-overlay',
    '.noise-overlay',
  ];
  for (const sel of selectors) {
    container.querySelectorAll(sel).forEach((el) => el.remove());
  }
}
