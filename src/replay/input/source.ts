import type { InputFrame, InputSource, InputSourceId } from '../../input/InputFrame';
import { NEUTRAL_FRAME } from '../../input/InputFrame';
import { decodeInputFrame, type InputReplayData } from './types';

/**
 * P9 — replay playback as an InputSource.
 *
 * Feeds the recorded normalized control timeline back through the
 * InputManager into the normal game loop — there is no parallel physics,
 * no replay-specific steering model. Frames are consumed one per
 * `frame()` call (i.e. one per game-loop iteration), in exact recorded
 * order.
 *
 * Safety contract:
 * - while active, `isAvailable()` is true and `frame()` never falls
 *   through to live input — keyboard/touch/gyro/hand/phone cannot modify
 *   a race under playback;
 * - once exhausted the source HOLD the last frame (the race reaches its
 *   natural end instead of stalling);
 * - an empty/defensive payload yields the neutral frame;
 * - `stop()` restores live input for the next race.
 */
export class ReplayInputSource implements InputSource {
  readonly id: InputSourceId = 'replay';
  private cursor = 0;
  private active = true;
  private readonly lastIndex: number;

  constructor(private readonly data: InputReplayData) {
    this.lastIndex = data.frames > 0 ? data.frames - 1 : 0;
  }

  isAvailable(): boolean {
    return this.active;
  }

  get frameIndex(): number {
    return this.cursor;
  }

  get totalFrames(): number {
    return this.data.frames;
  }

  get exhausted(): boolean {
    return this.cursor >= this.data.frames;
  }

  read(): InputFrame {
    if (!this.data || this.data.frames === 0) return { ...NEUTRAL_FRAME };
    const idx = Math.min(this.cursor, this.lastIndex);
    if (this.cursor < this.data.frames) this.cursor += 1;
    const { steers, throttles, brakes, boosts } = this.data;
    return decodeInputFrame(steers, throttles, brakes, boosts, idx);
  }

  /** Deactivate the source — live input takes over again. */
  stop(): void {
    this.active = false;
  }
}
