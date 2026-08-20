import { A11yPrefsDefaults, type A11yPrefs, type ColorblindMode } from './tokens';
import { colorblindModeFromBoolean, normalizeColorblindMode } from './colorblind';

/**
 * Applies theme and accessibility modes to the document root via data
 * attributes consumed by `ui.css`. Single source of truth for theme state.
 *
 * Colorblind support exposes both the legacy `data-colorblind` boolean and
 * the granular `data-colorblind-mode` preset attribute. When only the
 * boolean is set, `colorblindMode` is derived (true → deuteranopia).
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

  get colorblindMode(): ColorblindMode {
    return normalizeColorblindMode(this.prefs.colorblindMode);
  }

  set(patch: Partial<A11yPrefs>): void {
    let colorblind = patch.colorblind;
    let colorblindMode = patch.colorblindMode;
    if (patch.colorblind !== undefined && patch.colorblindMode === undefined) {
      colorblindMode = colorblindModeFromBoolean(patch.colorblind);
    }
    if (patch.colorblindMode !== undefined && patch.colorblind === undefined) {
      colorblind = patch.colorblindMode !== 'none';
    }
    this.prefs = {
      ...this.prefs,
      ...patch,
      ...(colorblind !== undefined ? { colorblind } : {}),
      ...(colorblindMode !== undefined ? { colorblindMode: normalizeColorblindMode(colorblindMode) } : {}),
    };
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
    root.dataset.colorblind = String(this.colorblindMode !== 'none');
    root.dataset.colorblindMode = this.colorblindMode;
    root.dataset.largeHud = String(this.prefs.largeHud);
    root.dataset.reducedMotion = String(this.prefs.reducedMotion);
  }
}
