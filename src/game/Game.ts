import * as THREE from 'three';
import { SmoothFilter } from '../utils/smoothing';
import type { Landmark } from '../input/HandTracker';
import { SceneManager, type SceneOptions } from '../managers/SceneManager';
import type { ResourceManager } from '../managers/ResourceManager';
import { ParticlePool } from '../graphics/ParticlePool';
import { WeatherSystem } from '../graphics/WeatherSystem';
import { PostProcessor } from '../graphics/PostProcessor';
import { profileManager } from '../managers/ProfileManager';
import { skinHex, neonHex } from '../progression/ContentCatalog';
import { mulberry32 } from '../ai/AIIdentity';
import {
  ComboSystem,
  LaneSwitchTracker,
  isNearMiss,
  nearMissReward,
  BoostController,
  BOOST_DURATION,
  maxSpeedFor,
  spawnIntervalFor,
  CollisionJuice,
} from './p4';

const SEG_LEN = 24;

/**
 * Recursively dispose a removed object's geometries and materials so that
 * recycled cars/pickups never leak GPU resources (P12 release hardening).
 */
function disposeObject(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) {
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) {
        for (const m of material) m.dispose();
      } else if (material) {
        material.dispose();
      }
    }
  });
}

/** '#rrggbb' → THREE color int (safe fallback). */
function hexColor(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 0x0e1015;
  return parseInt(m[1], 16);
}
const NUM_SEG = 18;
const ROAD_W = 10;
export const LANE_X = [-3.3, 0, 3.3];
const TUNNEL_W = 14;
const TUNNEL_H = 5;
const FOV = 78;
const CAM_Y = 1.3;
const RACE_DURATION = 90;

export interface GameState {
  speed: number;
  score: number;
  raceTime: number;
  bestTime: number;
  lap: number;
  totalLaps: number;
  position: number;
  totalCars: number;
  started: boolean;
  gameOver: boolean;
  raceDuration: number;
  shakeIntensity: number;
  justCollided: boolean;
  // P4
  comboMultiplier: number;
  comboStreak: number;
  boostActive: boolean;
  boostTimeLeft: number;
  boostMaxTime: number;
  nearMissEvent: { reward: number; multiplier: number } | null;
  crashActive: boolean;
  playerDistance: number;
}

export class Game {
  private scenes: SceneManager;
  private mobile: boolean;

  private segments: THREE.Group[] = [];

  private obstacles: THREE.Group[] = [];
  private maxObstacles = 10;

  public gesturesEnabled = false;

  private _speed = 0;
  private baseSpeed = 0.2;
  private score = 0;
  private raceTime = 0;
  private bestTime = Infinity;
  private lap = 1;
  private totalLaps = 2;
  private position = 2;
  private totalCars = 6;
  private _gameOver = false;
  private _started = false;

  /** When true, random obstacle spawning is suppressed (AI Race mode). */
  private _raceMode: 'survival' | 'ai-race' | 'versus' = 'survival';
  /** Cumulative distance driven, in metres — consumed by the AI runtime. */
  private _playerDistance = 0;

  private centerX = 0.5;
  private _handsDetected = 0;
  private _cameraX = 0;
  private smoothSteer = new SmoothFilter(0.45, 0);
  private sensitivity = 1.0;

  private spawnTimer = 0;
  private lastFrameTime = 0;

  private shakeIntensity = 0;
  public cameraMode: 'chase' | 'orbit' | 'cinematic' | 'free' = 'chase';
  public orbitAngle = 0;
  public freeCameraPos = new THREE.Vector3();
  public freeCameraRot = new THREE.Euler();

  private _justCollided = false;

  // P4: Combo, near-miss, boost, dynamic difficulty, collision juice
  private comboSystem = new ComboSystem();
  private laneSwitchTracker = new LaneSwitchTracker();
  private boostController = new BoostController();
  private collisionJuice = new CollisionJuice();
  private pendingGameOver = false;
  private crashActive = false;
  private boostPickups: THREE.Group[] = [];
  private boostPickupTimer = 0;
  private readonly BOOST_PICKUP_INTERVAL_MIN = 8;
  private readonly BOOST_PICKUP_INTERVAL_MAX = 20;
  private nextBoostPickupTime = 0;

  private headlight1!: THREE.SpotLight;
  private headlight2!: THREE.SpotLight;

  private cockpitGroup!: THREE.Group;
  private wheelGroup!: THREE.Group;
  private wheelAngle = 0;
  private handSkeleton: Landmark[] = [];
  private mirrorCanvas!: HTMLCanvasElement;
  private mirrorCtx!: CanvasRenderingContext2D | null;

  // P8.6: cosmetic materials (skin paint + neon underglow), refreshed at
  // race start from the authoritative ProfileManager state.
  private hoodMat!: THREE.MeshStandardMaterial;
  private neonMat!: THREE.MeshBasicMaterial;

  private particles!: THREE.Points;
  private particlePositions!: Float32Array;

