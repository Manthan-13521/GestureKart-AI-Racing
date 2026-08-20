import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfileManager } from './ProfileManager';

beforeEach(() => {
  localStorage.clear();
});

describe('ProfileManager — rewards (P8.2)', () => {
  it('applyRewards adds validated XP and coins and derives level', () => {
    const pm = new ProfileManager();
    const res = pm.applyRewards(250, 100);
    expect(res).toEqual({
      levelBefore: 1,
      levelAfter: 1,
      levelsGained: 0,
      xp: 250,
      coins: 100,
    });
    expect(pm.xp).toBe(250);
    expect(pm.coins).toBe(100);
    expect(pm.level).toBe(1);
  });

  it('applyRewards carries overflow and reports multiple level-ups', () => {
    const pm = new ProfileManager();
    pm.applyRewards(950, 0);
    const res = pm.applyRewards(2500, 0);
    expect(res?.levelBefore).toBe(1);
    expect(res?.levelAfter).toBe(4);
    expect(res?.levelsGained).toBe(3);
    expect(pm.xp).toBe(3450);
    expect(pm.level).toBe(4);
    expect(pm.derivedLevel).toBe(4);
  });

  it('rejects negative and non-integer rewards without mutating state', () => {
    const pm = new ProfileManager();
    expect(pm.applyRewards(-100, 0)).toBeNull();
    expect(pm.applyRewards(100, -50)).toBeNull();
    expect(pm.applyRewards(1.5, 0)).toBeNull();
    expect(pm.applyRewards(100, NaN)).toBeNull();
    expect(pm.xp).toBe(0);
    expect(pm.coins).toBe(0);
    expect(pm.level).toBe(1);
  });

  it('addRewards remains backwards compatible', () => {
    const pm = new ProfileManager();
    pm.addRewards(500, 250);
    expect(pm.xp).toBe(500);
    expect(pm.coins).toBe(250);
  });
});

describe('ProfileManager — completion tokens (P8.2)', () => {
  it('markRaceCompleted records a token and increments racesFinished once', () => {
    const pm = new ProfileManager();
    pm.markRaceCompleted('race-1');
    pm.markRaceCompleted('race-1');
    expect(pm.isRaceCompleted('race-1')).toBe(true);
    expect(pm.racesFinished).toBe(1);
    expect(pm.isRaceCompleted('race-2')).toBe(false);
  });

  it('caps the token list at 64 entries (FIFO)', () => {
    const pm = new ProfileManager();
    for (let i = 0; i < 70; i++) pm.markRaceCompleted(`race-${i}`);
    expect(pm.racesFinished).toBe(70);
    expect(pm.isRaceCompleted('race-0')).toBe(false);
    expect(pm.isRaceCompleted('race-69')).toBe(true);
    expect(pm.currentState.completedRaces.length).toBe(64);
  });

  it('tokens survive reload (new instance over the same storage)', () => {
    const pm1 = new ProfileManager();
    pm1.markRaceCompleted('race-1');
    pm1.applyRewards(300, 150);

    const pm2 = new ProfileManager();
    expect(pm2.isRaceCompleted('race-1')).toBe(true);
    expect(pm2.xp).toBe(300);
    expect(pm2.coins).toBe(150);
    expect(pm2.racesFinished).toBe(1);
    // A duplicate completion through a fresh instance does not double-pay.
    const res = pm2.applyRewards(300, 150);
    expect(res?.xp).toBe(600);
    expect(pm2.racesFinished).toBe(1);
  });

  it('legacy profile saves without P8 fields load with defaults', () => {
    localStorage.setItem(
      'vs_profile_state',
      JSON.stringify({
        xp: 1250,
        level: 2,
        coins: 500,
        unlockedSkins: ['default', 'blue'],
        selectedSkin: 'blue',
        unlockedNeons: ['red', 'blue'],
        selectedNeon: 'red',
      })
    );
    const pm = new ProfileManager();
    expect(pm.xp).toBe(1250);
    expect(pm.coins).toBe(500);
    expect(pm.racesFinished).toBe(0);
    expect(pm.isRaceCompleted('anything')).toBe(false);
    expect(pm.currentState.selectedSkin).toBe('blue');
  });

  it('corrupt JSON recovers to defaults', () => {
    localStorage.setItem('vs_profile_state', '{not json');
    const pm = new ProfileManager();
    expect(pm.xp).toBe(0);
    expect(pm.coins).toBe(0);
    expect(pm.level).toBe(1);
  });

  it('currentState is a defensive copy', () => {
    const pm = new ProfileManager();
    const snap = pm.currentState;
    snap.coins = 99999;
    snap.completedRaces.push('fake');
    expect(pm.coins).toBe(0);
    expect(pm.isRaceCompleted('fake')).toBe(false);
  });
});

