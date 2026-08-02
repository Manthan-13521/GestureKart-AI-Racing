import { HandTracker, HandData, getDirection, HAND_CONNECTIONS } from './input/HandTracker';
import type { GameKeys } from './input/Keyboard';
import { Game, GameState } from './game/Game';
import { AppEvents, EventBus } from './core/EventBus';
import { StateMachine, type AppState } from './core/StateMachine';
import { ResourceManager } from './managers/ResourceManager';
import { AudioManager } from './managers/AudioManager';
import { SaveManager } from './managers/SaveManager';
import { InputManager } from './managers/InputManager';
import { UIManager } from './managers/UIManager';

// ─── Core systems ──────────────────────────────────────────────────
const resources = new ResourceManager();
const bus = new EventBus();
const stateMachine = new StateMachine();
const saveManager = new SaveManager();
const audioManager = new AudioManager();
const inputManager = new InputManager(bus);
const ui = new UIManager();

// ─── DOM refs ───────────────────────────────────────────────────────
const landing = document.getElementById('landing')!;
const landingPlay = document.getElementById('landing-play')!;
const landingSettings = document.getElementById('landing-settings')!;
const landingLearn = document.getElementById('landing-learn')!;
const navTitle = document.querySelector('.nav-title') as HTMLElement;
const video = document.getElementById('webcam') as HTMLVideoElement;
const gameCanvas = document.getElementById('game') as HTMLCanvasElement;
const camOverlay = document.getElementById('cam-overlay') as HTMLCanvasElement;
const gameOverlayCanvas = document.getElementById('game-overlay-canvas') as HTMLCanvasElement;
const handSkeletonCanvas = document.getElementById('hand-skeleton-canvas') as HTMLCanvasElement;

const faceLabel = document.getElementById('face-label')!;
const handLeftLabel = document.getElementById('hand-left-label')!;
const handRightLabel = document.getElementById('hand-right-label')!;
const camError = document.getElementById('cam-error')!;

const steerDir = document.getElementById('steer-dir')!;
const steerSub = document.getElementById('steer-sub')!;
const steerLine = document.getElementById('steer-line')!;
const steerArc = document.getElementById('steer-arc')!;

const telemFps = document.getElementById('telem-fps')!;
const telemHandDist = document.getElementById('telem-hand-dist')!;
const telemLR = document.getElementById('telem-lr')!;
const telemConfidence = document.getElementById('telem-confidence')!;

const camFpsLabel = document.getElementById('cam-fps')!;
const sensitivitySlider = document.getElementById('sensitivity-slider') as HTMLInputElement;
const sensitivityValue = document.getElementById('sensitivity-value')!;

const statusHand = document.getElementById('status-hand')!;
const statusKeyboard = document.getElementById('status-keyboard')!;
const statusCamera = document.getElementById('status-camera')!;
const statusCameraDot = document.getElementById('status-camera-dot')!;

const navCamDot = document.getElementById('nav-cam-dot')!;
const navCamText = document.getElementById('nav-cam-text')!;

const hudPosition = document.getElementById('hud-position')!;
const hudLap = document.getElementById('hud-lap')!;
const hudTime = document.getElementById('hud-time')!;
const hudBest = document.getElementById('hud-best')!;
const hudSpeed = document.getElementById('hud-speed')!;
const hudGear = document.getElementById('hud-gear')!;
const speedArc = document.getElementById('speed-arc')!;

const statusAuto = document.getElementById('status-auto')!;
const statusAutoDot = document.getElementById('status-auto-dot')!;
const speedVignette = document.getElementById('speed-vignette')!;
const collisionFlash = document.getElementById('collision-flash')!;

const resultsRetry = document.getElementById('results-retry')!;
const resultsMenu = document.getElementById('results-menu')!;

const menuStart = document.getElementById('menu-start')!;
const menuHowtoplay = document.getElementById('menu-howtoplay')!;
const menuSettings = document.getElementById('menu-settings')!;
const htpBack = document.getElementById('htp-back')!;
const settingsBack = document.getElementById('settings-back')!;
const menuSensitivitySlider = document.getElementById('menu-sensitivity-slider') as HTMLInputElement;
const menuSensitivityValue = document.getElementById('menu-sensitivity-value')!;
const menuAutoToggle = document.getElementById('menu-auto-toggle')!;

