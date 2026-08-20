/**
 * Three.js Hero Car for Main Menu
 * Lazy-loaded, respects reduced-motion, Kenney CC0 car model with high-quality procedural fallback
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { isMotionReduced } from '../ui/core/AnimationSystem';

let carScene: THREE.Scene | null = null;
let carRenderer: THREE.WebGLRenderer | null = null;
let carCamera: THREE.PerspectiveCamera | null = null;
let carModel: THREE.Group | null = null;
let animationId: number | null = null;
let container: HTMLElement | null = null;
let isInitialized = false;

// Camera stages for cinematic showcase
const stages = [
  { position: new THREE.Vector3(0, 0.8, 4.5), rotation: new THREE.Euler(0, 0, 0), fov: 35 }, // Front 3/4
  { position: new THREE.Vector3(3.5, 0.6, 2), rotation: new THREE.Euler(-0.1, Math.PI * 0.85, 0), fov: 30 }, // Side
  { position: new THREE.Vector3(-3, 0.8, 1.5), rotation: new THREE.Euler(-0.05, -Math.PI * 0.7, 0), fov: 35 }, // Other side
  { position: new THREE.Vector3(0, 2.2, 0), rotation: new THREE.Euler(-Math.PI / 2.5, 0, 0), fov: 28 }, // Top-down
];

interface HeroCarGlobals {
  __heroCarCleanup?: () => void;
}

const heroWindow = window as Window & HeroCarGlobals;

export async function createHeroCar(mount: HTMLElement): Promise<void> {
  if (isInitialized || isMotionReduced()) return;

  container = mount;
  container.innerHTML = '';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.position = 'relative';
  container.style.overflow = 'hidden';

  // Renderer - high quality
  carRenderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
  });
  carRenderer.setSize(mount.clientWidth, mount.clientHeight);
  carRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  carRenderer.shadowMap.enabled = true;
  carRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  carRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  carRenderer.toneMappingExposure = 1.15;
  carRenderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(carRenderer.domElement);

  // Scene
  carScene = new THREE.Scene();
  carScene.background = null;

  // Camera
  carCamera = new THREE.PerspectiveCamera(35, mount.clientWidth / mount.clientHeight, 0.1, 100);
  carCamera.position.copy(stages[0].position);
  carCamera.rotation.copy(stages[0].rotation);

  // === LIGHTING - Professional showroom setup ===
  // Ambient fill
  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  carScene.add(ambient);

  // Key light - main illumination
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
  keyLight.position.set(6, 12, 8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 30;
  keyLight.shadow.camera.left = -8;
  keyLight.shadow.camera.right = 8;
  keyLight.shadow.camera.top = 8;
  keyLight.shadow.camera.bottom = -8;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.02;
  carScene.add(keyLight);

  // Fill light - cool cyan from opposite side
  const fillLight = new THREE.DirectionalLight(0x00e5ff, 0.6);
  fillLight.position.set(-6, 6, -6);
  carScene.add(fillLight);

  // Rim light - warm gold from behind
  const rimLight = new THREE.DirectionalLight(0xffd700, 0.9);
  rimLight.position.set(0, -4, -12);
  carScene.add(rimLight);

  // Accent light - subtle magenta for depth
  const accentLight = new THREE.DirectionalLight(0xff00ff, 0.25);
  accentLight.position.set(-4, 3, 4);
  carScene.add(accentLight);

  // Ground plane with subtle reflection
  const groundGeo = new THREE.PlaneGeometry(60, 60);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x080a10,
    metalness: 0.4,
    roughness: 0.7,
    transparent: true,
    opacity: 0.4,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.45;
  ground.receiveShadow = true;
  carScene.add(ground);

  // Subtle floor glow
  const glowGeo = new THREE.RingGeometry(1.5, 4, 64);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -0.44;
  carScene.add(glow);

  // Load Kenney car model
  const loader = new GLTFLoader();
  try {
    const gltf = await loader.loadAsync('/assets/models/kenney-car.glb');
    carModel = gltf.scene;
    carModel.scale.set(1.8, 1.8, 1.8);
    carModel.position.y = 0.05;

    carModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.metalness = 0.85;
          child.material.roughness = 0.15;
          child.material.envMapIntensity = 1.8;
        }
      }
    });

    carScene!.add(carModel);
  } catch {
    console.warn('Kenney car model not found, creating premium procedural car');
    createPremiumProceduralCar();
  }

  // Handle resize
  const handleResize = () => {
    if (!carRenderer || !carCamera || !container) return;
    carCamera.aspect = container.clientWidth / container.clientHeight;
    carCamera.updateProjectionMatrix();
    carRenderer.setSize(container.clientWidth, container.clientHeight);
  };
  window.addEventListener('resize', handleResize);

  // Animation loop with smooth stage transitions
  let lastStageChange = performance.now();
  let targetStage = 0;
  let transitionProgress = 0;
  const stageDuration = 7000;
  const transitionDuration = 2000;

  function animate(time: number): void {
    if (!carRenderer || !carScene || !carCamera || !container) return;

    // Stage cycling
    const elapsed = time - lastStageChange;
    if (elapsed > stageDuration) {
      targetStage = (targetStage + 1) % stages.length;
      lastStageChange = time;
      transitionProgress = 0;
    }

    // Smooth transition between stages
    if (transitionProgress < 1) {
      transitionProgress += 16.67 / transitionDuration;
      transitionProgress = Math.min(1, transitionProgress);
      const eased = 1 - Math.pow(1 - transitionProgress, 4); // ease-out quartic

      const current = stages[(targetStage - 1 + stages.length) % stages.length];
      const next = stages[targetStage];

      carCamera!.position.lerpVectors(current.position, next.position, eased);
      carCamera!.rotation.x = THREE.MathUtils.lerp(current.rotation.x, next.rotation.x, eased);
      carCamera!.rotation.y = THREE.MathUtils.lerp(current.rotation.y, next.rotation.y, eased);
      carCamera!.rotation.z = THREE.MathUtils.lerp(current.rotation.z, next.rotation.z, eased);
      carCamera!.fov = THREE.MathUtils.lerp(current.fov, next.fov, eased);
      carCamera!.updateProjectionMatrix();
    }

    // Gentle floating + rotation for car
    if (carModel) {
      carModel.rotation.y += 0.0003;
      carModel.position.y = 0.05 + Math.sin(time * 0.0008) * 0.025;
    }

    // Animate floor glow
    if (glow) {
      glow.material.opacity = 0.08 + Math.sin(time * 0.001) * 0.02;
      glow.scale.setScalar(1 + Math.sin(time * 0.0007) * 0.05);
    }

    carRenderer.render(carScene, carCamera);
    animationId = requestAnimationFrame(animate);
  }

  animationId = requestAnimationFrame(animate);

  // Cleanup
  heroWindow.__heroCarCleanup = () => {
    if (animationId) cancelAnimationFrame(animationId);
    if (carRenderer) {
      carRenderer.dispose();
      carRenderer.forceContextLoss();
    }
    window.removeEventListener('resize', handleResize);
    isInitialized = false;
  };

  isInitialized = true;
}

function createPremiumProceduralCar(): void {
  if (!carScene) return;

  const carGroup = new THREE.Group();

  // ==========================================
  // BODY - Sleek aerodynamic racing body
  // ==========================================
  const bodyGroup = new THREE.Group();

  // Main chassis - low, wide, aggressive
  const chassisGeo = new THREE.BoxGeometry(2.4, 0.35, 4.8);
  const chassisMat = new THREE.MeshPhysicalMaterial({
    color: 0x001a2e,
    metalness: 0.95,
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  chassis.position.y = 0.2;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  bodyGroup.add(chassis);

  // Upper body - tapered cockpit area
  const upperGeo = new THREE.BoxGeometry(1.5, 0.45, 2.2);
  const upperMat = new THREE.MeshPhysicalMaterial({
    color: 0x000814,
    metalness: 0.9,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  });
  const upper = new THREE.Mesh(upperGeo, upperMat);
  upper.position.set(0, 0.55, -0.3);
  upper.scale.set(1, 1, 0.85);
  upper.castShadow = true;
  upper.receiveShadow = true;
  bodyGroup.add(upper);

  // Rear spoiler
  const spoilerGeo = new THREE.BoxGeometry(1.8, 0.06, 0.6);
  const spoilerMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a12,
    metalness: 0.9,
    roughness: 0.15,
  });
  const spoiler = new THREE.Mesh(spoilerGeo, spoilerMat);
  spoiler.position.set(0, 0.65, -2.0);
  spoiler.castShadow = true;
  bodyGroup.add(spoiler);

  // Side skirts
  const skirtGeo = new THREE.BoxGeometry(0.12, 0.25, 3.8);
  const skirtMat = new THREE.MeshStandardMaterial({
    color: 0x05050a,
    metalness: 0.8,
    roughness: 0.2,
  });
  [-1.26, 1.26].forEach((x) => {
    const skirt = new THREE.Mesh(skirtGeo, skirtMat);
    skirt.position.set(x, 0.15, -0.1);
    skirt.castShadow = true;
    bodyGroup.add(skirt);
  });

  // Front splitter
  const splitterGeo = new THREE.BoxGeometry(2.2, 0.04, 0.5);
  const splitterMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a12,
    metalness: 0.95,
    roughness: 0.05,
  });
  const splitter = new THREE.Mesh(splitterGeo, splitterMat);
  splitter.position.set(0, 0.05, 2.45);
  splitter.castShadow = true;
  bodyGroup.add(splitter);

  // Rear diffuser
  const diffuserGeo = new THREE.BoxGeometry(1.6, 0.12, 0.7);
  const diffuserMat = new THREE.MeshStandardMaterial({
    color: 0x08080c,
    metalness: 0.85,
    roughness: 0.2,
  });
  const diffuser = new THREE.Mesh(diffuserGeo, diffuserMat);
  diffuser.position.set(0, 0.12, -2.5);
  diffuser.castShadow = true;
  bodyGroup.add(diffuser);

  carGroup.add(bodyGroup);

  // ==========================================
  // COCKPIT / CANOPY
  // ==========================================
  const cockpitGeo = new THREE.CapsuleGeometry(0.55, 1.2, 8, 16);
  const cockpitMat = new THREE.MeshPhysicalMaterial({
    color: 0x000a1a,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.85,
    thickness: 0.02,
    ior: 1.5,
    transparent: true,
    opacity: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
  });
  const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
  cockpit.position.set(0, 0.65, -0.15);
  cockpit.rotation.x = Math.PI / 2;
  cockpit.scale.set(1, 1, 0.7);
  cockpit.castShadow = true;
  cockpit.receiveShadow = true;
  carGroup.add(cockpit);

  // ==========================================
  // WHEELS - Detailed with brake calipers
  // ==========================================
  const wheelPositions = [
    [-1.15, 0.28, 1.65],
    [1.15, 0.28, 1.65],
    [-1.15, 0.28, -1.55],
    [1.15, 0.28, -1.55],
  ];

  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.22, 24);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x0d0d0d,
    metalness: 0.1,
    roughness: 0.85,
  });
  const rimMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1a2e,
    metalness: 0.95,
    roughness: 0.1,
    clearcoat: 0.8,
    clearcoatRoughness: 0.05,
  });
  const caliperMat = new THREE.MeshStandardMaterial({
    color: 0xff3300,
    metalness: 0.8,
    roughness: 0.3,
    emissive: 0xff3300,
    emissiveIntensity: 0.3,
  });

  wheelPositions.forEach((pos, _i) => {
    const wheelGroup = new THREE.Group();

    // Tire
    const tire = new THREE.Mesh(wheelGeo, tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    tire.receiveShadow = true;
    wheelGroup.add(tire);

    // Rim
    const rimGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 10);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    rim.castShadow = true;
    wheelGroup.add(rim);

    // Brake disc
    const discGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.02, 16);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a3a,
      metalness: 0.9,
      roughness: 0.2,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.z = Math.PI / 2;
    disc.position.set(0, 0, 0.11);
    wheelGroup.add(disc);

    // Caliper (front wheels only)
    if (pos[2] > 0) {
      const caliperGeo = new THREE.BoxGeometry(0.18, 0.25, 0.12);
      const caliper = new THREE.Mesh(caliperGeo, caliperMat);
      caliper.position.set(pos[0] > 0 ? 0.38 : -0.38, 0.28, pos[2]);
      caliper.rotation.z = Math.PI / 2;
      caliper.castShadow = true;
      carGroup.add(caliper);
    }

    wheelGroup.position.set(pos[0], pos[1], pos[2]);
    wheelGroup.castShadow = true;
    carGroup.add(wheelGroup);
  });

  // ==========================================
  // NEON ACCENTS - Racing livery
  // ==========================================
  // Front neon strip
  const frontNeonGeo = new THREE.BoxGeometry(2.0, 0.025, 0.04);
  const frontNeonMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.95,
  });
  const frontNeon = new THREE.Mesh(frontNeonGeo, frontNeonMat);
  frontNeon.position.set(0, 0.18, 2.45);
  carGroup.add(frontNeon);

  // Rear neon strip
  const rearNeonGeo = new THREE.BoxGeometry(1.8, 0.025, 0.04);
  const rearNeonMat = new THREE.MeshBasicMaterial({
    color: 0xff3300,
    transparent: true,
    opacity: 0.95,
  });
  const rearNeon = new THREE.Mesh(rearNeonGeo, rearNeonMat);
  rearNeon.position.set(0, 0.22, -2.55);
  carGroup.add(rearNeon);

  // Side neon strips
  const sideNeonGeo = new THREE.BoxGeometry(0.025, 0.04, 3.2);
  const sideNeonMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.7,
  });
  [-1.22, 1.22].forEach((x) => {
    const neon = new THREE.Mesh(sideNeonGeo, sideNeonMat);
    neon.position.set(x, 0.15, -0.1);
    carGroup.add(neon);
  });

  // ==========================================
  // GLOW EFFECTS - Subtle emissive highlights
  // ==========================================
  // Front headlights
  const headlightGeo = new THREE.SphereGeometry(0.12, 16, 16);
  const headlightMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 1.0,
  });
  [-0.7, 0.7].forEach((x) => {
    const light = new THREE.Mesh(headlightGeo, headlightMat);
    light.position.set(x, 0.35, 2.35);
    light.scale.set(1, 0.7, 1.5);
    carGroup.add(light);

    // Lens flare glow
    const flareGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const flareMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.15,
    });
    const flare = new THREE.Mesh(flareGeo, flareMat);
    flare.position.set(x, 0.35, 2.45);
    flare.scale.set(1, 0.7, 2);
    carGroup.add(flare);
  });

  // Rear lights
  const taillightGeo = new THREE.SphereGeometry(0.1, 12, 12);
  const taillightMat = new THREE.MeshBasicMaterial({
    color: 0xff3300,
    transparent: true,
    opacity: 1.0,
  });
  [-0.75, 0.75].forEach((x) => {
    const light = new THREE.Mesh(taillightGeo, taillightMat);
    light.position.set(x, 0.32, -2.35);
    light.scale.set(1, 0.6, 1.2);
    carGroup.add(light);
  });

  // Underglow
  const underglowGeo = new THREE.PlaneGeometry(2.8, 5.5);
  const underglowMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.06,
    side: THREE.DoubleSide,
  });
  const underglow = new THREE.Mesh(underglowGeo, underglowMat);
  underglow.rotation.x = -Math.PI / 2;
  underglow.position.y = -0.05;
  carGroup.add(underglow);

  carModel = carGroup;
  carScene!.add(carGroup);
}

export function destroyHeroCar(): void {
  const cleanup = heroWindow.__heroCarCleanup;
  if (cleanup) cleanup();
}
