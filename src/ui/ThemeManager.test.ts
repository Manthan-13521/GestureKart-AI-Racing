import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeManager } from './ThemeManager';

describe('ThemeManager', () => {
  beforeEach(() => {
    ThemeManager.instance = null;
  });

  it('applies a11y attributes to the document root', () => {
    const tm = new ThemeManager({ highContrast: true, reducedMotion: true });
    void tm;
    expect(document.documentElement.dataset.highContrast).toBe('true');
    expect(document.documentElement.dataset.reducedMotion).toBe('true');
    expect(document.documentElement.dataset.largeHud).toBe('false');
  });

  it('patches only provided keys', () => {
    const tm = new ThemeManager({ highContrast: true });
    tm.set({ colorblind: true });
    const prefs = tm.get();
    expect(prefs.highContrast).toBe(true);
    expect(prefs.colorblind).toBe(true);
    expect(prefs.largeHud).toBe(false);
    expect(prefs.reducedMotion).toBe(false);
  });

  it('exposes reducedMotion read flag', () => {
    const tm = new ThemeManager({ reducedMotion: true });
    expect(tm.reducedMotion).toBe(true);
    expect(tm.get().highContrast).toBe(false);
  });
});
