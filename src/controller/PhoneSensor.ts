export interface PhoneSensorConfig {
  /** Degrees from calibrated center required for full deflection (default 25). */
  rangeDeg?: number;
  /** Degrees of dead-zone around center (default 2). */
  deadzoneDeg?: number;
  /** Sensitivity multiplier applied to the raw angle delta (default 1). */
  sensitivity?: number;
}

export type SensorPermission = 'granted' | 'denied' | 'unsupported';

export interface DeviceOrientationWithPermission {
  requestPermission?: () => Promise<string>;
}

/**
 * Phone-side steering sensor.
 *
 * Uses DeviceOrientationEvent.gamma as the primary steering signal and
 * exposes pure, testable mapping logic: calibration → dead-zone → sensitivity
 * → clamp to [-1, 1]. Raw sensor values never reach the network unmapped.
 */
export class PhoneSensor {
  private baseGamma = 0;
  private lastGamma = 0;
  private listener: ((e: DeviceOrientationEvent) => void) | null = null;

  constructor(private config: PhoneSensorConfig = {}) {}

  get supported(): boolean {
    return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
  }

  get needsPermission(): boolean {
    if (!this.supported) return false;
    const Ctor = DeviceOrientationEvent as unknown as DeviceOrientationWithPermission;
    return typeof Ctor.requestPermission === 'function';
  }

  /** Request the (iOS-style) permission. Safe to call on any browser. */
  async requestPermission(): Promise<SensorPermission> {
    if (!this.supported) return 'unsupported';
    const Ctor = DeviceOrientationEvent as unknown as DeviceOrientationWithPermission;
    if (typeof Ctor.requestPermission === 'function') {
      try {
        const state = await Ctor.requestPermission();
        return state === 'granted' ? 'granted' : 'denied';
      } catch {
        return 'denied';
      }
    }
    return 'granted';
  }

  /** Start streaming steering updates via `callback`. */
  start(callback: (steering: number) => void): void {
    if (!this.supported || this.listener) return;
    this.listener = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || !Number.isFinite(e.gamma)) return;
      this.lastGamma = e.gamma;
      callback(this.readSteering(e.gamma));
    };
    window.addEventListener('deviceorientation', this.listener);
  }

  stop(): void {
    if (this.listener) {
      window.removeEventListener('deviceorientation', this.listener);
      this.listener = null;
    }
  }

  /** Mark the current phone orientation as neutral steering position. */
  calibrate(): void {
    this.baseGamma = this.lastGamma;
  }

  /** Set the sensitivity multiplier (clamped to [0.1, 3]). */
  setSensitivity(v: number): void {
    this.config.sensitivity = Math.max(0.1, Math.min(3, v));
  }

  /** Map a gamma reading to a normalized steering value in [-1, 1]. */
  readSteering(gamma: number): number {
    if (!Number.isFinite(gamma)) return 0;
    const { rangeDeg = 25, deadzoneDeg = 2, sensitivity = 1 } = this.config;
    const delta = gamma - this.baseGamma;
    let value = (delta / rangeDeg) * sensitivity;
    const dz = deadzoneDeg / rangeDeg;
    if (Math.abs(value) < dz) return 0;
    value = Math.sign(value) * ((Math.abs(value) - dz) / (1 - dz));
    return Math.max(-1, Math.min(1, value));
  }
}
