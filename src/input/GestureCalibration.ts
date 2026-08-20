/**
 * Gesture Calibration System
 * Captures neutral palm-center position and computes calibrated dead-zone.
 * Provides adaptive EMA smoothing based on signal stability.
 */

export interface CalibrationData {
  version: number;
  neutralCenterX: number;
  deadZone: number;
  emaAlpha: number;
  timestamp: number;
}

export interface CalibrationSample {
  centerX: number;
  confidence: number;
  handsDetected: number;
  timestamp: number;
}

export interface CalibrationState {
  phase: 'idle' | 'ready' | 'capturing' | 'success' | 'failed' | 'cancelled';
  progress: number; // 0..1
  message: string;
  samplesCollected: number;
  samplesRequired: number;
}

const CALIBRATION_VERSION = 1;
const SAMPLES_REQUIRED = 30;
const CAPTURE_DURATION_MS = 2000; // 2 seconds
const MIN_CONFIDENCE = 0.7;
const MIN_HANDS_DETECTED = 2;
const BASE_DEAD_ZONE = 0.02;
const MAX_DEAD_ZONE = 0.15;
const DEAD_ZONE_MULTIPLIER = 2.5; // deadZone = stdDev * multiplier
const BASE_EMA_ALPHA = 0.55;
const MIN_EMA_ALPHA = 0.25;
const MAX_EMA_ALPHA = 0.85;

export class GestureCalibration {
  private state: CalibrationState = {
    phase: 'idle',
    progress: 0,
    message: '',
    samplesCollected: 0,
    samplesRequired: SAMPLES_REQUIRED,
  };
  private samples: CalibrationSample[] = [];
  private captureStartTime = 0;
  private calibrationData: CalibrationData | null = null;
  private listeners: Set<(state: CalibrationState) => void> = new Set();
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.loadCalibration();
  }

  /** Subscribe to calibration state changes. */
  subscribe(listener: (state: CalibrationState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }

  /** Get current calibration data (for Game/HandTracker to use). */
  getCalibration(): CalibrationData | null {
    return this.calibrationData;
  }

  /** Get current calibration state. */
  getState(): CalibrationState {
    return { ...this.state };
  }

  /** Start calibration capture. */
  start(): void {
    if (this.state.phase === 'capturing') return;

    this.samples = [];
    this.captureStartTime = performance.now();
    this.setState({
      phase: 'ready',
      progress: 0,
      message: 'GET READY',
      samplesCollected: 0,
      samplesRequired: SAMPLES_REQUIRED,
    });

    // Brief "GET READY" before capture starts
    setTimeout(() => {
      if (this.state.phase === 'ready') {
        this.setState({
          phase: 'capturing',
          message: 'KEEP HANDS CENTERED',
        });
      }
    }, 500);

    // Auto-complete after duration
    this.timeoutId = setTimeout(() => this.completeCapture(), CAPTURE_DURATION_MS);
  }

  /** Cancel calibration. */
  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.setState({
      phase: 'cancelled',
      progress: 0,
      message: 'Calibration cancelled',
      samplesCollected: 0,
    });
  }

  /** Feed a hand data sample during capture. */
  feedSample(centerX: number, confidence: number, handsDetected: number): void {
    if (this.state.phase !== 'capturing') return;

    const now = performance.now();
    if (now - this.captureStartTime > CAPTURE_DURATION_MS) {
      this.completeCapture();
      return;
    }

    // Reject invalid samples
    if (handsDetected < MIN_HANDS_DETECTED || confidence < MIN_CONFIDENCE) {
      return;
    }

    this.samples.push({
      centerX,
      confidence,
      handsDetected,
      timestamp: now,
    });

    this.setState({
      samplesCollected: this.samples.length,
      progress: Math.min(this.samples.length / SAMPLES_REQUIRED, 1),
    });
  }

  private completeCapture(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.samples.length < SAMPLES_REQUIRED * 0.5) {
      this.setState({
        phase: 'failed',
        progress: 1,
        message: 'Insufficient valid samples. Keep hands steady and try again.',
        samplesCollected: this.samples.length,
      });
      return;
    }

    // Compute neutral center (median for robustness)
    const sortedX = this.samples.map((s) => s.centerX).sort((a, b) => a - b);
    const neutralCenterX = sortedX[Math.floor(sortedX.length / 2)];

    // Compute standard deviation of samples
    const mean = this.samples.reduce((sum, s) => sum + s.centerX, 0) / this.samples.length;
    const variance = this.samples.reduce((sum, s) => sum + (s.centerX - mean) ** 2, 0) / this.samples.length;
    const stdDev = Math.sqrt(variance);

    // Dead zone: stdDev * multiplier, clamped
    const deadZone = Math.max(BASE_DEAD_ZONE, Math.min(MAX_DEAD_ZONE, stdDev * DEAD_ZONE_MULTIPLIER));

    // Adaptive EMA alpha: more stable signal -> lower alpha (more smoothing)
    // Higher confidence -> lower alpha
    const avgConfidence = this.samples.reduce((sum, s) => sum + s.confidence, 0) / this.samples.length;
    const emaAlpha = Math.max(
      MIN_EMA_ALPHA,
      Math.min(MAX_EMA_ALPHA, BASE_EMA_ALPHA * (1 - avgConfidence * 0.5))
    );

    this.calibrationData = {
      version: CALIBRATION_VERSION,
      neutralCenterX,
      deadZone,
      emaAlpha,
      timestamp: Date.now(),
    };

    this.saveCalibration();

    this.setState({
      phase: 'success',
      progress: 1,
      message: 'Calibration saved',
      samplesCollected: this.samples.length,
    });

    // Auto-reset to idle after brief success display
    setTimeout(() => {
      if (this.state.phase === 'success') {
        this.setState({
          phase: 'idle',
          progress: 0,
          message: '',
          samplesCollected: 0,
        });
      }
    }, 1500);
  }

  private setState(partial: Partial<CalibrationState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  /** Load calibration from localStorage. */
  private loadCalibration(): void {
    try {
      const raw = localStorage.getItem('virtual-steering:gesture-calibration');
      if (raw) {
        const parsed = JSON.parse(raw) as CalibrationData;
        if (parsed.version === CALIBRATION_VERSION && this.isValidData(parsed)) {
          this.calibrationData = parsed;
        }
      }
    } catch {
      // Ignore invalid data
    }
  }

  /** P12: shape/range validation so corrupt calibration can never poison steering. */
  private isValidData(d: CalibrationData): boolean {
    return (
      typeof d.version === 'number' &&
      Number.isFinite(d.neutralCenterX) &&
      d.neutralCenterX >= 0 &&
      d.neutralCenterX <= 1 &&
      Number.isFinite(d.deadZone) &&
      d.deadZone >= 0 &&
      d.deadZone <= 1 &&
      Number.isFinite(d.emaAlpha) &&
      d.emaAlpha > 0 &&
      d.emaAlpha <= 1 &&
      Number.isFinite(d.timestamp) &&
      d.timestamp >= 0
    );
  }

  /** Save calibration to localStorage. */
  private saveCalibration(): void {
    if (!this.calibrationData) return;
    try {
      localStorage.setItem('virtual-steering:gesture-calibration', JSON.stringify(this.calibrationData));
    } catch {
      // Ignore storage errors
    }
  }

  /** Reset to defaults. */
  reset(): void {
    this.calibrationData = null;
    try {
      localStorage.removeItem('virtual-steering:gesture-calibration');
    } catch {
      // Ignore
    }
  }
}

export const gestureCalibration = new GestureCalibration();
