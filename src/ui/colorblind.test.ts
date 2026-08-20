import { describe, it, expect } from 'vitest';
import {
  COLORBLIND_PRESETS,
  colorblindLabel,
  normalizeColorblindMode,
  colorblindModeFromBoolean,
  colorblindBooleanFromMode,
} from './colorblind';

describe('colorblind presets', () => {
  it('exposes four presets including none', () => {
    expect(COLORBLIND_PRESETS.map((p) => p.mode)).toEqual([
      'none',
      'deuteranopia',
      'protanopia',
      'tritanopia',
    ]);
  });

  it('normalizes stored values defensively', () => {
    expect(normalizeColorblindMode('deuteranopia')).toBe('deuteranopia');
    expect(normalizeColorblindMode('protanopia')).toBe('protanopia');
    expect(normalizeColorblindMode('tritanopia')).toBe('tritanopia');
    expect(normalizeColorblindMode(true)).toBe('deuteranopia');
    expect(normalizeColorblindMode(undefined)).toBe('none');
    expect(normalizeColorblindMode('garbage')).toBe('none');
  });

  it('maps boolean to/from presets', () => {
    expect(colorblindModeFromBoolean(true)).toBe('deuteranopia');
    expect(colorblindModeFromBoolean(false)).toBe('none');
    expect(colorblindBooleanFromMode('protanopia')).toBe(true);
    expect(colorblindBooleanFromMode('none')).toBe(false);
  });

  it('labels presets', () => {
    expect(colorblindLabel('tritanopia')).toBe('Tritanopia');
    expect(colorblindLabel('none')).toBe('Off');
  });
});
