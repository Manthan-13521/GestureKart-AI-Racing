import { describe, it, expect } from 'vitest';
import { InputManager } from './InputManager';
import { EventBus } from '../core/EventBus';
import { PhoneSource } from '../input/PhoneSource';
import type { InputSource } from '../input/InputFrame';
import { GAME_MODES } from '../game/GameModeConfig';

function makeInputManager(): InputManager {
  const im = new InputManager(new EventBus());
  im.setBase('keyboard', { steer: 0.25, throttle: 0.5, brake: 0, boostButton: false });
  return im;
}

function connectedPhone(steering: number): PhoneSource {
  const phone = new PhoneSource(new EventBus());
  const internals = phone as unknown as { _phoneConnected: boolean; _steering: number };
  internals._phoneConnected = true;
  internals._steering = steering;
  return phone;
}

describe('InputManager.frame() — layer resolution', () => {
  it('returns the base frame when no priority layer is active', () => {
    const im = makeInputManager();
    const f = im.frame(0.5);
    expect(im.lastLayer).toBe('base');
    expect(f.steer).toBe(0.25);
    expect(f.throttle).toBe(0.5);
  });

  it('normalizes and clamps throttle into [0, 1]', () => {
    const im = makeInputManager();
    im.setBase('keyboard', { steer: 0, throttle: 5, brake: 0, boostButton: false });
    expect(im.frame(0.5).throttle).toBe(1);
    im.setBase('keyboard', { steer: 0, throttle: -1, brake: 0, boostButton: false });
    expect(im.frame(0.5).throttle).toBe(0);
  });

  it('clamps steering to [-1, 1]', () => {
    const im = new InputManager(new EventBus());
    im.autoAccelerate = true;
    im.keys.left = true;
    expect(im.frame(0.5).steer).toBe(-1);
  });

  it('phone source wins over auto-accelerate and gyro while connected', () => {
    const im = makeInputManager();
    im.autoAccelerate = true;
    im.gyroscopeMode = true;
    const phone = connectedPhone(0.5);
    im.registerSource(phone);
    const f = im.frame(0.5);
    expect(im.lastLayer).toBe('phone');
    expect(f.steer).toBeCloseTo(0.4);
    expect(f.throttle).toBe(1);
  });

  it('falls back to the previous hierarchy when the phone disconnects', () => {
    const im = new InputManager(new EventBus());
    im.autoAccelerate = true;
    im.keys.left = true;
    const phone = connectedPhone(0.9);
    im.registerSource(phone);
    const internals = phone as unknown as { _phoneConnected: boolean };
    internals._phoneConnected = false;
    const f = im.frame(0.5);
    expect(im.lastLayer).toBe('auto');
    expect(f.steer).toBe(-1); // keyboard left
    expect(f.throttle).toBe(1);
  });

  it('auto-accelerate layer forces full throttle and keeps current steering', () => {
    const im = makeInputManager();
    im.autoAccelerate = true;
    const f = im.frame(0.7);
    expect(im.lastLayer).toBe('auto');
    expect(f.throttle).toBe(1);
    expect(f.steer).toBeCloseTo((0.7 - 0.5) * 2);
  });

  it('auto-accelerate layer reads gyro steering when gyro mode is on', () => {
    const im = makeInputManager();
    im.autoAccelerate = true;
    im.gyroscopeMode = true;
    im.gyroTilt = 0.5;
    const f = im.frame(0.5);
    expect(f.steer).toBeCloseTo(0.4);
    expect(im.lastLayer).toBe('auto');
  });

  it('auto-accelerate layer keeps the active touch steering', () => {
    const im = makeInputManager();
    im.autoAccelerate = true;
    im.touch.left = true;
    im.touch.active = true;
    const f = im.frame(0.9);
    expect(im.lastLayer).toBe('auto');
    expect(f.steer).toBe(-1);
    expect(f.throttle).toBe(1);
  });

  it('gyro layer applies tilt steering and throttle from the up key', () => {
    const im = makeInputManager();
    im.gyroscopeMode = true;
    im.gyroTilt = -0.25;
    im.keys.up = true;
    const f = im.frame(0.5);
    expect(im.lastLayer).toBe('gyro');
    expect(f.steer).toBeCloseTo(-0.2);
    expect(f.throttle).toBe(1);
  });

  it('auto-accelerate is suppressed while the up key is held', () => {
    const im = makeInputManager();
    im.autoAccelerate = true;
    im.keys.up = true;
    im.frame(0.5);
    expect(im.lastLayer).toBe('base');
  });
});

