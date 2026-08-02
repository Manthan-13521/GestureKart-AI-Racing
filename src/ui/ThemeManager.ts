import { A11yPrefsDefaults, type A11yPrefs } from './tokens';

/**
 * Applies theme and accessibility modes to the document root via data
 * attributes consumed by `ui.css`. Single source of truth for theme state.
 */
export class ThemeManager {
  private prefs: A11yPrefs = { ...A11yPrefsDefaults };
  private readonly root = document.documentElement;

  constructor(initial?: Partial<A11yPrefs>) {
    if (initial) this.set(initial);
  }

  get(): A11yPrefs {
    return { ...this.prefs };
  }

  set(patch: Partial<A11yPrefs>): void {
    this.prefs = { ...this.prefs, ...patch };
    this.apply();
  }

  get reducedMotion(): boolean {
    return this.prefs.reducedMotion;
  }

  /** Globally registered so animations can consult motion preferences. */
  static instance: ThemeManager | null = null;

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  private apply(): void {
    const root = this.root;
    root.dataset.highContrast = String(this.prefs.highContrast);
    root.dataset.colorblind = String(this.prefs.colorblind);
    root.dataset.largeHud = String(this.prefs.largeHud);
    root.dataset.reducedMotion = String(this.prefs.reducedMotion);
  }
}
