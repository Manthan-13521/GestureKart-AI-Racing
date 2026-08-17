import type { InputFrame, InputSource, InputSourceId } from '../InputFrame';
import type { InputManager } from '../../managers/InputManager';

/**
 * Keyboard source — projects WASD/arrow key state into a normalized frame.
 * Reads the shared key state owned by InputManager.
 */
export class KeyboardSource implements InputSource {
  readonly id: InputSourceId = 'keyboard';

  constructor(private input: InputManager) {}

  isAvailable(): boolean {
    return true;
  }

  read(): InputFrame {
    const { keys } = this.input;
    return {
      steer: keys.left ? -1 : keys.right ? 1 : 0,
      throttle: keys.up ? 1 : 0,
      brake: 0,
      boostButton: false,
    };
  }
}