describe('InputManager sources', () => {
  it('registerSource/getSource round-trips by id', () => {
    const im = new InputManager(new EventBus());
    const source: InputSource = {
      id: 'gamepad',
      isAvailable: () => false,
      read: () => ({ steer: 0, throttle: 0, brake: 0, boostButton: false }),
    };
    im.registerSource(source);
    expect(im.getSource('gamepad')).toBe(source);
    expect(im.getSource('phone')).toBeUndefined();
  });

  it('should not own phone state directly', () => {
    const im = new InputManager(new EventBus());
    const asAny = im as unknown as { phoneConnected?: boolean; phoneSteering?: number };
    expect(asAny.phoneConnected).toBeUndefined();
    expect(asAny.phoneSteering).toBeUndefined();
  });

  it('keeps keyboard/touch/gyro source registrations', () => {
    const im = new InputManager(new EventBus());
    expect(im.keyboard.id).toBe('keyboard');
    expect(im.touchSource.id).toBe('touch');
    expect(im.gyro.id).toBe('gyro');
  });
});

describe('InputManager mode restriction (GAME_MODES)', () => {
  it('rejects base frames from sources not allowed by the active mode', () => {
    const im = new InputManager(new EventBus());
    im.setModeConfig(GAME_MODES.survival); // gesture-only
    im.setBase('keyboard', { steer: 1, throttle: 1, brake: 0, boostButton: false });
    expect(im.frame(0.5).steer).toBe(0);
    im.setBase('hand', { steer: -0.7, throttle: 0.5, brake: 0, boostButton: false });
    expect(im.frame(0.5).steer).toBeCloseTo(-0.7);
  });

  it('survival: auto-accelerate ignores keyboard/gyro steering (keeps center)', () => {
    const im = new InputManager(new EventBus());
    im.setModeConfig(GAME_MODES.survival);
    im.autoAccelerate = true;
    im.keys.left = true;
    expect(im.frame(0.5).steer).toBe(0);

    const im2 = new InputManager(new EventBus());
    im2.setModeConfig(GAME_MODES.survival);
    im2.autoAccelerate = true;
    im2.gyroscopeMode = true;
    im2.gyroTilt = 0.5;
    expect(im2.frame(0.5).steer).toBe(0);
  });

  it('survival: a connected phone source is ignored', () => {
    const im = new InputManager(new EventBus());
    im.setModeConfig(GAME_MODES.survival);
    im.autoAccelerate = true;
    const phone = connectedPhone(0.9);
    im.registerSource(phone);
    const f = im.frame(0.5);
    expect(im.lastLayer).toBe('auto');
    expect(f.steer).toBe(0);
  });

  it('vs-mode keeps the phone source in the priority chain', () => {
    const im = new InputManager(new EventBus());
    im.setModeConfig(GAME_MODES.versus);
    im.autoAccelerate = true;
    im.gyroscopeMode = true;
    const phone = connectedPhone(0.5);
    im.registerSource(phone);
    const f = im.frame(0.5);
    expect(im.lastLayer).toBe('phone');
    expect(f.steer).toBeCloseTo(0.4);
  });

  it('isSourceAllowed reflects the mode input whitelist', () => {
    const im = new InputManager(new EventBus());
    expect(im.isSourceAllowed('keyboard')).toBe(true); // no mode active
    im.setModeConfig(GAME_MODES.survival);
    expect(im.isSourceAllowed('hand')).toBe(true);
    expect(im.isSourceAllowed('keyboard')).toBe(false);
    expect(im.isSourceAllowed('phone')).toBe(false);
    im.setModeConfig(GAME_MODES.versus);
    expect(im.isSourceAllowed('phone')).toBe(true);
  });

  it('setModeConfig(null) lifts all restrictions', () => {
    const im = new InputManager(new EventBus());
    im.setModeConfig(GAME_MODES.survival);
    im.setModeConfig(null);
    im.setBase('keyboard', { steer: 1, throttle: 1, brake: 0, boostButton: false });
    expect(im.frame(0.5).steer).toBe(1);
  });
});
