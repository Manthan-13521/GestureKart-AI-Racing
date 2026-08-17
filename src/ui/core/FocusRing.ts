/**
 * Keyboard-mode detection for visible focus styling.
 *
 * With the FocusNavigator (P0.4) now owning focus movement, this singleton
 * only tracks whether the user is navigating with a keyboard vs. pointer so
 * the CSS can show/hide focus rings via `data-keyboard-nav`. Tab and the
 * arrow keys switch it on; any mouse/pointer interaction switches it off.
 */
export class FocusRing {
  private static instance: FocusRing | null = null;

  static getInstance(): FocusRing {
    if (!FocusRing.instance) {
      const ring = new FocusRing();
      FocusRing.instance = ring;
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' || e.key.startsWith('Arrow')) {
          ring.mark(true);
        }
      });
      document.addEventListener('mousedown', () => ring.mark(false));
      document.addEventListener('pointerdown', () => ring.mark(false));
    }
    return FocusRing.instance;
  }

  private mark(isKeyboard: boolean): void {
    document.documentElement.dataset.keyboardNav = String(isKeyboard);
  }
}
