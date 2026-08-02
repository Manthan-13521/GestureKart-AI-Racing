export const REPLAY_MAGIC = 'VSRP';
export const REPLAY_VERSION = 1;
export const REPLAY_SAMPLE_RATE = 30;
export const REPLAY_TICKS_PER_SEC = 60;
export const REPLAY_MAX_TRACK_MODE_LEN = 32;
export const REPLAY_MAX_FRAMES = 72000;
export const REPLAY_MIN_FRAMES = 2;
export const REPLAY_MAX_DURATION_TICKS = 120 * REPLAY_TICKS_PER_SEC;

/**
 * Decoded, ready-to-play replay. Typed arrays are reused across samples —
 * playback never allocates per frame.
 */
export interface ReplayData {
  version: number;
  sampleRate: number;
  track: string;
  mode: string;
  score: number;
  /** Race-clock seconds at the moment the run ended. */
  duration: number;
  /** Distance travelled at each 1/3 and 2/3 sector boundary (ghost reference). */
  sectorDists: [number, number];
  count: number;
  /** Frame timestamps in 1/60 s ticks (monotonic). */
  times: Int16Array;
  /** Lateral position in cm + 2000 offset. */
  xs: Int16Array;
  /** Speed quantised to 0.05 m/s units. */
  speeds: Int8Array;
  /** Cumulative distance per frame, derived once at decode (m). */
  dist: Float32Array;
}

export interface ReplayOutcome {
  /** Score beat the stored best for this track+mode. */
  newBest: boolean;
  /** Player covered more distance than the ghost by the finish. */
  beatGhost: boolean;
  /** A best replay existed and was raced against. */
  ghostPresent: boolean;
  /** Live delta in seconds, positive when the player is ahead. */
  timeDelta: number;
  /** Distance delta at finish in metres, positive when the player is ahead. */
  distDelta: number;
}

export const NO_OUTCOME: ReplayOutcome = {
  newBest: false,
  beatGhost: false,
  ghostPresent: false,
  timeDelta: 0,
  distDelta: 0,
};
