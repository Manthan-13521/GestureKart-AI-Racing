import type { InputFrame, InputSource, InputSourceId } from '../InputFrame';
import type { InputManager } from '../../managers/InputManager';

/**
 * Touch source — projects the on-screen steer/accel buttons into a frame.
 * Reads the shared touch state owned by InputManager.
 */
export class TouchSource implements InputSource {
  readonly id: InputSourceId = 'touch';

  constructor(private input: InputManager) {}

  isAvailable(): boolean {
    return this.input.touch.active;
  }

  read(): InputFrame {
    const { touch } = this.input;
    if (this.input.oneHand) {
      // One-hand mode: either side steers AND accelerates (GDD §2.4).
      return {
        steer: touch.left ? -1 : touch.right ? 1 : 0,
        throttle: touch.left || touch.right ? 1 : 0,
        brake: 0,
        boostButton: false,
      };
    }
    return {
      steer: touch.left ? -1 : touch.right ? 1 : 0,
      throttle: touch.up ? 1 : 0,
      brake: 0,
      boostButton: false,
    };
  }
}
