import { describe, it, expect } from 'vitest';
import {
  PROFILE_VERSION,
  MAX_COMPLETED_RACES,
  createDefaultProfile,
  parseProfileJson,
  migrateProfile,
  sanitizeCompletedRaces,
} from './profilePersistence';
import { levelForXp } from './XpProgression';

function validV2Profile() {
  return {
    version: 2,
    xp: 3450,
    coins: 500,
    level: 4,
    unlockedSkins: ['default', 'blue'],
    selectedSkin: 'blue',
    unlockedNeons: ['red', 'blue', 'green', 'cyan'],
    selectedNeon: 'cyan',
    lifetimeStats: { racesFinished: 3 },
    completedRaces: ['race-a', 'race-b', 'race-c'],
    someFutureField: 'ignored',
  };
}

describe('parseProfileJson (P8.3)', () => {
  it('null/empty input yields null', () => {
    expect(parseProfileJson(null)).toBeNull();
    expect(parseProfileJson('')).toBeNull();
  });

  it('invalid JSON yields null instead of throwing', () => {
    expect(parseProfileJson('{not json')).toBeNull();
    expect(parseProfileJson('undefined')).toBeNull();
  });

  it('valid JSON parses', () => {
    expect(parseProfileJson('{"xp":5}')).toEqual({ xp: 5 });
  });
});

describe('migrateProfile — schema version (P8.3)', () => {
  it('no profile (null/undefined) creates a valid default v2 profile', () => {
    const p = migrateProfile(null);
    expect(p.version).toBe(PROFILE_VERSION);
    expect(p).toEqual(createDefaultProfile());
  });

  it('non-object persisted values (array, primitive, string) create defaults', () => {
    expect(migrateProfile([])).toEqual(createDefaultProfile());
    expect(migrateProfile('oops')).toEqual(createDefaultProfile());
    expect(migrateProfile(42)).toEqual(createDefaultProfile());
    expect(migrateProfile(true)).toEqual(createDefaultProfile());
  });

  it('empty object (no legacy fields) creates defaults', () => {
    expect(migrateProfile({})).toEqual(createDefaultProfile());
  });

  it('valid v2 profile round-trips without changing valid values', () => {
    const p = migrateProfile(validV2Profile());
    expect(p.version).toBe(PROFILE_VERSION);
    expect(p.xp).toBe(3450);
    expect(p.coins).toBe(500);
    expect(levelForXp(p.xp)).toBe(4);
    expect(p.unlockedSkins).toEqual(['default', 'blue']);
    expect(p.selectedSkin).toBe('blue');
    expect(p.unlockedNeons).toEqual(['red', 'blue', 'green', 'cyan']);
    expect(p.selectedNeon).toBe('cyan');
    expect(p.lifetimeStats.racesFinished).toBe(3);
    expect(p.completedRaces).toEqual(['race-a', 'race-b', 'race-c']);
  });

  it('extra unknown fields are ignored', () => {
    const p = migrateProfile({ ...validV2Profile(), hackerField: 'x', nested: { a: 1 } });
    expect('hackerField' in p).toBe(false);
    expect(p.xp).toBe(3450);
  });

  it('unversioned legacy profile migrates: recognized fields survive, new fields default', () => {
    const p = migrateProfile({
      xp: 1250,
      coins: 500,
      level: 50,
      unlockedSkins: ['default', 'blue'],
      selectedSkin: 'blue',
      unlockedNeons: ['red', 'blue'],
      selectedNeon: 'red',
    });
    expect(p.version).toBe(PROFILE_VERSION);
    expect(p.xp).toBe(1250);
    expect(p.coins).toBe(500);
    expect(p.unlockedSkins).toEqual(['default', 'blue']);
    expect(p.selectedSkin).toBe('blue');
    expect(p.selectedNeon).toBe('red');
    expect(p.lifetimeStats.racesFinished).toBe(0);
    expect(p.completedRaces).toEqual([]);
  });

  it('explicit version 1 profile migrates through the same path', () => {
    const p = migrateProfile({ version: 1, xp: 999, coins: 10 });
    expect(p.version).toBe(PROFILE_VERSION);
    expect(p.xp).toBe(999);
    expect(p.coins).toBe(10);
    expect(levelForXp(p.xp)).toBe(1);
  });

  it('unknown future schema version fails closed with a safe default (no speculative migration)', () => {
    expect(migrateProfile({ version: 3, xp: 999999, coins: 999999 })).toEqual(createDefaultProfile());
    expect(migrateProfile({ ...validV2Profile(), version: 99 })).toEqual(createDefaultProfile());
  });

  it('corrupt integer versions (0, negative) fail closed to a default profile', () => {
    expect(migrateProfile({ version: 0, xp: 100 })).toEqual(createDefaultProfile());
    expect(migrateProfile({ version: -5, xp: 100 })).toEqual(createDefaultProfile());
  });

  it('non-integer version values are treated as legacy (shape-based recovery preserves valid data)', () => {
    const p1 = migrateProfile({ version: '2', xp: 100 });
    expect(p1.version).toBe(PROFILE_VERSION);
    expect(p1.xp).toBe(100);
    const p2 = migrateProfile({ version: 2.5, xp: 250 });
    expect(p2.version).toBe(PROFILE_VERSION);
    expect(p2.xp).toBe(250);
  });
});

