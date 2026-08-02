import * as THREE from 'three';
import type { ResourceManager } from './ResourceManager';

export interface SceneOptions {
  mobile: boolean;
  fov: number;
  camY: number;
}

export class SceneManager {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly mobile: boolean;
  private resources: ResourceManager;

  constructor(canvas: HTMLCanvasElement, options: SceneOptions, resources: ResourceManager) {
    this.mobile = options.mobile;
    this.resources = resources;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050709);
    this.scene.fog = new THREE.Fog(0x050709, 40, 200);

    const w = canvas.clientWidth || 800;
    const h = canvas.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(options.fov, w / h, 0.1, 300);
    this.camera.position.set(0, options.camY, 0);

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

    resources.trackDisposable(this.renderer);
  }

  resize(w: number, h: number): void {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  dispose(): void {
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) {
        for (const m of material) m.dispose();
      } else if (material) {
        material.dispose();
      }
    });
    this.resources.disposeAll();
  }
}
