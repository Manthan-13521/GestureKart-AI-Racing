import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { gestureCalibration } from './GestureCalibration';

describe('GestureCalibration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    gestureCalibration.reset();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts idle', () => {
    expect(gestureCalibration.getState().phase).toBe('idle');
    expect(gestureCalibration.getState().samplesCollected).toBe(0);
  });

  it('rejects invalid samples (low hands detected)', () => {
    gestureCalibration.start();
    vi.advanceTimersByTime(600);
    gestureCalibration.feedSample(0.5, 0.8, 1);
    expect(gestureCalibration.getState().samplesCollected).toBe(0);
  });

  it('rejects invalid samples (low confidence)', () => {
    gestureCalibration.start();
    vi.advanceTimersByTime(600);
    gestureCalibration.feedSample(0.5, 0.5, 2);
    expect(gestureCalibration.getState().samplesCollected).toBe(0);
  });

  it('accepts valid samples', () => {
    gestureCalibration.start();
    vi.advanceTimersByTime(600);
    for (let i = 0; i < 10; i++) {
      gestureCalibration.feedSample(0.5 + i * 0.001, 0.9, 2);
    }
    expect(gestureCalibration.getState().samplesCollected).toBe(10);
  });

  it('cancels cleanly', () => {
    gestureCalibration.start();
    vi.advanceTimersByTime(600);
    gestureCalibration.feedSample(0.5, 0.9, 2);
    gestureCalibration.cancel();
    expect(gestureCalibration.getState().phase).toBe('cancelled');
    expect(gestureCalibration.getCalibration()).toBeNull();
  });

  it('persists calibration to localStorage', () => {
    gestureCalibration.start();
    vi.advanceTimersByTime(600);
    for (let i = 0; i < 35; i++) {
      gestureCalibration.feedSample(0.5 + i * 0.001, 0.9, 2);
    }
    // Manually trigger completion for test
    (gestureCalibration as unknown as { completeCapture: () => void }).completeCapture();

    const raw = localStorage.getItem('virtual-steering:gesture-calibration');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(1);
    expect(parsed.neutralCenterX).toBeCloseTo(0.5, 1);
  });

  it('loads existing calibration on init', async () => {
    const calData = {
      version: 1,
      neutralCenterX: 0.52,
      deadZone: 0.05,
      emaAlpha: 0.5,
      timestamp: Date.now(),
    };
    localStorage.setItem('virtual-steering:gesture-calibration', JSON.stringify(calData));

    vi.resetModules();
    const { gestureCalibration: newCalibration } = await import('./GestureCalibration');
    expect(newCalibration.getCalibration()).not.toBeNull();
    expect(newCalibration.getCalibration()!.neutralCenterX).toBeCloseTo(0.52, 2);
  });

  it('rejects invalid persisted calibration', async () => {
    localStorage.setItem('virtual-steering:gesture-calibration', 'invalid json');
    vi.resetModules();
    const { gestureCalibration: newCalibration } = await import('./GestureCalibration');
    expect(newCalibration.getCalibration()).toBeNull();
  });

  it('rejects old version calibration', async () => {
    const oldCal = {
      version: 0,
      neutralCenterX: 0.5,
      deadZone: 0.02,
      emaAlpha: 0.55,
      timestamp: Date.now(),
    };
    localStorage.setItem('virtual-steering:gesture-calibration', JSON.stringify(oldCal));
    vi.resetModules();
    const { gestureCalibration: newCalibration } = await import('./GestureCalibration');
    expect(newCalibration.getCalibration()).toBeNull();
  });

  it('rejects malformed calibration shapes (P12)', async () => {
    const badCases: Array<Record<string, unknown>> = [
      { version: 1, neutralCenterX: NaN, deadZone: 0.05, emaAlpha: 0.5, timestamp: 1 },
      { version: 1, neutralCenterX: 2.5, deadZone: 0.05, emaAlpha: 0.5, timestamp: 1 },
      { version: 1, neutralCenterX: 0.5, deadZone: -1, emaAlpha: 0.5, timestamp: 1 },
      { version: 1, neutralCenterX: 0.5, deadZone: 0.05, emaAlpha: 0, timestamp: 1 },
      { version: 1, neutralCenterX: 0.5, deadZone: 0.05, emaAlpha: 'high', timestamp: 1 },
      { version: 1, neutralCenterX: 0.5, deadZone: 0.05, emaAlpha: 0.5, timestamp: -1 },
    ];
    for (const bad of badCases) {
      localStorage.setItem('virtual-steering:gesture-calibration', JSON.stringify(bad));
      vi.resetModules();
      const { gestureCalibration: newCalibration } = await import('./GestureCalibration');
      expect(newCalibration.getCalibration()).toBeNull();
    }
  });
});
