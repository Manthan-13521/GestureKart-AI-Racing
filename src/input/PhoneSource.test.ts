import { describe, it, expect } from 'vitest';
import { sanitizeSteering, PhoneSource } from './PhoneSource';
import { EventBus } from '../core/EventBus';

describe('sanitizeSteering', () => {
  it('accepts a valid packet', () => {
    expect(sanitizeSteering({ s: 0.5, t: 100 }, -Infinity)).toEqual({ v: 0.5, t: 100 });
  });

  it('clamps steering to [-1, 1]', () => {
    expect(sanitizeSteering({ s: 5, t: 1 }, -Infinity)).toEqual({ v: 1, t: 1 });
    expect(sanitizeSteering({ s: -5, t: 2 }, -Infinity)).toEqual({ v: -1, t: 2 });
  });

  it('rejects NaN / Infinity steering', () => {
    expect(sanitizeSteering({ s: NaN, t: 1 }, -Infinity)).toBeNull();
    expect(sanitizeSteering({ s: Infinity, t: 1 }, -Infinity)).toBeNull();
    expect(sanitizeSteering({ s: -Infinity, t: 1 }, -Infinity)).toBeNull();
  });

  it('rejects non-finite timestamps', () => {
    expect(sanitizeSteering({ s: 0, t: NaN }, -Infinity)).toBeNull();
    expect(sanitizeSteering({ s: 0, t: Infinity }, -Infinity)).toBeNull();
  });

  it('rejects strings, missing fields and malformed payloads', () => {
    expect(sanitizeSteering({ s: '0.5', t: 1 }, -Infinity)).toBeNull();
    expect(sanitizeSteering({ s: null, t: 1 }, -Infinity)).toBeNull();
    expect(sanitizeSteering({ s: 0, t: '1' }, -Infinity)).toBeNull();
    expect(sanitizeSteering({ t: 1 }, -Infinity)).toBeNull();
    expect(sanitizeSteering(null, -Infinity)).toBeNull();
    expect(sanitizeSteering(undefined, -Infinity)).toBeNull();
    expect(sanitizeSteering([1, 2], -Infinity)).toBeNull();
  });

  it('rejects stale and duplicate packets (latest value wins)', () => {
    expect(sanitizeSteering({ s: 0.5, t: 100 }, 90)).not.toBeNull();
    expect(sanitizeSteering({ s: 0.9, t: 90 }, 100)).toBeNull(); // stale
    expect(sanitizeSteering({ s: 0.2, t: 100 }, 100)).toBeNull(); // duplicate timestamp
  });
});

describe('PhoneSource as an InputSource', () => {
  it('is unavailable until a phone is connected', () => {
    const phone = new PhoneSource(new EventBus());
    expect(phone.isAvailable()).toBe(false);
  });

  it('disconnect removes availability and zeroes steering', () => {
    const phone = new PhoneSource(new EventBus());
    const internals = phone as unknown as { _phoneConnected: boolean; _steering: number };
    internals._phoneConnected = true;
    internals._steering = 0.5;
    phone.stop();
    expect(phone.isAvailable()).toBe(false);
    expect(phone.read().steer).toBe(0);
  });

  it('projects steering × gain with full throttle while connected', () => {
    const phone = new PhoneSource(new EventBus());
    const internals = phone as unknown as { _phoneConnected: boolean; _steering: number };
    internals._phoneConnected = true;
    internals._steering = 0.5;
    expect(phone.isAvailable()).toBe(true);
    const f = phone.read();
    expect(f.steer).toBeCloseTo(0.4);
    expect(f.throttle).toBe(1);
    expect(f.brake).toBe(0);
    expect(f.boostButton).toBe(false);
  });

  it('clamps steering to the legacy center-of-screen range', () => {
    const phone = new PhoneSource(new EventBus());
    const internals = phone as unknown as { _steering: number };
    internals._steering = 1;
    expect(phone.read().steer).toBeCloseTo(0.8);
    internals._steering = -1;
    expect(phone.read().steer).toBeCloseTo(-0.8);
  });

  it('rejects malformed phone steering data at the source', () => {
    const phone = new PhoneSource(new EventBus());
    const internals = phone as unknown as { _steering: number; _lastT: number };
    internals._lastT = -Infinity;
    expect(sanitizeSteering({ s: 'left', t: 1 }, internals._lastT)).toBeNull();
    expect(sanitizeSteering({ s: NaN, t: 1 }, internals._lastT)).toBeNull();
    expect(sanitizeSteering(null, internals._lastT)).toBeNull();
    expect(sanitizeSteering(undefined, internals._lastT)).toBeNull();
    expect(phone.read().steer).toBe(0);
  });
});
