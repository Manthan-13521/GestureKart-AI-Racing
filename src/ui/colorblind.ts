import type { ColorblindMode } from './tokens';

/**
 * Color-vision presets (GDD §2.4). Maps each named preset to the CSS
 * attribute consumed by `ui.css` plus a human label. Pure and deterministic.
 */
export interface ColorblindPreset {
  mode: ColorblindMode;
  label: string;
  description: string;
}

export const COLORBLIND_PRESETS: ColorblindPreset[] = [
  { mode: 'none', label: 'Off', description: 'Default palette' },
  { mode: 'deuteranopia', label: 'Deuteranopia', description: 'Red-green (most common)' },
  { mode: 'protanopia', label: 'Protanopia', description: 'Red-weak sensitivity' },
  { mode: 'tritanopia', label: 'Tritanopia', description: 'Blue-yellow' },
];

export function colorblindLabel(mode: ColorblindMode): string {
  const preset = COLORBLIND_PRESETS.find((p) => p.mode === mode);
  return preset ? preset.label : 'Off';
}

/** Coerce any stored value into a valid preset (safe migration). */
export function normalizeColorblindMode(value: unknown): ColorblindMode {
  if (value === 'deuteranopia' || value === 'protanopia' || value === 'tritanopia') return value;
  if (value === true) return 'deuteranopia';
  return 'none';
}

/** Old boolean flag → preset (backward-compatible mapping). */
export function colorblindModeFromBoolean(on: boolean): ColorblindMode {
  return on ? 'deuteranopia' : 'none';
}

/** Preset → legacy boolean flag (keeps the boolean API coherent). */
export function colorblindBooleanFromMode(mode: ColorblindMode): boolean {
  return mode !== 'none';
}
