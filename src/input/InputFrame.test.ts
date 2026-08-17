import { describe, it, expect } from 'vitest';
import { InputManager } from '../managers/InputManager';
import { EventBus } from '../core/EventBus';
import { HandSource } from './sources/HandSource';
import {
  centerFromSteer,
  clampFrame,
  frameFromHandData,
  handsFromThrottle,
  steerFromCenterX,
  STEER_GAIN,
} from './InputFrame';

describe('InputFrame helpers', () => {
  it('round-trips steering center ↔ steer', () => {
    for (const centerX of [0, 0.25, 0.5, 0.75, 1]) {
      const steer = steerFromCenterX(centerX);
      expect(centerFromSteer(steer)).toBeCloseTo(centerX);
    }
  });

  it('clamps steering to [-1, 1]', () => {
    expect(clampFrame({ steer: 3, throttle: 0, brake: 0, boostButton: false }).steer).toBe(1);
    expect(clampFrame({ steer: -3, throttle: 0, brake: 0, boostButton: false }).steer).toBe(-1);
    expect(clampFrame({ steer: Number.NaN, throttle: 0, brake: 0, boostButton: false }).steer).toBe(-1);
  });

  it('clamps throttle and brake to [0, 1]', () => {
    expect(clampFrame({ steer: 0, throttle: 5, brake: 0, boostButton: false }).throttle).toBe(1);
    expect(clampFrame({ steer: 0, throttle: -2, brake: 0, boostButton: false }).throttle).toBe(0);
    expect(clampFrame({ steer: 0, throttle: 0, brake: 3, boostButton: false }).brake).toBe(1);
    expect(clampFrame({ steer: 0, throttle: 0, brake: -9, boostButton: false }).brake).toBe(0);
  });

  it('coerces boostButton to a boolean', () => {
    expect(
      clampFrame({ steer: 0, throttle: 0, brake: 0, boostButton: 1 as unknown as boolean }).boostButton
    ).toBe(true);
  });

  it('maps throttle back to hands (0/0.5/1 → 0/1/2)', () => {
    expect(handsFromThrottle(0)).toBe(0);
    expect(handsFromThrottle(0.5)).toBe(1);
    expect(handsFromThrottle(1)).toBe(2);
    expect(handsFromThrottle(0.7)).toBe(1);
    expect(handsFromThrottle(1.4)).toBe(2);
    expect(handsFromThrottle(Number.NaN)).toBe(0);
  });

  it('builds a frame from hand data', () => {
    const f = frameFromHandData(0.7, 2);
    expect(f.steer).toBeCloseTo(0.4);
    expect(f.throttle).toBe(1);
    expect(f.brake).toBe(0);
    expect(f.boostButton).toBe(false);
    const one = frameFromHandData(0.5, 1);
    expect(one.throttle).toBe(0.5);
  });
});

describe('source projections', () => {
  it('KeyboardSource maps keys to steer/throttle', () => {
    const im = new InputManager(new EventBus());
    im.keys.left = true;
    expect(im.keyboard.read().steer).toBe(-1);
    im.keys.left = false;
    im.keys.right = true;
    expect(im.keyboard.read().steer).toBe(1);
    im.keys.left = true;
    expect(im.keyboard.read().steer).toBe(-1); // left wins, matching legacy
    im.keys.left = false;
    im.keys.up = true;
    expect(im.keyboard.read().throttle).toBe(1);
    expect(im.keyboard.read().steer).toBe(1);
  });

  it('TouchSource maps touch state to steer/throttle', () => {
    const im = new InputManager(new EventBus());
    expect(im.touchSource.isAvailable()).toBe(false);
    im.touch.left = true;
    im.touch.active = true;
    expect(im.touchSource.isAvailable()).toBe(true);
    expect(im.touchSource.read().steer).toBe(-1);
    im.touch.left = false;
    im.touch.up = true;
    expect(im.touchSource.read().throttle).toBe(1);
  });

  it('GyroSource applies the legacy gain to tilt', () => {
    const im = new InputManager(new EventBus());
    im.gyroscopeMode = true;
    im.gyroTilt = 0.5;
    expect(im.gyro.read().steer).toBeCloseTo(0.5 * STEER_GAIN);
    im.gyroTilt = -0.5;
    expect(im.gyro.read().steer).toBeCloseTo(-0.5 * STEER_GAIN);
  });

  it('HandSource is neutral before any update and reflects the last hand frame', () => {
    const hs = new HandSource();
    expect(hs.isAvailable()).toBe(false);
    const neutral = hs.read();
    expect(neutral.steer).toBe(0);
    expect(neutral.throttle).toBe(0);
    hs.update({ centerX: 0.25, handsDetected: 1 } as never);
    expect(hs.isAvailable()).toBe(true);
    expect(hs.read().steer).toBeCloseTo(-0.5);
    expect(hs.read().throttle).toBe(0.5);
  });
});
