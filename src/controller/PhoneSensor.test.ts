import { describe, it, expect } from 'vitest';
import { PhoneSensor, extractSteeringAngle } from './PhoneSensor';

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
    (s as unknown as { lastAngle: number }).lastAngle = 10;
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

  describe('extractSteeringAngle and horizontal orientation', () => {
    it('extracts correct steering angle for portrait (0 deg)', () => {
      // Tilting right: gamma > 0 -> angle > 0 (steer right)
      expect(extractSteeringAngle({ gamma: 15, beta: 30 }, 0)).toBe(15);
      // Tilting left: gamma < 0 -> angle < 0 (steer left)
      expect(extractSteeringAngle({ gamma: -15, beta: 30 }, 0)).toBe(-15);
    });

    it('extracts correct steering angle for landscape primary (90 deg)', () => {
      // In landscape 90 (top of phone on left):
      // Turning right (clockwise) moves top up/right -> beta decreases (e.g. -15) -> angle is +15 (steer right)
      expect(extractSteeringAngle({ beta: -15, gamma: 0 }, 90)).toBe(15);
      // Turning left (counter-clockwise) moves top down/left -> beta increases (e.g. +15) -> angle is -15 (steer left)
      expect(extractSteeringAngle({ beta: 15, gamma: 0 }, 90)).toBe(-15);
    });

    it('extracts correct steering angle for landscape secondary (270 deg)', () => {
      // In landscape 270 (top of phone on right):
      // Turning right (clockwise) moves top down/right -> beta is positive -> angle is +15 (steer right)
      expect(extractSteeringAngle({ beta: 15, gamma: 0 }, 270)).toBe(15);
      // Turning left (counter-clockwise) -> beta is negative -> angle is -15 (steer left)
      expect(extractSteeringAngle({ beta: -15, gamma: 0 }, 270)).toBe(-15);
    });

    it('extracts correct steering angle for portrait upside-down (180 deg)', () => {
      expect(extractSteeringAngle({ gamma: -15, beta: 0 }, 180)).toBe(15);
    });
  });
});
