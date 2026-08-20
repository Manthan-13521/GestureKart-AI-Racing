import { applyXp, isValidCurrencyAmount, isValidXpAmount, levelForXp } from '../progression/XpProgression';
import { MAX_COMPLETED_RACES, migrateProfile, parseProfileJson } from '../progression/profilePersistence';
import { isKnownNeon, isKnownSkin, neonCost, skinCost } from '../progression/ContentCatalog';
import type { PlayerProfile } from '../progression/types';

export interface ProfileState {
  version: number;
  xp: number;
  level: number;
  coins: number;
  unlockedSkins: string[];
  selectedSkin: string;
  unlockedNeons: string[];
  selectedNeon: string;
  completedRaces: string[];
  lifetimeStats: { racesFinished: number };
}

/**
 * ProfileManager — the persistence authority for the player profile
 * (`vs_profile_state`). Persisted data is untrusted: every load goes through
 * the migrate/sanitize pipeline (see progression/profilePersistence.ts), so
 * malformed JSON, legacy shapes, invalid values and unknown schema versions
 * can never corrupt runtime state. Persistence happens ONLY at explicit
 * mutation boundaries — never per frame.
 */
export class ProfileManager {
  private state: PlayerProfile;
  private readonly storageKey = 'vs_profile_state';

  constructor() {
    this.state = this.load();
  }

  private load(): PlayerProfile {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(this.storageKey);
    } catch {
      // storage unavailable or throws — fail soft, keep in-memory defaults
    }
    return migrateProfile(parseProfileJson(raw));
  }

  private save(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch {
      // Persistence failure: keep the in-memory state (the game keeps
      // working) and report the failure once instead of pretending success.
      console.warn('[ProfileManager] could not persist profile state');
    }
  }

  get currentState(): ProfileState {
    return {
      ...this.state,
      level: levelForXp(this.state.xp),
      completedRaces: [...this.state.completedRaces],
    };
  }

  get xp(): number {
    return this.state.xp;
  }

  get coins(): number {
    return this.state.coins;
  }

  get level(): number {
    return levelForXp(this.state.xp);
  }

  get racesFinished(): number {
    return this.state.lifetimeStats.racesFinished;
  }

  /**
   * Apply a validated XP + coin reward. Returns the level delta or null when
   * the amounts are invalid (nothing is mutated). Overflow XP is carried.
   */
  applyRewards(
    xp: number,
    coins: number
  ): {
    levelBefore: number;
    levelAfter: number;
    levelsGained: number;
    xp: number;
    coins: number;
  } | null {
    if (!isValidXpAmount(xp) || !isValidCurrencyAmount(coins)) return null;
    const res = applyXp(this.state.xp, xp);
    if (!res) return null;
    this.state.xp = res.xp;
    this.state.coins += coins;
    this.save();
    return {
      levelBefore: res.levelBefore,
      levelAfter: res.levelAfter,
      levelsGained: res.levelsGained,
      xp: res.xp,
      coins: this.state.coins,
    };
  }

  /** Backwards-compatible reward entry (delegates to the validated path). */
  addRewards(xp: number, coins: number): void {
    this.applyRewards(xp, coins);
  }

  isRaceCompleted(raceId: string): boolean {
    return this.state.completedRaces.includes(raceId);
  }

  /** Record a processed completion; dedupes and caps the token list (FIFO). */
  markRaceCompleted(raceId: string): void {
    if (typeof raceId !== 'string' || raceId === '') return;
    if (this.state.completedRaces.includes(raceId)) return;
    this.state.completedRaces.push(raceId);
    if (this.state.completedRaces.length > MAX_COMPLETED_RACES) {
      this.state.completedRaces = this.state.completedRaces.slice(-MAX_COMPLETED_RACES);
    }
    this.state.lifetimeStats.racesFinished += 1;
    this.save();
  }

  /**
   * Purchase a skin. The price is sourced from ContentCatalog (the single
   * authority); a caller-supplied price is only accepted when it EXACTLY
   * matches the catalog price. Unknown ids, unknown/mismatched prices,
   * already-owned items and insufficient funds all fail without mutation.
   */
  purchaseSkin(skinId: string, cost?: number): boolean {
    const catalogPrice = skinCost(skinId);
    if (catalogPrice === null) return false;
    if (
      cost !== undefined &&
      (!Number.isFinite(cost) || !Number.isInteger(cost) || cost < 0 || cost !== catalogPrice)
    ) {
      return false;
    }
    if (this.state.unlockedSkins.includes(skinId)) return false;
    if (this.state.coins < catalogPrice) return false;
    this.state.coins -= catalogPrice;
    this.state.unlockedSkins.push(skinId);
    this.save();
    return true;
  }

  /** Purchase a neon trail (catalog-priced, same rules as purchaseSkin). */
  purchaseNeon(neonId: string, cost?: number): boolean {
    const catalogPrice = neonCost(neonId);
    if (catalogPrice === null) return false;
    if (
      cost !== undefined &&
      (!Number.isFinite(cost) || !Number.isInteger(cost) || cost < 0 || cost !== catalogPrice)
    ) {
      return false;
    }
    if (this.state.unlockedNeons.includes(neonId)) return false;
    if (this.state.coins < catalogPrice) return false;
    this.state.coins -= catalogPrice;
    this.state.unlockedNeons.push(neonId);
    this.save();
    return true;
  }

  /** Equip a skin — only catalog-known, owned skins can be equipped. */
  selectSkin(skinId: string): void {
    if (!isKnownSkin(skinId)) return;
    if (this.state.unlockedSkins.includes(skinId)) {
      this.state.selectedSkin = skinId;
      this.save();
    }
  }

  /** Equip a neon — only catalog-known, owned neons can be equipped. */
  selectNeon(neonId: string): void {
    if (!isKnownNeon(neonId)) return;
    if (this.state.unlockedNeons.includes(neonId)) {
      this.state.selectedNeon = neonId;
      this.save();
    }
  }

  /** Defensive derivation guard: level must always match total XP. */
  get derivedLevel(): number {
    return levelForXp(this.state.xp);
  }
}

export const profileManager = new ProfileManager();
