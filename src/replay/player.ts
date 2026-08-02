import { REPLAY_TICKS_PER_SEC, type ReplayData } from './types';

export interface ReplaySample {
  x: number;
  speed: number;
  dist: number;
}

/**
 * Deterministic playback over a decoded replay. Sampling is fixed-time
 * interpolation: binary search on timestamps + linear lerp, so any playback
 * rate renders smoothly with no jitter and no teleporting. Reuses a single
 * out-object — zero allocation per sample.
 */
export class ReplayPlayer {
  readonly data: ReplayData;
  private readonly out: ReplaySample = { x: 0, speed: 0, dist: 0 };

  constructor(data: ReplayData) {
    this.data = data;
  }

  get duration(): number {
    return this.data.duration;
  }

  get totalDist(): number {
    return this.data.dist[this.data.count - 1];
  }

  sample(t: number, out: ReplaySample = this.out): ReplaySample {
    const { count, times, xs, speeds, dist } = this.data;
    const tTicks = t * REPLAY_TICKS_PER_SEC;

    if (tTicks <= times[0]) {
      out.x = xs[0] / 100 - 2;
      out.speed = speeds[0] / 20;
      out.dist = 0;
      return out;
    }
    if (tTicks >= times[count - 1]) {
      out.x = xs[count - 1] / 100 - 2;
      out.speed = speeds[count - 1] / 20;
      out.dist = dist[count - 1];
      return out;
    }

    let lo = 0;
    let hi = count - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (times[mid] <= tTicks) lo = mid;
      else hi = mid;
    }

    const tLo = times[lo];
    const tHi = times[hi];
    const span = tHi - tLo;
    const f = span <= 0 ? 0 : (tTicks - tLo) / span;

    out.x = (xs[lo] / 100 - 2) * (1 - f) + (xs[hi] / 100 - 2) * f;
    out.speed = (speeds[lo] / 20) * (1 - f) + (speeds[hi] / 20) * f;
    out.dist = dist[lo] * (1 - f) + dist[hi] * f;
    return out;
  }

  /**
   * The replay clock time at which the car had covered `d` metres. Used for
   * the ghost delta and sector comparisons. Monotonic; clamps to [0, duration].
   */
  timeAtDistance(d: number): number {
    const { count, times, dist } = this.data;
    if (count < 2) return 0;
    const total = dist[count - 1];
    if (d <= dist[0]) return times[0] / REPLAY_TICKS_PER_SEC;
    if (d >= total) return times[count - 1] / REPLAY_TICKS_PER_SEC;

    let lo = 0;
    let hi = count - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (dist[mid] <= d) lo = mid;
      else hi = mid;
    }
    const span = dist[hi] - dist[lo];
    const f = span <= 0 ? 0 : (d - dist[lo]) / span;
    return (times[lo] * (1 - f) + times[hi] * f) / REPLAY_TICKS_PER_SEC;
  }
}
