import * as THREE from 'three';

export type WeatherKind = 'clear' | 'rain' | 'storm' | 'fog';

interface WeatherConfig {
  fogNear: number;
  fogFar: number;
  fogColor: THREE.Color;
  rainIntensity: number; // 0–1
  ambientIntensity: number;
  ambientColor: THREE.Color;
}

const PRESETS: Record<WeatherKind, WeatherConfig> = {
  clear: {
    fogNear: 60,
    fogFar: 220,
    fogColor: new THREE.Color(0x0a0c14),
    rainIntensity: 0,
    ambientIntensity: 0.6,
    ambientColor: new THREE.Color(0x1a2030),
  },
  fog: {
    fogNear: 18,
    fogFar: 80,
    fogColor: new THREE.Color(0x1a1f2e),
    rainIntensity: 0,
    ambientIntensity: 0.4,
    ambientColor: new THREE.Color(0x1a2535),
  },
  rain: {
    fogNear: 30,
    fogFar: 110,
    fogColor: new THREE.Color(0x0d1018),
    rainIntensity: 0.55,
    ambientIntensity: 0.35,
    ambientColor: new THREE.Color(0x141c28),
  },
  storm: {
    fogNear: 15,
    fogFar: 60,
    fogColor: new THREE.Color(0x080c14),
    rainIntensity: 1.0,
    ambientIntensity: 0.25,
    ambientColor: new THREE.Color(0x0e1420),
  },
};

const RAIN_COUNT = 600;

/**
 * WeatherSystem — dynamic weather with smooth transitions.
 *
 * Manages:
 *  - THREE.Fog (exponential-linear blend)
 *  - Ambient / hemisphere light intensity
 *  - Rain streaks (pooled geometry, no per-frame allocations)
 *  - Automatic weather cycling with configurable intervals
 */
export class WeatherSystem {
  private scene: THREE.Scene;
  private ambient: THREE.AmbientLight;
  private current: WeatherConfig;
  private target: WeatherConfig;
  private lerpT = 1; // 0 → 1 during transition
  private transitionSpeed = 0.3; // units/second

  // Rain
  private rainPositions!: Float32Array;
  private rainPoints!: THREE.Points;
  private rainActive = false;

  // Auto-cycle
  private cycleTimer = 0;
  private cycleInterval = 45; // seconds before random weather change
  private currentKind: WeatherKind = 'clear';

  /** Quality-tier gate: when false, rain layers are hidden and cycling pauses (GDD §11.2). */
  public enabled = true;

  constructor(scene: THREE.Scene, ambient: THREE.AmbientLight) {
    this.scene = scene;
    this.ambient = ambient;
    this.current = { ...PRESETS.clear };
    this.target = { ...PRESETS.clear };

    this.setupFog();
    this.setupRain();
    this.applyImmediate(PRESETS.clear);
  }

  private setupFog(): void {
    this.scene.fog = new THREE.Fog(PRESETS.clear.fogColor, PRESETS.clear.fogNear, PRESETS.clear.fogFar);
  }

  private setupRain(): void {
    const pos = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = Math.random() * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    this.rainPositions = pos;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.ShaderMaterial({
      uniforms: { intensity: { value: 0 } },
      vertexShader: `
        uniform float intensity;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 1.5;
        }
      `,
      fragmentShader: `
        uniform float intensity;
        void main() {
          gl_FragColor = vec4(0.6, 0.7, 0.9, intensity * 0.55);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.rainPoints = new THREE.Points(geo, mat);
    this.rainPoints.visible = false;
    this.scene.add(this.rainPoints);
  }

  /** Immediately snap to a weather preset (no transition). */
  private applyImmediate(cfg: WeatherConfig): void {
    const fog = this.scene.fog as THREE.Fog;
    if (fog) {
      fog.color.copy(cfg.fogColor);
      fog.near = cfg.fogNear;
      fog.far = cfg.fogFar;
    }
    this.ambient.intensity = cfg.ambientIntensity;
    this.ambient.color.copy(cfg.ambientColor);
  }

  /** Transition to a new weather kind. */
  public setWeather(kind: WeatherKind): void {
    if (kind === this.currentKind) return;
    this.currentKind = kind;
    this.current = { ...this.lerped() }; // snapshot current interpolated state
    this.target = { ...PRESETS[kind] };
    this.lerpT = 0;
  }

  private lerped(): WeatherConfig {
    const t = this.lerpT;
    return {
      fogNear: this.current.fogNear + (this.target.fogNear - this.current.fogNear) * t,
      fogFar: this.current.fogFar + (this.target.fogFar - this.current.fogFar) * t,
      fogColor: this.current.fogColor.clone().lerp(this.target.fogColor, t),
      rainIntensity:
        this.current.rainIntensity + (this.target.rainIntensity - this.current.rainIntensity) * t,
      ambientIntensity:
        this.current.ambientIntensity + (this.target.ambientIntensity - this.current.ambientIntensity) * t,
      ambientColor: this.current.ambientColor.clone().lerp(this.target.ambientColor, t),
    };
  }

  /**
   * @param dt Delta time in seconds.
   * @param speed Normalised speed (0–3).
   * @param moveAmount World-scroll amount this frame.
   */
  public update(dt: number, speed: number, moveAmount: number): void {
    // Advance transition
    if (this.lerpT < 1) {
      this.lerpT = Math.min(1, this.lerpT + dt * this.transitionSpeed);
    }

    const cfg = this.lerped();

    const fog = this.scene.fog as THREE.Fog;
    if (fog) {
      fog.color.copy(cfg.fogColor);
      fog.near = cfg.fogNear;
      fog.far = cfg.fogFar;
    }
    this.ambient.intensity = cfg.ambientIntensity;
    this.ambient.color.copy(cfg.ambientColor);

    // Rain update
    const rainMat = this.rainPoints.material as THREE.ShaderMaterial;
    if (cfg.rainIntensity > 0.01 && this.enabled) {
      this.rainPoints.visible = true;
      rainMat.uniforms.intensity.value = cfg.rainIntensity;

      const pos = this.rainPositions;
      const fallSpeed = 8 + speed * 3;
      for (let i = 0; i < RAIN_COUNT; i++) {
        pos[i * 3 + 1] -= fallSpeed * dt;
        pos[i * 3 + 2] += moveAmount * 0.6;

        if (pos[i * 3 + 1] < -0.5) {
          pos[i * 3 + 1] = 8 + Math.random() * 4;
          pos[i * 3] = (Math.random() - 0.5) * 24;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
        }
        if (Math.abs(pos[i * 3 + 2]) > 20) {
          pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
        }
      }
      this.rainPoints.geometry.attributes.position.needsUpdate = true;
    } else {
      this.rainPoints.visible = false;
    }

    // Auto weather cycle
    if (this.enabled) {
      this.cycleTimer += dt;
      if (this.cycleTimer >= this.cycleInterval) {
        this.cycleTimer = 0;
        this.pickNextWeather();
      }
    }
  }

  private pickNextWeather(): void {
    const options: WeatherKind[] = ['clear', 'clear', 'fog', 'rain', 'storm'];
    const next = options[Math.floor(Math.random() * options.length)];
    this.setWeather(next);
  }

  public getCurrentKind(): WeatherKind {
    return this.currentKind;
  }

  public dispose(): void {
    this.scene.remove(this.rainPoints);
    this.rainPoints.geometry.dispose();
    (this.rainPoints.material as THREE.Material).dispose();
    this.scene.fog = null;
  }
}
