/**
 * P5.1 — AI Identity + Personality + Tiers tests.
 *
 * Covers:
 *  - A. Identity tests: all six exist, characteristic fingerprints, stable names
 *  - B. Personality tests: 0..1 normalization, deterministic seeding, bounded variation
 *  - C. Tier tests: five tiers, deterministic strength ordering
 *  - D. Expert tests: never randomly mistakes
 *  - E. Chameleon tests: <3 races, exactly 3 races, adapts to performance, bounded, deterministic
 *  - F. Grid tests: six identities, deterministic grid, correct assignment
 */
import { describe, it, expect } from 'vitest';
import {
  IDENTITY_FINGERPRINTS,
  IDENTITY_NAMES,
  IDENTITY_ORDER,
  TIER_ORDER,
  isNormalized,
  identityFingerprint,
  seedNoise,
} from '../ai/AIIdentity';
import type { IdentityFingerprint } from '../ai/AIIdentity';
import { PERSONALITIES, buildGrid, toEnginePersonality } from '../ai/AIPersonality';
import { ChameleonAdapter } from '../ai/ChameleonAdapter';

// ─── A. Identity tests ────────────────────────────────────────────────────────

describe('GDD identities', () => {
  it('defines all six GDD identities', () => {
    expect(IDENTITY_ORDER).toHaveLength(6);
    expect(IDENTITY_ORDER).toEqual(
      expect.arrayContaining(['blaze', 'shield', 'vector', 'risky', 'chameleon', 'comet'])
    );
  });

  it('identity names are stable and uppercase-initial', () => {
    expect(IDENTITY_NAMES.blaze).toBe('Blaze');
    expect(IDENTITY_NAMES.shield).toBe('Shield');
    expect(IDENTITY_NAMES.vector).toBe('Vector');
    expect(IDENTITY_NAMES.risky).toBe('Risky');
    expect(IDENTITY_NAMES.chameleon).toBe('Chameleon');
    expect(IDENTITY_NAMES.comet).toBe('Comet');
  });

  it('Blaze is aggressive with strong boost sense and low braking discipline', () => {
    const fp = IDENTITY_FINGERPRINTS.blaze;
    expect(fp.aggression).toBeGreaterThan(0.8);
    expect(fp.boostSense).toBeGreaterThan(0.8);
    expect(fp.braking).toBeLessThan(0.5);
    expect(fp.mistakeFreq).toBeLessThan(0.2);
  });

  it('Shield is defensive: low aggression, high braking, high consistency', () => {
    const fp = IDENTITY_FINGERPRINTS.shield;
    expect(fp.aggression).toBeLessThan(0.3);
    expect(fp.braking).toBeGreaterThan(0.8);
    expect(fp.consistency).toBeGreaterThan(0.8);
  });

  it('Vector is precision: high cornering, high consistency, near-zero mistakes', () => {
    const fp = IDENTITY_FINGERPRINTS.vector;
    expect(fp.cornering).toBeGreaterThan(0.9);
    expect(fp.consistency).toBeGreaterThan(0.9);
    expect(fp.mistakeFreq).toBeLessThanOrEqual(0.05);
  });

  it('Risky takes risks: high aggression, high mistake frequency, mid consistency', () => {
    const fp = IDENTITY_FINGERPRINTS.risky;
    expect(fp.aggression).toBeGreaterThan(0.7);
    expect(fp.mistakeFreq).toBeGreaterThan(0.2);
    expect(fp.consistency).toBeLessThan(0.6);
  });

  it('Comet is a rookie: low aggression, high mistakes, low consistency', () => {
    const fp = IDENTITY_FINGERPRINTS.comet;
    expect(fp.aggression).toBeLessThan(0.4);
    expect(fp.mistakeFreq).toBeGreaterThan(0.3);
    expect(fp.consistency).toBeLessThan(0.5);
  });

  it('all baseline fingerprints are normalized 0..1', () => {
    for (const id of IDENTITY_ORDER) {
      expect(isNormalized(IDENTITY_FINGERPRINTS[id])).toBe(true);
    }
  });
});