describe('sanitizeProfile — value validation (P8.3)', () => {
  it('invalid XP (negative, fractional, string, null, boolean) sanitizes to 0', () => {
    expect(migrateProfile({ version: 2, xp: -50 }).xp).toBe(0);
    expect(migrateProfile({ version: 2, xp: 1.5 }).xp).toBe(0);
    expect(migrateProfile({ version: 2, xp: 'lots' }).xp).toBe(0);
    expect(migrateProfile({ version: 2, xp: null }).xp).toBe(0);
    expect(migrateProfile({ version: 2, xp: true }).xp).toBe(0);
    expect(migrateProfile({ version: 2, xp: NaN }).xp).toBe(0);
    expect(migrateProfile({ version: 2, xp: Infinity }).xp).toBe(0);
  });

  it('valid XP is preserved', () => {
    expect(migrateProfile({ version: 2, xp: 2500 }).xp).toBe(2500);
  });

  it('invalid coins (negative, fractional, string, NaN/Infinity) sanitize to 0', () => {
    expect(migrateProfile({ version: 2, coins: -1 }).coins).toBe(0);
    expect(migrateProfile({ version: 2, coins: 9.99 }).coins).toBe(0);
    expect(migrateProfile({ version: 2, coins: 'rich' }).coins).toBe(0);
    expect(migrateProfile({ version: 2, coins: NaN }).coins).toBe(0);
    expect(migrateProfile({ version: 2, coins: Infinity }).coins).toBe(0);
  });

  it('invalid level is repaired by deriving it from XP', () => {
    expect(levelForXp(migrateProfile({ version: 2, xp: 1250, level: 99 }).xp)).toBe(2);
    expect(levelForXp(migrateProfile({ version: 2, xp: 1250, level: 'high' }).xp)).toBe(2);
    expect(levelForXp(migrateProfile({ version: 2, xp: 1250, level: -3 }).xp)).toBe(2);
  });

  it('level is always the XP-derived level (0/999/1000/1999/2000/large)', () => {
    const cases: Array<[number, number]> = [
      [0, 1],
      [999, 1],
      [1000, 2],
      [1999, 2],
      [2000, 3],
      [250000, 251],
    ];
    for (const [xp, level] of cases) {
      const p = migrateProfile({ version: 2, xp, level: 999 });
      expect(levelForXp(p.xp)).toBe(level);
      expect(p.xp).toBe(xp);
    }
  });

  it('invalid racesFinished is repaired to 0', () => {
    expect(
      migrateProfile({ version: 2, lifetimeStats: { racesFinished: 'many' } }).lifetimeStats.racesFinished
    ).toBe(0);
    expect(
      migrateProfile({ version: 2, lifetimeStats: { racesFinished: -5 } }).lifetimeStats.racesFinished
    ).toBe(0);
    expect(
      migrateProfile({ version: 2, lifetimeStats: { racesFinished: 2.5 } }).lifetimeStats.racesFinished
    ).toBe(0);
    expect(migrateProfile({ version: 2, lifetimeStats: 'junk' }).lifetimeStats.racesFinished).toBe(0);
    expect(migrateProfile({ version: 2, lifetimeStats: null }).lifetimeStats.racesFinished).toBe(0);
  });

  it('valid racesFinished is preserved', () => {
    expect(
      migrateProfile({ version: 2, lifetimeStats: { racesFinished: 7 } }).lifetimeStats.racesFinished
    ).toBe(7);
  });
});

