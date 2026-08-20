/**
 * profilePersistence — pure profile load/migrate/sanitize pipeline (P8.3).
 *
 * Persisted profile data is UNTRUSTED input. This module is the only place
 * that turns raw storage content into a valid PlayerProfile:
 *
 *   parseProfileJson(raw)  → unknown             (JSON layer)
 *   migrateProfile(raw)    → PlayerProfile       (version + shape layer)
 *
 * Rules:
 *  - version 2 profiles are sanitized field-by-field (valid values are
 *    preserved, invalid values fall back to safe defaults);
 *  - legacy (pre-P8, unversioned) profiles are migrated through the same
 *    sanitizer — recognized fields survive, new fields get defaults;
 *  - any OTHER integer version (0, negative, future >2) fails closed with a
 *    fresh default profile: unknown future schemas are never guessed at;
 *  - level is ALWAYS derived from XP on load (level = 1 + floor(xp/1000)),
 *    so persisted XP and level can never contradict each other;
 *  - completedRaces tokens are deduped, id-validated and capped at 64 (FIFO,
 *    newest entries kept).
 *
 * This module is side-effect free (no storage, no DOM) and fully testable.
 */
import { isKnownNeon, isKnownSkin } from './ContentCatalog';
import type { PlayerProfile } from './types';

export const PROFILE_VERSION = 2;
export const MAX_COMPLETED_RACES = 64;
export const MAX_RACE_ID_LENGTH = 128;

const DEFAULT_SKINS = ['default'];
const DEFAULT_NEONS = ['red', 'blue'];
const DEFAULT_SELECTED_NEON = 'blue';

/** Recognized legacy (pre-P8) profile fields, used for legacy detection. */
const LEGACY_FIELDS = [
  'xp',
  'coins',
  'level',
  'unlockedSkins',
  'selectedSkin',
  'unlockedNeons',
  'selectedNeon',
  'completedRaces',
  'lifetimeStats',
] as const;

/** Deep-fresh default profile — nested arrays are never shared. */
export function createDefaultProfile(): PlayerProfile {
  return {
    version: PROFILE_VERSION,
    xp: 0,
    coins: 0,
    unlockedSkins: [...DEFAULT_SKINS],
    selectedSkin: 'default',
    unlockedNeons: [...DEFAULT_NEONS],
    selectedNeon: DEFAULT_SELECTED_NEON,
    lifetimeStats: { racesFinished: 0 },
    completedRaces: [],
  };
}

/** Safe JSON parse: malformed JSON yields null, never throws. */
export function parseProfileJson(raw: string | null): unknown {
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function nonNegativeInt(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= 0
    ? value
    : 0;
}

function isValidRaceId(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const id = value.trim();
  return id.length > 0 && id.length <= MAX_RACE_ID_LENGTH;
}

/**
 * Validate + dedupe + cap the completion-token list. Newest entries are
 * preserved (the list is append-ordered, so the last MAX entries survive).
 * Invalid entries (non-strings, empty, oversized) are dropped.
 */
export function sanitizeCompletedRaces(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of value) {
    if (!isValidRaceId(entry)) continue;
    const id = entry.trim();
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out.slice(-MAX_COMPLETED_RACES);
}

function sanitizeCosmeticList(value: unknown, known: (id: string) => boolean, defaults: string[]): string[] {
  if (!Array.isArray(value)) return [...defaults];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string' || !known(entry)) continue;
    if (seen.has(entry)) continue;
    seen.add(entry);
    out.push(entry);
  }
  return out.length > 0 ? out : [...defaults];
}

/** Equipped item must be owned (present in the sanitized ownership list). */
function sanitizeSelected(value: unknown, owned: string[], preferred: string): string {
  if (typeof value === 'string' && owned.includes(value)) return value;
  if (owned.includes(preferred)) return preferred;
  return owned[0] ?? preferred;
}

/**
 * Sanitize an arbitrary object into a valid v2 profile. Valid values are
 * preserved; invalid/unknown values fall back to safe defaults. Level is
 * re-derived from the authoritative XP.
 */
export function sanitizeProfile(input: Record<string, unknown>): PlayerProfile {
  const xp = nonNegativeInt(input.xp);
  const coins = nonNegativeInt(input.coins);
  const racesFinished = nonNegativeInt(
    input.lifetimeStats && typeof input.lifetimeStats === 'object'
      ? (input.lifetimeStats as Record<string, unknown>).racesFinished
      : undefined
  );
  const completedRaces = sanitizeCompletedRaces(input.completedRaces);
  const unlockedSkins = sanitizeCosmeticList(input.unlockedSkins, isKnownSkin, DEFAULT_SKINS);
  const unlockedNeons = sanitizeCosmeticList(input.unlockedNeons, isKnownNeon, DEFAULT_NEONS);
  return {
    version: PROFILE_VERSION,
    xp,
    coins,
    unlockedSkins,
    selectedSkin: sanitizeSelected(input.selectedSkin, unlockedSkins, 'default'),
    unlockedNeons,
    selectedNeon: sanitizeSelected(input.selectedNeon, unlockedNeons, DEFAULT_SELECTED_NEON),
    lifetimeStats: { racesFinished },
    completedRaces,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Migrate any persisted value into a valid v2 profile.
 *
 *   null / non-object          → fresh default (no profile exists)
 *   version 2                  → sanitize (repair invalid fields, keep valid)
 *   version 1 / no version     → legacy migration (shape-based sanitize)
 *   other integer version      → fail closed with a fresh default
 *                                (future/unknown schemas are never guessed)
 */
export function migrateProfile(raw: unknown): PlayerProfile {
  if (!isRecord(raw)) return createDefaultProfile();

  const version = raw.version;
  if (typeof version === 'number' && Number.isInteger(version)) {
    if (version === PROFILE_VERSION) return sanitizeProfile(raw);
    if (version === 1) return sanitizeProfile(raw);
    return createDefaultProfile();
  }

  // Unversioned: legacy profile? Only migrate when recognizable fields exist,
  // so arbitrary junk in storage never becomes a "profile".
  const hasLegacyField = LEGACY_FIELDS.some((f) => f in raw);
  if (!hasLegacyField) return createDefaultProfile();
  return sanitizeProfile(raw);
}
