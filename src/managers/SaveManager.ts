export interface SaveData {
  version: number;
  sensitivity: number;
  autoAccelerate: boolean;
  gyroscopeMode: boolean;
  oneHand: boolean;
  bestScore: number;
  highScores: HighScoreEntry[];
  highContrast: boolean;
  colorblind: boolean;
  colorblindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  largeHud: boolean;
  reducedMotion: boolean;
  masterVolume: number;
  uiSounds: boolean;
  graphicsQuality: 'performance' | 'balanced' | 'quality';
  shadows: boolean;
  particles: boolean;
}

export interface HighScoreEntry {
  score: number;
  track: string;
  mode: string;
  timestamp: number;
  distance?: number;
  combo?: number;
}

export interface A11ySaveData {
  highContrast: boolean;
  colorblind: boolean;
  colorblindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  largeHud: boolean;
  reducedMotion: boolean;
}

const SAVE_VERSION = 4;

const DEFAULT_DATA: SaveData = {
  version: SAVE_VERSION,
  sensitivity: 75,
  autoAccelerate: false,
  gyroscopeMode: false,
  oneHand: false,
  bestScore: 0,
  highScores: [],
  highContrast: false,
  colorblind: false,
  colorblindMode: 'none',
  largeHud: false,
  reducedMotion: false,
  masterVolume: 1,
  uiSounds: true,
  graphicsQuality: 'balanced',
  shadows: true,
  particles: true,
};

const MAX_HIGH_SCORES = 10;
const MAX_STRING_FIELD = 64;

const COLORBLIND_MODES: SaveData['colorblindMode'][] = ['none', 'deuteranopia', 'protanopia', 'tritanopia'];
const GRAPHICS_QUALITIES: SaveData['graphicsQuality'][] = ['performance', 'balanced', 'quality'];

type TimeFn = () => number;

function isFiniteNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function sanitizeHighScoreEntry(raw: unknown): HighScoreEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Record<string, unknown>;
  if (!isFiniteNum(e.score) || e.score < 0) return null;
  if (typeof e.track !== 'string' || e.track.length > MAX_STRING_FIELD) return null;
  if (typeof e.mode !== 'string' || e.mode.length > MAX_STRING_FIELD) return null;
  if (!isFiniteNum(e.timestamp)) return null;
  const entry: HighScoreEntry = {
    score: e.score,
    track: e.track,
    mode: e.mode,
    timestamp: e.timestamp,
  };
  if (isFiniteNum(e.distance)) entry.distance = Math.max(0, e.distance);
  if (isFiniteNum(e.combo)) entry.combo = Math.max(0, e.combo);
  return entry;
}

function sanitizeHighScores(raw: unknown): HighScoreEntry[] {
  if (!Array.isArray(raw)) return [];
  const cleaned: HighScoreEntry[] = [];
  for (const item of raw) {
    const entry = sanitizeHighScoreEntry(item);
    if (entry) cleaned.push(entry);
  }
  return cleaned.sort((a, b) => b.score - a.score).slice(0, MAX_HIGH_SCORES);
}

export class SaveManager {
  private data: SaveData;
  private timeFn: TimeFn;

  constructor(
    private key = 'virtual-steering:v1',
    timeFn?: TimeFn
  ) {
    this.timeFn = timeFn ?? Date.now;
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

  get oneHand(): boolean {
    return this.data.oneHand;
  }

  set oneHand(v: boolean) {
    this.data.oneHand = v;
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
      colorblindMode: this.data.colorblindMode,
      largeHud: this.data.largeHud,
      reducedMotion: this.data.reducedMotion,
    };
  }