  // Phase 6: GPU particle pool + weather
  private particlePool!: ParticlePool;
  private weatherSystem!: WeatherSystem;
  private ambientLight!: THREE.AmbientLight;
  public postProcessor!: PostProcessor;

  private baseFov = FOV;

  // P9: race randomness source. Defaults to Math.random (historical
  // behavior); setRaceSeed() swaps in the deterministic mulberry32 stream
  // so a replay reproduces the exact traffic/pickup layout of the run.
  private rng: () => number = Math.random;

  constructor(
    private canvas: HTMLCanvasElement,
    resources: ResourceManager
  ) {
    this.mobile = resources.device.isMobile;

    const sceneOptions: SceneOptions = { mobile: this.mobile, fov: FOV, camY: CAM_Y };
    this.scenes = new SceneManager(canvas, sceneOptions, resources);

    this.setupLights();
    this.buildRoad();
    this.buildSegments();
    this.cockpitGroup = this.buildCockpit();
    this.setupMirror();
    this.setupParticles();

    // Phase 6 — GPU particle pool replaces/supplements legacy particles
    this.particlePool = new ParticlePool(this.scene);
    // WeatherSystem needs the ambient light created in setupLights()
    this.weatherSystem = new WeatherSystem(this.scene, this.ambientLight);
    // Bloom post-processor (disabled on mobile to save GPU)
    const vpW = canvas.clientWidth || 800;
    const vpH = canvas.clientHeight || 600;
    this.postProcessor = new PostProcessor(this.renderer, vpW, vpH);
    this.postProcessor.enabled = !this.mobile;

    this.lastFrameTime = performance.now();
  }

  public get scene(): THREE.Scene {
    return this.scenes.scene;
  }

  public get camera(): THREE.PerspectiveCamera {
    return this.scenes.camera;
  }

  public get renderer(): THREE.WebGLRenderer {
    return this.scenes.renderer;
  }

  get gameOver(): boolean {
    return this._gameOver;
  }
  get started(): boolean {
    return this._started;
  }
  get handsDetected(): number {
    return this._handsDetected;
  }
  get cameraX(): number {
    return this._cameraX;
  }
  get steerCenterX(): number {
    return this.centerX;
  }
  get justCollided(): boolean {
    return this._justCollided;
  }
  get speed(): number {
    return this._speed;
  }

  /** Cumulative metres driven — used by AI runtime for distance ranking. */
  get playerDistance(): number {
    return this._playerDistance;
  }

  /** Current race mode. */
  get raceMode(): string {
    return this._raceMode;
  }

  /** Read-only access to the 3D scene for engine subsystems (replay/ghost). */
  get scene3d(): THREE.Scene {
    return this.scene;
  }

  private get difficulty(): number {
    return Math.min(1, this.raceTime / 60);
  }

  private get maxSpeed(): number {
    return 2.0 + this.difficulty * 2.5;
  }

  private get spawnInterval(): number {
    return 120 - this.difficulty * 90;
  }

  getState(): GameState {
    return {
      speed: this._speed,
      score: this.score,
      raceTime: this.raceTime,
      bestTime: this.bestTime === Infinity ? 0 : this.bestTime,
      lap: Math.min(this.lap, this.totalLaps),
      totalLaps: this.totalLaps,
      position: this._gameOver ? this.totalCars : this.position,
      totalCars: this.totalCars,
      started: this._started,
      gameOver: this._gameOver,
      raceDuration: RACE_DURATION,
      shakeIntensity: this.shakeIntensity,
      justCollided: this._justCollided,
      // P4
      comboMultiplier: this.comboSystem.multiplier,
      comboStreak: this.comboSystem.streakCount,
      boostActive: this.boostController.state.active,
      boostTimeLeft: this.boostController.state.timeLeft,
      boostMaxTime: BOOST_DURATION,
      nearMissEvent: this._lastNearMissEvent,
      crashActive: this.crashActive,
      playerDistance: this._playerDistance,
    };
  }

  getSpeedKmh(): number {
    return Math.floor(this._speed * 120);
  }

  getGear(): number {
    const kmh = this.getSpeedKmh();
    if (kmh < 30) return 1;
    if (kmh < 70) return 2;
    if (kmh < 110) return 3;
    if (kmh < 160) return 4;
    return 5;
  }

  getWeather(): import('../graphics/WeatherSystem').WeatherKind {
    return this.weatherSystem.getCurrentKind();
  }

  setHandData(centerX: number, handsDetected: number): void {
    this.centerX = centerX;
    this._handsDetected = handsDetected;
  }

  setHandSkeleton(landmarks: Landmark[]): void {
    this.handSkeleton = landmarks;
  }

  setSensitivity(val: number): void {
    this.sensitivity = val;
  }

  setGameOver(): void {
    this._gameOver = true;
    this._started = false;
  }

  /** Switch race mode — must be called BEFORE start(). */
  setRaceMode(mode: 'survival' | 'ai-race' | 'versus'): void {
    this._raceMode = mode;
  }

