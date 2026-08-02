export interface ProfileState {
  xp: number;
  level: number;
  coins: number;
  unlockedSkins: string[];
  selectedSkin: string;
  unlockedNeons: string[];
  selectedNeon: string;
}

const DEFAULT_PROFILE: ProfileState = {
  xp: 0,
  level: 1,
  coins: 0,
  unlockedSkins: ['default'],
  selectedSkin: 'default',
  unlockedNeons: ['red', 'blue'], // Basic neons unlocked by default
  selectedNeon: 'blue',
};

const LEVEL_XP_REQUIREMENT = 1000; // 1000 XP per level

export class ProfileManager {
  private state: ProfileState;
  private readonly storageKey = 'vs_profile_state';

  constructor() {
    this.state = { ...DEFAULT_PROFILE };
    this.load();
  }

  private load(): void {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this.state = { ...DEFAULT_PROFILE, ...parsed };
      } catch {
        this.state = { ...DEFAULT_PROFILE };
      }
    }
  }

  private save(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch {
      // storage unavailable (private mode / quota exceeded)
    }
  }

  get currentState(): ProfileState {
    return { ...this.state };
  }

  addRewards(xp: number, coins: number): void {
    this.state.xp += xp;
    this.state.coins += coins;

    // Check level up
    this.state.level = 1 + Math.floor(this.state.xp / LEVEL_XP_REQUIREMENT);

    this.save();

    // We could emit an event here if a level up occurred, but UI reads on load
  }

  purchaseSkin(skinId: string, cost: number): boolean {
    if (this.state.coins >= cost && !this.state.unlockedSkins.includes(skinId)) {
      this.state.coins -= cost;
      this.state.unlockedSkins.push(skinId);
      this.save();
      return true;
    }
    return false;
  }

  purchaseNeon(neonId: string, cost: number): boolean {
    if (this.state.coins >= cost && !this.state.unlockedNeons.includes(neonId)) {
      this.state.coins -= cost;
      this.state.unlockedNeons.push(neonId);
      this.save();
      return true;
    }
    return false;
  }

  selectSkin(skinId: string): void {
    if (this.state.unlockedSkins.includes(skinId)) {
      this.state.selectedSkin = skinId;
      this.save();
    }
  }

  selectNeon(neonId: string): void {
    if (this.state.unlockedNeons.includes(neonId)) {
      this.state.selectedNeon = neonId;
      this.save();
    }
  }
}

export const profileManager = new ProfileManager();