// ─── B. Personality tests ─────────────────────────────────────────────────────

describe('identity seeding', () => {
  it('same identity + same seed ⇒ same fingerprint', () => {
    expect(identityFingerprint('blaze', 1234)).toEqual(identityFingerprint('blaze', 1234));
  });

  it('same identity + different seed ⇒ bounded variation', () => {
    const noise = 0.04;
    for (const id of IDENTITY_ORDER) {
      const base = IDENTITY_FINGERPRINTS[id];
      const a = identityFingerprint(id, 1);
      const b = identityFingerprint(id, 9999);
      for (const key of Object.keys(base) as (keyof IdentityFingerprint)[]) {
        // Variations stay within [base-noise, base+noise], clamped to 0..1.
        expect(a[key]).toBeGreaterThanOrEqual(Math.max(0, base[key] - noise));
        expect(a[key]).toBeLessThanOrEqual(Math.min(1, base[key] + noise));
        expect(b[key]).toBeGreaterThanOrEqual(Math.max(0, base[key] - noise));
        expect(b[key]).toBeLessThanOrEqual(Math.min(1, base[key] + noise));
        // Different seeds do not produce identical fingerprints across all fields.
      }
      // Ensure the two rolls actually diverge somewhere measurable.
      const diverged = a.aggression !== b.aggression || a.boostSense !== b.boostSense;
      expect(diverged).toBe(true);
    }
  });

  it('all seeded fingerprints remain normalized 0..1', () => {
    for (const id of IDENTITY_ORDER) {
      for (let seed = 0; seed < 50; seed++) {
        expect(isNormalized(identityFingerprint(id, seed))).toBe(true);
      }
    }
  });

  it('seedNoise is deterministic and zero-noise preserves the fingerprint', () => {
    expect(seedNoise(IDENTITY_FINGERPRINTS.blaze, 7, 0)).toEqual(IDENTITY_FINGERPRINTS.blaze);
    expect(seedNoise(IDENTITY_FINGERPRINTS.blaze, 7, 0.04)).toEqual(
      seedNoise(IDENTITY_FINGERPRINTS.blaze, 7, 0.04)
    );
  });

  it('engine personalities expose stable identity ids and names', () => {
    for (const id of IDENTITY_ORDER) {
      const p = PERSONALITIES[id];
      expect(p.id).toBe(id);
      expect(p.name).toBe(IDENTITY_NAMES[id]);
    }
  });

  it('engine personalities keep all parameters in 0..1 (or defined ranges)', () => {
    for (const id of IDENTITY_ORDER) {
      const p = PERSONALITIES[id];
      expect(p.speedFactor).toBeGreaterThan(0);
      expect(p.speedFactor).toBeLessThanOrEqual(1.2);
      for (const k of [
        'aggression',
        'mistakeRate',
        'blockingFrequency',
        'draftUsage',
        'recoverySpeed',
        'cornerConfidence',
        'boostStrategy',
      ] as const) {
        expect(p[k]).toBeGreaterThanOrEqual(0);
        expect(p[k]).toBeLessThanOrEqual(1);
      }
    }
  });
});

// ─── C. Tier tests ────────────────────────────────────────────────────────────

