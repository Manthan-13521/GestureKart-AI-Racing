/**
 * Three.js Hero Car for Main Menu
 * Lazy-loaded, respects reduced-motion, uses Kenney CC0 car model
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
const stages = [
  { position: new THREE.Vector3(0, 0, 0), rotation: new THREE.Euler(0, 0, 0), fov: 45 }, // Front
  { position: new THREE.Vector3(0, 0.5, 3), rotation: new THREE.Euler(0, Math.PI, 0), fov: 40 }, // Rear
  { position: new THREE.Vector3(2, 0.3, 1), rotation: new THREE.Euler(0, -Math.PI / 2, 0), fov: 35 }, // Side
  { position: new THREE.Vector3(0, 1.5, 0), rotation: new THREE.Euler(-Math.PI / 6, 0, 0), fov: 30 }, // Top-down
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

  // Renderer
  carRenderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  carRenderer.setSize(mount.clientWidth, mount.clientHeight);
  carRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  carRenderer.shadowMap.enabled = false; // No shadows for performance
  carRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  carRenderer.toneMappingExposure = 1.2;
  container.appendChild(carRenderer.domElement);

  // Scene
  carScene = new THREE.Scene();
  carScene.background = null;

  // Camera
  carCamera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
  carCamera.position.copy(stages[0].position);
  carCamera.rotation.copy(stages[0].rotation);

  // Lighting - showroom style
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  carScene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
  keyLight.position.set(5, 10, 7);
  carScene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x00e5ff, 0.5);
  fillLight.position.set(-5, 5, -5);
  carScene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffd700, 0.8);
  rimLight.position.set(0, -5, -10);
  carScene.add(rimLight);

  // Ground plane for reflections
  const groundGeo = new THREE.PlaneGeometry(100, 100);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x05070b,
    metalness: 0.8,
    roughness: 0.2,
    transparent: true,
    opacity: 0.3,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  ground.receiveShadow = false;
  carScene.add(ground);

  // Load Kenney car model
  const loader = new GLTFLoader();
  try {
    // Try to load from Kenney assets or fallback
    const gltf = await loader.loadAsync('/assets/models/kenney-car.glb');
    carModel = gltf.scene;
    carModel.scale.set(1.5, 1.5, 1.5);
    carModel.position.y = 0;

    // Enhance materials for showroom look
    carModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.metalness = 0.7;
          child.material.roughness = 0.3;
          child.material.envMapIntensity = 1.5;
        }
      }
    });

    carScene!.add(carModel);
  } catch {
    console.warn('Kenney car model not found, creating procedural car');
    createProceduralCar();
  }

  // Handle resize
  const handleResize = () => {
    if (!carRenderer || !carCamera || !container) return;
    carCamera.aspect = container.clientWidth / container.clientHeight;
    carCamera.updateProjectionMatrix();
    carRenderer.setSize(container.clientWidth, container.clientHeight);
  };
  window.addEventListener('resize', handleResize);

  // Animation loop
  let lastStageChange = performance.now();
  let targetStage = 0;
  let transitionProgress = 0;
  const stageDuration = 6000; // 6 seconds per stage
  const transitionDuration = 1500; // 1.5s transition

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
      transitionProgress += 16.67 / transitionDuration; // ~60fps
      transitionProgress = Math.min(1, transitionProgress);
      const eased = 1 - Math.pow(1 - transitionProgress, 3); // ease-out cubic

      const current = stages[(targetStage - 1 + stages.length) % stages.length];
      const next = stages[targetStage];

      carCamera!.position.lerpVectors(current.position, next.position, eased);
      carCamera!.rotation.x = THREE.MathUtils.lerp(current.rotation.x, next.rotation.x, eased);
      carCamera!.rotation.y = THREE.MathUtils.lerp(current.rotation.y, next.rotation.y, eased);
      carCamera!.rotation.z = THREE.MathUtils.lerp(current.rotation.z, next.rotation.z, eased);
    }

    // Gentle floating animation for car
    if (carModel) {
      carModel.rotation.y += 0.0005;
      carModel.position.y = Math.sin(time * 0.001) * 0.02;
    }

    carRenderer.render(carScene, carCamera);
    animationId = requestAnimationFrame(animate);
  }

  animationId = requestAnimationFrame(animate);

  // Cleanup function
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

function createProceduralCar(): void {
  if (!carScene) return;

  const carGroup = new THREE.Group();

  // Body
  const bodyGeo = new THREE.BoxGeometry(2.2, 0.6, 4);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0x003344,
    emissiveIntensity: 0.3,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.3;
  carGroup.add(body);

  // Cockpit
  const cockpitGeo = new THREE.BoxGeometry(1.2, 0.5, 1.8);
  const cockpitMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.1,
    roughness: 0.9,
    transparent: true,
    opacity: 0.7,
  });
  const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
  cockpit.position.set(0, 0.8, -0.2);
  carGroup.add(cockpit);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.9,
    roughness: 0.1,
  });

  const wheelPositions = [
    [-1.1, 0.3, 1.5],
    [1.1, 0.3, 1.5],
    [-1.1, 0.3, -1.5],
    [1.1, 0.3, -1.5],
  ];

  wheelPositions.forEach((pos) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos[0], pos[1], pos[2]);
    carGroup.add(wheel);
  });

  // Neon accents
  const neonGeo = new THREE.BoxGeometry(2.4, 0.05, 0.1);
  const neonMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.8,
  });
  const neonFront = new THREE.Mesh(neonGeo, neonMat);
  neonFront.position.set(0, 0.2, 2.05);
  carGroup.add(neonFront);

  const neonBack = new THREE.Mesh(neonGeo, neonMat);
  neonBack.position.set(0, 0.2, -2.05);
  neonBack.material = neonMat.clone();
  neonBack.material.color.setHex(0xffd700);
  carGroup.add(neonBack);

  carModel = carGroup;
  carScene!.add(carModel);
}

export function destroyHeroCar(): void {
  const cleanup = heroWindow.__heroCarCleanup;
  if (cleanup) cleanup();
}
