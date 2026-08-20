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
 * Extracts raw steering angle in degrees from orientation event based on screen orientation.
 * Turning the phone clockwise (steering Right) produces positive angle (+).
 * Turning the phone counter-clockwise (steering Left) produces negative angle (-).
 */
export function extractSteeringAngle(
  event: { beta?: number | null; gamma?: number | null; alpha?: number | null },
  orientationAngle = 0
): number {
  const beta = Number.isFinite(event.beta) ? (event.beta as number) : 0;
  const gamma = Number.isFinite(event.gamma) ? (event.gamma as number) : 0;

  let normAngle = orientationAngle % 360;
  if (normAngle < 0) normAngle += 360;

  if (normAngle === 90) {
    // Landscape primary (top to left, screen facing user)
    // Turning wheel clockwise (right): top moves up/right, beta decreases -> -beta increases
    return -beta;
  } else if (normAngle === 270) {
    // Landscape secondary (top to right, screen facing user)
    // Turning wheel clockwise (right): top moves down/right, beta increases
    return beta;
  } else if (normAngle === 180) {
    // Portrait upside-down
    return -gamma;
  } else {
    // Portrait standard (0 deg)
    // Tilting right: gamma increases
    return gamma;
  }
}

/** Get the current screen orientation angle in degrees (0, 90, 180, 270). */
export function getScreenOrientationAngle(): number {
  if (typeof window === 'undefined') return 0;
  if (window.screen?.orientation?.angle !== undefined) {
    return window.screen.orientation.angle;
  }
  if (typeof (window as unknown as { orientation?: number }).orientation === 'number') {
    return (window as unknown as { orientation: number }).orientation;
  }
  // Fallback: detect landscape via aspect ratio if orientation angle unavailable
  if (window.innerWidth > window.innerHeight) {
    return 90;
  }
  return 0;
}

/**
 * Phone-side steering sensor.
 *
 * Supports both horizontal (landscape) steering-wheel rotation and
 * portrait tilt, with pure testable mapping logic:
 * calibration → dead-zone → sensitivity → clamp to [-1, 1].
 */
export class PhoneSensor {
  private baseAngle = 0;
  private lastAngle = 0;
  private lastGamma = 0;
  private currentOrientation = 0;
  private listener: ((e: DeviceOrientationEvent) => void) | null = null;
  private orientationListener: (() => void) | null = null;

  constructor(private config: PhoneSensorConfig = {}) {}

  get supported(): boolean {
    return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
  }

  get needsPermission(): boolean {
    if (!this.supported) return false;
    const Ctor = DeviceOrientationEvent as unknown as DeviceOrientationWithPermission;
    return typeof Ctor.requestPermission === 'function';
  }

  get orientation(): number {
    return this.currentOrientation;
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
  start(callback: (steering: number, angleDeg: number) => void): void {
    if (!this.supported || this.listener) return;

    this.currentOrientation = getScreenOrientationAngle();

    this.orientationListener = () => {
      this.currentOrientation = getScreenOrientationAngle();
    };

    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', this.orientationListener);
    } else {
      window.addEventListener('orientationchange', this.orientationListener);
    }

    this.listener = (e: DeviceOrientationEvent) => {
      if (e.gamma == null && e.beta == null) return;
      if (e.gamma != null && Number.isFinite(e.gamma)) {
        this.lastGamma = e.gamma;
      }
      const rawAngle = extractSteeringAngle(e, this.currentOrientation);
      this.lastAngle = rawAngle;
      const steering = this.readSteering(rawAngle);
      callback(steering, rawAngle);
    };

    window.addEventListener('deviceorientation', this.listener);
  }

  stop(): void {
    if (this.listener) {
      window.removeEventListener('deviceorientation', this.listener);
      this.listener = null;
    }
    if (this.orientationListener) {
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', this.orientationListener);
      } else {
        window.removeEventListener('orientationchange', this.orientationListener);
      }
      this.orientationListener = null;
    }
  }

  /** Set screen orientation manually (useful for testing or forced landscape mode). */
  setOrientation(angle: number): void {
    this.currentOrientation = angle;
  }

  /** Mark the current phone orientation as neutral steering position. */
  calibrate(): void {
    this.baseAngle = this.lastAngle !== 0 ? this.lastAngle : this.lastGamma;
  }

  /** Set the sensitivity multiplier (clamped to [0.1, 3]). */
  setSensitivity(v: number): void {
    this.config.sensitivity = Math.max(0.1, Math.min(3, v));
  }

  /**
   * Map an angle reading (gamma or extracted orientation angle) to a normalized
   * steering value in [-1, 1].
   */
  readSteering(angle: number): number {
    if (!Number.isFinite(angle)) return 0;
    const { rangeDeg = 25, deadzoneDeg = 2, sensitivity = 1 } = this.config;
    const delta = angle - this.baseAngle;
    let value = (delta / rangeDeg) * sensitivity;
    const dz = deadzoneDeg / rangeDeg;
    if (Math.abs(value) < dz) return 0;
    value = Math.sign(value) * ((Math.abs(value) - dz) / (1 - dz));
    return Math.max(-1, Math.min(1, value));
  }
}