describe('ProfileManager — legacy purchases (unchanged contract)', () => {
  it('purchaseSkin requires funds and dedupes ownership', () => {
    const pm = new ProfileManager();
    pm.applyRewards(0, 1500);
    expect(pm.purchaseSkin('blue', 1500)).toBe(true);
    expect(pm.purchaseSkin('blue', 1500)).toBe(false);
    expect(pm.currentState.unlockedSkins).toEqual(['default', 'blue']);
    expect(pm.coins).toBe(0);
  });

  it('purchaseNeon fails on insufficient funds', () => {
    const pm = new ProfileManager();
    expect(pm.purchaseNeon('cyan', 2000)).toBe(false);
    expect(pm.coins).toBe(0);
  });

  it('selectSkin/selectNeon only equip owned items', () => {
    const pm = new ProfileManager();
    pm.selectSkin('gold');
    pm.selectNeon('cyan');
    expect(pm.currentState.selectedSkin).toBe('default');
    expect(pm.currentState.selectedNeon).toBe('blue');
    pm.applyRewards(0, 10000);
    pm.purchaseSkin('gold', 10000);
    pm.selectSkin('gold');
    expect(pm.currentState.selectedSkin).toBe('gold');
  });
});

describe('ProfileManager — persistence hardening (P8.3)', () => {
  it('localStorage.setItem throwing does not crash reward application', () => {
    const pm = new ProfileManager();
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    try {
      const res = pm.applyRewards(500, 250);
      expect(res?.xp).toBe(500);
      expect(res?.coins).toBe(250);
      expect(pm.xp).toBe(500);
      expect(pm.coins).toBe(250);
    } finally {
      spy.mockRestore();
    }
  });

  it('localStorage.getItem throwing does not crash construction', () => {
    const spy = vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    try {
      const pm = new ProfileManager();
      expect(pm.xp).toBe(0);
      expect(pm.coins).toBe(0);
      expect(pm.level).toBe(1);
    } finally {
      spy.mockRestore();
    }
  });

  it('unknown future schema version fails closed to a default profile', () => {
    localStorage.setItem('vs_profile_state', JSON.stringify({ version: 99, xp: 123456, coins: 9999 }));
    const pm = new ProfileManager();
    expect(pm.xp).toBe(0);
    expect(pm.coins).toBe(0);
    expect(pm.level).toBe(1);
    expect(pm.racesFinished).toBe(0);
  });

  it('invalid persisted XP/coins are sanitized while valid cosmetics survive', () => {
    localStorage.setItem(
      'vs_profile_state',
      JSON.stringify({
        version: 2,
        xp: 'corrupt',
        coins: -50,
        unlockedSkins: ['default', 'blue', 'unknown-skin'],
        selectedSkin: 'blue',
        unlockedNeons: ['red', 'blue'],
        selectedNeon: 'blue',
      })
    );
    const pm = new ProfileManager();
    expect(pm.xp).toBe(0);
    expect(pm.coins).toBe(0);
    expect(pm.level).toBe(1);
    expect(pm.currentState.unlockedSkins).toEqual(['default', 'blue']);
    expect(pm.currentState.selectedSkin).toBe('blue');
  });

  it('persisted level cannot contradict persisted XP (level is derived)', () => {
    localStorage.setItem('vs_profile_state', JSON.stringify({ version: 2, xp: 2500, level: 1, coins: 0 }));
    const pm = new ProfileManager();
    expect(pm.level).toBe(3);
    expect(pm.derivedLevel).toBe(3);
  });

  it('reward persistence survives a fresh instance and is not double-applied on load', () => {
    const pm1 = new ProfileManager();
    pm1.applyRewards(1000, 500);
    const pm2 = new ProfileManager();
    expect(pm2.xp).toBe(1000);
    expect(pm2.coins).toBe(500);
    expect(pm2.level).toBe(2);
  });
});

