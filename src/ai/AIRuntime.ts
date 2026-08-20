/**
 * AIRuntime — the AI race orchestrator.
 *
 * Creates and manages the grid of AI cars, drives the Perception →
 * Decision → Action loop each frame, syncs meshes to the world, and
 * feeds the RaceDirector with entity snapshots.
 *
 * Three.js is used ONLY for mesh positioning. All race logic is pure.
 */
import * as THREE from 'three';
import { AICar } from './AICar';
import { buildGrid } from './AIPersonality';
import { chameleonAdapter } from './ChameleonAdapter';
import { computePerception } from './AIPerception';
import type { DifficultyTier, IdentityFingerprint } from './AIIdentity';
import type { EntityState } from './RaceEntity';
import type { RaceState, RaceEntitySnapshot } from '../game/RaceDirector';

export interface HUDTelemetry {
  /** Player's race position (1 = leading). */
  position: number;
  /** Total cars in race (AI + player). */
  totalCars: number;
  /** Time gap to car ahead in seconds (null if leading). */
  gapAhead: number | null;
  /** Time gap to car behind in seconds (null if last). */
  gapBehind: number | null;
  /** Player's current draft zone. */
  draftZone: 'none' | 'entry' | 'optimal' | 'dirty' | 'cooldown';
  /** Player's current draft bonus fraction (0–0.18). */
  draftBonus: number;
  /** Intent of the AI car immediately ahead (if any). */
  intent: string;
  /** Whether the AI car ahead is currently overtaking. */
  isOvertaking: boolean;
  /** Identity of the AI car immediately ahead. */
  opponentIdentity: { id: string; name: string } | null;
  /** Current lap. */
  lap: number;
  /** Total laps. */
  totalLaps: number;
  /** Current race time (for lap timing). */
  lapTime: number;
}

export interface AIRuntimeOptions {
  scene: THREE.Scene;
  /** Total number of AI cars. Default 5. */
  carCount?: number;
  /**
   * Difficulty tier (GDD §9.3). Default 'medium'.
   * Replaces the old 0–1 `difficulty` scalar bands.
   */
  tier?: DifficultyTier;
  /** Deterministic grid seed. Same seed ⇒ same grid every race. */
  seed?: number;
  /** Optional Chameleon fingerprint override (from ChameleonAdapter). */
  chameleon?: IdentityFingerprint;
  /** Total track distance in metres. Default 2400. */
  trackDistance?: number;
}

export class AIRuntime {
  private scene: THREE.Scene;
  private cars: AICar[] = [];
  private trackDistance: number;
  private active = false;

  constructor(private readonly options: AIRuntimeOptions) {
    this.scene = options.scene;
    this.trackDistance = options.trackDistance ?? 2400;
  }

  get isActive(): boolean {
    return this.active;
  }

  /** Spawn the AI grid. Call this once when a race begins. */
  start(): void {
    this.dispose();
    this.active = true;

    const count = this.options.carCount ?? 5;
    const tier = this.options.tier ?? 'medium';
    const seed = this.options.seed ?? 1;
    const chameleon = this.options.chameleon ?? chameleonAdapter.adapt();
    const grid = buildGrid(count, tier, seed, chameleon);

    // Stagger starting positions ahead of the player
    for (let i = 0; i < count; i++) {
      const startDist = 15 + i * 12; // Staggered ahead
      // Per-car deterministic RNG stream, tied to the grid seed
      // so an identical seed reproduces an identical race.
      const car = new AICar(`ai-${i}`, grid[i], startDist, this.trackDistance, this.scene, seed * 31 + i);
      this.cars.push(car);
    }
  }

  /**
   * Called every render frame.
   * @param dt Delta time in SECONDS.
   * @param playerDistance Player's cumulative distance (metres).
   * @param playerSpeed Player's current normalised speed.
   * @param moveAmount Three.js world movement amount this frame.
   */
  tick(dt: number, playerDistance: number, playerSpeed: number, moveAmount: number): void {
    if (!this.active) return;

    // Build entity snapshots for Perception
    const snapshots: EntityState[] = this.cars.map((c) => c.getSnapshot());

    // Player pseudo-entity for perception
    const playerSnapshot: EntityState = {
      id: 'player',
      x: 0, // will be overridden per-car if needed
      speed: playerSpeed,
      distance: playerDistance,
      lap: 1,
      isPlayer: true,
      isAI: false,
      isGhost: false,
      isFinished: false,
    };

    const allEntities = [...snapshots, playerSnapshot];

    // Race leader = furthest cumulative distance (AI or player).
    // Player speed is never modified; this only feeds AI catch-up.
    let leaderDistance = playerDistance;
    for (const car of this.cars) {
      if (car.distance > leaderDistance) leaderDistance = car.distance;
    }

    for (const car of this.cars) {
      car.setPlayerState(playerDistance, playerSpeed);
      car.setPackLeader(leaderDistance);
      car.update(dt, allEntities);
      car.syncMesh(playerDistance, moveAmount);
    }
  }

