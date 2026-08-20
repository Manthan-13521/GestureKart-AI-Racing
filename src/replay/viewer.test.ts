import { describe, expect, it } from 'vitest';
import {
  stepFreeCamera,
  lookFreeCamera,
  slowMoDelta,
  VIEWER_DEFAULTS,
  SLOW_MO_SCALE,
  type FreeCameraState,
} from './viewer';

describe('viewer free camera (P10)', () => {
  it('translates forward along -Z when yaw is 0', () => {
    const start: FreeCameraState = { x: 0, y: 3, z: -8, yaw: 0, pitch: 0 };
    const next = stepFreeCamera(start, { forward: true, back: false, left: false, right: false }, 0.1);
    expect(next.z).toBeLessThan(start.z);
    expect(next.x).toBeCloseTo(start.x, 6);
  });

  it('translates back toward +Z', () => {
    const start: FreeCameraState = { x: 0, y: 3, z: -8, yaw: 0, pitch: 0 };
    const next = stepFreeCamera(start, { forward: false, back: true, left: false, right: false }, 0.1);
    expect(next.z).toBeGreaterThan(start.z);
  });

  it('strafe moves along +X when yaw is 0', () => {
    const start: FreeCameraState = { x: 0, y: 3, z: -8, yaw: 0, pitch: 0 };
    const next = stepFreeCamera(start, { forward: false, back: false, left: false, right: true }, 0.1);
    expect(next.x).toBeGreaterThan(start.x);
    expect(next.z).toBeCloseTo(start.z, 6);
  });

  it('yaw rotates the travel direction', () => {
    const start: FreeCameraState = { x: 0, y: 3, z: -8, yaw: Math.PI / 2, pitch: 0 };
    const next = stepFreeCamera(start, { forward: true, back: false, left: false, right: false }, 0.1);
    expect(next.x).toBeLessThan(start.x);
    expect(next.z).toBeCloseTo(start.z, 6);
  });

  it('no input returns the same position', () => {
    const start: FreeCameraState = { x: 1, y: 3, z: -8, yaw: 1, pitch: 0.2 };
    expect(stepFreeCamera(start, { forward: false, back: false, left: false, right: false }, 0.1)).toBe(
      start
    );
  });

  it('clamps into the world bounds', () => {
    const start: FreeCameraState = { x: 1000, y: 1000, z: -1000, yaw: 0, pitch: 0 };
    const next = stepFreeCamera(start, { forward: false, back: true, left: false, right: true }, 0.5);
    expect(next.x).toBeLessThanOrEqual(30);
    expect(next.y).toBeLessThanOrEqual(20);
    expect(next.z).toBeGreaterThanOrEqual(-120);
  });

  it('pitch stays within the vertical limit', () => {
    const start: FreeCameraState = { x: 0, y: 3, z: -8, yaw: 0, pitch: 0 };
    let cam = start;
    for (let i = 0; i < 1000; i++) cam = lookFreeCamera(cam, 0, 5);
    expect(cam.pitch).toBeLessThanOrEqual(1.35);
    expect(cam.pitch).toBeGreaterThanOrEqual(-1.35);
  });

  it('yaw wraps around 2π', () => {
    const start: FreeCameraState = { x: 0, y: 3, z: -8, yaw: 6.2, pitch: 0 };
    const next = lookFreeCamera(start, 0.5, 0);
    expect(next.yaw).toBeGreaterThanOrEqual(0);
    expect(next.yaw).toBeLessThan(Math.PI * 2);
  });

  it('slowMoDelta applies the slow-mo scale only when active', () => {
    expect(slowMoDelta(1 / 60, false)).toBeCloseTo(1 / 60, 6);
    expect(slowMoDelta(1 / 60, true)).toBeCloseTo((1 / 60) * SLOW_MO_SCALE, 6);
    expect(SLOW_MO_SCALE).toBeGreaterThan(0);
    expect(SLOW_MO_SCALE).toBeLessThan(1);
  });

  it('defaults are valid finite numbers inside bounds', () => {
    expect(Number.isFinite(VIEWER_DEFAULTS.x)).toBe(true);
    expect(VIEWER_DEFAULTS.y).toBeGreaterThan(0);
    expect(Number.isFinite(VIEWER_DEFAULTS.z)).toBe(true);
    expect(Number.isFinite(VIEWER_DEFAULTS.yaw)).toBe(true);
    expect(Number.isFinite(VIEWER_DEFAULTS.pitch)).toBe(true);
  });
});
