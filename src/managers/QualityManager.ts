/**
 * Quality tiers (GDD §11.2, §15). Resolves the persisted `graphicsQuality`
 * preference into concrete renderer knobs (pixel ratio ceiling, post,
 * shadows, weather, particle density) and provides a rolling frame-budget
 * auto-scaler that drops the render resolution when frames run long.
 *
 * Pure and framework-free: `resolveQualityConfig` is deterministic, and
 * `FrameBudgetScaler` only consumes per-frame durations. No DOM, no THREE.
 */
export type QualityMode = 'performance' | 'balanced' | 'quality';

export interface QualityConfig {
  mode: QualityMode;
  /** Upper bound for renderer pixel ratio. */
  pixelRatio: number;
  /** Bloom / post-processing pipeline enabled. */
  post: boolean;
  /** Real-time shadow mapping enabled. */
  shadows: boolean;
  /** Weather layers (rain / storm) enabled. */
  weather: boolean;
  /** 0..1 particle emission density multiplier. */
  particleDensity: number;
}

const PIXEL_RATIO_CAP: Record<QualityMode, number> = {
  quality: 2,
  balanced: 1.5,
  performance: 1,
};

const PARTICLE_DENSITY: Record<QualityMode, number> = {
  quality: 1,
  balanced: 0.7,
  performance: 0.4,
};

export function resolveQualityConfig(
  mode: QualityMode,
  dpr: number,
  shadowsToggle: boolean,
  particlesToggle: boolean
): QualityConfig {
  const low = mode === 'performance';
  const pixelRatio = Math.min(Math.max(dpr || 1, 1), PIXEL_RATIO_CAP[mode]);
  return {
    mode,
    pixelRatio,
    post: !low,
    shadows: !low && shadowsToggle,
    weather: !low,
    particleDensity: PARTICLE_DENSITY[mode] * (particlesToggle ? 1 : 0.2),
  };
}

/** Sustained frame-budget budget for auto-drop: 18ms (~55fps). */
export const AUTO_DROP_FRAME_MS = 18;
/** Sustained comfortable frame time that triggers a recovery step: 16ms (~62fps). */
export const AUTO_UP_FRAME_MS = 16;
export const AUTO_WINDOW_MS = 2000;
const RESOLUTION_FLOOR = 0.6;
const RESOLUTION_STEP = 0.8;

/**
 * Rolling frame-budget auto-scaler (GDD §15: dynamic resolution scaling).
 *
 * Maintains a sliding 2-second window of frame durations. When the average
 * exceeds `dropMs` for the full window it steps the resolution multiplier
 * down; when it comfortably sits below `upMs` it steps back up. Returns the
 * current resolution multiplier (1 = full configured pixel ratio).
 */
export class FrameBudgetScaler {
  private frames: number[] = [];
  private multiplier = 1;

  constructor(
    private readonly dropMs = AUTO_DROP_FRAME_MS,
    private readonly upMs = AUTO_UP_FRAME_MS,
    private readonly windowMs = AUTO_WINDOW_MS,
    private readonly minFrames = 15
  ) {}

  record(frameMs: number): void {
    this.frames.push(frameMs);
    let total = 0;
    for (let i = this.frames.length - 1; i >= 0; i--) {
      total += this.frames[i];
      if (total >= this.windowMs) {
        this.frames = this.frames.slice(i);
        break;
      }
    }
    const avg = total / this.frames.length;
    // Require a sustained window (not a single spike) before reacting.
    if (this.frames.length >= this.minFrames && avg > this.dropMs) {
      this.multiplier = Math.max(RESOLUTION_FLOOR, this.multiplier * RESOLUTION_STEP);
      this.frames = [];
    } else if (this.frames.length >= this.minFrames && this.multiplier < 1 && avg < this.upMs) {
      this.multiplier = Math.min(1, this.multiplier / RESOLUTION_STEP);
      this.frames = [];
    }
  }

  get resolutionMultiplier(): number {
    return this.multiplier;
  }

  /** Effective pixel ratio = configured cap × auto-scaled multiplier. */
  effectivePixelRatio(config: QualityConfig): number {
    return Math.max(1, config.pixelRatio * this.multiplier);
  }
}
