/**
 * AICar — A single AI race participant.
 *
 * Extends RaceEntity. Owns a personality, memory, and a Three.js mesh
 * group injected at construction so the entity logic stays pure while
 * the renderer can reference the mesh externally.
 *
 * The mesh is positioned in world space relative to the camera
 * using the same Z-delta strategy as Game.obstacles:
 *   mesh.position.z = -(SPAWN_Z_BASE + (playerDistance - self.distance))
 */
import * as THREE from 'three';
import { RaceEntity } from './RaceEntity';
import type { Personality } from './AIPersonality';
import type { EntityState } from './RaceEntity';
import { makeMemory, decide } from './AIDecision';
import type { AIMemory } from './AIDecision';
import { computePerception } from './AIPerception';

const SPEED_LERP = 0.06; // How quickly speed converges to desired
const STEER_LERP = 0.04; // How quickly X converges to desired offset
const BOOST_SPEED_BONUS = 0.25;

// ─── Mesh factory ──────────────────────────────────────────────────────────
const RACER_COLORS: number[] = [
  0x00d4ff, // cyan
  0xff2d95, // magenta
  0x00ff41, // green
  0xffd700, // gold
  0xff6622, // orange
  0xaa44ff, // violet
];

let colorIdx = 0;

function buildRacerMesh(): THREE.Group {
  const g = new THREE.Group();
  const color = RACER_COLORS[colorIdx % RACER_COLORS.length];
  colorIdx++;

  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.6 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.78, 3.6), bodyMat);
  body.position.y = 0.5;
  g.add(body);

  const cabinMat = new THREE.MeshStandardMaterial({
    color: 0x060810,
    roughness: 0.2,
    metalness: 0.7,
  });
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 1.4), cabinMat);
  cabin.position.set(0, 1.18, 0.3);
  g.add(cabin);

  // Spoiler
  const spoilerMat = new THREE.MeshStandardMaterial({ color, roughness: 0.2, metalness: 0.9 });
  const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.4), spoilerMat);
  spoilerWing.position.set(0, 1.15, 1.7);
  g.add(spoilerWing);
  const spoilerPost = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.1), spoilerMat);
  spoilerPost.position.set(0, 0.97, 1.7);
  g.add(spoilerPost);

  // Tail lights
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff1100 });
  for (const side of [-0.7, 0.7]) {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.16, 0.06), tailMat);
    tl.position.set(side, 0.56, 1.82);
    g.add(tl);
  }

  // Headlights
  const headMat = new THREE.MeshBasicMaterial({ color: 0xeeffdd });
  for (const side of [-0.6, 0.6]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.06), headMat);
    hl.position.set(side, 0.48, -1.84);
    g.add(hl);
  }

  // Neon underbody strip
  const neonMat = new THREE.MeshBasicMaterial({ color });
  const neon = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.04, 3.5), neonMat);
  neon.position.y = 0.08;
  g.add(neon);

  return g;
}

// ─── AICar ────────────────────────────────────────────────────────────────

/** Z-depth at which a freshly spawned AI car appears ahead. */
const SPAWN_Z = -55;

export class AICar extends RaceEntity {
  public readonly mesh: THREE.Group;
  private readonly pers: Personality;
  private readonly mem: AIMemory;

  private _desiredSpeed = 0;
  private _desiredOffset = 0;

  /** Separate from entity speed — used for mesh rendering delta calc. */
  private playerDistance = 0;
  private playerSpeed = 0;

  private totalTrackDistance: number;
  private raceTime = 0;

  constructor(
    id: string,
    pers: Personality,
    startDistance: number,
    totalTrackDistance: number,
    scene: THREE.Scene
  ) {
    super(id, { isPlayer: false, isAI: true, isGhost: false });
    this.pers = pers;
    this.mem = makeMemory();
    this.totalTrackDistance = totalTrackDistance;

    this._state.distance = startDistance;
    this._state.speed = pers.speedFactor * 0.4;

    // Random start offset
    this._desiredOffset = this.mem.currentDesiredOffset;
    this._state.x = this._desiredOffset;

    this.mesh = buildRacerMesh();
    this.mesh.position.set(this._state.x, 0, SPAWN_Z - startDistance * 0.1);
    scene.add(this.mesh);
  }

  /** Inject real-time player state each frame before update(). */
  setPlayerState(dist: number, speed: number): void {
    this.playerDistance = dist;
    this.playerSpeed = speed;
  }

  /**
   * update() drives the entity's logical state.
   * @param dt Delta time in SECONDS.
   * @param others All other entity snapshots this frame.
   */
  update(dt: number, others: EntityState[] = []): void {
    this.raceTime += dt;

    // ─── Perception ────────────────────────────────────────────────
    const perc = computePerception(this._state, others, this.totalTrackDistance, this.mem.draftCooldown);

    // ─── Decision ──────────────────────────────────────────────────
    const action = decide(perc, this.pers, this.mem, this.raceTime, this.playerSpeed, dt);

    this._desiredSpeed = action.desiredSpeed;
    this._desiredOffset = action.desiredOffset;

    const boostBonus = action.boost ? BOOST_SPEED_BONUS * dt : 0;

    // ─── Action — integrate speed and position ──────────────────────
    this._state.speed += (this._desiredSpeed + boostBonus - this._state.speed) * SPEED_LERP;
    this._state.speed = Math.max(0.05, Math.min(2.8, this._state.speed));

    this._state.x += (this._desiredOffset - this._state.x) * STEER_LERP;

    // Distance accumulates at AI speed
    this._state.distance += this._state.speed * dt * 60 * 0.2;

    this.mem.currentDesiredOffset = this._desiredOffset;
  }

  /**
   * Sync the Three.js mesh position.
   * Called after update() — uses the distance delta to the player to
   * compute Z depth, exactly as Game.obstacles do.
   * @param playerDistance Player's cumulative track distance.
   * @param moveAmount Game movement amount this frame (in Three.js units).
   */
  syncMesh(playerDistance: number, moveAmount: number): void {
    // Z position: negative = ahead of camera, positive = behind
    const distDelta = this._state.distance - playerDistance;
    const targetZ = -30 - distDelta * 0.8;

    this.mesh.position.x = this._state.x;
    this.mesh.position.z += moveAmount; // Scroll forward with world
    // Snap Z toward the physics-derived position (prevent drift)
    this.mesh.position.z += (targetZ - this.mesh.position.z) * 0.05;
    this.mesh.position.y = 0;
  }

  /** True when the car has scrolled past the camera. */
  isBehindCamera(): boolean {
    return this.mesh.position.z > 14;
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.mesh);
  }
}
