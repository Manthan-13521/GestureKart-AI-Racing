import { describe, it, expect } from 'vitest';
import {
  NEON_ITEMS,
  SKIN_ITEMS,
  TITLE_TIERS,
  isKnownNeon,
  isKnownSkin,
  neonCost,
  neonHex,
  neonName,
  skinCost,
  skinHex,
  skinName,
  titleForLevel,
} from './ContentCatalog';

describe('ContentCatalog', () => {
  it('has no duplicate item ids within a category', () => {
    const skinIds = SKIN_ITEMS.map((i) => i.id);
    const neonIds = NEON_ITEMS.map((i) => i.id);
    expect(new Set(skinIds).size).toBe(skinIds.length);
    expect(new Set(neonIds).size).toBe(neonIds.length);
  });

  it('all costs are non-negative integers', () => {
    for (const item of [...SKIN_ITEMS, ...NEON_ITEMS]) {
      expect(Number.isInteger(item.cost)).toBe(true);
      expect(item.cost).toBeGreaterThanOrEqual(0);
    }
  });

  it('starter cosmetics are free (red/blue neons, default skin)', () => {
    expect(skinCost('default')).toBe(0);
    expect(neonCost('red')).toBe(0);
    expect(neonCost('blue')).toBe(0);
  });

  it('preserves the original skin prices', () => {
    expect(skinCost('blue')).toBe(1500);
    expect(skinCost('green')).toBe(3000);
    expect(skinCost('purple')).toBe(5000);
    expect(skinCost('gold')).toBe(10000);
  });

  it('rejects unknown ids with null cost and fallback visuals', () => {
    expect(isKnownSkin('does-not-exist')).toBe(false);
    expect(isKnownNeon('does-not-exist')).toBe(false);
    expect(skinCost('nope')).toBeNull();
    expect(neonCost('nope')).toBeNull();
    expect(skinHex('nope')).toBe('#0e1015');
    expect(neonHex('nope')).toBe('#22aaff');
    expect(skinName('nope')).toBe('nope');
    expect(neonName('nope')).toBe('nope');
  });

  it('resolves ids to display data', () => {
    expect(isKnownSkin('gold')).toBe(true);
    expect(isKnownNeon('cyan')).toBe(true);
    expect(skinHex('purple')).toBe('#8833cc');
    expect(neonHex('cyan')).toBe('#00d4ff');
    expect(skinName('blue')).toBe('Azure Blue');
    expect(neonName('pink')).toBe('Neon Pink');
  });

  it('titles are level-gated and strictly ordered', () => {
    for (let i = 1; i < TITLE_TIERS.length; i++) {
      expect(TITLE_TIERS[i].level).toBeGreaterThan(TITLE_TIERS[i - 1].level);
    }
  });

  it('titleForLevel picks the highest qualifying tier', () => {
    expect(titleForLevel(0)).toBeNull();
    expect(titleForLevel(1)).toBe('Rookie');
    expect(titleForLevel(2)).toBe('Rookie');
    expect(titleForLevel(3)).toBe('Street Racer');
    expect(titleForLevel(5)).toBe('Street Racer');
    expect(titleForLevel(9)).toBe('Apex');
    expect(titleForLevel(10)).toBe('Pro');
    expect(titleForLevel(99)).toBe('Champion');
  });
});
