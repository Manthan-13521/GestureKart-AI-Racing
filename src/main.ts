import { HandTracker, HandData, getDirection, HAND_CONNECTIONS } from './input/HandTracker';
import { KeyboardHandler, GameKeys } from './input/Keyboard';
import { Game, GameState } from './game/Game';

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

const countdownOverlay = document.getElementById('countdown-overlay')!;
const countdownNum = document.getElementById('countdown-num')!;

const statusAuto = document.getElementById('status-auto')!;
const statusAutoDot = document.getElementById('status-auto-dot')!;
const speedVignette = document.getElementById('speed-vignette')!;
const collisionFlash = document.getElementById('collision-flash')!;

const resultsRetry = document.getElementById('results-retry')!;
const resultsMenu = document.getElementById('results-menu')!;

const menuOverlay = document.getElementById('menu-overlay')!;
const howtoplayOverlay = document.getElementById('howtoplay-overlay')!;
const settingsOverlay = document.getElementById('settings-overlay')!;
const menuStart = document.getElementById('menu-start')!;
const menuHowtoplay = document.getElementById('menu-howtoplay')!;
const menuSettings = document.getElementById('menu-settings')!;
const htpBack = document.getElementById('htp-back')!;
const settingsBack = document.getElementById('settings-back')!;
const menuSensitivitySlider = document.getElementById('menu-sensitivity-slider') as HTMLInputElement;
const menuSensitivityValue = document.getElementById('menu-sensitivity-value')!;
const menuAutoToggle = document.getElementById('menu-auto-toggle')!;

const panelLeft = document.getElementById('panel-left')!;
const panelToggle = document.getElementById('panel-toggle')!;

// ─── State ──────────────────────────────────────────────────────────
let game: Game;
let tracker: HandTracker;
let keys: GameKeys = { up: false, down: false, left: false, right: false };
let cameraActive = false;
let handTrackingActive = false;
let autoAccelerate = false;
let gyroscopeMode = false;
let gyroTilt = 0;

// Audio
let audioCtx: AudioContext | null = null;
let engineOsc: OscillatorNode | null = null;
let engineGain: GainNode | null = null;
let subOsc: OscillatorNode | null = null;
let subGain: GainNode | null = null;
let engineRunning = false;

