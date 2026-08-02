export interface SaveData {
  version: number;
  sensitivity: number;
  autoAccelerate: boolean;
  gyroscopeMode: boolean;
  bestScore: number;
}

const SAVE_VERSION = 1;

const DEFAULT_DATA: SaveData = {
  version: SAVE_VERSION,
  sensitivity: 75,
  autoAccelerate: false,
  gyroscopeMode: false,
  bestScore: 0,
};

export class SaveManager {
  private data: SaveData;

  constructor(private key = 'virtual-steering:v1') {
    this.data = this.load();
  }

  get sensitivity(): number {
    return this.data.sensitivity;
  }

  set sensitivity(v: number) {
    this.data.sensitivity = v;
    this.save();
  }

  get autoAccelerate(): boolean {
    return this.data.autoAccelerate;
  }

  set autoAccelerate(v: boolean) {
    this.data.autoAccelerate = v;
    this.save();
  }

  get gyroscopeMode(): boolean {
    return this.data.gyroscopeMode;
  }

  set gyroscopeMode(v: boolean) {
    this.data.gyroscopeMode = v;
    this.save();
  }

  get bestScore(): number {
    return this.data.bestScore;
  }

  get version(): number {
    return this.data.version;
  }

  setBestScore(v: number): void {
    if (v > this.data.bestScore) {
      this.data.bestScore = v;
      this.save();
    }
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return { ...DEFAULT_DATA };
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      return { ...DEFAULT_DATA, ...parsed };
    } catch {
      return { ...DEFAULT_DATA };
    }
  }

  private save(): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.data));
    } catch {
      // storage unavailable (private mode / quota)
    }
  }
}
