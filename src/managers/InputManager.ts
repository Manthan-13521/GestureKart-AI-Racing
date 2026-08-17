import { KeyboardHandler, type GameKeys } from '../input/Keyboard';
import { AppEvents, type EventBus } from '../core/EventBus';
import { GyroSource } from '../input/sources/GyroSource';
import { KeyboardSource } from '../input/sources/KeyboardSource';
import { TouchSource } from '../input/sources/TouchSource';
import type { InputFrame, InputLayer, InputSource, InputSourceId } from '../input/InputFrame';
import { clampFrame, NEUTRAL_FRAME, steerFromCenterX } from '../input/InputFrame';
import { sourceAllowed, type GameModeConfig } from '../game/GameModeConfig';

export interface TouchElements {
  left: HTMLElement;
  right: HTMLElement;
  accel: HTMLElement;
  auto: HTMLElement;
  modeLabel: HTMLElement;
}

/**
 * Input Manager — single owner of game input (GDD §6.2).
 *
 * Holds the raw device state (keys / touch / gyro / auto-accelerate),
 * exposes interchangeable `InputSource` adapters, and resolves one normalized
 * `InputFrame` per game tick via `frame()`.
 *
 * The event-driven sources (hand / keyboard / touch) publish into a passive
 * "base" layer through `setBase()`; the priority layers (phone, auto-accel,
 * gyro) are resolved inside `frame()`. This preserves the legacy precedence:
 *   phone → auto-accelerate → gyro → base.
 */
export class InputManager {
  readonly keys: GameKeys = { up: false, down: false, left: false, right: false };
  readonly touch = { active: false, left: false, right: false, up: false };
  gyroscopeMode = false;
  gyroTilt = 0;
  autoAccelerate = false;

  readonly keyboard = new KeyboardSource(this);
  readonly touchSource = new TouchSource(this);
  readonly gyro = new GyroSource(this);

  /** Layer that produced the most recent frame() — drives loop side effects. */
  lastLayer: InputLayer = 'base';

  private keyCallback: ((keys: GameKeys) => void) | null = null;
  private touchApply: (() => void) | null = null;
  private orientationListener: ((e: DeviceOrientationEvent) => void) | null = null;
  private sources = new Map<InputSourceId, InputSource>();
  private _baseFrame: InputFrame = { ...NEUTRAL_FRAME };
  /** Active game mode config, or null when no race is in progress. */
  private modeConfig: GameModeConfig | null = null;

