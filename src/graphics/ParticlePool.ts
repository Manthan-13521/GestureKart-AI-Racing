import * as THREE from 'three';

/**
 * ParticlePool — GPU-driven, zero-allocation particle system.
 *
 * All particles live in a single pre-allocated Float32Array (position buffer)
 * and a matching metadata array. No objects are created or destroyed at
 * runtime — particles are recycled from the pool by resetting their state,
 * eliminating GC pressure entirely.
 *
 * Supports two logical layers:
 *   - TRAIL:  speed-streak particles spawned behind the car
 *   - SPARKS: bright collision burst particles
 *   - FOG:    slow-drifting atmospheric particles
 */

export type ParticleLayer = 'trail' | 'sparks' | 'fog';

interface ParticleMeta {
  life: number; // seconds remaining
  maxLife: number; // initial lifetime
  vx: number; // velocity x (world units/s)
  vy: number; // velocity y
  vz: number; // velocity z
  layer: ParticleLayer;
  active: boolean;
}

const POOL_SIZE = 512;

export class ParticlePool {
  private points: THREE.Points;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private meta: ParticleMeta[];
  private scene: THREE.Scene;

  // Layer spawn throttles
  private trailTimer = 0;
  private fogTimer = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.positions = new Float32Array(POOL_SIZE * 3);
    this.colors = new Float32Array(POOL_SIZE * 3);
    this.sizes = new Float32Array(POOL_SIZE);

    this.meta = Array.from({ length: POOL_SIZE }, () => ({
      life: 0,
      maxLife: 1,
      vx: 0,
      vy: 0,
      vz: 0,
      layer: 'trail' as ParticleLayer,
      active: false,
    }));

    // Park all particles far off-screen initially
    for (let i = 0; i < POOL_SIZE; i++) {
      this.positions[i * 3 + 2] = 9999;
      this.sizes[i] = 0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
          vAlpha = size / 8.0;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          float alpha = (1.0 - d * 2.0) * vAlpha;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    this.points = new THREE.Points(geo, mat);
    this.scene.add(this.points);
  }

  /** Allocate a free particle slot. Returns index or -1 if pool is full. */
  private allocate(): number {
    for (let i = 0; i < POOL_SIZE; i++) {
      if (!this.meta[i].active) return i;
    }
    // Pool full — evict the oldest trail particle
    let oldest = 0;
    let lowestLife = Infinity;
    for (let i = 0; i < POOL_SIZE; i++) {
      if (this.meta[i].layer === 'trail' && this.meta[i].life < lowestLife) {
        lowestLife = this.meta[i].life;
        oldest = i;
      }
    }
    return oldest;
  }

  private emit(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    r: number,
    g: number,
    b: number,
    life: number,
    size: number,
    layer: ParticleLayer
  ): void {
    const i = this.allocate();
    const m = this.meta[i];
    m.active = true;
    m.life = life;
    m.maxLife = life;
    m.vx = vx;
    m.vy = vy;
    m.vz = vz;
    m.layer = layer;

    this.positions[i * 3] = x;
    this.positions[i * 3 + 1] = y;
    this.positions[i * 3 + 2] = z;
    this.colors[i * 3] = r;
    this.colors[i * 3 + 1] = g;
    this.colors[i * 3 + 2] = b;
    this.sizes[i] = size;
  }

  /**
   * Emit a burst of spark particles (collision feedback).
   * @param camX Player camera X position.
   */
  public emitSparks(camX: number): void {
    const count = 24;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.emit(
        camX + (Math.random() - 0.5) * 2,
        0.5 + Math.random(),
        -2,
        Math.cos(angle) * speed * 0.4,
        Math.sin(angle) * speed * 0.5 + 1,
        speed,
        1.0,
        0.5 + Math.random() * 0.5,
        0.0, // orange-yellow
        0.4 + Math.random() * 0.3,
        4 + Math.random() * 6,
        'sparks'
      );
    }
  }

  /**
   * Tick the pool each frame.
   * @param dt Delta time in seconds.
   * @param speed Normalised speed (0–3).
   * @param camX Camera X for trail origin.
   * @param moveAmount World scroll amount this frame.
   */
  public update(dt: number, speed: number, camX: number, moveAmount: number): void {
    // Spawn trail particles when moving fast enough
    this.trailTimer += dt;
    const trailInterval = speed > 0.3 ? Math.max(0.01, 0.08 - speed * 0.02) : 1;
    if (this.trailTimer >= trailInterval && speed > 0.3) {
      this.trailTimer = 0;
      const intensity = Math.min(1, (speed - 0.3) / 2.5);
      const count = Math.floor(intensity * 4) + 1;
      for (let i = 0; i < count; i++) {
        const side = (Math.random() > 0.5 ? 1 : -1) * 0.8;
        this.emit(
          camX + side + (Math.random() - 0.5) * 0.5,
          0.1 + Math.random() * 0.15,
          -0.5,
          (Math.random() - 0.5) * 0.3,
          Math.random() * 0.2,
          speed * 2,
          0.45 + intensity * 0.35,
          0.55 + intensity * 0.25,
          0.75 + intensity * 0.25,
          0.15 + Math.random() * 0.2,
          2 + intensity * 5,
          'trail'
        );
      }
    }

    // Spawn atmospheric fog particles
    this.fogTimer += dt;
    if (this.fogTimer >= 0.3) {
      this.fogTimer = 0;
      this.emit(
        (Math.random() - 0.5) * 12,
        Math.random() * 3,
        -60 - Math.random() * 40,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.1,
        0,
        0.5,
        0.55,
        0.65,
        3 + Math.random() * 4,
        6 + Math.random() * 8,
        'fog'
      );
    }

    // Update all active particles
    const geo = this.points.geometry;
    for (let i = 0; i < POOL_SIZE; i++) {
      const m = this.meta[i];
      if (!m.active) continue;

      m.life -= dt;
      if (m.life <= 0) {
        m.active = false;
        this.positions[i * 3 + 2] = 9999;
        this.sizes[i] = 0;
        continue;
      }

      const t = m.life / m.maxLife; // 1→0 over lifetime

      // Apply velocity
      this.positions[i * 3] += m.vx * dt;
      this.positions[i * 3 + 1] += m.vy * dt;
      this.positions[i * 3 + 2] += m.vz * dt;

      // Scroll with world (trail + fog move with the road)
      if (m.layer !== 'sparks') {
        this.positions[i * 3 + 2] += moveAmount;
      }

      // Fade size out
      const baseSize = m.layer === 'fog' ? 10 : m.layer === 'sparks' ? 7 : 5;
      this.sizes[i] = baseSize * t;

      // Fade colour brightness
      this.colors[i * 3] *= 0.998;
      this.colors[i * 3 + 1] *= 0.998;
      this.colors[i * 3 + 2] *= 0.998;
    }

    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    geo.attributes.size.needsUpdate = true;
  }

  public dispose(): void {
    this.scene.remove(this.points);
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}