// Countdown
let countdownActive = false;
let countdownTimer = 0;
let countdownStep = 3;
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

  ctx.shadowColor = 'rgba(0, 255, 65, 0.5)';
  ctx.shadowBlur = 10;

  for (const [i, j] of HAND_CONNECTIONS) {
    if (i < lm.length && j < lm.length) {
      ctx.strokeStyle = 'rgba(0, 255, 65, 0.15)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(lm[i].x * w, lm[i].y * h);
      ctx.lineTo(lm[j].x * w, lm[j].y * h);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(150, 255, 200, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lm[i].x * w, lm[i].y * h);
      ctx.lineTo(lm[j].x * w, lm[j].y * h);
      ctx.stroke();
    }
  }

  for (const p of lm) {
    ctx.shadowBlur = 8;
    ctx.fillStyle = 'rgba(0, 255, 65, 0.25)';
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 4;
    ctx.fillStyle = 'rgba(150, 255, 200, 0.5)';
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 12;
  for (const tipIdx of [4, 8, 12, 16, 20]) {
    if (tipIdx < lm.length) {
      const p = lm[tipIdx];
      ctx.fillStyle = 'rgba(0, 255, 65, 0.7)';
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(200, 255, 220, 0.9)';
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
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
  statusAuto.textContent = autoAccelerate ? 'ON' : 'OFF';
  statusAuto.className = `status-val ${autoAccelerate ? '' : 'inactive'}`;
  statusAutoDot.style.background = autoAccelerate ? 'var(--gold)' : 'var(--text3)';
  statusAutoDot.style.boxShadow = autoAccelerate ? '0 0 5px var(--gold)' : 'none';
}

// ─── Countdown ─────────────────────────────────────────────────────
function startCountdown(callback: () => void): void {
  if (countdownActive) return;
  countdownActive = true;
  countdownStep = 3;
  countdownOverlay.classList.remove('hidden');
  countdownNum.textContent = '3';
  countdownNum.className = 'countdown-num';

  // Reset animation
  countdownNum.style.animation = 'none';
  void countdownNum.offsetHeight;
  countdownNum.style.animation = '';

  let step = 3;
  countdownInterval = setInterval(() => {
    step--;
    if (step > 0) {
      countdownNum.textContent = `${step}`;
      countdownNum.className = 'countdown-num';
      countdownNum.style.animation = 'none';
      void countdownNum.offsetHeight;
      countdownNum.style.animation = '';
    } else if (step === 0) {
      countdownNum.textContent = 'GO';
      countdownNum.className = 'countdown-num go';
      countdownNum.style.animation = 'none';
      void countdownNum.offsetHeight;
      countdownNum.style.animation = '';
    } else {
      clearInterval(countdownInterval!);
      countdownInterval = null;
      countdownActive = false;
      countdownOverlay.classList.add('hidden');
      callback();
    }
  }, 800);
}

function cancelCountdown(): void {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  countdownActive = false;
  countdownOverlay.classList.add('hidden');
}

// ─── Keyboard callback ─────────────────────────────────────────────
function onKeys(newKeys: GameKeys): void {
  keys = newKeys;
  const keyBoxes = document.querySelectorAll('.key-box');
  for (const box of keyBoxes) {
    const k = box.getAttribute('data-key');
    if (k === 'w') box.classList.toggle('active', keys.up);
    if (k === 'a') box.classList.toggle('active', keys.left);
    if (k === 'd') box.classList.toggle('active', keys.right);
  }
  const uBox = document.querySelector('.key-box[data-key="u"]')!;
  uBox.classList.toggle('active', autoAccelerate);

  if (game) {
    if (keys.up) {
      game.setHandData(game.steerCenterX, 2);
      if (!game.started || game.gameOver) {
        if (menuOverlay.classList.contains('visible')) return;
        cancelCountdown();
        startCountdown(() => {
          game.start();
          document.getElementById('game-overlay')!.classList.remove('visible');
          document.getElementById('game-over-overlay')!.classList.remove('visible');
        });
      }
    } else if (keys.left || keys.right) {
      const steerX = keys.left ? 0 : 1;
      game.setHandData(steerX, autoAccelerate ? 2 : 1);
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
  game.setHandData(data.centerX, autoAccelerate ? 2 : data.handsDetected);

  if (data.landmarks.length > 0) {
    game.setHandSkeleton(data.landmarks[0]);
  }

  if (!game.started && data.handsDetected >= 2 && !countdownActive) {
    landing.classList.remove('visible');
    if (menuOverlay.classList.contains('visible')) return;
    if (howtoplayOverlay.classList.contains('visible')) return;
    if (settingsOverlay.classList.contains('visible')) return;
    menuOverlay.classList.add('visible');
    document.getElementById('game-overlay')!.classList.remove('visible');
    document.getElementById('game-over-overlay')!.classList.remove('visible');
  }

  if (game.gameOver && data.handsDetected >= 2 && !countdownActive) {
    startCountdown(() => {
      game.start();
      document.getElementById('game-over-overlay')!.classList.remove('visible');
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
    if (autoAccelerate && !keys.up) {
      let steerX = game.steerCenterX;
      if (touchActive) {
        // touch steering already set by applyTouchState
      } else if (gyroscopeMode) {
        steerX = 0.5 + gyroTilt * 0.4;
      } else if (keys.left || keys.right) {
        steerX = keys.left ? 0 : 1;
      }
      game.setHandData(steerX, 2);
      if (!game.started) {
        if (menuOverlay.classList.contains('visible')) return;
        startCountdown(() => {
          game.start();
          menuOverlay.classList.remove('visible');
          howtoplayOverlay.classList.remove('visible');
          settingsOverlay.classList.remove('visible');
          document.getElementById('game-overlay')!.classList.remove('visible');
          document.getElementById('game-over-overlay')!.classList.remove('visible');
        });
      }
    }
    // Gyroscope layer
    else if (gyroscopeMode && !touchActive && !keys.left && !keys.right) {
      const gyroCenterX = 0.5 + gyroTilt * 0.4;
      const gyroHands = keys.up ? 2 : 0;
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
      updateEngineSound(state.speed);
    } else {
      stopEngineSound();
      const ctx = gameOverlayCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, gameOverlayCanvas.width, gameOverlayCanvas.height);
      speedVignette.style.opacity = '0';
    }

    // Juice: collision flash
    if (state.justCollided) {
      collisionFlash.classList.add('active');
      playCollisionSound();
      setTimeout(() => collisionFlash.classList.remove('active'), 450);
    }

    const startOvr = document.getElementById('game-overlay')!;
    const gameOverOvr = document.getElementById('game-over-overlay')!;
    const finalScoreEl = document.getElementById('final-score')!;
    if (state.started && !state.gameOver) {
      startOvr.classList.remove('visible');
      gameOverOvr.classList.remove('visible');
      menuOverlay.classList.remove('visible');
      howtoplayOverlay.classList.remove('visible');
      settingsOverlay.classList.remove('visible');
    } else if (state.gameOver) {
      startOvr.classList.remove('visible');
      gameOverOvr.classList.add('visible');
      finalScoreEl.textContent = `${Math.floor(state.score)}`;
    } else if (!menuOverlay.classList.contains('visible') &&
               !howtoplayOverlay.classList.contains('visible') &&
               !settingsOverlay.classList.contains('visible')) {
      startOvr.classList.add('visible');
      gameOverOvr.classList.remove('visible');
    }
  }

  requestAnimationFrame(gameLoop);
}

// ─── Sensitivity ───────────────────────────────────────────────────
function setupSensitivity(): void {
  sensitivitySlider.addEventListener('input', () => {
    const val = parseInt(sensitivitySlider.value, 10);
    sensitivityValue.textContent = `${val}%`;
    const alpha = val / 100;
    if (tracker) tracker.setSmoothing(1 - alpha * 0.6);
    if (game) game.setSensitivity(alpha);
  });
}

// ─── Resize ────────────────────────────────────────────────────────
function handleResize(): void {
  if (!game) return;
  const viewport = document.getElementById('game-viewport')!;
  game.resize(viewport.clientWidth, viewport.clientHeight);
}

// ─── Touch Controls ────────────────────────────────────────────────
let touchActive = false;
let touchLeftHeld = false;
let touchRightHeld = false;
let touchUpHeld = false;

function setupTouchControls(): void {
  const touchLeft = document.getElementById('touch-left')!;
  const touchRight = document.getElementById('touch-right')!;
  const touchAccel = document.getElementById('touch-accel')!;
  const touchAuto = document.getElementById('touch-auto')!;
  const modeLabel = document.getElementById('touch-mode-label')!;

  function applyTouchState(): void {
    if (!game) return;
    touchActive = touchLeftHeld || touchRightHeld || touchUpHeld;
    if (touchUpHeld) {
      let steerX = 0.5;
      if (touchLeftHeld) steerX = 0;
      else if (touchRightHeld) steerX = 1;
      game.setHandData(steerX, 2);
      if (!game.started || game.gameOver) {
        if (menuOverlay.classList.contains('visible')) return;
        cancelCountdown();
        startCountdown(() => {
          game.start();
          menuOverlay.classList.remove('visible');
          howtoplayOverlay.classList.remove('visible');
          settingsOverlay.classList.remove('visible');
          document.getElementById('game-overlay')!.classList.remove('visible');
          document.getElementById('game-over-overlay')!.classList.remove('visible');
        });
      }
    } else if (touchLeftHeld) {
      game.setHandData(0, autoAccelerate ? 2 : 1);
    } else if (touchRightHeld) {
      game.setHandData(1, autoAccelerate ? 2 : 1);
    }
  }

  function bindTouch(el: HTMLElement, key: 'left' | 'right' | 'up'): void {
    const setHeld = (held: boolean) => {
      if (key === 'left') touchLeftHeld = held;
      else if (key === 'right') touchRightHeld = held;
      else touchUpHeld = held;
      el.classList.toggle('pressed', held);
      applyTouchState();
    };
    el.addEventListener('touchstart', (e) => { e.preventDefault(); setHeld(true); }, { passive: false });
    el.addEventListener('touchend', (e) => { e.preventDefault(); setHeld(false); }, { passive: false });
    el.addEventListener('touchcancel', () => setHeld(false));
    el.addEventListener('mousedown', () => setHeld(true));
    el.addEventListener('mouseup', () => setHeld(false));
    el.addEventListener('mouseleave', () => setHeld(false));
  }

  bindTouch(touchLeft, 'left');
  bindTouch(touchRight, 'right');
  bindTouch(touchAccel, 'up');

  touchAuto.addEventListener('click', () => {
    autoAccelerate = !autoAccelerate;
    touchAuto.classList.toggle('active', autoAccelerate);
    const uBox = document.querySelector('.key-box[data-key="u"]');
    if (uBox) uBox.classList.toggle('active', autoAccelerate);
    updateStatus();
    if (touchActive) applyTouchState();
  });

  let lastTap = 0;
  modeLabel.addEventListener('click', () => {
    const now = Date.now();
    if (now - lastTap < 400) {
      gyroscopeMode = !gyroscopeMode;
      modeLabel.textContent = gyroscopeMode ? 'GYRO' : 'TOUCH';
      deviceOrientationInit();
      updateStatus();
    }
    lastTap = now;
  });
}

// ─── Gyroscope ─────────────────────────────────────────────────────
let orientationListener: ((e: DeviceOrientationEvent) => void) | null = null;

function deviceOrientationInit(): void {
  if (orientationListener) {
    window.removeEventListener('deviceorientation', orientationListener);
    orientationListener = null;
  }
  if (!gyroscopeMode) return;

  orientationListener = (e: DeviceOrientationEvent) => {
    if (e.gamma == null) return;
    gyroTilt = Math.max(-1, Math.min(1, e.gamma / 45));
  };

  if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
    (DeviceOrientationEvent as any).requestPermission().then((state: string) => {
      if (state === 'granted') window.addEventListener('deviceorientation', orientationListener!);
    });
  } else {
    window.addEventListener('deviceorientation', orientationListener);
  }
}

// ─── Audio Engine ──────────────────────────────────────────────────
function initAudio(): void {
  if (audioCtx) return;
  try {
    audioCtx = new AudioContext();
    engineGain = audioCtx.createGain();
    engineGain.gain.value = 0;
    engineGain.connect(audioCtx.destination);

    engineOsc = audioCtx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 60;
    engineOsc.connect(engineGain);
    engineOsc.start();

    subGain = audioCtx.createGain();
    subGain.gain.value = 0;
    subGain.connect(audioCtx.destination);

    subOsc = audioCtx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.value = 30;
    subOsc.connect(subGain);
    subOsc.start();

    engineRunning = true;
  } catch { /* audio not available */ }
}

function updateEngineSound(speed: number): void {
  if (!engineOsc || !engineGain || !subOsc || !subGain || !audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const freq = 60 + speed * 80;
  const vol = speed > 0.1 ? 0.04 + speed * 0.02 : 0;
  const subVol = speed > 0.1 ? 0.06 + speed * 0.015 : 0;
  engineOsc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.1);
  engineGain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.1);
  subOsc.frequency.setTargetAtTime(freq * 0.5, audioCtx.currentTime, 0.15);
  subGain.gain.setTargetAtTime(subVol, audioCtx.currentTime, 0.15);
}

function playCollisionSound(): void {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = 120;
  gain.gain.value = 0.15;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
  osc.stop(audioCtx.currentTime + 0.3);
}

function stopEngineSound(): void {
  if (engineGain && audioCtx) {
    engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
  }
  if (subGain && audioCtx) {
    subGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
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

  const numLines = Math.floor(intensity * 45);
  speedLineOffset += speed * 0.4;

  const steerOffset = (steerX - 0.5) * 0.3;

  for (let i = 0; i < numLines; i++) {
    const seed = (i * 7919 + 31) % 1000 / 1000;
    const seed2 = (i * 6271 + 17) % 1000 / 1000;
    const angle = seed * Math.PI * 2 + steerOffset;
    const startR = (seed2 * 0.15 + 0.25) * Math.min(w, h) * 0.5;
    const len = 40 + intensity * 120 + seed * 60;
    const offset = (speedLineOffset * (0.5 + seed * 0.5) + seed * 80) % (startR + len);

    const x1 = w / 2 + Math.cos(angle) * offset;
    const y1 = h / 2 + Math.sin(angle) * offset;
    const x2 = w / 2 + Math.cos(angle) * (offset + len);
    const y2 = h / 2 + Math.sin(angle) * (offset + len);

    const alpha = Math.max(0, 1 - offset / (startR + len)) * intensity * 0.4;
    const hue = 200 + seed * 40;
    ctx.strokeStyle = `hsla(${hue}, 80%, 70%, ${alpha})`;
    ctx.lineWidth = 1 + seed * 2;

    ctx.globalAlpha = Math.max(0, 1 - offset / (startR + len));
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  for (let i = 0; i < Math.floor(intensity * 8); i++) {
    const seed = (i * 5557 + 13) % 1000 / 1000;
    const x = w * (0.1 + seed * 0.8);
    const y = h * (0.1 + seed * 0.8);
    const l = 20 + intensity * 60;
    ctx.globalAlpha = intensity * 0.15 * (1 - seed * 0.5);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + steerOffset * l * 0.5, y - l);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ─── Init ──────────────────────────────────────────────────────────
async function init(): Promise<void> {
  game = new Game(gameCanvas);
  handleResize();
  window.addEventListener('resize', handleResize);

  new KeyboardHandler(onKeys);
  setupSensitivity();
  setupTouchControls();
  deviceOrientationInit();

  // Init audio on first interaction
  const initAudioOnce = () => { initAudio(); window.removeEventListener('click', initAudioOnce); window.removeEventListener('keydown', initAudioOnce); window.removeEventListener('touchstart', initAudioOnce); };
  window.addEventListener('click', initAudioOnce, { once: true });
  window.addEventListener('keydown', initAudioOnce, { once: true });
  window.addEventListener('touchstart', initAudioOnce, { once: true });

  // U key toggle
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'u') {
      e.preventDefault();
      autoAccelerate = !autoAccelerate;
      const touchAuto = document.getElementById('touch-auto');
      if (touchAuto) touchAuto.classList.toggle('active', autoAccelerate);
      const uBox = document.querySelector('.key-box[data-key="u"]');
      if (uBox) uBox.classList.toggle('active', autoAccelerate);
      updateStatus();
    }
  });

  // ─── Menu flow ──────────────────────────────────────────────
  function showMenu(screen: 'menu' | 'howtoplay' | 'settings' | 'game'): void {
    menuOverlay.classList.toggle('visible', screen === 'menu');
    howtoplayOverlay.classList.toggle('visible', screen === 'howtoplay');
    settingsOverlay.classList.toggle('visible', screen === 'settings');
    document.getElementById('game-overlay')!.classList.toggle('visible', screen === 'game');
  }

  menuStart.addEventListener('click', () => {
    showMenu('game');
    const startOvr = document.getElementById('game-overlay')!;
    startOvr.classList.add('visible');
    document.getElementById('game-over-overlay')!.classList.remove('visible');
    cancelCountdown();
    if (autoAccelerate) {
      startCountdown(() => {
        game.start();
        menuOverlay.classList.remove('visible');
        howtoplayOverlay.classList.remove('visible');
        settingsOverlay.classList.remove('visible');
        document.getElementById('game-overlay')!.classList.remove('visible');
        document.getElementById('game-over-overlay')!.classList.remove('visible');
      });
    }
  });

  menuHowtoplay.addEventListener('click', () => showMenu('howtoplay'));
  htpBack.addEventListener('click', () => showMenu('menu'));

  menuSettings.addEventListener('click', () => {
    menuSensitivitySlider.value = sensitivitySlider.value;
    menuSensitivityValue.textContent = `${sensitivitySlider.value}%`;
    menuAutoToggle.textContent = autoAccelerate ? 'ON' : 'OFF';
    menuAutoToggle.classList.toggle('active', autoAccelerate);
    showMenu('settings');
  });

  settingsBack.addEventListener('click', () => {
    const val = parseInt(menuSensitivitySlider.value, 10);
    sensitivitySlider.value = `${val}`;
    sensitivityValue.textContent = `${val}%`;
    const alpha = val / 100;
    if (tracker) tracker.setSmoothing(1 - alpha * 0.85);
    if (game) game.setSensitivity(alpha);
    showMenu('menu');
  });

  menuSensitivitySlider.addEventListener('input', () => {
    const val = parseInt(menuSensitivitySlider.value, 10);
    menuSensitivityValue.textContent = `${val}%`;
  });

  menuAutoToggle.addEventListener('click', () => {
    autoAccelerate = !autoAccelerate;
    menuAutoToggle.textContent = autoAccelerate ? 'ON' : 'OFF';
    menuAutoToggle.classList.toggle('active', autoAccelerate);
    const touchAuto = document.getElementById('touch-auto');
    if (touchAuto) touchAuto.classList.toggle('active', autoAccelerate);
    const uBox = document.querySelector('.key-box[data-key="u"]');
    if (uBox) uBox.classList.toggle('active', autoAccelerate);
    updateStatus();
  });

  // Results buttons
  resultsRetry.addEventListener('click', () => {
    cancelCountdown();
    startCountdown(() => {
      game.start();
      document.getElementById('game-over-overlay')!.classList.remove('visible');
    });
  });

  resultsMenu.addEventListener('click', () => {
    cancelCountdown();
    document.getElementById('game-over-overlay')!.classList.remove('visible');
    landing.classList.add('visible');
  });

  faceLabel.style.display = 'none';
  handLeftLabel.style.display = 'none';
  handRightLabel.style.display = 'none';

  // ─── Landing page controls ────────────────────────────────────
  landingPlay.addEventListener('click', () => {
    landing.classList.remove('visible');
    document.getElementById('menu-overlay')!.classList.add('visible');
    document.getElementById('howtoplay-overlay')!.classList.remove('visible');
    document.getElementById('settings-overlay')!.classList.remove('visible');
    document.getElementById('game-overlay')!.classList.remove('visible');
    document.getElementById('game-over-overlay')!.classList.remove('visible');
  });

  landingSettings.addEventListener('click', () => {
    landing.classList.remove('visible');
    document.getElementById('menu-overlay')!.classList.remove('visible');
    document.getElementById('settings-overlay')!.classList.add('visible');
  });

  landingLearn.addEventListener('click', () => {
    landing.classList.remove('visible');
    document.getElementById('menu-overlay')!.classList.remove('visible');
    document.getElementById('howtoplay-overlay')!.classList.add('visible');
  });

  navTitle.addEventListener('click', () => {
    landing.classList.add('visible');
    if (game) game.setGameOver();
    document.getElementById('game-over-overlay')!.classList.remove('visible');
    document.getElementById('game-overlay')!.classList.add('visible');
    document.getElementById('menu-overlay')!.classList.remove('visible');
    document.getElementById('howtoplay-overlay')!.classList.remove('visible');
    document.getElementById('settings-overlay')!.classList.remove('visible');
  });
  navTitle.style.cursor = 'pointer';

  tracker = new HandTracker(video, onHandData);
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

  updateStatus();
  gameLoop();
}

init();