  constructor(private bus: EventBus) {
    new KeyboardHandler((keys) => {
      Object.assign(this.keys, keys);
      this.keyCallback?.(keys);
    });

    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'u') {
        e.preventDefault();
        this.setAutoAccelerate(!this.autoAccelerate);
      }
    });
  }

  registerSource(source: InputSource): void {
    this.sources.set(source.id, source);
  }

  getSource(id: InputSourceId): InputSource | undefined {
    return this.sources.get(id);
  }

  /** Publish a normalized frame into the passive base layer (hand/keyboard/touch events). */
  setBase(source: InputSourceId, frame: InputFrame): void {
    if (!this.isSourceAllowed(source)) return;
    this._baseFrame = clampFrame(frame);
  }

  get baseFrame(): InputFrame {
    return this._baseFrame;
  }

  /** Restrict input to the sources allowed by the active mode (null = unrestricted). */
  setModeConfig(config: GameModeConfig | null): void {
    this.modeConfig = config;
  }

  isSourceAllowed(id: InputSourceId): boolean {
    return this.modeConfig === null || sourceAllowed(this.modeConfig, id);
  }

  onKeysChanged(cb: (keys: GameKeys) => void): void {
    this.keyCallback = cb;
  }

  onTouchChanged(cb: () => void): void {
    this.touchApply = cb;
  }

  setAutoAccelerate(on: boolean): void {
    if (this.autoAccelerate === on) return;
    this.autoAccelerate = on;
    this.bus.emit(AppEvents.autoToggle, on);
  }

  bindTouchControls(els: TouchElements): void {
    const setHeld = (key: 'left' | 'right' | 'up', el: HTMLElement, held: boolean): void => {
      this.touch[key] = held;
      el.classList.toggle('pressed', held);
      this.touch.active = this.touch.left || this.touch.right || this.touch.up;
      this.touchApply?.();
    };

    const bind = (el: HTMLElement, key: 'left' | 'right' | 'up'): void => {
      el.addEventListener(
        'touchstart',
        (e) => {
          e.preventDefault();
          setHeld(key, el, true);
        },
        { passive: false }
      );
      el.addEventListener(
        'touchend',
        (e) => {
          e.preventDefault();
          setHeld(key, el, false);
        },
        { passive: false }
      );
      el.addEventListener('touchcancel', () => setHeld(key, el, false));
      el.addEventListener('mousedown', () => setHeld(key, el, true));
      el.addEventListener('mouseup', () => setHeld(key, el, false));
      el.addEventListener('mouseleave', () => setHeld(key, el, false));
    };

    bind(els.left, 'left');
    bind(els.right, 'right');
    bind(els.accel, 'up');

    els.auto.addEventListener('click', () => {
      this.setAutoAccelerate(!this.autoAccelerate);
      if (this.touch.active) this.touchApply?.();
    });

    let lastTap = 0;
    els.modeLabel.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastTap < 400) {
        this.gyroscopeMode = !this.gyroscopeMode;
        this.bus.emit(AppEvents.gyroToggle, this.gyroscopeMode);
        this.initGyro();
      }
      lastTap = now;
    });
  }

  initGyro(): void {
    if (this.orientationListener) {
      window.removeEventListener('deviceorientation', this.orientationListener);
      this.orientationListener = null;
    }
    if (!this.gyroscopeMode) return;

    this.orientationListener = (e: DeviceOrientationEvent) => {
      if (e.gamma == null) return;
      this.gyroTilt = Math.max(-1, Math.min(1, e.gamma / 45));
    };

    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission === 'function'
    ) {
      (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> })
        .requestPermission()
        .then((state: string) => {
          if (state === 'granted') window.addEventListener('deviceorientation', this.orientationListener!);
        });
    } else {
      window.addEventListener('deviceorientation', this.orientationListener);
    }
  }

  /**
   * Resolve the single active InputFrame for this game tick.
   *
   * Preserves the legacy priority: phone → auto-accelerate → gyro → base.
   * `currentCenterX` is the game's last-applied steering center (0..1),
   * used by the auto-accelerate layer's "keep current steering" fallback.
   */
  frame(currentCenterX: number): InputFrame {
    const phone = this.getSource('phone');
    if (phone?.isAvailable() && this.isSourceAllowed('phone')) {
      this.lastLayer = 'phone';
      return clampFrame(phone.read());
    }

    if (this.autoAccelerate && !this.keys.up) {
      this.lastLayer = 'auto';
      let steer = steerFromCenterX(currentCenterX);
      if (this.touch.active && this.isSourceAllowed('touch')) {
        // Touch steering already published via setBase on touch events.
        steer = this.touchSource.read().steer;
      } else if (this.gyroscopeMode && this.isSourceAllowed('gyro')) {
        steer = this.gyro.read().steer;
      } else if ((this.keys.left || this.keys.right) && this.isSourceAllowed('keyboard')) {
        steer = this.keyboard.read().steer;
      }
      return clampFrame({ steer, throttle: 1, brake: 0, boostButton: false });
    }

    if (
      this.gyroscopeMode &&
      this.isSourceAllowed('gyro') &&
      !this.touch.active &&
      !this.keys.left &&
      !this.keys.right
    ) {
      this.lastLayer = 'gyro';
      return clampFrame({
        steer: this.gyro.read().steer,
        throttle: this.keys.up ? 1 : 0,
        brake: 0,
        boostButton: false,
      });
    }

    this.lastLayer = 'base';
    return this._baseFrame;
  }
}