  setA11y(patch: Partial<A11ySaveData>): void {
    this.data.highContrast = patch.highContrast ?? this.data.highContrast;
    if (patch.colorblind !== undefined) this.data.colorblind = patch.colorblind;
    if (patch.colorblindMode !== undefined) this.data.colorblindMode = patch.colorblindMode;
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

  /** Add a score to the high-score table. */
  addHighScore(entry: Omit<HighScoreEntry, 'timestamp'>): void {
    const newEntry: HighScoreEntry = {
      ...entry,
      timestamp: this.timeFn(),
    };

    // Check for duplicate (same score, track, mode within short time window)
    const isDuplicate = this.data.highScores.some(
      (e) =>
        e.score === newEntry.score &&
        e.track === newEntry.track &&
        e.mode === newEntry.mode &&
        Math.abs(e.timestamp - newEntry.timestamp) < 5000
    );

    if (!isDuplicate) {
      this.data.highScores.push(newEntry);
      // Sort by score descending
      this.data.highScores.sort((a, b) => b.score - a.score);
      // Cap at max entries
      if (this.data.highScores.length > MAX_HIGH_SCORES) {
        this.data.highScores = this.data.highScores.slice(0, MAX_HIGH_SCORES);
      }
      this.save();
    }
  }

  /** Get high scores for a specific track/mode. */
  getHighScores(track?: string, mode?: string): HighScoreEntry[] {
    let scores = this.data.highScores;
    if (track) scores = scores.filter((e) => e.track === track);
    if (mode) scores = scores.filter((e) => e.mode === mode);
    return scores;
  }

  /** Get all high scores. */
  getAllHighScores(): HighScoreEntry[] {
    return this.data.highScores;
  }

  /** Check if a score qualifies for the high-score table. */
  isHighScore(score: number, track: string, mode: string): boolean {
    const scores = this.getHighScores(track, mode);
    if (scores.length < MAX_HIGH_SCORES) return true;
    return score > scores[scores.length - 1].score;
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return { ...DEFAULT_DATA, highScores: [] };
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      // P12: unknown future schema versions fail closed to defaults instead
      // of being trusted blindly (mirrors ProfileManager behavior).
      if (typeof parsed.version === 'number' && parsed.version > SAVE_VERSION) {
        return { ...DEFAULT_DATA, highScores: [] };
      }
      // P12: field-by-field sanitization. Each setting is type-checked and
      // range-clamped so impossible/corrupt values can never reach runtime
      // (e.g. NaN sensitivity, string masterVolume, unknown enum values).
      const merged: SaveData = {
        ...DEFAULT_DATA,
        highScores: sanitizeHighScores(parsed.highScores),
      };
      if (isFiniteNum(parsed.sensitivity)) merged.sensitivity = clamp(parsed.sensitivity, 0, 100);
      if (typeof parsed.autoAccelerate === 'boolean') merged.autoAccelerate = parsed.autoAccelerate;
      if (typeof parsed.gyroscopeMode === 'boolean') merged.gyroscopeMode = parsed.gyroscopeMode;
      if (typeof parsed.oneHand === 'boolean') merged.oneHand = parsed.oneHand;
      if (isFiniteNum(parsed.bestScore)) merged.bestScore = Math.max(0, parsed.bestScore);
      if (typeof parsed.highContrast === 'boolean') merged.highContrast = parsed.highContrast;
      if (typeof parsed.colorblind === 'boolean') merged.colorblind = parsed.colorblind;
      if (COLORBLIND_MODES.includes(parsed.colorblindMode as SaveData['colorblindMode'])) {
        merged.colorblindMode = parsed.colorblindMode as SaveData['colorblindMode'];
      }
      if (typeof parsed.largeHud === 'boolean') merged.largeHud = parsed.largeHud;
      if (typeof parsed.reducedMotion === 'boolean') merged.reducedMotion = parsed.reducedMotion;
      if (isFiniteNum(parsed.masterVolume)) merged.masterVolume = clamp(parsed.masterVolume, 0, 1);
      if (typeof parsed.uiSounds === 'boolean') merged.uiSounds = parsed.uiSounds;
      if (GRAPHICS_QUALITIES.includes(parsed.graphicsQuality as SaveData['graphicsQuality'])) {
        merged.graphicsQuality = parsed.graphicsQuality as SaveData['graphicsQuality'];
      }
      if (typeof parsed.shadows === 'boolean') merged.shadows = parsed.shadows;
      if (typeof parsed.particles === 'boolean') merged.particles = parsed.particles;
      // Migration: derive colorblindMode from the legacy boolean when the
      // granular preset is absent from the stored payload.
      if (parsed.colorblindMode === undefined) {
        merged.colorblindMode = merged.colorblind ? 'deuteranopia' : 'none';
      }
      return merged;
    } catch {
      return { ...DEFAULT_DATA, highScores: [] };
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