describe('ProfileManager — catalog-validated purchases (P8.5)', () => {
  it('purchase without a price uses the ContentCatalog price', () => {
    const pm = new ProfileManager();
    pm.applyRewards(0, 5000);
    expect(pm.purchaseSkin('purple')).toBe(true);
    expect(pm.coins).toBe(0);
    expect(pm.currentState.unlockedSkins).toContain('purple');
  });

  it('rejects a caller-supplied price that differs from the catalog price', () => {
    const pm = new ProfileManager();
    pm.applyRewards(0, 100000);
    expect(pm.purchaseSkin('blue', 1)).toBe(false);
    expect(pm.purchaseSkin('blue', 1501)).toBe(false);
    expect(pm.purchaseSkin('blue', -1500)).toBe(false);
    expect(pm.purchaseSkin('blue', 1500.5)).toBe(false);
    expect(pm.purchaseSkin('blue', NaN)).toBe(false);
    expect(pm.currentState.unlockedSkins).toEqual(['default']);
    expect(pm.coins).toBe(100000);
  });

  it('rejects unknown cosmetic ids without mutation', () => {
    const pm = new ProfileManager();
    pm.applyRewards(0, 100000);
    expect(pm.purchaseSkin('hacker-skin')).toBe(false);
    expect(pm.purchaseNeon('hacker-neon')).toBe(false);
    expect(pm.purchaseSkin('hacker-skin', 1)).toBe(false);
    expect(pm.coins).toBe(100000);
    expect(pm.currentState.unlockedSkins).toEqual(['default']);
    expect(pm.currentState.unlockedNeons).toEqual(['red', 'blue']);
  });

  it('rejects an already-owned item (no double charge)', () => {
    const pm = new ProfileManager();
    pm.applyRewards(0, 5000);
    expect(pm.purchaseNeon('cyan')).toBe(true);
    expect(pm.coins).toBe(3000);
    expect(pm.purchaseNeon('cyan')).toBe(false);
    expect(pm.coins).toBe(3000);
    expect(pm.currentState.unlockedNeons.filter((n) => n === 'cyan').length).toBe(1);
  });

  it('rejects insufficient funds without mutation', () => {
    const pm = new ProfileManager();
    pm.applyRewards(0, 500);
    expect(pm.purchaseSkin('gold')).toBe(false);
    expect(pm.coins).toBe(500);
    expect(pm.currentState.unlockedSkins).toEqual(['default']);
  });

  it('equip rejects unknown and unowned cosmetics', () => {
    const pm = new ProfileManager();
    pm.selectSkin('purple');
    pm.selectNeon('gold');
    expect(pm.currentState.selectedSkin).toBe('default');
    expect(pm.currentState.selectedNeon).toBe('blue');
    pm.selectSkin('not-a-skin');
    pm.selectNeon('not-a-neon');
    expect(pm.currentState.selectedSkin).toBe('default');
    expect(pm.currentState.selectedNeon).toBe('blue');
  });

  it('equipped cosmetics persist through reload', () => {
    const pm1 = new ProfileManager();
    pm1.applyRewards(0, 15000);
    pm1.purchaseSkin('gold');
    pm1.selectSkin('gold');
    pm1.purchaseNeon('gold');
    pm1.selectNeon('gold');
    const pm2 = new ProfileManager();
    expect(pm2.currentState.selectedSkin).toBe('gold');
    expect(pm2.currentState.selectedNeon).toBe('gold');
    expect(pm2.currentState.unlockedSkins).toContain('gold');
    expect(pm2.currentState.unlockedNeons).toContain('gold');
    expect(pm2.coins).toBe(0);
  });
});
