import { LANE_X } from '../Game';

export interface ComboConfig {
  maxMultiplier: number;
  laneSwitchDwellFrames: number;
}

export interface ComboState {
  multiplier: number;
  streak: number;
}

/**
 * Quantizes continuous cameraX into a lane index (0, 1, 2) based on nearest LANE_X.
 */
export function nearestLaneIndex(cameraX: number): number {
  let best = 0;
  let bestDist = Math.abs(cameraX - LANE_X[0]);
  for (let i = 1; i < LANE_X.length; i++) {
    const d = Math.abs(cameraX - LANE_X[i]);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

/**
 * Tracks lane switches with a dwell requirement to avoid jitter at boundaries.
 * Only commits a switch after the new lane is held for dwellFrames consecutive frames.
 * Initial lane assignment is silent (no combo increment).
 */
export class LaneSwitchTracker {
  private lastLane = -1;
  private pending: number | null = null;
  private dwell = 0;
  private switched = false;

  constructor(
    private readonly laneXs: number[] = LANE_X,
    private readonly dwellFrames = 4
  ) {}

  /** Returns true when a lane switch is committed this frame. */
  update(cameraX: number): boolean {
    this.switched = false;
    const idx = nearestLaneIndex(cameraX);

    if (this.lastLane === -1) {
      this.lastLane = idx;
      this.pending = null;
      this.dwell = 0;
      return false;
    }

    if (idx === this.lastLane) {
      this.pending = null;
      this.dwell = 0;
      return false;
    }

    if (idx !== this.pending) {
      this.pending = idx;
      this.dwell = 1; // Start counting from 1 so commit happens after dwellFrames calls
      return false;
    }

    this.dwell += 1;
    if (this.dwell >= this.dwellFrames) {
      this.lastLane = idx;
      this.pending = null;
      this.dwell = 0;
      this.switched = true;
    }
    return this.switched;
  }

  reset(): void {
    this.lastLane = -1;
    this.pending = null;
    this.dwell = 0;
    this.switched = false;
  }

  get lastCommittedLane(): number {
    return this.lastLane;
  }
}

/**
 * Combo system for Survival mode.
 * Multiplier progresses from ×1 up to maxMultiplier (default 10).
 * Each near-miss or committed lane switch increments the streak by 1.
 * Multiplier = min(maxMultiplier, streak + 1).
 * Resets on collision, new race, or explicit reset.
 */
export class ComboSystem {
  private streak = 0;
  private readonly maxMultiplier: number;
  private readonly laneTracker: LaneSwitchTracker;

  constructor(config: ComboConfig = { maxMultiplier: 10, laneSwitchDwellFrames: 4 }) {
    this.maxMultiplier = config.maxMultiplier;
    this.laneTracker = new LaneSwitchTracker(LANE_X, config.laneSwitchDwellFrames);
  }

  get multiplier(): number {
    return Math.min(this.maxMultiplier, this.streak + 1);
  }

  get streakCount(): number {
    return this.streak;
  }

  get state(): ComboState {
    return { multiplier: this.multiplier, streak: this.streak };
  }

  /** Called on a successful near-miss. */
  registerNearMiss(): void {
    this.streak += 1;
  }

  /** Called once per frame with current cameraX. Returns true if a lane switch was committed. */
  updateLaneSwitch(cameraX: number): boolean {
    if (this.laneTracker.update(cameraX)) {
      this.streak += 1;
      return true;
    }
    return false;
  }

  reset(): void {
    this.streak = 0;
    this.laneTracker.reset();
  }
}