const touchAuto = document.getElementById('touch-auto')!;
const touchModeLabel = document.getElementById('touch-mode-label')!;
const uBox = document.querySelector('.key-box[data-key="u"]')!;

const panelLeft = document.getElementById('panel-left')!;
const panelToggle = document.getElementById('panel-toggle')!;

// ─── State ──────────────────────────────────────────────────────────
let game: Game;
let tracker: HandTracker;
let cameraActive = false;
let handTrackingActive = false;

// Countdown
let countdownActive = false;
let countdownInterval: ReturnType<typeof setInterval> | null = null;

let overlayFps = 0;
let fpsCounter = 0;
let lastFpsTime = performance.now();

// ─── Panel toggle ───────────────────────────────────────────────────
panelToggle.addEventListener('click', () => {
  panelLeft.classList.toggle('collapsed');
  setTimeout(() => {
    if (game) {
      const viewport = document.getElementById('game-viewport')!;
      game.resize(viewport.clientWidth, viewport.clientHeight);
    }
  }, 350);
});

// ─── Camera overlay drawing ────────────────────────────────────────
function drawCamOverlay(data: HandData): void {
  const w = (camOverlay.width = camOverlay.clientWidth);
  const h = (camOverlay.height = camOverlay.clientHeight);
  const ctx = camOverlay.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, w, h);

  faceLabel.style.display = data.handsDetected > 0 ? 'block' : 'none';

  const leftIdx = data.handedness.indexOf('Left');
  const rightIdx = data.handedness.indexOf('Right');
  handLeftLabel.style.display = leftIdx >= 0 ? 'block' : 'none';
  handRightLabel.style.display = rightIdx >= 0 ? 'block' : 'none';

  for (let hi = 0; hi < data.landmarks.length; hi++) {
    const lm = data.landmarks[hi];

    if (lm.length > 0) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of lm) {
        const px = p.x * w;
        const py = p.y * h;
        if (px < minX) minX = px;
        if (py < minY) minY = py;
        if (px > maxX) maxX = px;
        if (py > maxY) maxY = py;
      }
      const pad = 8;
      minX = Math.max(0, minX - pad);
      minY = Math.max(0, minY - pad);
      maxX = Math.min(w, maxX + pad);
      maxY = Math.min(h, maxY + pad);

      ctx.strokeStyle = 'rgba(0, 255, 65, 0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    }

    for (const [i, j] of HAND_CONNECTIONS) {
      if (i < lm.length && j < lm.length) {
        ctx.strokeStyle = 'rgba(0, 255, 65, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lm[i].x * w, lm[i].y * h);
        ctx.lineTo(lm[j].x * w, lm[j].y * h);
        ctx.stroke();
      }
    }

    for (const p of lm) {
      ctx.fillStyle = 'rgba(0, 255, 65, 0.4)';
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const tipIdx of [4, 8, 12, 16, 20]) {
      if (tipIdx < lm.length) {
        const p = lm[tipIdx];
        ctx.fillStyle = 'rgba(0, 255, 65, 0.7)';
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  if (data.handsDetected >= 2) {
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(2, 2, w - 4, h - 4);
  }
}

// ─── Hand skeleton in game view ────────────────────────────────────
function drawHandSkeleton(data: HandData): void {
  const canvas = handSkeletonCanvas;
  const w = (canvas.width = canvas.clientWidth);
  const h = (canvas.height = canvas.clientHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, w, h);
  if (data.landmarks.length === 0) return;

  const lm = data.landmarks[0];

  for (const [i, j] of HAND_CONNECTIONS) {
    if (i < lm.length && j < lm.length) {
      ctx.strokeStyle = 'rgba(0, 255, 65, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lm[i].x * w, lm[i].y * h);
      ctx.lineTo(lm[j].x * w, lm[j].y * h);
      ctx.stroke();
    }
  }

  for (const p of lm) {
    ctx.fillStyle = 'rgba(0, 255, 65, 0.5)';
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const tipIdx of [4, 8, 12, 16, 20]) {
    if (tipIdx < lm.length) {
      const p = lm[tipIdx];
      ctx.fillStyle = 'rgba(0, 255, 65, 0.8)';
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ─── Steering UI update ────────────────────────────────────────────
function updateSteeringUI(centerX: number, handsDetected: number): void {
  const dir = getDirection(centerX);

  steerDir.textContent = dir === 'LEFT' ? 'TURNING LEFT' : dir === 'RIGHT' ? 'TURNING RIGHT' : 'STRAIGHT';
  steerDir.className = `steer-dir ${dir === 'LEFT' ? 'active-left' : dir === 'RIGHT' ? 'active-right' : ''}`;

  steerSub.textContent =
    handsDetected >= 2
      ? dir === 'LEFT' ? 'Steering left'
        : dir === 'RIGHT' ? 'Steering right'
          : 'Keep hands steady'
      : handsDetected === 1 ? 'Show both hands'
        : 'No hands detected';

  const angle = (centerX - 0.5) * 80;
  steerLine?.setAttribute('transform', `rotate(${angle}, 50, 50)`);

  if (dir === 'LEFT') {
    steerArc.setAttribute('stroke', 'var(--blue)');
    steerLine.setAttribute('stroke', 'var(--blue)');
  } else if (dir === 'RIGHT') {
    steerArc.setAttribute('stroke', 'var(--gold)');
    steerLine.setAttribute('stroke', 'var(--gold)');
  } else {
    steerArc.setAttribute('stroke', 'var(--green)');
    steerLine.setAttribute('stroke', 'var(--green)');
  }
}

// ─── Telemetry update ──────────────────────────────────────────────
function updateTelemetry(data: HandData): void {
  telemFps.textContent = `${overlayFps}`;
  camFpsLabel.textContent = `FPS: ${overlayFps}`;

  const dist =
    data.landmarks.length >= 2
      ? Math.sqrt(
          (data.landmarks[0][0].x - data.landmarks[1][0].x) ** 2 +
            (data.landmarks[0][0].y - data.landmarks[1][0].y) ** 2,
        ) * 800
      : 0;
  telemHandDist.textContent = dist > 0 ? `${Math.floor(dist)}` : '--';

  const dirLabel = getDirection(data.centerX);
  telemLR.textContent = dirLabel === 'LEFT' ? 'LEFT' : dirLabel === 'RIGHT' ? 'RIGHT' : 'CENTER';

  telemConfidence.textContent = data.confidence > 0 ? data.confidence.toFixed(2) : '--';
}

// ─── Game HUD update ───────────────────────────────────────────────
function updateGameHUD(state: GameState): void {
  // Position (Tier 1 — always visible)
  const posNum = state.gameOver ? state.totalCars : state.position;
  hudPosition.textContent = `${posNum}`;

  // Lap (Tier 1 — always visible)
  hudLap.textContent = `${Math.min(state.lap, state.totalLaps)}/${state.totalLaps}`;

  // Time (Tier 1 — always visible)
  const remaining = Math.max(0, state.raceDuration - state.raceTime);
  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);
  hudTime.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

  // Timer urgency
  if (remaining < 10 && remaining > 0) {
    hudTime.classList.add('urgent');
  } else {
    hudTime.classList.remove('urgent');
  }

  // Score (Tier 2)
  hudBest.textContent = `${Math.floor(state.score)}`;

  // Speed (Tier 1 — always visible)
  const speedKmh = game ? game.getSpeedKmh() : 0;
  hudSpeed.textContent = `${speedKmh}`;

  // Speed digital styling (quiet-by-default, flare on high speed)
  const speedFrac = game ? game.speed / 3 : 0;
  if (speedFrac > 0.85) {
    hudSpeed.className = 'speed-num max';
  } else if (speedFrac > 0.5) {
    hudSpeed.className = 'speed-num fast';
  } else {
    hudSpeed.className = 'speed-num';
  }

  // Speed gauge arc (analog + digital combo per hud-design.md)
  if (speedArc) {
    const maxOffset = 157;
    const fill = speedFrac * maxOffset;
    speedArc.setAttribute('stroke-dashoffset', `${maxOffset - fill}`);

    if (speedFrac > 0.85) {
      speedArc.setAttribute('stroke', 'var(--gold)');
    } else if (speedFrac > 0.5) {
      speedArc.setAttribute('stroke', 'var(--blue)');
    } else {
      speedArc.setAttribute('stroke', 'var(--green)');
    }
  }

  // Gear
  const gear = game ? game.getGear() : 1;
  hudGear.textContent = `${gear}`;
  const prevGear = hudGear.getAttribute('data-prev') || '1';
  if (prevGear !== `${gear}`) {
    hudGear.className = 'hud-gear-val shift';
    setTimeout(() => hudGear.classList.remove('shift'), 200);
  }
  hudGear.setAttribute('data-prev', `${gear}`);
}

// ─── Status update ─────────────────────────────────────────────────
function updateStatus(): void {
  statusHand.textContent = handTrackingActive ? 'Active' : 'Inactive';
  statusHand.className = `status-val ${handTrackingActive ? '' : 'inactive'}`;
  statusKeyboard.textContent = 'Active';
  statusKeyboard.className = 'status-val';
  statusCamera.textContent = cameraActive ? 'Active' : 'Inactive';
  statusCamera.className = `status-val ${cameraActive ? '' : 'inactive'}`;
  statusCameraDot.style.background = cameraActive ? 'var(--green)' : '#f44';
  statusCameraDot.style.boxShadow = cameraActive ? '0 0 5px var(--green)' : '0 0 5px #f44';
  navCamDot.className = `cam-dot ${cameraActive ? 'on' : ''}`;
  navCamText.textContent = cameraActive ? 'Camera: ON' : 'Camera: OFF';
  statusAuto.textContent = inputManager.autoAccelerate ? 'ON' : 'OFF';
  statusAuto.className = `status-val ${inputManager.autoAccelerate ? '' : 'inactive'}`;
  statusAutoDot.style.background = inputManager.autoAccelerate ? 'var(--gold)' : 'var(--text3)';
  statusAutoDot.style.boxShadow = inputManager.autoAccelerate ? '0 0 5px var(--gold)' : 'none';
}

// ─── Auto-accelerate UI sync ───────────────────────────────────────
function syncAutoUI(on: boolean): void {
  touchAuto.classList.toggle('active', on);
  uBox.classList.toggle('active', on);
  menuAutoToggle.textContent = on ? 'ON' : 'OFF';
  menuAutoToggle.classList.toggle('active', on);
  updateStatus();
}

bus.on(AppEvents.autoToggle, (on: boolean) => {
  syncAutoUI(on);
  saveManager.autoAccelerate = on;
});

bus.on(AppEvents.gyroToggle, (on: boolean) => {
  touchModeLabel.textContent = on ? 'GYRO' : 'TOUCH';
  updateStatus();
  saveManager.gyroscopeMode = on;
});

// ─── Screen state → overlays ───────────────────────────────────────
stateMachine.onChange((_from, to) => {
  ui.sync(to);
  if (to === 'gameover') {
    const score = Math.floor(game.getState().score);
    ui.finalScore.textContent = `${score}`;
    saveManager.setBestScore(score);
  }
});

// ─── Countdown ─────────────────────────────────────────────────────
function startCountdown(callback: () => void): void {
  if (countdownActive) return;
  countdownActive = true;
  ui.countdown.classList.remove('hidden');
  ui.countdownNum.textContent = '3';
  ui.countdownNum.className = 'countdown-num';

  // Reset animation
  ui.countdownNum.style.animation = 'none';
  void ui.countdownNum.offsetHeight;
  ui.countdownNum.style.animation = '';

  let step = 3;
  countdownInterval = setInterval(() => {
    step--;
    if (step > 0) {
      ui.countdownNum.textContent = `${step}`;
      ui.countdownNum.className = 'countdown-num';
      ui.countdownNum.style.animation = 'none';
      void ui.countdownNum.offsetHeight;
      ui.countdownNum.style.animation = '';
    } else if (step === 0) {
      ui.countdownNum.textContent = 'GO';
      ui.countdownNum.className = 'countdown-num go';
      ui.countdownNum.style.animation = 'none';
      void ui.countdownNum.offsetHeight;
      ui.countdownNum.style.animation = '';
    } else {
      clearInterval(countdownInterval!);
      countdownInterval = null;
      countdownActive = false;
      ui.countdown.classList.add('hidden');
      callback();
    }
  }, 250);
}

function cancelCountdown(): void {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  countdownActive = false;
  ui.countdown.classList.add('hidden');
}

// ─── Keyboard callback ─────────────────────────────────────────────
function onKeysChanged(newKeys: GameKeys): void {
  const keyBoxes = document.querySelectorAll('.key-box');
  for (const box of keyBoxes) {
    const k = box.getAttribute('data-key');
    if (k === 'w') box.classList.toggle('active', newKeys.up);
    if (k === 'a') box.classList.toggle('active', newKeys.left);
    if (k === 'd') box.classList.toggle('active', newKeys.right);
  }

  if (game) {
    if (newKeys.up) {
      game.setHandData(game.steerCenterX, 2);
      if (!game.started || game.gameOver) {
        const s = stateMachine.get();
        if (s === 'landing') return;
        if (s === 'menu') return;
        cancelCountdown();
        startCountdown(() => {
          game.start();
          stateMachine.set('racing');
        });
      }
    } else if (newKeys.left || newKeys.right) {
      const steerX = newKeys.left ? 0 : 1;
      game.setHandData(steerX, inputManager.autoAccelerate ? 2 : 1);
    }
  }
}

// ─── Hand tracker callback ────────────────────────────────────────
function onHandData(data: HandData): void {
  handTrackingActive = true;
  updateStatus();

  if (!game) return;

  // Hand tracking always provides steering (centerX) for the game.
  // The game loop applies keyboard/touch overrides on top when active.
  game.setHandData(data.centerX, inputManager.autoAccelerate ? 2 : data.handsDetected);

  if (data.landmarks.length > 0) {
    game.setHandSkeleton(data.landmarks[0]);
  }

  if (!game.started && data.handsDetected >= 2 && !countdownActive) {
    const s = stateMachine.get();
    if (s === 'landing') return;
    if (s === 'menu') return;
    if (s === 'howtoplay') return;
    if (s === 'settings') return;
    startCountdown(() => {
      game.start();
      stateMachine.set('racing');
    });
  }

  drawCamOverlay(data);
  drawHandSkeleton(data);
  updateTelemetry(data);
}

// ─── Game loop ─────────────────────────────────────────────────────
function gameLoop(): void {
  fpsCounter++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    overlayFps = fpsCounter;
    fpsCounter = 0;
    lastFpsTime = now;
  }

  if (game) {
    // Auto-accelerate layer
    if (inputManager.autoAccelerate && !inputManager.keys.up) {
      let steerX = game.steerCenterX;
      if (inputManager.touch.active) {
        // touch steering already set by applyTouchState
      } else if (inputManager.gyroscopeMode) {
        steerX = 0.5 + inputManager.gyroTilt * 0.4;
      } else if (inputManager.keys.left || inputManager.keys.right) {
        steerX = inputManager.keys.left ? 0 : 1;
      }
      game.setHandData(steerX, 2);
      if (!game.started) {
        const s = stateMachine.get();
        if (s === 'landing') return;
        if (s === 'menu') return;
        startCountdown(() => {
          game.start();
          stateMachine.set('racing');
        });
      }
    }
    // Gyroscope layer
    else if (inputManager.gyroscopeMode && !inputManager.touch.active && !inputManager.keys.left && !inputManager.keys.right) {
      const gyroCenterX = 0.5 + inputManager.gyroTilt * 0.4;
      const gyroHands = inputManager.keys.up ? 2 : 0;
      game.setHandData(gyroCenterX, gyroHands);
    }

    game.update();
    game.render();

    const state = game.getState();
    updateSteeringUI(game.steerCenterX, game.handsDetected);
    updateGameHUD(state);

    // Juice: speed lines + vignette
    if (state.started && !state.gameOver) {
      drawSpeedLines(state.speed, game.steerCenterX);
      speedVignette.style.opacity = `${Math.max(0, (state.speed - 0.3) / 2.5) * 0.8}`;
      audioManager.updateEngineSound(state.speed);
    } else {
      audioManager.stopEngine();
      const ctx = gameOverlayCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, gameOverlayCanvas.width, gameOverlayCanvas.height);
      speedVignette.style.opacity = '0';
    }

    // Juice: collision flash
    if (state.justCollided) {
      collisionFlash.classList.add('active');
      audioManager.playCollision();
      setTimeout(() => collisionFlash.classList.remove('active'), 450);
    }

    // Screen state derived from game phase
    const s = stateMachine.get();
    let desired: AppState;
    if (s === 'landing') {
      desired = 'landing';
    } else if (state.started && !state.gameOver) {
      desired = 'racing';
    } else if (state.gameOver) {
      desired = 'gameover';
    } else if (s === 'menu' || s === 'howtoplay' || s === 'settings') {
      desired = s;
    } else {
      desired = 'ready';
    }
    if (desired !== s) {
      stateMachine.set(desired);
    }
  }

  requestAnimationFrame(gameLoop);
}

// ─── Sensitivity ───────────────────────────────────────────────────
function setupSensitivity(): void {
  sensitivitySlider.addEventListener('input', () => {
    applySensitivity(parseInt(sensitivitySlider.value, 10));
  });
}

// ─── Resize ────────────────────────────────────────────────────────
function handleResize(): void {
  if (!game) return;
  const viewport = document.getElementById('game-viewport')!;
  game.resize(viewport.clientWidth, viewport.clientHeight);
}

// ─── Touch Controls ────────────────────────────────────────────────
function applyTouchState(): void {
  if (!game) return;
  const touch = inputManager.touch;
  if (touch.up) {
    let steerX = 0.5;
    if (touch.left) steerX = 0;
    else if (touch.right) steerX = 1;
    game.setHandData(steerX, 2);
    if (!game.started || game.gameOver) {
      const s = stateMachine.get();
      if (s === 'landing') return;
      if (s === 'menu') return;
      cancelCountdown();
      startCountdown(() => {
        game.start();
        stateMachine.set('racing');
      });
    }
  } else if (touch.left) {
    game.setHandData(0, inputManager.autoAccelerate ? 2 : 1);
  } else if (touch.right) {
    game.setHandData(1, inputManager.autoAccelerate ? 2 : 1);
  }
}

// ─── Speed Lines ───────────────────────────────────────────────────
let speedLineOffset = 0;

function drawSpeedLines(speed: number, steerX: number): void {
  const w = (gameOverlayCanvas.width = gameOverlayCanvas.clientWidth);
  const h = (gameOverlayCanvas.height = gameOverlayCanvas.clientHeight);
  const ctx = gameOverlayCanvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, w, h);

  const intensity = Math.max(0, (speed - 0.3) / 2.5);
  if (intensity <= 0) return;

  const numLines = Math.floor(intensity * 20);
  speedLineOffset += speed * 0.4;
  const steerOffset = (steerX - 0.5) * 0.2;

  ctx.strokeStyle = `rgba(120, 160, 200, ${intensity * 0.3})`;
  ctx.lineWidth = 1;
  for (let i = 0; i < numLines; i++) {
    const seed = (i * 7919 + 31) % 1000 / 1000;
    const angle = seed * Math.PI * 2 + steerOffset;
    const r = 0.2 + seed * 0.3;
    const startR = r * Math.min(w, h) * 0.5;
    const len = 30 + intensity * 80;
    const offset = (speedLineOffset * (0.5 + seed * 0.5) + seed * 60) % (startR + len);
    const x1 = w / 2 + Math.cos(angle) * offset;
    const y1 = h / 2 + Math.sin(angle) * offset;
    const x2 = w / 2 + Math.cos(angle) * (offset + len);
    const y2 = h / 2 + Math.sin(angle) * (offset + len);
    ctx.globalAlpha = Math.max(0, 1 - offset / (startR + len)) * intensity * 0.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ─── Init ──────────────────────────────────────────────────────────
function applySensitivity(val: number): void {
  const alpha = val / 100;
  saveManager.sensitivity = val;
  sensitivityValue.textContent = `${val}%`;
  if (tracker) tracker.setSmoothing(1 - alpha * 0.6);
  if (game) game.setSensitivity(alpha);
}

function applySavedSensitivity(): void {
  applySensitivity(saveManager.sensitivity);
  sensitivitySlider.value = `${saveManager.sensitivity}`;
}

async function init(): Promise<void> {
  const gc = document.getElementById('game') as HTMLCanvasElement;
  if (!gc) throw new Error('Canvas #game not found');

  game = new Game(gc, resources);
  handleResize();
  window.addEventListener('resize', handleResize);

  // Restore persisted settings
  inputManager.autoAccelerate = saveManager.autoAccelerate;
  inputManager.gyroscopeMode = saveManager.gyroscopeMode;

  inputManager.onKeysChanged(onKeysChanged);
  inputManager.onTouchChanged(applyTouchState);
  inputManager.bindTouchControls({
    left: document.getElementById('touch-left')!,
    right: document.getElementById('touch-right')!,
    accel: document.getElementById('touch-accel')!,
    auto: touchAuto,
    modeLabel: touchModeLabel,
  });
  inputManager.initGyro();

  setupSensitivity();
  applySavedSensitivity();
  syncAutoUI(inputManager.autoAccelerate);
  touchModeLabel.textContent = inputManager.gyroscopeMode ? 'GYRO' : 'TOUCH';

  // Init audio on first interaction
  const initAudioOnce = () => { audioManager.init(); window.removeEventListener('click', initAudioOnce); window.removeEventListener('keydown', initAudioOnce); window.removeEventListener('touchstart', initAudioOnce); };
  window.addEventListener('click', initAudioOnce, { once: true });
  window.addEventListener('keydown', initAudioOnce, { once: true });
  window.addEventListener('touchstart', initAudioOnce, { once: true });

  // ─── Menu flow ──────────────────────────────────────────────
  menuStart.addEventListener('click', () => {
    stateMachine.set('ready');
    cancelCountdown();
    startCountdown(() => {
      game.start();
      stateMachine.set('racing');
    });
  });

  menuHowtoplay.addEventListener('click', () => stateMachine.set('howtoplay'));
  htpBack.addEventListener('click', () => stateMachine.set('menu'));

  menuSettings.addEventListener('click', () => {
    menuSensitivitySlider.value = sensitivitySlider.value;
    menuSensitivityValue.textContent = `${sensitivitySlider.value}%`;
    menuAutoToggle.textContent = inputManager.autoAccelerate ? 'ON' : 'OFF';
    menuAutoToggle.classList.toggle('active', inputManager.autoAccelerate);
    stateMachine.set('settings');
  });

  settingsBack.addEventListener('click', () => {
    const val = parseInt(menuSensitivitySlider.value, 10);
    sensitivitySlider.value = `${val}`;
    applySensitivity(val);
    stateMachine.set('menu');
  });

  menuSensitivitySlider.addEventListener('input', () => {
    const val = parseInt(menuSensitivitySlider.value, 10);
    menuSensitivityValue.textContent = `${val}%`;
  });

  menuAutoToggle.addEventListener('click', () => {
    inputManager.setAutoAccelerate(!inputManager.autoAccelerate);
  });

  // Results buttons
  resultsRetry.addEventListener('click', () => {
    cancelCountdown();
    startCountdown(() => {
      game.start();
      stateMachine.set('racing');
    });
  });

  resultsMenu.addEventListener('click', () => {
    cancelCountdown();
    stateMachine.set('landing');
  });

  faceLabel.style.display = 'none';
  handLeftLabel.style.display = 'none';
  handRightLabel.style.display = 'none';

  // ─── Landing page controls ────────────────────────────────────
  landingPlay.addEventListener('click', () => {
    inputManager.setAutoAccelerate(true);
    stateMachine.set('ready');
    if (game) game.setHandData(0.5, 2);
    startCountdown(() => {
      game.start();
      stateMachine.set('racing');
    });
  });

  landingSettings.addEventListener('click', () => stateMachine.set('settings'));
  landingLearn.addEventListener('click', () => stateMachine.set('howtoplay'));

  navTitle.addEventListener('click', () => {
    stateMachine.set('landing');
    if (game) game.setGameOver();
  });
  navTitle.style.cursor = 'pointer';

  if (!resources.externalHandsReady() || !resources.externalCameraUtilsReady()) {
    throw new Error('MediaPipe scripts failed to load — camera hand tracking unavailable. Keyboard and touch still work.');
  }

  tracker = new HandTracker(video, onHandData);
  tracker.setSmoothing(1 - (saveManager.sensitivity / 100) * 0.6);
  try {
    await tracker.start();
    cameraActive = true;
    camError.classList.add('hidden');
  } catch {
    cameraActive = false;
    camError.classList.remove('hidden');
    camError.querySelectorAll('span')[1].textContent = 'Camera permission denied';
    faceLabel.style.display = 'none';
    handLeftLabel.style.display = 'none';
    handRightLabel.style.display = 'none';
  }

  window.addEventListener('beforeunload', () => {
    game?.dispose();
    audioManager.dispose();
  });

  updateStatus();
  gameLoop();
}

init().catch((err: unknown) => {
  const msg = err instanceof Error ? err.stack || err.message : String(err);
  const el = document.getElementById('error-display') || (() => {
    const d = document.createElement('div');
    d.id = 'error-display';
    d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#e10600;color:#fff;padding:16px 24px;font-family:monospace;font-size:14px;white-space:pre-wrap;word-break:break-all;border-bottom:3px solid #ff4444';
    document.body.prepend(d);
    return d;
  })();
  el.textContent = 'ERROR: ' + msg;
  el.style.display = 'block';
});
