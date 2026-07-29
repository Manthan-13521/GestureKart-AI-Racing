import * as THREE from 'three';
import { SmoothFilter } from '../utils/smoothing';
import type { Landmark } from '../input/HandTracker';

const SEG_LEN = 24;
const NUM_SEG = 18;
const ROAD_W = 10;
const LANE_X = [-3.3, 0, 3.3];
const TUNNEL_W = 14;
const TUNNEL_H = 5;
const FOV = 78;
const CAM_Y = 1.3;
const RACE_DURATION = 90;

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
}

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
}

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private mobile: boolean;

  private segments: THREE.Group[] = [];
  private obstacles: THREE.Group[] = [];
  private maxObstacles = 10;

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

  private centerX = 0.5;
  private _handsDetected = 0;
  private cameraX = 0;
  private smoothSteer = new SmoothFilter(0.45, 0);
  private sensitivity = 1.0;

  private spawnTimer = 0;
  private lastFrameTime = 0;

  private shakeIntensity = 0;
  private _justCollided = false;

  private headlight1!: THREE.SpotLight;
  private headlight2!: THREE.SpotLight;

  private cockpitGroup!: THREE.Group;
  private wheelGroup!: THREE.Group;
  private wheelAngle = 0;
  private handSkeleton: Landmark[] = [];
  private mirrorCanvas!: HTMLCanvasElement;
  private mirrorCtx!: CanvasRenderingContext2D | null;

  private particles!: THREE.Points;
  private particlePositions!: Float32Array;

  private baseFov = FOV;

  constructor(private canvas: HTMLCanvasElement) {
    this.mobile = isMobile();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050709);
    this.scene.fog = new THREE.Fog(0x050709, 40, 200);

    const w = canvas.clientWidth || 800;
    const h = canvas.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(FOV, w / h, 0.1, 300);
    this.camera.position.set(0, CAM_Y, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !this.mobile,
      powerPreference: this.mobile ? 'low-power' : 'high-performance',
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(this.mobile ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = !this.mobile;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.setupLights();
    this.buildRoad();
    this.buildSegments();
    this.cockpitGroup = this.buildCockpit();
    this.setupMirror();
    this.setupParticles();
    this.lastFrameTime = performance.now();
  }

  get gameOver(): boolean { return this._gameOver; }
  get started(): boolean { return this._started; }
  get handsDetected(): number { return this._handsDetected; }
  get steerCenterX(): number { return this.centerX; }
  get justCollided(): boolean { return this._justCollided; }
  get speed(): number { return this._speed; }

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

  start(): void {
    this._started = true;
    this._gameOver = false;
    this.score = 0;
    this._speed = this.baseSpeed;
    this.raceTime = 0;
    this.lap = 1;
    this.position = 2;
    this.spawnTimer = 0;
    this.cameraX = 0;
    this.smoothSteer.reset(0);
    this.shakeIntensity = 0;
    this._justCollided = false;
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
    for (const c of this.obstacles) this.scene.remove(c);
    this.obstacles = [];
    this.spawnCar();
    this.spawnCar();
    this.spawnCar();
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0x1a2030, 0.6);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x223344, 0x111122, 0.3);
    this.scene.add(hemi);

    this.headlight1 = new THREE.SpotLight(0xffeebb, 8, 80, Math.PI / 6, 0.5, 1);
    this.headlight1.position.set(-1.5, 1.8, -2);
    this.headlight1.target.position.set(-1.5, 0, -20);
    this.headlight1.castShadow = !this.mobile;
    this.scene.add(this.headlight1);
    this.scene.add(this.headlight1.target);

    this.headlight2 = new THREE.SpotLight(0xffeebb, 8, 80, Math.PI / 6, 0.5, 1);
    this.headlight2.position.set(1.5, 1.8, -2);
    this.headlight2.target.position.set(1.5, 0, -20);
    this.headlight2.castShadow = !this.mobile;
    this.scene.add(this.headlight2);
    this.scene.add(this.headlight2.target);

    const mainLight = new THREE.DirectionalLight(0x446688, 0.8);
    mainLight.position.set(0, 10, -10);
    mainLight.castShadow = !this.mobile;
    this.scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0x223344, 0.5);
    rimLight.position.set(-5, 3, -10);
    this.scene.add(rimLight);
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
    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(TUNNEL_W + 1, SEG_LEN),
      ceilMat,
    );
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
    const ceilNeon = new THREE.Mesh(
      new THREE.BoxGeometry(TUNNEL_W * 0.5, 0.04, 0.1),
      ceilNeonMat,
    );
    ceilNeon.position.set(0, TUNNEL_H - 0.03, 0);
    g.add(ceilNeon);

    const barMat = new THREE.MeshBasicMaterial({ color: 0x442222 });
    for (const side of [-1, 1]) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.4, SEG_LEN),
        barMat,
      );
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
        const dash = new THREE.Mesh(
          new THREE.PlaneGeometry(0.12, 3.0),
          dashMat,
        );
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(lx, 0.01, d + 1.5);
        g.add(dash);
      }
    }

    if (!this.mobile) {
      for (let i = 0; i < 3; i++) {
        const lightZ = (i - 1) * (SEG_LEN / 3);
        const overhead = new THREE.PointLight(0xffeedd, 2.5, 18);
        overhead.position.set(0, TUNNEL_H - 0.5, lightZ);
        g.add(overhead);
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

    const hood = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.1, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x0e1015, roughness: 0.3, metalness: 0.6 }),
    );
    hood.position.set(0, 0.05, -1.6);
    hood.receiveShadow = true;
    g.add(hood);

    const dash = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.35, 0.5),
      bodyMat,
    );
    dash.position.set(0, 0.48, -0.85);
    g.add(dash);

    const dashTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.08, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.4, metalness: 0.3 }),
    );
    dashTop.position.set(0, 0.67, -0.85);
    g.add(dashTop);

    const gaugeMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
    const gaugeRimMat = new THREE.MeshBasicMaterial({ color: 0x333333 });

    for (const gx of [-0.5, 0.5]) {
      const gauge = new THREE.Mesh(
        new THREE.CircleGeometry(0.09, 16),
        gaugeMat,
      );
      gauge.position.set(gx, 0.58, -0.59);
      g.add(gauge);

      const rim = new THREE.Mesh(
        new THREE.RingGeometry(0.085, 0.1, 16),
        gaugeRimMat,
      );
      rim.position.set(gx, 0.58, -0.588);
      g.add(rim);

      const needle = new THREE.Mesh(
        new THREE.PlaneGeometry(0.003, 0.07),
        new THREE.MeshBasicMaterial({ color: 0xff3333 }),
      );
      needle.position.set(gx, 0.6, -0.587);
      needle.rotation.z = -0.3 + Math.random() * 0.6;
      g.add(needle);
    }

    const speedoLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x00ff41 }),
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
      new THREE.MeshBasicMaterial({ color: 0x222238 }),
    );
    hub.rotation.x = 0.5;
    this.wheelGroup.add(hub);

    this.wheelGroup.position.set(0, 0.8, -0.55);
    this.wheelGroup.rotation.x = 0.5;
    g.add(this.wheelGroup);

    for (const side of [-1, 1]) {
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.9, 0.08),
        bodyMat,
      );
      pillar.position.set(side * 1.35, 1.35, -0.5);
      pillar.rotation.z = side * 0.15;
      g.add(pillar);
    }

    const windshieldMat = new THREE.MeshBasicMaterial({
      color: 0x111822,
      transparent: true,
      opacity: 0.15,
    });
    const windshield = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.9),
      windshieldMat,
    );
    windshield.position.set(0, 1.1, -0.85);
    g.add(windshield);

    for (const side of [-1, 1]) {
      const mirrorGroup = new THREE.Group();

      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.04, 0.3),
        bodyMat,
      );
      arm.position.set(0, 0, 0.15);
      mirrorGroup.add(arm);

      const mirrorBack = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.18, 0.04),
        bodyMat,
      );
      mirrorBack.position.set(0, 0, 0.32);
      mirrorGroup.add(mirrorBack);

      const mirrorFace = new THREE.Mesh(
        new THREE.PlaneGeometry(0.22, 0.15),
        new THREE.MeshBasicMaterial({ color: 0x334455 }),
      );
      mirrorFace.position.set(0, 0, 0.34);
      mirrorGroup.add(mirrorFace);

      mirrorGroup.position.set(side * 1.55, 0.85, -0.7);
      mirrorGroup.rotation.y = side * 0.3;
      g.add(mirrorGroup);
    }

    const rearMirror = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.12, 0.03),
      bodyMat,
    );
    rearMirror.position.set(0, 1.7, -0.6);
    g.add(rearMirror);

    const rearGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.28, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x334455 }),
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
    const colors = [
      0xcc2222, 0xcc8800, 0x8833cc, 0x00aa88,
      0xcc5500, 0x1188cc, 0xcccccc, 0x33aa33,
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

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
      const tl = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.18, 0.06),
        tailMat,
      );
      tl.position.set(side, 0.6, 1.85);
      g.add(tl);
    }

    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    for (const side of [-0.65, 0.65]) {
      const hl = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.16, 0.06),
        hlMat,
      );
      hl.position.set(side, 0.5, -2.0);
      g.add(hl);
    }

    const lane = Math.floor(Math.random() * 3);
    g.position.set(LANE_X[lane], 0, -80 - Math.random() * 50);
    this.scene.add(g);
    this.obstacles.push(g);
  }

  update(): void {
    if (!this._started || this._gameOver) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastFrameTime) / 16.67, 3);
    this.lastFrameTime = now;
    const delta = dt / 60;

    if (this._handsDetected >= 2) {
      this._speed = Math.min(this.maxSpeed, this._speed + 0.004 * dt);
      this.score += this._speed * 2 * dt;
      this.raceTime += delta;
    } else {
      this._speed = Math.max(0.05, this._speed - 0.007 * dt);
    }

    if (this.raceTime >= RACE_DURATION) {
      this._gameOver = true;
    }

    this.position = Math.max(
      1,
      Math.min(
        this.totalCars,
        Math.floor((this.obstacles.length / 6) * (this.totalCars - 1)) + 2,
      ),
    );

    const rawSteer = (this.centerX - 0.5) * 2 * this.sensitivity;
    const deadZone = 0.02;
    let steerInput = Math.abs(rawSteer) < deadZone ? 0 : (rawSteer > 0 ? (rawSteer - deadZone) / (1 - deadZone) : (rawSteer + deadZone) / (1 - deadZone));
    steerInput = Math.sign(steerInput) * Math.pow(Math.abs(steerInput), 0.85);
    const targetX = steerInput * 5;
    this.cameraX = this.smoothSteer.update(targetX);
    this.cameraX = Math.max(-4, Math.min(4, this.cameraX));

    this._justCollided = false;
    if (this.shakeIntensity > 0.01) {
      this.shakeIntensity *= 0.9;
    } else {
      this.shakeIntensity = 0;
    }

    const shakeX = (Math.random() - 0.5) * this.shakeIntensity * 0.8;
    const shakeY = (Math.random() - 0.5) * this.shakeIntensity * 0.5;
    const rollExtra = (Math.random() - 0.5) * this.shakeIntensity * 0.04;

    this.camera.position.x = this.cameraX + shakeX;
    this.camera.position.y = CAM_Y + shakeY;
    this.camera.rotation.z = this.cameraX * -0.025 + rollExtra;

    const fovBoost = this._speed * 2.5;
    this.camera.fov = this.baseFov + fovBoost;
    this.camera.updateProjectionMatrix();

    const wheelTargetRot = -this.cameraX * 0.18;
    this.wheelAngle += (wheelTargetRot - this.wheelAngle) * 0.12;
    this.wheelGroup.rotation.z = this.wheelAngle;

    this.cockpitGroup.position.x = this.cameraX;

    this.headlight1.target.position.set(this.cameraX - 1.5, 0, -20);
    this.headlight2.target.position.set(this.cameraX + 1.5, 0, -20);

    const moveAmount = this._speed * dt;
    for (const seg of this.segments) {
      seg.position.z += moveAmount;
      if (seg.position.z > SEG_LEN) {
        seg.position.z -= NUM_SEG * SEG_LEN;
      }
    }

    this.spawnTimer += dt;
    const interval = Math.max(18, this.spawnInterval - this._speed * 30);
    if (this.spawnTimer >= interval && this._handsDetected >= 2 && this.raceTime > 3) {
      this.spawnTimer = 0;
      this.spawnCar();
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const car = this.obstacles[i];
      car.position.z += moveAmount;

      if (car.position.z > 12) {
        this.scene.remove(car);
        this.obstacles.splice(i, 1);
        continue;
      }

      const dx = Math.abs(this.cameraX - car.position.x);
      const dz = Math.abs(car.position.z);
      if (dx < 1.5 && dz < 2.5) {
        this._gameOver = true;
        this._justCollided = true;
        this.shakeIntensity = 2.8;
        this.camera.fov = this.baseFov + 12;
        this.camera.updateProjectionMatrix();
      }
    }

    this.updateParticles(dt);
    this.updateMirror();
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  resize(w: number, h: number): void {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
