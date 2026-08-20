/**
 * ContentCatalog — the single authoritative registry of unlockable cosmetics.
 *
 * The GDD (MASTER-GDD §3.4) specifies a cosmetic-only garage: car themes
 * (skins), neon trails, wheel skins, gloves, banners, name cards and titles.
 * P8 ships skins + neons (the categories the profile already models) and
 * level-gated titles. There are no performance upgrades in the GDD, so the
 * catalog intentionally contains no stat-bearing items.
 *
 * Costs, default ownership and level gates live HERE — never in UI code.
 */
export interface CosmeticItem {
  id: string;
  name: string;
  cost: number;
  hex: string;
}

export interface TitleTier {
  level: number;
  title: string;
}

/** Car themes (skins). Costs preserved from the original garage design. */
export const SKIN_ITEMS: CosmeticItem[] = [
  { id: 'default', name: 'Factory Red', cost: 0, hex: '#cc2222' },
  { id: 'blue', name: 'Azure Blue', cost: 1500, hex: '#1188cc' },
  { id: 'green', name: 'Neon Green', cost: 3000, hex: '#00aa88' },
  { id: 'purple', name: 'Midnight Purple', cost: 5000, hex: '#8833cc' },
  { id: 'gold', name: 'Champion Gold', cost: 10000, hex: '#ccaa33' },
];

/** Neon under-glow colors. red/blue are starter cosmetics (free, owned by default). */
export const NEON_ITEMS: CosmeticItem[] = [
  { id: 'red', name: 'Crimson', cost: 0, hex: '#ff3355' },
  { id: 'blue', name: 'Azure', cost: 0, hex: '#22aaff' },
  { id: 'green', name: 'Toxic', cost: 600, hex: '#00ff88' },
  { id: 'pink', name: 'Neon Pink', cost: 1200, hex: '#ff2d95' },
  { id: 'cyan', name: 'Cyber Cyan', cost: 2000, hex: '#00d4ff' },
  { id: 'gold', name: 'Champion Gold', cost: 5000, hex: '#ffd700' },
];

/** Level-gated identity titles (auto-unlocked, not purchasable). */
export const TITLE_TIERS: TitleTier[] = [
  { level: 1, title: 'Rookie' },
  { level: 3, title: 'Street Racer' },
  { level: 6, title: 'Apex' },
  { level: 10, title: 'Pro' },
  { level: 14, title: 'Elite' },
  { level: 18, title: 'Champion' },
];

function findItem(items: CosmeticItem[], id: string): CosmeticItem | undefined {
  return items.find((i) => i.id === id);
}

export function isKnownSkin(id: string): boolean {
  return findItem(SKIN_ITEMS, id) !== undefined;
}

export function isKnownNeon(id: string): boolean {
  return findItem(NEON_ITEMS, id) !== undefined;
}

export function skinCost(id: string): number | null {
  return findItem(SKIN_ITEMS, id)?.cost ?? null;
}

export function neonCost(id: string): number | null {
  return findItem(NEON_ITEMS, id)?.cost ?? null;
}

export function skinHex(id: string): string {
  return findItem(SKIN_ITEMS, id)?.hex ?? '#0e1015';
}

export function neonHex(id: string): string {
  return findItem(NEON_ITEMS, id)?.hex ?? '#22aaff';
}

export function skinName(id: string): string {
  return findItem(SKIN_ITEMS, id)?.name ?? id;
}

export function neonName(id: string): string {
  return findItem(NEON_ITEMS, id)?.name ?? id;
}

/** Highest title tier at or below `level`. */
export function titleForLevel(level: number): string | null {
  let best: string | null = null;
  for (const tier of TITLE_TIERS) {
    if (level >= tier.level) best = tier.title;
  }
  return best;
}
