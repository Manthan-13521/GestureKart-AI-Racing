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
import type { EntityState } from './RaceEntity';
import type { RaceEntitySnapshot } from '../game/RaceDirector';

export interface AIRuntimeOptions {
  scene: THREE.Scene;
  /** Total number of AI cars. Default 5. */
  carCount?: number;
  /** 0 = easy, 1 = hard. Default 0.5. */
  difficulty?: number;
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
    const diff = this.options.difficulty ?? 0.5;
    const grid = buildGrid(count, diff);

    // Stagger starting positions ahead of the player
    for (let i = 0; i < count; i++) {
      const startDist = 15 + i * 12; // Staggered ahead
      const car = new AICar(`ai-${i}`, grid[i], startDist, this.trackDistance, this.scene);
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

    for (const car of this.cars) {
      car.setPlayerState(playerDistance, playerSpeed);
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
}
