import { describe, it, expect } from 'vitest';
import {
  resolveQualityConfig,
  FrameBudgetScaler,
  AUTO_DROP_FRAME_MS,
  AUTO_UP_FRAME_MS,
  AUTO_WINDOW_MS,
} from './QualityManager';

describe('resolveQualityConfig', () => {
  it('performance caps pixel ratio at 1 and disables post/shadows/weather', () => {
    const cfg = resolveQualityConfig('performance', 2, true, true);
    expect(cfg.pixelRatio).toBe(1);
    expect(cfg.post).toBe(false);
    expect(cfg.shadows).toBe(false);
    expect(cfg.weather).toBe(false);
    expect(cfg.particleDensity).toBe(0.4);
  });

  it('balanced caps at 1.5 and keeps post/shadows/weather', () => {
    const cfg = resolveQualityConfig('balanced', 2, true, true);
    expect(cfg.pixelRatio).toBe(1.5);
    expect(cfg.post).toBe(true);
    expect(cfg.shadows).toBe(true);
    expect(cfg.weather).toBe(true);
    expect(cfg.particleDensity).toBe(0.7);
  });

  it('quality caps at 2 and uses full particle density', () => {
    const cfg = resolveQualityConfig('quality', 3, true, true);
    expect(cfg.pixelRatio).toBe(2);
    expect(cfg.post).toBe(true);
    expect(cfg.particleDensity).toBe(1);
  });

  it('respects the shadows and particles toggles', () => {
    expect(resolveQualityConfig('quality', 2, false, false).shadows).toBe(false);
    expect(resolveQualityConfig('quality', 2, true, false).particleDensity).toBe(0.2);
    expect(resolveQualityConfig('quality', 2, false, true).weather).toBe(true);
  });

  it('never returns a pixel ratio below 1', () => {
    const cfg = resolveQualityConfig('performance', 0.5, true, true);
    expect(cfg.pixelRatio).toBe(1);
  });
});

describe('FrameBudgetScaler', () => {
  it('starts at the full resolution multiplier', () => {
    const s = new FrameBudgetScaler();
    expect(s.resolutionMultiplier).toBe(1);
  });

  it('steps down when frames run long across the window', () => {
    const s = new FrameBudgetScaler();
    // Feed > windowMs worth of slow frames.
    const frames = Math.ceil(AUTO_WINDOW_MS / 30);
    for (let i = 0; i < frames; i++) s.record(AUTO_DROP_FRAME_MS + 2);
    expect(s.resolutionMultiplier).toBeLessThan(1);
  });

  it('recovers toward 1 when frames are comfortable', () => {
    const s = new FrameBudgetScaler();
    for (let i = 0; i < Math.ceil(AUTO_WINDOW_MS / 30); i++) s.record(AUTO_DROP_FRAME_MS + 2);
    const dropped = s.resolutionMultiplier;
    expect(dropped).toBeLessThan(1);
    for (let i = 0; i < Math.ceil(AUTO_WINDOW_MS / 30); i++) s.record(AUTO_UP_FRAME_MS - 2);
    expect(s.resolutionMultiplier).toBe(1);
  });

  it('keeps dropping on sustained overload but never below the floor', () => {
    const s = new FrameBudgetScaler();
    for (let round = 0; round < 8; round++) {
      for (let i = 0; i < Math.ceil(AUTO_WINDOW_MS / 30); i++) s.record(AUTO_DROP_FRAME_MS + 2);
    }
    expect(s.resolutionMultiplier).toBeGreaterThan(0);
  });

  it('does not drop on a short transient spike', () => {
    const s = new FrameBudgetScaler();
    s.record(AUTO_DROP_FRAME_MS + 40);
    expect(s.resolutionMultiplier).toBe(1);
  });

  it('computes the effective pixel ratio from the config cap', () => {
    const s = new FrameBudgetScaler();
    const cfg = resolveQualityConfig('quality', 2, true, true);
    expect(s.effectivePixelRatio(cfg)).toBe(2);
  });
});