  /**
   * P9: fix the race randomness seed (traffic + boost-pickup layout).
   * Must be called BEFORE start(); the same seed reproduces the same
   * spawn layout. Never seeded → historical Math.random behavior.
   */
  setRaceSeed(seed: number): void {
    this.rng = mulberry32(seed);
  }

  /** Override the displayed race position (driven externally by RaceDirector). */
  setPosition(pos: number, total: number): void {
    this.position = pos;
    this.totalCars = total;
  }

  /**
   * Reset the world to a clean pre-race state WITHOUT starting the clock.
   * Used by the race-start pipeline so the staging/countdown renders a
   * deterministic grid and the vehicle is anchored before GO.
   */
  prepareRace(): void {
    this._gameOver = false;
    this._started = false;
    this.score = 0;
    this._speed = 0;
    this.raceTime = 0;
    this.lap = 1;
    this.position = this._raceMode === 'ai-race' ? 6 : 2;
    this.spawnTimer = 0;
    this._cameraX = 0;
    this._playerDistance = 0;
    this.smoothSteer.reset(0);
    this.shakeIntensity = 0;
    this._justCollided = false;
    this.centerX = 0.5;
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
    for (const c of this.obstacles) {
      disposeObject(c);
      this.scene.remove(c);
    }
    this.obstacles = [];

    // P4: reset survival-specific state
    this.comboSystem.reset();
    this.laneSwitchTracker.reset();
    this.boostController.reset();
    this.collisionJuice.reset();
    this.pendingGameOver = false;
    this.crashActive = false;
    // Clear boost pickups
    for (const p of this.boostPickups) {
      disposeObject(p);
      this.scene.remove(p);
    }
    this.boostPickups = [];
    this.boostPickupTimer = 0;
    this.nextBoostPickupTime = 0;
    // P8.6: re-apply equipped cosmetics at every race start (event-driven,
    // never per-frame). Pure presentation — physics is untouched.
    this.applyCosmetics();
  }

  /** Refresh paint + neon from the authoritative profile (P8.6). */
  applyCosmetics(): void {
    if (!this.hoodMat || !this.neonMat) return;
    const state = profileManager.currentState;
    this.hoodMat.color.setHex(hexColor(skinHex(state.selectedSkin)));
    this.neonMat.color.setHex(hexColor(neonHex(state.selectedNeon)));
  }

  start(): void {
    this.prepareRace();
    this._started = true;
    this._speed = this.baseSpeed;
    // In AI race mode, no random traffic is spawned — the AI runtime owns the grid.
    if (this._raceMode !== 'ai-race') {
      this.spawnCar();
      this.spawnCar();
      this.spawnCar();
    }
  }

  private setupLights(): void {
    this.ambientLight = new THREE.AmbientLight(0x1a2030, 0.6);
    this.scene.add(this.ambientLight);

    const hemi = new THREE.HemisphereLight(0x223344, 0x111122, 0.3);
    this.scene.add(hemi);

    this.headlight1 = new THREE.SpotLight(0xffeebb, 10, 80, Math.PI / 6, 0.5, 1);
    this.headlight1.position.set(-1.5, 1.8, -2);
    this.headlight1.target.position.set(-1.5, 0, -20);
    this.scene.add(this.headlight1);
    this.scene.add(this.headlight1.target);

    this.headlight2 = new THREE.SpotLight(0xffeebb, 10, 80, Math.PI / 6, 0.5, 1);
    this.headlight2.position.set(1.5, 1.8, -2);
    this.headlight2.target.position.set(1.5, 0, -20);
    this.scene.add(this.headlight2);
    this.scene.add(this.headlight2.target);

    const mainLight = new THREE.DirectionalLight(0x446688, 1.2);
    mainLight.position.set(0, 10, -10);
    this.scene.add(mainLight);
  }

