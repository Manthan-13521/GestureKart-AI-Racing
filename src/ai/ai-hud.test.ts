/**
 * AI HUD Telemetry — unit tests
 *
 * Validates that getHUDTelemetry correctly reports live race state
 * from the player's perspective.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { AIRuntime } from '../ai/AIRuntime';

describe('AIRuntime HUD telemetry', () => {
  let scene: THREE.Scene;
  let runtime: AIRuntime;

  beforeEach(() => {
    scene = new THREE.Scene();
    runtime = new AIRuntime({
      scene,
      carCount: 3,
      tier: 'medium',
      seed: 42,
      trackDistance: 2400,
    });
    runtime.start();
  });

  const baseRaceState = {
    position: 2,
    totalCars: 4,
    standings: ['ai-1', 'player', 'ai-0', 'ai-2'],
    raceTime: 30.5,
    lap: 1,
    totalLaps: 2,
    started: true,
    gameOver: false,
    raceDuration: 90,
  };

  it('reports correct gap ahead when player has a car ahead', () => {
    // Player at 100m, ai-0 at 105m (5m ahead), ai-1 at 120m, ai-2 at 80m
    const cars = runtime.getCarsForTest();
    cars[0].setDistanceForTest(105);
    cars[1].setDistanceForTest(120);
    cars[2].setDistanceForTest(80);

    const telemetry = runtime.getHUDTelemetry(100, 1.0, 1, baseRaceState);
    expect(telemetry.gapAhead).not.toBeNull();
    expect(telemetry.gapAhead).toBeGreaterThan(0);
    // 5m gap / (1.0 * 60 * 0.2) = 5 / 12 = 0.416...s
    expect(telemetry.gapAhead).toBeCloseTo(5 / 12, 2);
  });

  it('reports null gap ahead when player is leading', () => {
    // Player at 150m, all AI behind
    runtime.getCarsForTest().forEach((car) => car.setDistanceForTest(100));

    const telemetry = runtime.getHUDTelemetry(150, 1.0, 1, baseRaceState);
    expect(telemetry.gapAhead).toBeNull();
  });

  it('reports correct gap behind when player has a car behind', () => {
    // Player at 100m, ai-2 at 95m (5m behind)
    const cars = runtime.getCarsForTest();
    cars[0].setDistanceForTest(120);
    cars[1].setDistanceForTest(120);
    cars[2].setDistanceForTest(95);

    const telemetry = runtime.getHUDTelemetry(100, 1.0, 1, baseRaceState);
    expect(telemetry.gapBehind).not.toBeNull();
    expect(telemetry.gapBehind).toBeGreaterThan(0);
    expect(telemetry.gapBehind).toBeCloseTo(5 / 12, 2);
  });

  it('reports null gap behind when player is last', () => {
    // Player at 50m, all AI ahead
    runtime.getCarsForTest().forEach((car) => car.setDistanceForTest(100));

    const telemetry = runtime.getHUDTelemetry(50, 1.0, 1, baseRaceState);
    expect(telemetry.gapBehind).toBeNull();
  });

  it('propagates draft zone from player perception', () => {
    // Player at 100m, car ahead at 102m (2m gap = optimal draft zone)
    // Set car lateral position close to player (x=0) to be within LATERAL_TOLERANCE
    const cars = runtime.getCarsForTest();
    cars[0].setDistanceForTest(102);
    cars[0].setXForTest(0.1);
    cars[1].setDistanceForTest(150);
    cars[2].setDistanceForTest(150);

    const telemetry = runtime.getHUDTelemetry(100, 1.0, 1, baseRaceState);
    expect(telemetry.draftZone).toBe('optimal');
    expect(telemetry.draftBonus).toBeGreaterThan(0);
  });

  it('reports entry draft zone at 3.5m gap', () => {
    // 3.5m gap = entry zone (2.5 < gap <= 4.5)
    const cars = runtime.getCarsForTest();
    cars[0].setDistanceForTest(103.5);
    cars[0].setXForTest(0.1);
    cars[1].setDistanceForTest(150);
    cars[2].setDistanceForTest(150);

    const telemetry = runtime.getHUDTelemetry(100, 1.0, 1, baseRaceState);
    expect(telemetry.draftZone).toBe('entry');
  });

  it('reports dirty air at 6m gap', () => {
    // 6m gap = dirty zone (4.5 < gap <= 7.5)
    const cars = runtime.getCarsForTest();
    cars[0].setDistanceForTest(106);
    cars[0].setXForTest(0.1);
    cars[1].setDistanceForTest(150);
    cars[2].setDistanceForTest(150);

    const telemetry = runtime.getHUDTelemetry(100, 1.0, 1, baseRaceState);
    expect(telemetry.draftZone).toBe('dirty');
    expect(telemetry.draftBonus).toBeLessThan(0);
  });

  it('reports no draft when no car ahead', () => {
    runtime.getCarsForTest().forEach((car) => car.setDistanceForTest(80));

    const telemetry = runtime.getHUDTelemetry(100, 1.0, 1, baseRaceState);
    expect(telemetry.draftZone).toBe('none');
    expect(telemetry.draftBonus).toBe(0);
  });

  it('reports AI car ahead intent and identity', () => {
    const cars = runtime.getCarsForTest();
    cars[0].setDistanceForTest(105);
    cars[1].setDistanceForTest(150);
    cars[2].setDistanceForTest(150);

    const telemetry = runtime.getHUDTelemetry(100, 1.0, 1, baseRaceState);
    expect(telemetry.intent).toBeTruthy();
    expect(typeof telemetry.intent).toBe('string');
    expect(telemetry.opponentIdentity).not.toBeNull();
    // identityId is the GDD identity name (blaze, shield, risky, etc.)
    expect(telemetry.opponentIdentity?.id).toMatch(/^(blaze|shield|vector|risky|chameleon|comet)$/);
    expect(telemetry.opponentIdentity?.name).toBeTruthy();
  });

  it('reports overtaking when car ahead is in overtake phase', () => {
    const cars = runtime.getCarsForTest();
    cars[0].setDistanceForTest(105);
    cars[0].setMemoryForTest('overtakePhase', 'accelerate');
    cars[0].setMemoryForTest('overtakeTimer', 1.0);

    cars[1].setDistanceForTest(150);
    cars[2].setDistanceForTest(80);

    const telemetry = runtime.getHUDTelemetry(100, 1.0, 1, baseRaceState);
    expect(telemetry.isOvertaking).toBe(true);
    expect(telemetry.intent).toBe('overtake');
  });

  it('reports drafting when car ahead has draft cooldown', () => {
    const cars = runtime.getCarsForTest();
    cars[0].setDistanceForTest(105);
    cars[0].setMemoryForTest('draftCooldown', 2.0);

    cars[1].setDistanceForTest(150);
    cars[2].setDistanceForTest(80);

    const telemetry = runtime.getHUDTelemetry(100, 1.0, 1, baseRaceState);
    expect(telemetry.intent).toBe('draft');
  });

  it('reports mistake when car ahead is in mistake state', () => {
    const cars = runtime.getCarsForTest();
    cars[0].setDistanceForTest(105);
    cars[0].setMemoryForTest('mistakeDuration', 0.5);

    cars[1].setDistanceForTest(150);
    cars[2].setDistanceForTest(80);

    const telemetry = runtime.getHUDTelemetry(100, 1.0, 1, baseRaceState);
    expect(telemetry.intent).toBe('mistake');
  });

  it('sanitizes invalid telemetry (no NaN/Infinity)', () => {
    // Edge case: zero player speed
    const cars = runtime.getCarsForTest();
    cars[0].setDistanceForTest(105);
    cars[1].setDistanceForTest(150);
    cars[2].setDistanceForTest(150);

    const telemetry = runtime.getHUDTelemetry(100, 0, 1, baseRaceState);
    expect(telemetry.gapAhead).not.toBeNull();
    expect(isFinite(telemetry.gapAhead!)).toBe(true);
    expect(telemetry.gapAhead! >= 0).toBe(true);
  });

  it('is deterministic for identical state', () => {
    const cars = runtime.getCarsForTest();
    cars[0].setDistanceForTest(105);
    cars[1].setDistanceForTest(120);
    cars[2].setDistanceForTest(80);

    const t1 = runtime.getHUDTelemetry(100, 1.0, 1, baseRaceState);
    const t2 = runtime.getHUDTelemetry(100, 1.0, 1, baseRaceState);

    expect(t1).toEqual(t2);
  });

  it('respects lap and totalLaps from raceState', () => {
    const raceState = { ...baseRaceState, lap: 2, totalLaps: 3 };
    runtime.getCarsForTest().forEach((car) => car.setDistanceForTest(100));

    const telemetry = runtime.getHUDTelemetry(100, 1.0, 2, raceState);
    expect(telemetry.lap).toBe(2);
    expect(telemetry.totalLaps).toBe(3);
  });
});
