import { KeyboardHandler, type GameKeys } from '../input/Keyboard';
import type { EventBus } from '../core/EventBus';

export interface TouchElements {
  left: HTMLElement;
  right: HTMLElement;
  accel: HTMLElement;
  auto: HTMLElement;
  modeLabel: HTMLElement;
}

export class InputManager {
  readonly keys: GameKeys = { up: false, down: false, left: false, right: false };
  readonly touch = { active: false, left: false, right: false, up: false };
  gyroscopeMode = false;
  gyroTilt = 0;
  autoAccelerate = false;

  private keyboard: KeyboardHandler;
  private keyCallback: ((keys: GameKeys) => void) | null = null;
  private touchApply: (() => void) | null = null;
  private orientationListener: ((e: DeviceOrientationEvent) => void) | null = null;

  constructor(private bus: EventBus) {
    this.keyboard = new KeyboardHandler((keys) => {
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

  onKeysChanged(cb: (keys: GameKeys) => void): void {
    this.keyCallback = cb;
  }

  onTouchChanged(cb: () => void): void {
    this.touchApply = cb;
  }

  setAutoAccelerate(on: boolean): void {
    if (this.autoAccelerate === on) return;
    this.autoAccelerate = on;
    this.bus.emit('auto', on);
  }

  bindTouchControls(els: TouchElements): void {
    const setHeld = (key: 'left' | 'right' | 'up', el: HTMLElement, held: boolean): void => {
      this.touch[key] = held;
      el.classList.toggle('pressed', held);
      this.touch.active = this.touch.left || this.touch.right || this.touch.up;
      this.touchApply?.();
    };

    const bind = (el: HTMLElement, key: 'left' | 'right' | 'up'): void => {
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        setHeld(key, el, true);
      }, { passive: false });
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        setHeld(key, el, false);
      }, { passive: false });
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
        this.bus.emit('gyro', this.gyroscopeMode);
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

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
      (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission().then((state: string) => {
        if (state === 'granted') window.addEventListener('deviceorientation', this.orientationListener!);
      });
    } else {
      window.addEventListener('deviceorientation', this.orientationListener);
    }
  }
}
