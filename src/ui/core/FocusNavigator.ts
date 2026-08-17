/**
 * Small reusable focus-navigation abstraction (P0.4).
 *
 * Owns one clearly-active element inside a screen root and moves it with
 * directional commands (arrow keys today, a gamepad adapter later). It
 * navigates between `[data-focus-group]` clusters in document order, wraps
 * at screen edges, skips hidden/disabled controls, and routes Enter/Space
 * activation and Escape to a screen's existing back behavior.
 *
 * The class never traps focus: Tab remains native, Escape returns to the
 * start of the screen (or invokes the optional `onCancel`), and pointer
 * interaction keeps working untouched.
 */
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface FocusNavigatorOptions {
  /** Called on Escape when the screen has back behavior. */
  onCancel?: () => void;
}

const NATIVE_ACTIVATORS =
  'button, input, select, textarea, a[href], label, summary, [contenteditable], [role="link"]';

const ELIGIBLE_SELECTOR = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const SKIP_GUARD = 'input, select, textarea, [contenteditable]';

export class FocusNavigator {
  private readonly root: HTMLElement;
  private readonly onCancel: (() => void) | undefined;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private focusHandler: ((e: FocusEvent) => void) | null = null;
  private activeEl: HTMLElement | null = null;

  constructor(root: HTMLElement, options: FocusNavigatorOptions = {}) {
    this.root = root;
    this.onCancel = options.onCancel;
  }

  bind(): void {
    if (this.keyHandler) return;
    this.keyHandler = (e) => this.handleKey(e);
    this.focusHandler = (e) => {
      if (e.target instanceof HTMLElement && this.root.contains(e.target)) {
        this.activeEl = e.target;
      }
    };
    this.root.addEventListener('keydown', this.keyHandler, { capture: true });
    this.root.addEventListener('focusin', this.focusHandler);
  }

  dispose(): void {
    if (this.keyHandler) this.root.removeEventListener('keydown', this.keyHandler, { capture: true });
    if (this.focusHandler) this.root.removeEventListener('focusin', this.focusHandler);
    this.keyHandler = null;
    this.focusHandler = null;
    this.activeEl = null;
  }

  get active(): HTMLElement | null {
    return this.activeEl;
  }

  // ── Public command API (keyboard now, gamepad adapter later) ─────

  move(dir: Direction): void {
    const target = this.resolveMove(dir);
    if (target) this.setFocus(target);
  }

  activate(): void {
    const el = this.activeEl;
    if (!el) return;
    if (this.activatesNatively(el)) return;
    el.click();
  }

  cancel(): void {
    if (this.onCancel) {
      this.onCancel();
      return;
    }
    this.focusFirst();
  }

  // ── Focus entry points ────────────────────────────────────────────

  focusFirst(): void {
    const items = this.getFocusable();
    if (items[0]) this.setFocus(items[0]);
  }

  focusLast(): void {
    const items = this.getFocusable();
    if (items[items.length - 1]) this.setFocus(items[items.length - 1]);
  }

  // ── Key handling ──────────────────────────────────────────────────

