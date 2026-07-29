import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
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
  private composer!: EffectComposer;
  private bloomPass!: UnrealBloomPass;

  private segments: THREE.Group[] = [];
  private obstacles: THREE.Group[] = [];

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

  private headlight1!: THREE.PointLight;
  private headlight2!: THREE.PointLight;

  private handSkeleton: Landmark[] = [];
  private cockpitGroup: THREE.Group;
  private wheelGroup!: THREE.Group;
  private wheelAngle = 0;

  private particles!: THREE.Points;
  private particlePositions!: Float32Array;

  private baseFov = FOV;

  constructor(private canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080a0e);
    this.scene.fog = new THREE.Fog(0x080a0e, 50, 250);

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(FOV, w / h, 0.1, 300);
    this.camera.position.set(0, CAM_Y, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.4;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.setupComposer(w, h);
    this.setupLights();
    this.buildRoad();
    this.buildSegments();
    this.cockpitGroup = this.buildCockpit();
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

  private setupComposer(w: number, h: number): void {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(w, h),
      0.2, 0.5, 0.1,
    );
    this.composer.addPass(this.bloomPass);
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0x6688aa, 1.0);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x88aacc, 0x445566, 0.6);
    this.scene.add(hemi);

    this.headlight1 = new THREE.PointLight(0xffeedd, 15, 100);
    this.headlight1.position.set(-2, 2.5, -7);
    this.headlight1.castShadow = true;
    this.scene.add(this.headlight1);

    this.headlight2 = new THREE.PointLight(0xffeedd, 15, 100);
    this.headlight2.position.set(2, 2.5, -7);
    this.headlight2.castShadow = true;
    this.scene.add(this.headlight2);

    const spot = new THREE.SpotLight(0xffffff, 5, 150, Math.PI / 5, 0.4);
    spot.position.set(0, 8, 8);
    spot.target.position.set(0, 0, -40);
    spot.castShadow = true;
    this.scene.add(spot);
    this.scene.add(spot.target);

    const fill = new THREE.PointLight(0x4488cc, 6, 60);
    fill.position.set(0, 4, -20);
    this.scene.add(fill);

    const rimLight = new THREE.DirectionalLight(0x4488ff, 1.5);
    rimLight.position.set(10, 5, -20);
    this.scene.add(rimLight);
  }

  private buildRoad(): void {
    const geo = new THREE.PlaneGeometry(ROAD_W, 600);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      roughness: 0.2,
      metalness: 0.35,
    });
    const road = new THREE.Mesh(geo, mat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, -0.02, -300);
    road.receiveShadow = true;
    this.scene.add(road);
  }

  private buildSeg(z: number): THREE.Group {
    const g = new THREE.Group();
    g.position.z = z;

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x3a3e45,
      roughness: 0.6,
      metalness: 0.2,
    });
    const wallGeo = new THREE.BoxGeometry(0.6, TUNNEL_H, SEG_LEN);

    const lw = new THREE.Mesh(wallGeo, wallMat);
    lw.position.set(-TUNNEL_W / 2 - 0.3, TUNNEL_H / 2, 0);
    lw.castShadow = true;
    lw.receiveShadow = true;
    g.add(lw);

    const rw = new THREE.Mesh(wallGeo, wallMat);
    rw.position.set(TUNNEL_W / 2 + 0.3, TUNNEL_H / 2, 0);
    rw.castShadow = true;
    rw.receiveShadow = true;
    g.add(rw);

    const ceilMat = new THREE.MeshStandardMaterial({
      color: 0x2e3238,
      roughness: 0.5,
      metalness: 0.15,
    });
    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(TUNNEL_W + 1.2, SEG_LEN),
      ceilMat,
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, TUNNEL_H, 0);
    ceil.receiveShadow = true;
    g.add(ceil);

    const neonMat = new THREE.MeshBasicMaterial({ color: 0xff1a1a });
    const neonGeo = new THREE.BoxGeometry(0.08, 0.12, SEG_LEN);
    for (const side of [-1, 1]) {
      const neon = new THREE.Mesh(neonGeo, neonMat);
      neon.position.set(side * (TUNNEL_W / 2 + 0.05), 1.2, 0);
      g.add(neon);
    }

    const ceilNeonMat = new THREE.MeshBasicMaterial({ color: 0x00aaff });
    const ceilNeon = new THREE.Mesh(
      new THREE.BoxGeometry(TUNNEL_W * 0.6, 0.06, 0.15),
      ceilNeonMat,
    );
    ceilNeon.position.set(0, TUNNEL_H - 0.04, 0);
    g.add(ceilNeon);

    const barMat = new THREE.MeshStandardMaterial({
      color: 0x882222,
      roughness: 0.5,
      emissive: 0x440000,
      emissiveIntensity: 0.5,
    });
    for (const side of [-1, 1]) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.5, SEG_LEN),
        barMat,
      );
      bar.position.set(side * (ROAD_W / 2 + 0.5), 0.25, 0);
      bar.receiveShadow = true;
      g.add(bar);
    }

    const lMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });
    const lGeo = new THREE.BoxGeometry(0.6, 0.08, 14);
    const l1 = new THREE.Mesh(lGeo, lMat);
    l1.position.set(-2.5, TUNNEL_H - 0.04, 0);
    g.add(l1);
    const l2 = new THREE.Mesh(lGeo, lMat);
    l2.position.set(2.5, TUNNEL_H - 0.04, 0);
    g.add(l2);

    const arrowMat = new THREE.MeshBasicMaterial({
      color: 0xff3333,
      transparent: true,
      opacity: 0.5,
    });
    for (const side of [-1, 1]) {
      for (let dz = -8; dz <= 8; dz += 8) {
        const arrow = new THREE.Mesh(
          new THREE.PlaneGeometry(0.6, 0.6),
          arrowMat,
        );
        arrow.position.set(
          side * (TUNNEL_W / 2 + 0.35),
          1.5,
          dz,
        );
        arrow.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        g.add(arrow);
      }
    }

    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.2,
    });
    const edgeGeo = new THREE.PlaneGeometry(0.15, SEG_LEN);
    for (const ex of [-ROAD_W / 2, ROAD_W / 2]) {
      const e = new THREE.Mesh(edgeGeo, edgeMat);
      e.rotation.x = -Math.PI / 2;
      e.position.set(ex, 0.02, 0);
      e.receiveShadow = true;
      g.add(e);
    }

    const dashMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      emissive: 0xeeeeee,
      emissiveIntensity: 0.15,
    });
    for (let lane = 0; lane < 2; lane++) {
      const lx = LANE_X[lane] + 1.65;
      for (let d = -SEG_LEN / 2; d < SEG_LEN / 2; d += 7) {
        const dash = new THREE.Mesh(
          new THREE.PlaneGeometry(0.14, 3.5),
          dashMat,
        );
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(lx, 0.02, d + 1.75);
        dash.receiveShadow = true;
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

    const hoodMat = new THREE.MeshStandardMaterial({
      color: 0x141a24,
      roughness: 0.25,
      metalness: 0.8,
    });
    const hood = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.12, 2.0),
      hoodMat,
    );
    hood.position.set(0, 0.06, -1.5);
    hood.receiveShadow = true;
    g.add(hood);

    const dashMat = new THREE.MeshStandardMaterial({
      color: 0x0a0e14,
      roughness: 0.5,
      metalness: 0.3,
    });
    const dash = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.3, 0.4),
      dashMat,
    );
    dash.position.set(0, 0.5, -0.9);
    g.add(dash);

    const screenMat = new THREE.MeshBasicMaterial({ color: 0x00ff41 });
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 0.15),
      screenMat,
    );
    screen.position.set(0, 0.6, -0.68);
    g.add(screen);

    this.wheelGroup = new THREE.Group();

    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x0e0e16,
      roughness: 0.3,
      metalness: 0.7,
    });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 14, 28), wheelMat);
    rim.rotation.x = 0.5;
    this.wheelGroup.add(rim);

    const spokeMat = new THREE.MeshStandardMaterial({
      color: 0x18182a,
      roughness: 0.35,
      metalness: 0.6,
    });
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.55), spokeMat);
      spoke.position.set(Math.sin(angle) * 0.15, Math.cos(angle) * 0.15, 0);
      spoke.rotation.z = angle;
      this.wheelGroup.add(spoke);
    }

    const hubMat = new THREE.MeshStandardMaterial({
      color: 0x222238,
      roughness: 0.3,
      metalness: 0.5,
    });
    const hub = new THREE.Mesh(new THREE.CircleGeometry(0.08, 12), hubMat);
    hub.rotation.x = 0.5;
    this.wheelGroup.add(hub);

    this.wheelGroup.position.set(0, 0.8, -0.6);
    this.wheelGroup.rotation.x = 0.5;
    g.add(this.wheelGroup);

    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x080a10,
      roughness: 0.3,
      metalness: 0.6,
    });
    for (const side of [-1, 1]) {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.8, 0.1),
        pillarMat,
      );
      p.position.set(side * 1.3, 1.3, -0.5);
      g.add(p);
    }

    this.scene.add(g);
    return g;
  }

  private setupParticles(): void {
    const count = 250;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = Math.random() * 5;
      positions[i * 3 + 2] = -Math.random() * 250;
      sizes[i] = 0.04 + Math.random() * 0.1;
    }
    this.particlePositions = positions;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xaaccff,
      size: 0.12,
      transparent: true,
      opacity: 0.35,
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
      if (pos[i * 3 + 2] > 15) {
        pos[i * 3] = (Math.random() - 0.5) * 24;
        pos[i * 3 + 1] = Math.random() * 5;
        pos[i * 3 + 2] = -Math.random() * 250;
        pos[i * 3] += this.smoothSteer.getValue() * 2;
      }
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  private spawnCar(): void {
    const g = new THREE.Group();
    const colors = [
      0xff2222, 0xffaa00, 0xaa44ff, 0x00ddaa,
      0xff6600, 0x2299ff, 0xffffff, 0x44dd44,
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.25,
      metalness: 0.5,
      emissive: color,
      emissiveIntensity: 0.3,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 4.0), bodyMat);
    body.position.y = 0.55;
    body.position.z = -0.1;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x0e0e1e,
      roughness: 0.2,
      metalness: 0.6,
    });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 1.8), cabinMat);
    cabin.position.set(0, 1.3, 0.4);
    cabin.castShadow = true;
    g.add(cabin);

    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
    for (const side of [-0.7, 0.7]) {
      const tl = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.22, 0.08),
        tailMat,
      );
      tl.position.set(side, 0.65, 2.02);
      g.add(tl);
    }
    const tailGlow = new THREE.PointLight(0xff2200, 3, 12);
    tailGlow.position.set(0, 0.65, 2.2);
    g.add(tailGlow);

    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    for (const side of [-0.7, 0.7]) {
      const hl = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.2, 0.08),
        hlMat,
      );
      hl.position.set(side, 0.55, -2.02);
      g.add(hl);
    }
    const hlGlow = new THREE.PointLight(0xffffdd, 5, 25);
    hlGlow.position.set(0, 0.55, -2.3);
    g.add(hlGlow);

    const underGlow = new THREE.PointLight(color, 2, 8);
    underGlow.position.set(0, 0.1, 0);
    g.add(underGlow);

    const lane = Math.floor(Math.random() * 3);
    g.position.set(LANE_X[lane], 0, -100 - Math.random() * 60);
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

    this.headlight1.position.x = this.cameraX - 2.5;
    this.headlight2.position.x = this.cameraX + 2.5;

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

      if (car.position.z > 15) {
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

    if (this.bloomPass) {
      const targetBloom = 0.12 + this._speed * 0.08;
      this.bloomPass.strength += (targetBloom - this.bloomPass.strength) * 0.05;
    }
  }

  render(): void {
    this.composer.render();
  }

  resize(w: number, h: number): void {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }
}
