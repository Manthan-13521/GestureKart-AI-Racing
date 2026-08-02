/**
 * Keyboard / gamepad focus management. Provides a visible focus ring for
 * non-pointer interaction and arrow-key navigation over card grids.
 */
export class FocusRing {
  private static instance: FocusRing | null = null;

  static getInstance(): FocusRing {
    if (!FocusRing.instance) {
      const ring = new FocusRing();
      FocusRing.instance = ring;
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          ring.mark(true);
          return;
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          ring.navigate(e.key);
        }
      });
      document.addEventListener('mousedown', () => ring.mark(false));
      document.addEventListener('pointerdown', () => ring.mark(false));
    }
    return FocusRing.instance;
  }

  private keyboardMode = false;

  private mark(isKeyboard: boolean): void {
    this.keyboardMode = isKeyboard;
    document.documentElement.dataset.keyboardNav = String(isKeyboard);
  }

  private get container(): HTMLElement | null {
    const active = document.activeElement;
    return active instanceof HTMLElement ? active.closest<HTMLElement>('[data-focus-group]') : null;
  }

  private navigate(key: string): void {
    if (!this.keyboardMode) return;
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) return;
    if (active.matches('input, select, textarea, [contenteditable]')) return;
    const container = this.container;
    if (!container) return;
    const items = Array.from(
      container.querySelectorAll<HTMLElement>('[tabindex]:not([tabindex="-1"]), button, a')
    ).filter((el) => !el.hasAttribute('disabled'));
    if (items.length === 0) return;
    const idx = items.indexOf(active);
    if (idx === -1) return;
    const forward = key === 'ArrowDown' || key === 'ArrowRight';
    const next = forward ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
    items[next].focus();
    this.mark(true);
  }
}
