import { describe, it, expect } from 'vitest';
import { PhoneSensor } from './PhoneSensor';

function sensor(): PhoneSensor {
  return new PhoneSensor({ rangeDeg: 25, deadzoneDeg: 2, sensitivity: 1 });
}

describe('PhoneSensor', () => {
  it('returns 0 at calibrated center', () => {
    expect(sensor().readSteering(0)).toBe(0);
  });

  it('steers negative for left tilt and positive for right', () => {
    const s = sensor();
    expect(s.readSteering(-12.5)).toBeLessThan(0);
    expect(s.readSteering(12.5)).toBeGreaterThan(0);
  });

  it('calibrates so the current orientation becomes neutral', () => {
    const s = sensor();
    (s as unknown as { lastGamma: number }).lastGamma = 10;
    s.calibrate();
    expect(s.readSteering(10)).toBe(0);
    expect(s.readSteering(20)).toBeGreaterThan(0);
    expect(s.readSteering(0)).toBeLessThan(0);
  });

  it('applies the dead zone', () => {
    const s = sensor(); // dead zone = 2deg / 25deg = 0.08
    expect(s.readSteering(1)).toBe(0);
    expect(s.readSteering(-1)).toBe(0);
  });

  it('clamps steering to [-1, 1]', () => {
    const s = sensor();
    expect(s.readSteering(500)).toBe(1);
    expect(s.readSteering(-500)).toBe(-1);
  });

  it('returns 0 for non-finite input', () => {
    const s = sensor();
    expect(s.readSteering(NaN)).toBe(0);
    expect(s.readSteering(Infinity)).toBe(0);
    expect(s.readSteering(-Infinity)).toBe(0);
  });

  it('respects the sensitivity multiplier', () => {
    const s = new PhoneSensor({ rangeDeg: 25, deadzoneDeg: 2, sensitivity: 2 });
    expect(s.readSteering(12.5)).toBeGreaterThan(sensor().readSteering(12.5));
  });
});
