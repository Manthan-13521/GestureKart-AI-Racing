import type { InputFrame, InputSource, InputSourceId } from '../InputFrame';
import { STEER_GAIN } from '../InputFrame';
import type { InputManager } from '../../managers/InputManager';

/**
 * Laptop gyroscope source — projects device tilt into a normalized frame.
 * Applies the legacy center-of-screen gain (×0.4 each side).
 */
export class GyroSource implements InputSource {
  readonly id: InputSourceId = 'gyro';

  constructor(private input: InputManager) {}

  isAvailable(): boolean {
    return this.input.gyroscopeMode;
  }

  read(): InputFrame {
    return {
      steer: this.input.gyroTilt * STEER_GAIN,
      throttle: 0,
      brake: 0,
      boostButton: false,
    };
  }
}
