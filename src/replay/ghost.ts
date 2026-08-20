import * as THREE from 'three';

const GHOST_LEAD = 16;
const TRAIL_LEN = 40;
const TRAIL_GAP = 0.35;
const BODY = 0x22e6ff;
const EDGE = 0x8af4ff;

/**
 * Holographic ghost car. Purely visual — never collides, never touches
 * physics. Built once, updated per frame with reused buffers (zero
 * per-frame allocation), disposed with the scene.
 */
export class GhostRenderer {
  private readonly scene: THREE.Scene;
  private readonly group = new THREE.Group();
  private bodyMat!: THREE.MeshBasicMaterial;
  private cabinMat!: THREE.MeshBasicMaterial;
  private edgeMat!: THREE.LineBasicMaterial;
  private glowMat!: THREE.SpriteMaterial;
  private trailMat!: THREE.LineBasicMaterial;
  private trailGeo!: THREE.BufferGeometry;
  private trailPositions!: Float32Array;
  private trailX = new Float32Array(TRAIL_LEN);
  private trailZ = new Float32Array(TRAIL_LEN);
  private trailHead = 0;
  private trailCount = 0;
  private built = false;
  private lastX = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  get visible(): boolean {
    return this.group.visible;
  }

  set visible(v: boolean) {
    this.group.visible = v;
  }

  build(): void {
    if (this.built) return;
    this.built = true;

    this.bodyMat = new THREE.MeshBasicMaterial({
      color: BODY,
      transparent: true,
      opacity: 0.36,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.cabinMat = new THREE.MeshBasicMaterial({
      color: BODY,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const bodyGeo = new THREE.BoxGeometry(1.8, 0.85, 3.8);
    const body = new THREE.Mesh(bodyGeo, this.bodyMat);
    body.position.y = 0.5;
    this.group.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 1.6), this.cabinMat);
    cabin.position.set(0, 1.2, 0.3);
    this.group.add(cabin);

    this.edgeMat = new THREE.LineBasicMaterial({
      color: EDGE,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(bodyGeo), this.edgeMat);
    edges.position.y = 0.5;
    this.group.add(edges);

    this.glowMat = new THREE.SpriteMaterial({
      color: BODY,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 64;
    glowCanvas.height = 64;
    const ctx = glowCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
      grad.addColorStop(0, 'rgba(90, 235, 255, 0.9)');
      grad.addColorStop(0.4, 'rgba(34, 230, 255, 0.35)');
      grad.addColorStop(1, 'rgba(34, 230, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const glowTexture = new THREE.CanvasTexture(glowCanvas);
    this.glowMat.map = glowTexture;
    const glow = new THREE.Sprite(this.glowMat);
    glow.scale.set(7, 7, 1);
    glow.position.y = 1.1;
    glow.renderOrder = 3;
    this.group.add(glow);

    this.trailPositions = new Float32Array(TRAIL_LEN * 3);
    this.trailGeo = new THREE.BufferGeometry();
    this.trailGeo.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    this.trailMat = new THREE.LineBasicMaterial({
      color: BODY,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const trail = new THREE.Line(this.trailGeo, this.trailMat);
    trail.renderOrder = 2;
    this.group.add(trail);

    this.group.traverse((o) => {
      o.renderOrder = Math.max(o.renderOrder, 2);
    });
    this.group.position.set(0, 0.3, -GHOST_LEAD);
    this.scene.add(this.group);
    this.group.visible = false;
  }

  /**
   * Positions the ghost at the world offset `z` relative to the player and
   * records the trail. `dt` drives the holographic shimmer.
   */
  update(dt: number, x: number, z: number, speed: number, time: number): void {
    if (!this.built) return;
    this.group.visible = true;

    this.group.position.x = THREE.MathUtils.clamp(x, -4, 4);
    this.group.position.z = Math.min(-6, z);

    const dx = x - this.lastX;
    this.lastX = x;
    const tilt = THREE.MathUtils.clamp(-dx * 2.2, -0.5, 0.5);
    this.group.rotation.z += (tilt - this.group.rotation.z) * Math.min(1, dt * 10);

    const pulse = 0.34 + 0.08 * Math.sin(time * 2.4);
    const speedGlow = 0.16 * Math.min(1, speed * 0.35);
    this.bodyMat.opacity = pulse;
    this.cabinMat.opacity = pulse + 0.14;
    this.edgeMat.opacity = 0.8 + 0.15 * Math.sin(time * 2.4 + 1.3);
    this.glowMat.opacity = 0.24 + speedGlow;
    this.trailMat.opacity = 0.26 + speedGlow;

    this.trailX[this.trailHead] = this.group.position.x;
    this.trailZ[this.trailHead] = this.group.position.z;
    this.trailHead = (this.trailHead + 1) % TRAIL_LEN;
    this.trailCount = Math.min(this.trailCount + 1, TRAIL_LEN);

    const pos = this.trailPositions;
    for (let i = 0; i < this.trailCount; i++) {
      const idx = (this.trailHead + TRAIL_LEN - 1 - i + TRAIL_LEN) % TRAIL_LEN;
      const back = i * TRAIL_GAP;
      pos[i * 3] = this.trailX[idx];
      pos[i * 3 + 1] = 0.3;
      pos[i * 3 + 2] = this.group.position.z + back;
    }
    for (let i = this.trailCount * 3; i < pos.length; i++) {
      pos[i] = 0;
    }
    this.trailGeo.setDrawRange(0, this.trailCount);
    this.trailGeo.attributes.position.needsUpdate = true;
  }

  /** Ghost fades out where it stopped instead of vanishing. */
  fadeOut(duration = 0.9): void {
    if (!this.built) return;
    const start = performance.now();
    const step = (): void => {
      if (!this.built) return;
      const f = Math.min(1, (performance.now() - start) / (duration * 1000));
      const alpha = Math.max(0, 1 - f);
      this.bodyMat.opacity *= alpha;
      this.cabinMat.opacity *= alpha;
      this.edgeMat.opacity *= alpha;
      this.glowMat.opacity *= alpha;
      this.trailMat.opacity *= alpha;
      if (f < 1) requestAnimationFrame(step);
      else this.visible = false;
    };
    requestAnimationFrame(step);
  }

  dispose(): void {
    if (!this.built) return;
    this.scene.remove(this.group);
    this.group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) {
        for (const m of material) m.dispose();
      } else if (material) {
        material.dispose();
      }
    });
    this.built = false;
  }
}