  private buildRoad(): void {
    const geo = new THREE.PlaneGeometry(ROAD_W, 600);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x121418,
      roughness: 0.7,
      metalness: 0.1,
    });
    const road = new THREE.Mesh(geo, mat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, -0.02, -300);
    road.receiveShadow = !this.mobile;
    this.scene.add(road);
  }

  private buildSeg(z: number): THREE.Group {
    const g = new THREE.Group();
    g.position.z = z;

    const wallMat = new THREE.MeshBasicMaterial({ color: 0x1a1c22 });
    const wallGeo = new THREE.BoxGeometry(0.5, TUNNEL_H, SEG_LEN);

    const lw = new THREE.Mesh(wallGeo, wallMat);
    lw.position.set(-TUNNEL_W / 2 - 0.25, TUNNEL_H / 2, 0);
    g.add(lw);

    const rw = new THREE.Mesh(wallGeo, wallMat);
    rw.position.set(TUNNEL_W / 2 + 0.25, TUNNEL_H / 2, 0);
    g.add(rw);

    const ceilMat = new THREE.MeshBasicMaterial({ color: 0x141618 });
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(TUNNEL_W + 1, SEG_LEN), ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, TUNNEL_H, 0);
    g.add(ceil);

    const neonMat = new THREE.MeshBasicMaterial({ color: 0xcc2222 });
    const neonGeo = new THREE.BoxGeometry(0.06, 0.08, SEG_LEN);
    for (const side of [-1, 1]) {
      const neon = new THREE.Mesh(neonGeo, neonMat);
      neon.position.set(side * (TUNNEL_W / 2 + 0.04), 1.0, 0);
      g.add(neon);
    }

    const ceilNeonMat = new THREE.MeshBasicMaterial({ color: 0x0066cc });
    const ceilNeon = new THREE.Mesh(new THREE.BoxGeometry(TUNNEL_W * 0.5, 0.04, 0.1), ceilNeonMat);
    ceilNeon.position.set(0, TUNNEL_H - 0.03, 0);
    g.add(ceilNeon);

    const barMat = new THREE.MeshBasicMaterial({ color: 0x442222 });
    for (const side of [-1, 1]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, SEG_LEN), barMat);
      bar.position.set(side * (ROAD_W / 2 + 0.4), 0.2, 0);
      g.add(bar);
    }

    const lMat = new THREE.MeshBasicMaterial({ color: 0xccaa66 });
    const lGeo = new THREE.BoxGeometry(0.5, 0.06, 12);
    const l1 = new THREE.Mesh(lGeo, lMat);
    l1.position.set(-2.5, TUNNEL_H - 0.04, 0);
    g.add(l1);
    const l2 = new THREE.Mesh(lGeo, lMat);
    l2.position.set(2.5, TUNNEL_H - 0.04, 0);
    g.add(l2);

    const panelMat = new THREE.MeshBasicMaterial({ color: 0x7788aa });
    for (let i = -1; i <= 1; i++) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.5), panelMat);
      panel.position.set(0, TUNNEL_H - 0.01, i * (SEG_LEN / 3));
      panel.rotation.x = -Math.PI / 2;
      g.add(panel);
    }

    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const edgeGeo = new THREE.PlaneGeometry(0.12, SEG_LEN);
    for (const ex of [-ROAD_W / 2, ROAD_W / 2]) {
      const e = new THREE.Mesh(edgeGeo, edgeMat);
      e.rotation.x = -Math.PI / 2;
      e.position.set(ex, 0.01, 0);
      g.add(e);
    }

    const dashMat = new THREE.MeshBasicMaterial({ color: 0x999999 });
    for (let lane = 0; lane < 2; lane++) {
      const lx = LANE_X[lane] + 1.65;
      for (let d = -SEG_LEN / 2; d < SEG_LEN / 2; d += 7) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 3.0), dashMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(lx, 0.01, d + 1.5);
        g.add(dash);
      }
    }

    this.scene.add(g);
    return g;
  }

  private buildSegments(): void {
    for (let i = 0; i < NUM_SEG; i++) {
      this.segments.push(this.buildSeg(-i * SEG_LEN));
    }
  }

  private buildCockpit(): THREE.Group {
    const g = new THREE.Group();

    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x0c0e12 });

    // P8.6: cosmetic paint comes from the authoritative ContentCatalog via
    // the validated profile state (no duplicated id/hex tables in Game.ts).
    const state = profileManager.currentState;
    this.hoodMat = new THREE.MeshStandardMaterial({
      color: hexColor(skinHex(state.selectedSkin)),
      roughness: 0.3,
      metalness: 0.6,
    });

    const hood = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 2.2), this.hoodMat);
    hood.position.set(0, 0.05, -1.6);
    hood.receiveShadow = true;
    g.add(hood);

    // P8.6: neon underglow — a soft emissive plane under the chassis in the
    // equipped neon color. Purely visual; never touches physics.
    this.neonMat = new THREE.MeshBasicMaterial({
      color: hexColor(neonHex(state.selectedNeon)),
      transparent: true,
      opacity: 0.35,
    });
    const underglow = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 3.6), this.neonMat);
    underglow.rotation.x = -Math.PI / 2;
    underglow.position.set(0, 0.02, -0.9);
    g.add(underglow);

    const dash = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.35, 0.5), bodyMat);
    dash.position.set(0, 0.48, -0.85);
    g.add(dash);

    const dashTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.08, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.4, metalness: 0.3 })
    );
    dashTop.position.set(0, 0.67, -0.85);
    g.add(dashTop);

    const gaugeMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
    const gaugeRimMat = new THREE.MeshBasicMaterial({ color: 0x333333 });

    for (const gx of [-0.5, 0.5]) {
      const gauge = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), gaugeMat);
      gauge.position.set(gx, 0.58, -0.59);
      g.add(gauge);

      const rim = new THREE.Mesh(new THREE.RingGeometry(0.085, 0.1, 16), gaugeRimMat);
      rim.position.set(gx, 0.58, -0.588);
      g.add(rim);

      const needle = new THREE.Mesh(
        new THREE.PlaneGeometry(0.003, 0.07),
        new THREE.MeshBasicMaterial({ color: 0xff3333 })
      );
      needle.position.set(gx, 0.6, -0.587);
      needle.rotation.z = -0.3 + Math.random() * 0.6;
      g.add(needle);
    }

    const speedoLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x00ff41 })
    );
    speedoLabel.position.set(0, 0.54, -0.58);
    g.add(speedoLabel);

    this.wheelGroup = new THREE.Group();

    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x0e0e16,
      roughness: 0.3,
      metalness: 0.7,
    });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 12, 24), wheelMat);
    rim.rotation.x = 0.5;
    this.wheelGroup.add(rim);

    const spokeMat = new THREE.MeshStandardMaterial({ color: 0x18182a, roughness: 0.35, metalness: 0.6 });
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.5), spokeMat);
      spoke.position.set(Math.sin(angle) * 0.15, Math.cos(angle) * 0.15, 0);
      spoke.rotation.z = angle;
      this.wheelGroup.add(spoke);
    }

    const hub = new THREE.Mesh(
      new THREE.CircleGeometry(0.07, 10),
      new THREE.MeshBasicMaterial({ color: 0x222238 })
    );
    hub.rotation.x = 0.5;
    this.wheelGroup.add(hub);

    this.wheelGroup.position.set(0, 0.8, -0.55);
    this.wheelGroup.rotation.x = 0.5;
    g.add(this.wheelGroup);

    for (const side of [-1, 1]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), bodyMat);
      pillar.position.set(side * 1.35, 1.35, -0.5);
      pillar.rotation.z = side * 0.15;
      g.add(pillar);
    }

    const windshieldMat = new THREE.MeshBasicMaterial({
      color: 0x111822,
      transparent: true,
      opacity: 0.15,
    });
    const windshield = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), windshieldMat);
    windshield.position.set(0, 1.1, -0.85);
    g.add(windshield);

    for (const side of [-1, 1]) {
      const mirrorGroup = new THREE.Group();

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.3), bodyMat);
      arm.position.set(0, 0, 0.15);
      mirrorGroup.add(arm);

      const mirrorBack = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.04), bodyMat);
      mirrorBack.position.set(0, 0, 0.32);
      mirrorGroup.add(mirrorBack);

      const mirrorFace = new THREE.Mesh(
        new THREE.PlaneGeometry(0.22, 0.15),
        new THREE.MeshBasicMaterial({ color: 0x334455 })
      );
      mirrorFace.position.set(0, 0, 0.34);
      mirrorGroup.add(mirrorFace);

      mirrorGroup.position.set(side * 1.55, 0.85, -0.7);
      mirrorGroup.rotation.y = side * 0.3;
      g.add(mirrorGroup);
    }

    const rearMirror = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.03), bodyMat);
    rearMirror.position.set(0, 1.7, -0.6);
    g.add(rearMirror);

    const rearGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.28, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x334455 })
    );
    rearGlass.position.set(0, 1.7, -0.585);
    g.add(rearGlass);

    this.scene.add(g);
    return g;
  }

  private setupMirror(): void {
    this.mirrorCanvas = document.createElement('canvas');
    this.mirrorCanvas.width = 64;
    this.mirrorCanvas.height = 48;
    this.mirrorCtx = this.mirrorCanvas.getContext('2d');
  }

  private updateMirror(): void {
    if (!this.mirrorCtx) return;
    const ctx = this.mirrorCtx;
    const w = this.mirrorCanvas.width;
    const h = this.mirrorCanvas.height;

    ctx.fillStyle = '#0a0c10';
    ctx.fillRect(0, 0, w, h);

    const fogColor = this._speed > 0.5 ? '#111822' : '#0a0c10';
    ctx.fillStyle = fogColor;
    ctx.fillRect(0, 0, w, h / 2);

    const roadY = h * 0.55;
    ctx.fillStyle = '#0e1014';
    ctx.fillRect(0, roadY, w, h - roadY);

    ctx.fillStyle = '#333';
    ctx.fillRect(w * 0.35, roadY - 2, w * 0.3, 2);

    for (let i = 0; i < 3; i++) {
      const cx = w * (0.3 + i * 0.2);
      const cy = roadY - 8 - i * 6;
      const cw = 12 - i * 2;
      const ch = 8 - i * 2;
      ctx.fillStyle = ['#445', '#556', '#334'][i];
      ctx.fillRect(cx - cw / 2, cy, cw, ch);
    }
  }

  private setupParticles(): void {
    const count = this.mobile ? 40 : 80;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 4;
      positions[i * 3 + 2] = -Math.random() * 200;
    }
    this.particlePositions = positions;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x8899aa,
      size: 0.1,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  private updateParticles(dt: number): void {
    const pos = this.particlePositions;
    const moveSpeed = this._speed * 0.6 * dt;
    for (let i = 0; i < pos.length / 3; i++) {
      pos[i * 3 + 2] += moveSpeed;
      if (pos[i * 3 + 2] > 10) {
        pos[i * 3] = (Math.random() - 0.5) * 20;
        pos[i * 3 + 1] = Math.random() * 4;
        pos[i * 3 + 2] = -Math.random() * 200;
        pos[i * 3] += this.smoothSteer.getValue() * 2;
      }
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  private spawnCar(): void {
    if (this.obstacles.length >= this.maxObstacles) return;

    const g = new THREE.Group();
    const colors = [0xcc2222, 0xcc8800, 0x8833cc, 0x00aa88, 0xcc5500, 0x1188cc, 0xcccccc, 0x33aa33];
    // Seeded stream (P9): traffic color is part of the reproducible layout.
    const color = colors[Math.floor(this.rng() * colors.length)];

    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.4,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.85, 3.8), bodyMat);
    body.position.y = 0.5;
    body.position.z = -0.1;
    body.castShadow = !this.mobile;
    body.receiveShadow = !this.mobile;
    g.add(body);

    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0a0a14, roughness: 0.3, metalness: 0.5 });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.6), cabinMat);
    cabin.position.set(0, 1.25, 0.3);
    cabin.castShadow = !this.mobile;
    g.add(cabin);

    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
    for (const side of [-0.65, 0.65]) {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.06), tailMat);
      tl.position.set(side, 0.6, 1.85);
      g.add(tl);
    }

    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    for (const side of [-0.65, 0.65]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.16, 0.06), hlMat);
      hl.position.set(side, 0.5, -2.0);
      g.add(hl);
    }

    const lane = Math.floor(this.rng() * 3);
    g.position.set(LANE_X[lane], 0, -80 - this.rng() * 50);
    this.scene.add(g);
    this.obstacles.push(g);
  }

  update(): void {
    if (!this._started) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastFrameTime) / 16.67, 3);
    this.lastFrameTime = now;
    const realDelta = dt / 60; // real time for timers

    // P4: Crash state machine (hit-stop + slow-mo) for survival collisions
    if (this.crashActive) {
      const stillCrashing = this.collisionJuice.tick(realDelta);
      if (!stillCrashing && this.collisionJuice.consumeDone()) {
        this._gameOver = true;
        this.crashActive = false;
      }
      // During crash, still render but freeze/slow world
      this.updateCamera(dt);
      return; // Skip game logic during crash
    }

    // Delta with time scale (for slow-mo if ever active outside crash)
    const worldDelta = realDelta;

    // P4: Boost controller tick
    this.boostController.tick(realDelta);
    const boostState = this.boostController.state;

    // P4: Dynamic difficulty for survival mode
    const isSurvival = this._raceMode === 'survival';
    const currentMaxSpeed = isSurvival ? maxSpeedFor(this._playerDistance) : this.maxSpeed;
    const currentSpawnInterval = isSurvival
      ? spawnIntervalFor(this.raceTime, this._playerDistance)
      : this.spawnInterval;

    if (this._handsDetected >= 2) {
      // P4: Apply boost speed bonus
      this._speed = Math.min(
        currentMaxSpeed,
        this._speed + 0.004 * dt + (boostState.active ? boostState.speedBonus * 0.002 * dt : 0)
      );

      // P4: Score with combo multiplier
      const comboMultiplier = this.comboSystem.multiplier;
      this.score += this._speed * 2 * dt * comboMultiplier;
      this.raceTime += worldDelta;
    } else {
      this._speed = Math.max(0.05, this._speed - 0.007 * dt);
    }

    // Accumulate player distance for AI race ranking
    this._playerDistance += this._speed * worldDelta * 60 * 0.2;

    if (this.raceTime >= RACE_DURATION) {
      this._gameOver = true;
    }

    // P7.3: obstacle-based position is a survival-mode HUD heuristic. In AI
    // races the RaceDirector is the authoritative rank source (setPosition)
    // and must not be clobbered every frame — previously the legacy HUD
    // always displayed P2 while the AI HUD showed the true standing.
    if (this._raceMode === 'survival') {
      this.position = Math.max(
        1,
        Math.min(this.totalCars, Math.floor((this.obstacles.length / 6) * (this.totalCars - 1)) + 2)
      );
    }

    this.spawnTimer += dt;
    const interval = Math.max(18, currentSpawnInterval - this._speed * 30);
    if (
      this.spawnTimer >= interval &&
      this._handsDetected >= 2 &&
      this.raceTime > 3 &&
      this.gesturesEnabled
    ) {
      this.spawnTimer = 0;
      this.spawnCar();
    }

    // P4: Boost pickup spawning (survival only, separate from traffic)
    if (isSurvival && this._handsDetected >= 2 && this.gesturesEnabled) {
      this.maybeSpawnBoostPickup(worldDelta);
    }

    // P4: Lane switch tracking for combo (survival only)
    if (isSurvival) {
      this.comboSystem.updateLaneSwitch(this._cameraX);
    }

    const rawSteer = (this.centerX - 0.5) * 2 * this.sensitivity;
    const deadZone = 0.02;
    let steerInput =
      Math.abs(rawSteer) < deadZone
        ? 0
        : rawSteer > 0
          ? (rawSteer - deadZone) / (1 - deadZone)
          : (rawSteer + deadZone) / (1 - deadZone);
    steerInput = Math.sign(steerInput) * Math.pow(Math.abs(steerInput), 0.85);
    const targetX = steerInput * 5;
    this._cameraX = this.smoothSteer.update(targetX);
    this._cameraX = Math.max(-4, Math.min(4, this._cameraX));

    this._justCollided = false;
    if (this.shakeIntensity > 0.01) {
      this.shakeIntensity *= 0.9;
    } else {
      this.shakeIntensity = 0;
    }

    this.updateCamera(dt);

    const moveAmount = this._speed * worldDelta;
    for (const seg of this.segments) {
      seg.position.z += moveAmount;
      if (seg.position.z > SEG_LEN) {
        seg.position.z -= NUM_SEG * SEG_LEN;
      }
    }

    // P4: Boost pickup spawning (survival only, separate from traffic)
    if (isSurvival && this._handsDetected >= 2 && this.gesturesEnabled) {
      this.maybeSpawnBoostPickup(worldDelta);
    }

    // Obstacle processing with near-miss detection
    let nearMissEvent: { reward: number; multiplier: number } | null = null;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const car = this.obstacles[i];
      const prevZ = car.position.z;
      car.position.z += moveAmount;

      // Near-miss tracking: track min lateral clearance during pass
      const dx = Math.abs(this._cameraX - car.position.x);
      const state = car.userData as {
        minDx?: number;
        passed?: boolean;
        nearMissed?: boolean;
        collided?: boolean;
      };
      if (!state.minDx || dx < state.minDx) state.minDx = dx;

      if (car.position.z > 12) {
        disposeObject(car);
        this.scene.remove(car);
        this.obstacles.splice(i, 1);
        continue;
      }

      // Near-miss: obstacle passes player plane (z crosses 0)
      if (!state.passed && prevZ <= 0 && car.position.z > 0) {
        state.passed = true;
        if (!state.collided && state.minDx !== undefined && isNearMiss(state.minDx)) {
          const multiplier = this.comboSystem.multiplier;
          const reward = nearMissReward(multiplier);
          this.comboSystem.registerNearMiss();
          this.score += reward;
          nearMissEvent = { reward, multiplier };
        }
      }

      // Collision check
      const dz = Math.abs(car.position.z);
      if (dx < 1.5 && dz < 2.5) {
        state.collided = true;
        if (isSurvival) {
          if (boostState.invulnerable) {
            // Invulnerable: skip collision effects, continue
            continue;
          }
          // Start crash sequence (hit-stop + slow-mo) instead of instant gameOver
          this._justCollided = true;
          this.shakeIntensity = 2.8;
          this.camera.fov = this.baseFov + 12;
          this.camera.updateProjectionMatrix();
          this.collisionJuice.activate();
          this.crashActive = true;
          this.pendingGameOver = true;
          // Don't set _gameOver yet; crash sequence will set it after slow-mo
        } else {
          // Non-survival: instant gameOver as before
          this._gameOver = true;
          this._justCollided = true;
          this.shakeIntensity = 2.8;
          this.camera.fov = this.baseFov + 12;
          this.camera.updateProjectionMatrix();
        }
      }
    }

    // P4: Boost pickup processing (collection)
    this.processBoostPickups(moveAmount, worldDelta);

    this.updateParticles(dt);
    this.updateMirror();

    if (this._justCollided && !this.reducedMotion) {
      this.particlePool.emitSparks(this._cameraX);
    }
    this.particlePool.update(worldDelta, this._speed, this._cameraX, moveAmount);
    this.weatherSystem.update(worldDelta, this._speed, moveAmount);

    // Store near-miss event for state (will be read by getState)
    this._lastNearMissEvent = nearMissEvent;
  }

  // P4: Track last near-miss event for state
  private _lastNearMissEvent: { reward: number; multiplier: number } | null = null;

  private maybeSpawnBoostPickup(delta: number): void {
    this.boostPickupTimer += delta;
    if (this.boostPickupTimer >= this.nextBoostPickupTime) {
      this.spawnBoostPickup();
      this.boostPickupTimer = 0;
      this.nextBoostPickupTime =
        this.BOOST_PICKUP_INTERVAL_MIN +
        this.rng() * (this.BOOST_PICKUP_INTERVAL_MAX - this.BOOST_PICKUP_INTERVAL_MIN);
    }
  }

  private spawnBoostPickup(): void {
    const g = new THREE.Group();
    // Glowing torus for boost pickup - use StandardMaterial for emissive
    const geo = new THREE.TorusGeometry(0.6, 0.15, 8, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8,
      emissive: 0x00ffff,
      emissiveIntensity: 1.0,
      roughness: 0.3,
      metalness: 0.5,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    g.add(mesh);

    // Inner pulse ring - BasicMaterial is fine
    const ringGeo = new THREE.RingGeometry(0.4, 0.8, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    g.add(ring);

    const lane = Math.floor(this.rng() * 3);
    g.position.set(LANE_X[lane], 0.5, -80 - this.rng() * 50);
    g.userData = { type: 'boost-pickup', collected: false, lane };
    this.scene.add(g);
    this.boostPickups.push(g);
  }

  private processBoostPickups(moveAmount: number, _delta: number): void {
    for (let i = this.boostPickups.length - 1; i >= 0; i--) {
      const pickup = this.boostPickups[i];
      pickup.position.z += moveAmount;

      // Animate glow pulse
      const time = performance.now() / 1000;
      const pulse = Math.sin(time * 5) * 0.2 + 0.8;
      const mesh = pickup.children[0] as THREE.Mesh;
      if (mesh && mesh.material) {
        (mesh.material as THREE.MeshStandardMaterial).opacity = pulse * 0.8;
        (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
      }
      const ring = pickup.children[1] as THREE.Mesh;
      if (ring && ring.material) {
        (ring.material as THREE.MeshBasicMaterial).opacity = pulse * 0.4;
      }

      if (pickup.position.z > 12) {
        disposeObject(pickup);
        this.scene.remove(pickup);
        this.boostPickups.splice(i, 1);
        continue;
      }

      // Collection check
      const dx = Math.abs(this._cameraX - pickup.position.x);
      const dz = Math.abs(pickup.position.z);
      const state = pickup.userData as { collected: boolean; type: string };
      if (!state.collected && dx < 1.2 && dz < 2.0) {
        state.collected = true;
        this.boostController.activate();
        disposeObject(pickup);
        this.scene.remove(pickup);
        this.boostPickups.splice(i, 1);
        // Visual feedback
        if (!this.reducedMotion) this.particlePool.emitSparks(pickup.position.x);
      }
    }
  }

  public updateCamera(dt: number = 1 / 60): void {
    const effectiveShake = this.reducedMotion ? 0 : this.shakeIntensity;
    const shakeX = (Math.random() - 0.5) * effectiveShake * 0.8;
    const shakeY = (Math.random() - 0.5) * effectiveShake * 0.5;
    const rollExtra = (Math.random() - 0.5) * effectiveShake * 0.04;

    if (this.cameraMode === 'chase') {
      this.camera.position.x = this._cameraX + shakeX;
      this.camera.position.y = CAM_Y + shakeY;
      this.camera.position.z = 0;
      this.camera.rotation.set(0, 0, this._cameraX * -0.025 + rollExtra);

      const fovBoost = this._speed * 2.5;
      this.camera.fov = this.baseFov + fovBoost;
    } else if (this.cameraMode === 'orbit') {
      this.orbitAngle += dt * 0.5;
      const radius = 6;
      this.camera.position.x = this._cameraX + Math.sin(this.orbitAngle) * radius;
      this.camera.position.y = 2 + Math.abs(Math.cos(this.orbitAngle * 2));
      this.camera.position.z = Math.cos(this.orbitAngle) * radius - 2;
      this.camera.lookAt(this._cameraX, 0.5, -1.5);
      this.camera.fov = this.baseFov;
    } else if (this.cameraMode === 'cinematic') {
      this.camera.position.x = this._cameraX + Math.sin(this.raceTime * 0.3) * 4;
      this.camera.position.y = 0.5;
      this.camera.position.z = -5;
      this.camera.lookAt(this._cameraX, 0.5, -1.5);
      this.camera.fov = 90;
    } else if (this.cameraMode === 'free') {
      this.camera.position.copy(this.freeCameraPos);
      this.camera.rotation.copy(this.freeCameraRot);
      this.camera.fov = this.baseFov;
    }

    this.camera.updateProjectionMatrix();

    const wheelTargetRot = -this._cameraX * 0.18;
    this.wheelAngle += (wheelTargetRot - this.wheelAngle) * 0.12;
    this.wheelGroup.rotation.z = this.wheelAngle;

    this.cockpitGroup.position.x = this._cameraX;

    this.headlight1.target.position.set(this._cameraX - 1.5, 0, -20);
    this.headlight2.target.position.set(this._cameraX + 1.5, 0, -20);
  }

  public render(): void {
    this.postProcessor.render(this.scene, this.camera);
  }

  /** Reduced-motion gate: suppresses camera shake and particle bursts. */
  public reducedMotion = false;

  /** Apply a resolved quality config (GDD §11.2/§15). */
  setQuality(config: {
    pixelRatio: number;
    post: boolean;
    shadows: boolean;
    weather: boolean;
    particleDensity: number;
  }): void {
    this.renderer.setPixelRatio(config.pixelRatio);
    this.postProcessor.enabled = config.post;
    this.renderer.shadowMap.enabled = config.shadows;
    this.weatherSystem.enabled = config.weather;
    this.particlePool.emissionScale = config.particleDensity;
  }

  resize(w: number, h: number): void {
    this.scenes.resize(w, h);
    this.postProcessor.resize(w, h);
  }

  dispose(): void {
    this.particlePool.dispose();
    this.weatherSystem.dispose();
    this.postProcessor.dispose();
    this.scenes.dispose();
  }
}