describe('sanitizeCompletedRaces (P8.3)', () => {
  it('non-array values yield an empty token list', () => {
    expect(sanitizeCompletedRaces(null)).toEqual([]);
    expect(sanitizeCompletedRaces('race-1')).toEqual([]);
    expect(sanitizeCompletedRaces(5)).toEqual([]);
  });

  it('invalid entries (numbers, empties, whitespace, oversized) are dropped', () => {
    const long = 'r'.repeat(129);
    expect(sanitizeCompletedRaces(['race-1', 42, '', '   ', null, true, long, 'race-2'])).toEqual([
      'race-1',
      'race-2',
    ]);
  });

  it('duplicate ids are removed without increasing length', () => {
    const out = sanitizeCompletedRaces(['race-a', 'race-b', 'race-a', 'race-b']);
    expect(out).toEqual(['race-a', 'race-b']);
  });

  it('tokens are capped at 64, preserving the newest entries', () => {
    const ids = Array.from({ length: 70 }, (_, i) => `race-${i}`);
    const out = sanitizeCompletedRaces(ids);
    expect(out.length).toBe(MAX_COMPLETED_RACES);
    expect(out[0]).toBe('race-6');
    expect(out[out.length - 1]).toBe('race-69');
  });

  it('65 persisted tokens stay bounded through reload', () => {
    const ids = Array.from({ length: 65 }, (_, i) => `race-${i}`);
    const p = migrateProfile({ version: 2, completedRaces: ids });
    expect(p.completedRaces.length).toBe(MAX_COMPLETED_RACES);
    expect(p.completedRaces).toEqual(ids.slice(-MAX_COMPLETED_RACES));
  });
});

describe('cosmetic field validation (P8.3)', () => {
  it('unknown skin/neon ids are dropped from ownership; valid ones survive', () => {
    const p = migrateProfile({
      version: 2,
      unlockedSkins: ['default', 'blue', 'not-a-skin'],
      selectedSkin: 'not-a-skin',
      unlockedNeons: ['red', 'hacked', 'cyan'],
      selectedNeon: 'hacked',
    });
    expect(p.unlockedSkins).toEqual(['default', 'blue']);
    expect(p.selectedSkin).toBe('default');
    expect(p.unlockedNeons).toEqual(['red', 'cyan']);
    expect(p.selectedNeon).toBe('red');
  });

  it('non-array cosmetic fields fall back to starter defaults', () => {
    const p = migrateProfile({ version: 2, unlockedSkins: 'default', unlockedNeons: 7 });
    expect(p.unlockedSkins).toEqual(['default']);
    expect(p.unlockedNeons).toEqual(['red', 'blue']);
    expect(p.selectedSkin).toBe('default');
    expect(p.selectedNeon).toBe('blue');
  });

  it('duplicate cosmetic ids are removed', () => {
    const p = migrateProfile({ version: 2, unlockedSkins: ['default', 'blue', 'blue'] });
    expect(p.unlockedSkins).toEqual(['default', 'blue']);
  });

  it('valid cosmetic ownership and equipped state survive migration', () => {
    const p = migrateProfile({
      xp: 3000,
      coins: 800,
      unlockedSkins: ['default', 'green'],
      selectedSkin: 'green',
      unlockedNeons: ['red', 'blue', 'pink'],
      selectedNeon: 'pink',
    });
    expect(p.unlockedSkins).toEqual(['default', 'green']);
    expect(p.selectedSkin).toBe('green');
    expect(p.unlockedNeons).toEqual(['red', 'blue', 'pink']);
    expect(p.selectedNeon).toBe('pink');
  });

  it('legacy purchased/equipped cosmetics survive migration', () => {
    const p = migrateProfile({
      xp: 1250,
      coins: 500,
      unlockedSkins: ['default', 'blue'],
      selectedSkin: 'blue',
      unlockedNeons: ['red', 'blue'],
      selectedNeon: 'red',
    });
    expect(p.unlockedSkins).toEqual(['default', 'blue']);
    expect(p.selectedSkin).toBe('blue');
    expect(p.unlockedNeons).toEqual(['red', 'blue']);
    expect(p.selectedNeon).toBe('red');
  });
});

describe('default profile integrity (P8.3)', () => {
  it('default profile is deep-fresh: mutations never leak across instances', () => {
    const a = createDefaultProfile();
    const b = createDefaultProfile();
    a.completedRaces.push('x');
    a.unlockedSkins.push('blue');
    a.lifetimeStats.racesFinished = 99;
    expect(b.completedRaces).toEqual([]);
    expect(b.unlockedSkins).toEqual(['default']);
    expect(b.lifetimeStats.racesFinished).toBe(0);
  });
});
