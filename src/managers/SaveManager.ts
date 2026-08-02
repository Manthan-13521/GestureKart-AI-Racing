export interface SaveData {
  version: number;
  sensitivity: number;
  autoAccelerate: boolean;
  gyroscopeMode: boolean;
  bestScore: number;
  highContrast: boolean;
  colorblind: boolean;
  largeHud: boolean;
  reducedMotion: boolean;
  masterVolume: number;
  uiSounds: boolean;
  graphicsQuality: 'performance' | 'balanced' | 'quality';
  shadows: boolean;
  particles: boolean;
}

export interface A11ySaveData {
  highContrast: boolean;
  colorblind: boolean;
  largeHud: boolean;
  reducedMotion: boolean;
}

const SAVE_VERSION = 2;

const DEFAULT_DATA: SaveData = {
  version: SAVE_VERSION,
  sensitivity: 75,
  autoAccelerate: false,
  gyroscopeMode: false,
  bestScore: 0,
  highContrast: false,
  colorblind: false,
  largeHud: false,
  reducedMotion: false,
  masterVolume: 1,
  uiSounds: true,
  graphicsQuality: 'balanced',
  shadows: true,
  particles: true,
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

  get a11y(): A11ySaveData {
    return {
      highContrast: this.data.highContrast,
      colorblind: this.data.colorblind,
      largeHud: this.data.largeHud,
      reducedMotion: this.data.reducedMotion,
    };
  }

  setA11y(patch: Partial<A11ySaveData>): void {
    this.data.highContrast = patch.highContrast ?? this.data.highContrast;
    this.data.colorblind = patch.colorblind ?? this.data.colorblind;
    this.data.largeHud = patch.largeHud ?? this.data.largeHud;
    this.data.reducedMotion = patch.reducedMotion ?? this.data.reducedMotion;
    this.save();
  }

  get masterVolume(): number {
    return this.data.masterVolume;
  }

  set masterVolume(v: number) {
    this.data.masterVolume = v;
    this.save();
  }

  get uiSounds(): boolean {
    return this.data.uiSounds;
  }

  set uiSounds(v: boolean) {
    this.data.uiSounds = v;
    this.save();
  }

  get graphicsQuality(): SaveData['graphicsQuality'] {
    return this.data.graphicsQuality;
  }

  set graphicsQuality(v: SaveData['graphicsQuality']) {
    this.data.graphicsQuality = v;
    this.save();
  }

  get shadows(): boolean {
    return this.data.shadows;
  }

  set shadows(v: boolean) {
    this.data.shadows = v;
    this.save();
  }

  get particles(): boolean {
    return this.data.particles;
  }

  set particles(v: boolean) {
    this.data.particles = v;
    this.save();
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