  private handleKey(e: KeyboardEvent): void {
    const target = e.target;
    // Track the real focus target from keyboard events so navigation works
    // even when the browser does not emit focusin (e.g. test environments).
    if (
      target instanceof HTMLElement &&
      target.matches(ELIGIBLE_SELECTOR) &&
      this.root.contains(target) &&
      this.isEligible(target)
    ) {
      this.activeEl = target;
    }
    if (target instanceof HTMLElement && target.matches(SKIP_GUARD)) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        this.move('up');
        return;
      case 'ArrowDown':
        e.preventDefault();
        this.move('down');
        return;
      case 'ArrowLeft':
        e.preventDefault();
        this.move('left');
        return;
      case 'ArrowRight':
        e.preventDefault();
        this.move('right');
        return;
      case 'Enter':
      case ' ':
        if (this.activeEl && !this.activatesNatively(this.activeEl)) {
          e.preventDefault();
          this.activate();
        }
        return;
      case 'Escape':
        e.preventDefault();
        this.cancel();
        return;
    }
  }

  // ── Movement resolution ───────────────────────────────────────────

  private getFocusable(): HTMLElement[] {
    return Array.from(this.root.querySelectorAll<HTMLElement>(ELIGIBLE_SELECTOR)).filter((el) =>
      this.isEligible(el)
    );
  }

  private isEligible(el: HTMLElement): boolean {
    if (el.hasAttribute('disabled')) return false;
    const still = el.closest('[hidden], [aria-hidden="true"], [inert]');
    if (still) return false;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    return true;
  }

  private hasGeometry(items: HTMLElement[]): boolean {
    return items.some((el) => el.getBoundingClientRect().width > 0);
  }

  /** Clusters of navigable items in document order (groups + standalones). */
  private clusters(): HTMLElement[][] {
    const all = this.getFocusable();
    const groups = Array.from(this.root.querySelectorAll<HTMLElement>('[data-focus-group]'));
    const clusters: HTMLElement[][] = [];
    const inGroup = new Set<HTMLElement>();
    for (const group of groups) {
      const items = all.filter((el) => group.contains(el) && group !== el);
      if (items.length === 0) continue;
      items.forEach((el) => inGroup.add(el));
      clusters.push(items);
    }
    for (const el of all) {
      if (!inGroup.has(el)) clusters.push([el]);
    }
    return clusters;
  }

  private locate(
    el: HTMLElement,
    clusters: HTMLElement[][]
  ): { cluster: HTMLElement[]; index: number } | null {
    for (const cluster of clusters) {
      const index = cluster.indexOf(el);
      if (index !== -1) return { cluster, index };
    }
    return null;
  }

  private resolveMove(dir: Direction): HTMLElement | null {
    const items = this.getFocusable();
    if (items.length === 0) return null;

    const active = this.activeEl && items.includes(this.activeEl) ? this.activeEl : items[0];
    const clusters = this.clusters();
    const loc = this.locate(active, clusters);
    if (!loc) return null;
    const { cluster, index } = loc;

    // Geometry-aware: prefer same-row/column neighbors on real layouts.
    if (this.hasGeometry(items)) {
      const neighbor = this.geometricNeighbor(cluster, active, dir);
      if (neighbor) return neighbor;
    }

    const forward = dir === 'down' || dir === 'right';
    const horizontal = dir === 'left' || dir === 'right';

    if (horizontal) {
      // Rows wrap within the cluster.
      return (
        this.nextEligible(cluster, index, forward) ?? this.wrapEligible(cluster, index, forward) ?? active
      );
    }
    // Vertical stacks cross between clusters at the edges.
    const within = this.nextEligible(cluster, index, forward);
    if (within) return within;
    return (
      (forward ? this.nextClusterEntry(clusters, cluster) : this.prevClusterExit(clusters, cluster)) ?? active
    );
  }

  private nextEligible(cluster: HTMLElement[], fromIndex: number, forward: boolean): HTMLElement | null {
    const step = forward ? 1 : -1;
    for (let i = fromIndex + step; i >= 0 && i < cluster.length; i += step) {
      if (this.isEligible(cluster[i])) return cluster[i];
    }
    return null;
  }

  private wrapEligible(cluster: HTMLElement[], fromIndex: number, forward: boolean): HTMLElement | null {
    const len = cluster.length;
    if (len <= 1) return null;
    for (let step = 1; step < len; step++) {
      const i = forward ? (fromIndex + step) % len : (fromIndex - step + len) % len;
      if (this.isEligible(cluster[i])) return cluster[i];
    }
    return null;
  }

  private geometricNeighbor(cluster: HTMLElement[], active: HTMLElement, dir: Direction): HTMLElement | null {
    const activeRect = active.getBoundingClientRect();
    const centers = cluster
      .map((el) => ({ el, rect: el.getBoundingClientRect() }))
      .filter((c) => c.rect.width > 0 && c.rect.height > 0);
    if (centers.length < 2) return null;

    const ax = activeRect.left + activeRect.width / 2;
    const ay = activeRect.top + activeRect.height / 2;
    let best: HTMLElement | null = null;
    let bestDist = Infinity;

    for (const { el, rect } of centers) {
      if (el === active) continue;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = cx - ax;
      const dy = cy - ay;
      const dist = Math.hypot(dx, dy);
      const matches =
        dir === 'up'
          ? dy < -1 && dist < bestDist
          : dir === 'down'
            ? dy > 1 && dist < bestDist
            : dir === 'left'
              ? dx < -1 && dist < bestDist
              : dx > 1 && dist < bestDist;
      if (matches) {
        best = el;
        bestDist = dist;
      }
    }
    return best;
  }

  private nextClusterEntry(clusters: HTMLElement[][], current: HTMLElement[]): HTMLElement | null {
    const idx = clusters.indexOf(current);
    const count = clusters.length;
    for (let i = 1; i <= count; i++) {
      const next = clusters[(idx + i) % count];
      if (next === current) continue;
      const entry = next.find((el) => this.isEligible(el));
      if (entry) return entry;
    }
    return null;
  }

  private prevClusterExit(clusters: HTMLElement[][], current: HTMLElement[]): HTMLElement | null {
    const idx = clusters.indexOf(current);
    const count = clusters.length;
    for (let i = 1; i <= count; i++) {
      const prev = clusters[(idx - i + count) % count];
      if (prev === current) continue;
      for (let j = prev.length - 1; j >= 0; j--) {
        if (this.isEligible(prev[j])) return prev[j];
      }
    }
    return null;
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private activatesNatively(el: HTMLElement): boolean {
    return el.matches(NATIVE_ACTIVATORS);
  }

  private setFocus(el: HTMLElement): void {
    if (!this.isEligible(el)) return;
    this.activeEl = el;
    document.documentElement.dataset.keyboardNav = 'true';
    el.focus({ preventScroll: true });
  }
}

/**
 * Future gamepad hook: map D-pad / buttons to navigator commands without
 * modeling a gamepad here. A later phase can feed `navigator.move(...)` /
 * `navigator.activate()` / `navigator.cancel()` from real gamepad events.
 */
export function mapGamepadToCommands(_navigator: FocusNavigator): () => void {
  return () => {};
}