describe('difficulty tiers', () => {
  it('defines all five tiers', () => {
    expect(TIER_ORDER).toEqual(['easy', 'medium', 'hard', 'expert', 'adaptive']);
  });

  it('tier strength ordering is deterministic and monotonic', () => {
    const avgSpeedEasy = buildGrid(6, 'easy').reduce((s, p) => s + p.speedFactor, 0) / 6;
    const avgSpeedMedium = buildGrid(6, 'medium').reduce((s, p) => s + p.speedFactor, 0) / 6;
    const avgSpeedHard = buildGrid(6, 'hard').reduce((s, p) => s + p.speedFactor, 0) / 6;
    const avgSpeedExpert = buildGrid(6, 'expert').reduce((s, p) => s + p.speedFactor, 0) / 6;
    expect(avgSpeedEasy).toBeLessThan(avgSpeedMedium);
    expect(avgSpeedMedium).toBeLessThan(avgSpeedHard);
    expect(avgSpeedHard).toBeLessThan(avgSpeedExpert);
  });

  it('easy tier leads with Comet/Shield (mid-pack)', () => {
    const grid = buildGrid(6, 'easy');
    expect(grid[0].id).toBe('comet');
    expect(grid[1].id).toBe('shield');
  });

  it('hard tier leads with Blaze (strong drafting/overtaking)', () => {
    const grid = buildGrid(6, 'hard');
    expect(grid[0].id).toBe('blaze');
  });

  it('expert tier leads with Vector (near-optimal precision)', () => {
    const grid = buildGrid(6, 'expert');
    expect(grid[0].id).toBe('vector');
  });

  it('adaptive tier leads with Chameleon', () => {
    const grid = buildGrid(6, 'adaptive');
    expect(grid[0].id).toBe('chameleon');
  });

  it('same tier + same seed ⇒ identical grids', () => {
    expect(buildGrid(6, 'hard', 99)).toEqual(buildGrid(6, 'hard', 99));
  });

  it('same tier + different seed ⇒ identical identities, bounded parameter variation', () => {
    const a = buildGrid(6, 'medium', 1);
    const b = buildGrid(6, 'medium', 2);
    expect(a.map((p) => p.id)).toEqual(b.map((p) => p.id));
    for (let i = 0; i < a.length; i++) {
      expect(Math.abs(a[i].aggression - b[i].aggression)).toBeLessThanOrEqual(0.12);
    }
  });
});

// ─── D. Expert tests ──────────────────────────────────────────────────────────

describe('Expert tier', () => {
  it('expert grid personalities never randomly mistake', () => {
    const grid = buildGrid(6, 'expert');
    for (const p of grid) {
      expect(p.mistakeRate).toBe(0);
    }
  });

  it('expert tier is genuinely stronger: higher pace than hard tier', () => {
    const expertAvg = buildGrid(6, 'expert').reduce((s, p) => s + p.speedFactor, 0) / 6;
    const hardAvg = buildGrid(6, 'hard').reduce((s, p) => s + p.speedFactor, 0) / 6;
    expect(expertAvg).toBeGreaterThan(hardAvg);
  });

  it('Vector stays near-zero on mistakes vs Comet (precision trait)', () => {
    for (let seed = 0; seed < 20; seed++) {
      const vector = toEnginePersonality('vector', IDENTITY_FINGERPRINTS.vector, 'medium', seed);
      const comet = toEnginePersonality('comet', IDENTITY_FINGERPRINTS.comet, 'medium', seed);
      expect(vector.mistakeRate).toBeLessThan(0.05);
      expect(vector.mistakeRate).toBeLessThan(comet.mistakeRate);
    }
  });
});

// ─── E. Chameleon tests ───────────────────────────────────────────────────────