  /** Returns entity snapshots suitable for RaceDirector.update(). */
  getSnapshots(playerDistance: number, playerLap: number): RaceEntitySnapshot[] {
    const snapshots: RaceEntitySnapshot[] = this.cars.map((car) => ({
      id: car.id,
      z: car.distance,
      lap: car.lap,
      isPlayer: false,
    }));

    snapshots.push({
      id: 'player',
      z: playerDistance,
      lap: playerLap,
      isPlayer: true,
    });

    return snapshots;
  }

  /**
   * Compute live HUD telemetry from the player's perspective.
   * Uses existing perception/decision state — no duplicate calculations.
   */
  getHUDTelemetry(
    playerDistance: number,
    playerSpeed: number,
    playerLap: number,
    raceState: RaceState
  ): HUDTelemetry {
    // Find the AI car immediately ahead of the player
    let carAhead: AICar | null = null;
    let minGapAhead = Infinity;
    for (const car of this.cars) {
      const gap = car.distance - playerDistance;
      if (gap > 0 && gap < minGapAhead) {
        minGapAhead = gap;
        carAhead = car;
      }
    }

    // Find the AI car immediately behind the player
    let carBehind: AICar | null = null;
    let minGapBehind = Infinity;
    for (const car of this.cars) {
      const gap = playerDistance - car.distance;
      if (gap > 0 && gap < minGapBehind) {
        minGapBehind = gap;
        carBehind = car;
      }
    }

    // Compute player's perception relative to car ahead (for draft telemetry)
    let draftZone: HUDTelemetry['draftZone'] = 'none';
    let draftBonus = 0;
    if (carAhead) {
      const playerEntity: EntityState = {
        id: 'player',
        x: 0,
        speed: playerSpeed,
        distance: playerDistance,
        lap: playerLap,
        isPlayer: true,
        isAI: false,
        isGhost: false,
        isFinished: false,
      };
      const perc = computePerception(playerEntity, [carAhead.getSnapshot()], this.trackDistance, 0);
      draftZone = perc.draftZone;
      draftBonus = perc.draftBonus;
    }

    // Convert distance gaps to time gaps (seconds) using player speed
    // Clamp playerSpeed to avoid division by zero / extreme values
    const speedForGap = Math.max(0.1, playerSpeed);
    const gapAheadSec = carAhead ? minGapAhead / (speedForGap * 60 * 0.2) : null;
    const gapBehindSec = carBehind ? minGapBehind / (speedForGap * 60 * 0.2) : null;

    // Get intent and overtaking state from the car ahead
    let intent = '';
    let isOvertaking = false;
    let opponentIdentity: HUDTelemetry['opponentIdentity'] = null;
    if (carAhead) {
      const hudIntent = carAhead.getHUDIntent();
      intent = hudIntent.intent;
      isOvertaking = hudIntent.isOvertaking;
      opponentIdentity = { id: carAhead.identityId, name: carAhead.identityName };
    }

    return {
      position: raceState.position,
      totalCars: raceState.totalCars,
      gapAhead: gapAheadSec,
      gapBehind: gapBehindSec,
      draftZone,
      draftBonus,
      intent,
      isOvertaking,
      opponentIdentity,
      lap: playerLap,
      totalLaps: raceState.totalLaps,
      lapTime: raceState.raceTime,
    };
  }

  /** Check if the player (at given x) is colliding with any AI car. */
  checkPlayerCollision(playerX: number, playerDist: number): boolean {
    for (const car of this.cars) {
      const dx = Math.abs(playerX - car.x);
      const dz = Math.abs(car.distance - playerDist);
      if (dx < 1.6 && dz < 4) return true;
    }
    return false;
  }

  /** Cleanly remove all AI cars from the scene. */
  dispose(): void {
    for (const car of this.cars) {
      car.dispose(this.scene);
    }
    this.cars = [];
    this.active = false;
  }

  /** Test helper: access cars array. */
  getCarsForTest(): AICar[] {
    return this.cars;
  }
}
