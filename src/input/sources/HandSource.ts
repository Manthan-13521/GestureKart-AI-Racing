import type { InputFrame, InputSource, InputSourceId } from '../InputFrame';
import { frameFromHandData, NEUTRAL_FRAME } from '../InputFrame';
import type { HandData } from '../HandTracker';

/**
 * Hand tracking source — projects the latest MediaPipe hand frame into a
 * normalized frame. Fed by the game's HandTracker callback.
 */
export class HandSource implements InputSource {
  readonly id: InputSourceId = 'hand';
  private last: HandData | null = null;

  update(data: HandData): void {
    this.last = data;
  }

  isAvailable(): boolean {
    return this.last !== null;
  }

  read(): InputFrame {
    const data = this.last;
    if (!data) return { ...NEUTRAL_FRAME };
    // Use calibrated center if available, fallback to regular centerX
    const centerX = data.calibratedCenterX ?? data.centerX;
    return frameFromHandData(centerX, data.handsDetected);
  }
}
