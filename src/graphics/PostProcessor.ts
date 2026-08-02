import * as THREE from 'three';

/**
 * PostProcessor — screen-space bloom pass using a render-to-texture pipeline.
 *
 * Pipeline:
 *   1. Render scene → offscreen render target (sceneRT)
 *   2. Threshold pass: extract bright pixels → brightRT
 *   3. Blur pass (separable Gaussian): brightRT → blurHRT → blurVRT
 *   4. Composite: sceneRT + blurVRT (additive blend) → screen
 *
 * All geometry is a single full-screen triangle (no quad, saves 2 vertices).
 */
export class PostProcessor {
  private renderer: THREE.WebGLRenderer;
  private width: number;
  private height: number;

  // Render targets
  private sceneRT: THREE.WebGLRenderTarget;
  private brightRT: THREE.WebGLRenderTarget;
  private blurHRT: THREE.WebGLRenderTarget;
  private blurVRT: THREE.WebGLRenderTarget;

  // Full-screen triangle
  private fsTriGeo: THREE.BufferGeometry;

  // Pass materials
  private thresholdMat: THREE.ShaderMaterial;
  private blurHMat: THREE.ShaderMaterial;
  private blurVMat: THREE.ShaderMaterial;
  private compositeMat: THREE.ShaderMaterial;

  // Orthographic camera + scene for passes
  private fsCamera: THREE.OrthographicCamera;
  private fsScene: THREE.Scene;
  private fsMesh: THREE.Mesh;

  // Strength 0–1
  public bloomStrength = 0.55;
  public bloomThreshold = 0.62;
  public enabled = true;

  // Photo Mode Filters
  public contrast = 1.0;
  public grain = 0.0;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.renderer = renderer;
    this.width = width;
    this.height = height;

    const rtOpts: THREE.RenderTargetOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
    };

    this.sceneRT = new THREE.WebGLRenderTarget(width, height, rtOpts);
    this.brightRT = new THREE.WebGLRenderTarget(width >> 1, height >> 1, rtOpts);
    this.blurHRT = new THREE.WebGLRenderTarget(width >> 1, height >> 1, rtOpts);
    this.blurVRT = new THREE.WebGLRenderTarget(width >> 1, height >> 1, rtOpts);

    this.fsCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.fsScene = new THREE.Scene();

    // Full-screen triangle (covers NDC -1..1 with one triangle instead of two)
    this.fsTriGeo = new THREE.BufferGeometry();
    const verts = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]);
    const uvs = new Float32Array([0, 0, 2, 0, 0, 2]);
    this.fsTriGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    this.fsTriGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    // Threshold pass
    this.thresholdMat = new THREE.ShaderMaterial({
      uniforms: {
        tScene: { value: null },
        threshold: { value: this.bloomThreshold },
      },
      vertexShader: PASSTHROUGH_VERT,
      fragmentShader: THRESHOLD_FRAG,
      depthWrite: false,
      depthTest: false,
    });

    // Horizontal blur
    this.blurHMat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(width >> 1, height >> 1) },
        direction: { value: new THREE.Vector2(1, 0) },
      },
      vertexShader: PASSTHROUGH_VERT,
      fragmentShader: BLUR_FRAG,
      depthWrite: false,
      depthTest: false,
    });

    // Vertical blur
    this.blurVMat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(width >> 1, height >> 1) },
        direction: { value: new THREE.Vector2(0, 1) },
      },
      vertexShader: PASSTHROUGH_VERT,
      fragmentShader: BLUR_FRAG,
      depthWrite: false,
      depthTest: false,
    });

    // Composite pass (Tone mapping + Bloom + Filters)
    this.compositeMat = new THREE.ShaderMaterial({
      uniforms: {
        tScene: { value: null },
        tBloom: { value: null },
        strength: { value: this.bloomStrength },
        contrast: { value: this.contrast },
        grain: { value: this.grain },
        time: { value: 0 },
      },
      vertexShader: PASSTHROUGH_VERT,
      fragmentShader: COMPOSITE_FRAG,
      depthWrite: false,
      depthTest: false,
    });

    this.fsMesh = new THREE.Mesh(this.fsTriGeo, this.thresholdMat);
    this.fsMesh.frustumCulled = false;
    this.fsScene.add(this.fsMesh);
  }

  private renderPass(mat: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null): void {
    this.fsMesh.material = mat;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.fsScene, this.fsCamera);
  }

  /**
   * Render the scene through the bloom pipeline.
   * Call this INSTEAD of renderer.render(scene, camera).
   */
  public render(scene: THREE.Scene, camera: THREE.Camera): void {
    if (!this.enabled) {
      this.renderer.setRenderTarget(null);
      this.renderer.render(scene, camera);
      return;
    }

    // 1. Render scene to offscreen RT
    this.renderer.setRenderTarget(this.sceneRT);
    this.renderer.render(scene, camera);

    // 2. Threshold — extract bright regions (half-res)
    this.thresholdMat.uniforms.tScene.value = this.sceneRT.texture;
    this.thresholdMat.uniforms.threshold.value = this.bloomThreshold;
    this.renderPass(this.thresholdMat, this.brightRT);

    // 3. Horizontal blur
    this.blurHMat.uniforms.tDiffuse.value = this.brightRT.texture;
    this.renderPass(this.blurHMat, this.blurHRT);

    // 4. Vertical blur
    this.blurVMat.uniforms.tDiffuse.value = this.blurHRT.texture;
    this.renderPass(this.blurVMat, this.blurVRT);

    // 5. Composite to screen
    this.compositeMat.uniforms.tScene.value = this.sceneRT.texture;
    this.compositeMat.uniforms.tBloom.value = this.blurVRT.texture;
    this.compositeMat.uniforms.strength.value = this.bloomStrength;
    this.compositeMat.uniforms.contrast.value = this.contrast;
    this.compositeMat.uniforms.grain.value = this.grain;
    this.compositeMat.uniforms.time.value = performance.now() / 1000.0;
    this.renderPass(this.compositeMat, null);
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.sceneRT.setSize(width, height);
    this.brightRT.setSize(width >> 1, height >> 1);
    this.blurHRT.setSize(width >> 1, height >> 1);
    this.blurVRT.setSize(width >> 1, height >> 1);
    const res = new THREE.Vector2(width >> 1, height >> 1);
    this.blurHMat.uniforms.resolution.value = res.clone();
    this.blurVMat.uniforms.resolution.value = res.clone();
  }

  public dispose(): void {
    this.sceneRT.dispose();
    this.brightRT.dispose();
    this.blurHRT.dispose();
    this.blurVRT.dispose();
    this.fsTriGeo.dispose();
    this.thresholdMat.dispose();
    this.blurHMat.dispose();
    this.blurVMat.dispose();
    this.compositeMat.dispose();
  }
}