describe('ChameleonAdapter', () => {
  it('with no history returns the neutral baseline fingerprint', () => {
    const adapter = new ChameleonAdapter();
    const fp = adapter.adapt();
    expect(fp.aggression).toBeCloseTo(IDENTITY_FINGERPRINTS.chameleon.aggression, 5);
    expect(fp.boostSense).toBeCloseTo(IDENTITY_FINGERPRINTS.chameleon.boostSense, 5);
    expect(adapter.size).toBe(0);
  });

  it('handles fewer than 3 previous races safely', () => {
    const adapter = new ChameleonAdapter();
    adapter.recordRace({ position: 1, gridSize: 6 });
    expect(adapter.size).toBe(1);
    const fp = adapter.adapt();
    expect(isNormalized(fp)).toBe(true);
  });

  it('handles exactly 3 race deltas', () => {
    const adapter = new ChameleonAdapter();
    adapter.recordRace({ position: 2, gridSize: 6 });
    adapter.recordRace({ position: 3, gridSize: 6 });
    adapter.recordRace({ position: 4, gridSize: 6 });
    expect(adapter.size).toBe(3);
    const fp = adapter.adapt();
    expect(isNormalized(fp)).toBe(true);
  });

  it('adapts toward stronger play when the player consistently wins', () => {
    const win = new ChameleonAdapter();
    win.recordRace({ position: 1, gridSize: 6 });
    win.recordRace({ position: 1, gridSize: 6 });
    win.recordRace({ position: 1, gridSize: 6 });
    const winFp = win.adapt();

    const lose = new ChameleonAdapter();
    lose.recordRace({ position: 6, gridSize: 6 });
    lose.recordRace({ position: 6, gridSize: 6 });
    lose.recordRace({ position: 6, gridSize: 6 });
    const loseFp = lose.adapt();

    // Chameleon should be stronger (higher aggression/boost) vs a winning player.
    expect(winFp.aggression).toBeGreaterThan(loseFp.aggression);
    expect(winFp.boostSense).toBeGreaterThan(loseFp.boostSense);
  });

  it('adaptation remains bounded (never instantly unbeatable)', () => {
    const adapter = new ChameleonAdapter();
    for (let i = 0; i < 100; i++) {
      adapter.recordRace({ position: 1, gridSize: 6 });
    }
    expect(adapter.size).toBe(3); // capped history
    const fp = adapter.adapt();
    expect(isNormalized(fp)).toBe(true);
    expect(fp.aggression).toBeLessThanOrEqual(IDENTITY_FINGERPRINTS.chameleon.aggression + 0.15 + 1e-9);
    expect(fp.boostSense).toBeLessThanOrEqual(IDENTITY_FINGERPRINTS.chameleon.boostSense + 0.18 + 1e-9);
  });

  it('same input history produces the same adapted fingerprint', () => {
    const a = new ChameleonAdapter();
    a.recordRace({ position: 3, gridSize: 6 });
    a.recordRace({ position: 1, gridSize: 6 });
    a.recordRace({ position: 2, gridSize: 6 });
    const b = new ChameleonAdapter();
    b.recordRace({ position: 3, gridSize: 6 });
    b.recordRace({ position: 1, gridSize: 6 });
    b.recordRace({ position: 2, gridSize: 6 });
    expect(a.adapt()).toEqual(b.adapt());
  });
});

// ─── F. Grid tests ────────────────────────────────────────────────────────────

describe('AI grid', () => {
  it('builds a six-identity grid without duplicates (GDD expects six distinct)', () => {
    const grid = buildGrid(6, 'medium', 7);
    const ids = grid.map((p) => p.id);
    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(6);
  });

  it('grid ordering is deterministic for the same seed', () => {
    expect(buildGrid(6, 'medium', 5).map((p) => p.id)).toEqual(buildGrid(6, 'medium', 5).map((p) => p.id));
  });

  it('each grid car carries correct identity metadata', () => {
    const grid = buildGrid(6, 'hard', 3);
    for (const p of grid) {
      expect(p.name).toBe(IDENTITY_NAMES[p.id]);
      expect(p.id).toBeDefined();
    }
  });

  it('chameleon override fingerprint is honored in the grid', () => {
    const override: IdentityFingerprint = { ...IDENTITY_FINGERPRINTS.chameleon, aggression: 1.0 };
    const grid = buildGrid(6, 'adaptive', 1, override);
    const chameleons = grid.filter((p) => p.id === 'chameleon');
    expect(chameleons.length).toBeGreaterThan(0);
    for (const c of chameleons) {
      expect(c.aggression).toBeGreaterThanOrEqual(0.98);
    }
  });
});
