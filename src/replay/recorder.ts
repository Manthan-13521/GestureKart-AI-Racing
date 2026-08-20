import { REPLAY_SAMPLE_RATE, REPLAY_TICKS_PER_SEC, type ReplayData } from './types';

export interface ReplayRecording {
  track: string;
  mode: string;
  score: number;
  duration: number;
  frames: { t: number; x: number; speed: number }[];
  sectorDists: [number, number];
}

/**
 * Records race state at a fixed 30 Hz timestep on the race clock — never
 * tied to render FPS. Distance is integrated per emitted frame so that a
 * live player comparison and the decoded cumulative-distance array use the
 * exact same formula.
 */
export class ReplayRecorder {
  private active = false;
  private track = '';
  private mode = '';
  private sampleRate = REPLAY_SAMPLE_RATE;
  private nextSampleT = 0;
  private lastT = 0;
  private lastEmitSpeed = 0;
  private dist = 0;
  private boundary0 = 0;
  private boundary1 = 0;
  private sector0Captured = false;
  private sector1Captured = false;
  private sector0 = 0;
  private sector1 = 0;
  private times: number[] = [];
  private xs: number[] = [];
  private speeds: number[] = [];

  get isActive(): boolean {
    return this.active;
  }

  /** Distance covered by the car this session, integrated at the sample grid. */
  get distance(): number {
    return this.dist;
  }

  begin(track: string, mode: string, duration: number, sampleRate = REPLAY_SAMPLE_RATE): void {
    this.active = true;
    this.track = track;
    this.mode = mode;
    this.sampleRate = sampleRate;
    this.nextSampleT = 0;
    this.lastT = 0;
    this.lastEmitSpeed = 0;
    this.dist = 0;
    this.boundary0 = duration / 3;
    this.boundary1 = (2 * duration) / 3;
    this.sector0Captured = false;
    this.sector1Captured = false;
    this.sector0 = 0;
    this.sector1 = 0;
    this.times = [];
    this.xs = [];
    this.speeds = [];
  }

  /** Feed the latest race state once per render frame. */
  pump(raceTime: number, x: number, speed: number): void {
    if (!this.active) return;
    if (!Number.isFinite(raceTime) || !Number.isFinite(x) || !Number.isFinite(speed)) return;
    if (raceTime < this.lastT) return;

    while (raceTime >= this.nextSampleT) {
      this.emit(this.nextSampleT, x, speed);
      this.nextSampleT += 1 / this.sampleRate;
    }

    if (!this.sector0Captured && raceTime >= this.boundary0) {
      this.sector0Captured = true;
      this.sector0 = this.dist;
    }
    if (!this.sector1Captured && raceTime >= this.boundary1) {
      this.sector1Captured = true;
      this.sector1 = this.dist;
    }
    this.lastT = raceTime;
  }

  /**
   * Returns the recording or null when too short to be useful (< 2 frames).
   * The caller decides whether to persist it.
   */
  finish(score: number, duration: number): ReplayRecording | null {
    if (!this.active) return null;
    this.active = false;
    if (this.times.length < 2) return null;

    const frames = [];
    for (let i = 0; i < this.times.length; i++) {
      frames.push({
        t: this.times[i],
        x: this.xs[i],
        speed: this.speeds[i],
      });
    }
    return {
      track: this.track,
      mode: this.mode,
      score: Math.max(0, Math.floor(score)),
      duration,
      frames,
      sectorDists: [this.sector0, this.sector1],
    };
  }

  abort(): void {
    this.active = false;
  }

  private emit(t: number, x: number, speed: number): void {
    if (this.times.length > 0) {
      const prevT = this.times[this.times.length - 1];
      const dt = t - prevT / REPLAY_TICKS_PER_SEC;
      const avgSpeed = (this.lastEmitSpeed + speed) / 2;
      this.dist += avgSpeed * dt;
    }
    this.lastEmitSpeed = speed;
    this.times.push(Math.round(t * REPLAY_TICKS_PER_SEC));
    this.xs.push(Math.round((x + 2) * 100));
    this.speeds.push(Math.max(0, Math.min(127, Math.round(speed * 20))));
  }
}

/** Converts a finished recording into the typed frame arrays the codec needs. */
export function recordingToReplayData(rec: ReplayRecording): ReplayData {
  const n = rec.frames.length;
  const times = new Int16Array(n);
  const xs = new Int16Array(n);
  const speeds = new Int8Array(n);
  const dist = new Float32Array(n);
  dist[0] = 0;
  for (let i = 0; i < n; i++) {
    const f = rec.frames[i];
    times[i] = f.t;
    xs[i] = f.x;
    speeds[i] = f.speed;
    if (i > 0) {
      const dt = (times[i] - times[i - 1]) / REPLAY_TICKS_PER_SEC;
      const avg = (speeds[i - 1] + speeds[i]) / 2 / 20;
      dist[i] = dist[i - 1] + avg * dt;
    }
  }
  return {
    version: 1,
    sampleRate: REPLAY_SAMPLE_RATE,
    track: rec.track,
    mode: rec.mode,
    score: rec.score,
    duration: rec.duration,
    sectorDists: rec.sectorDists,
    count: n,
    times,
    xs,
    speeds,
    dist,
  };
}