// ─── Shaders ──────────────────────────────────────────────────────────────────

const PASSTHROUGH_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const THRESHOLD_FRAG = /* glsl */ `
  uniform sampler2D tScene;
  uniform float threshold;
  varying vec2 vUv;
  void main() {
    vec4 c = texture2D(tScene, vUv);
    float lum = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
    float factor = smoothstep(threshold - 0.05, threshold + 0.05, lum);
    gl_FragColor = vec4(c.rgb * factor, 1.0);
  }
`;

const BLUR_FRAG = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform vec2 resolution;
  uniform vec2 direction;
  varying vec2 vUv;

  // 9-tap Gaussian (sigma ≈ 2.0)
  const float weight[5] = float[](0.227027, 0.194595, 0.121621, 0.054054, 0.016216);

  void main() {
    vec2 texOffset = direction / resolution;
    vec3 result = texture2D(tDiffuse, vUv).rgb * weight[0];
    for (int i = 1; i < 5; i++) {
      float w = weight[i];
      result += texture2D(tDiffuse, vUv + texOffset * float(i)).rgb * w;
      result += texture2D(tDiffuse, vUv - texOffset * float(i)).rgb * w;
    }
    gl_FragColor = vec4(result, 1.0);
  }
`;

const COMPOSITE_FRAG = /* glsl */ `
  uniform sampler2D tScene;
  uniform sampler2D tBloom;
  uniform float strength;
  uniform float contrast;
  uniform float grain;
  uniform float time;
  varying vec2 vUv;
  
  float rand(vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  void main() {
    vec4 scene = texture2D(tScene, vUv);
    vec4 bloom = texture2D(tBloom, vUv);
    // Tone map: Reinhard on combined output
    vec3 combined = scene.rgb + bloom.rgb * strength;
    combined = combined / (combined + vec3(1.0));
    combined = pow(combined, vec3(1.0 / 2.2)); // gamma correction
    
    // Contrast
    combined = (combined - 0.5) * contrast + 0.5;
    
    // Film grain
    if (grain > 0.0) {
      float noise = (rand(vUv * time) - 0.5) * grain;
      combined += noise;
    }
    
    gl_FragColor = vec4(combined, scene.a);
  }
`;
