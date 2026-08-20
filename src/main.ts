import { HandTracker, HandData, getDirection, HAND_CONNECTIONS } from './input/HandTracker';
import type { GameKeys } from './input/Keyboard';
import { Game, GameState } from './game/Game';
import { AppEvents, EventBus } from './core/EventBus';
import { StateMachine } from './core/StateMachine';
import type { GamePhase } from './core/AppState';
import { Countdown } from './core/Countdown';
import { RaceIntro, type RaceIntroTarget } from './core/RaceIntro';
import { RaceStartPipeline } from './core/RaceStartPipeline';
import { ResourceManager } from './managers/ResourceManager';
import { AudioManager } from './managers/AudioManager';
import { SaveManager } from './managers/SaveManager';
import { InputManager } from './managers/InputManager';
import { FrameBudgetScaler, resolveQualityConfig } from './managers/QualityManager';
import { PhoneSource, type PhoneStatePayload } from './input/PhoneSource';
import { HandSource } from './input/sources/HandSource';
import { centerFromSteer, handsFromThrottle } from './input/InputFrame';
import { profileManager } from './managers/ProfileManager';
import { UIManager } from './managers/UIManager';
import { NavigationSystem } from './ui/core/NavigationSystem';
import { FocusRing } from './ui/core/FocusRing';
import { NotificationSystem } from './ui/core/NotificationSystem';
import { SoundHooks } from './ui/core/SoundHooks';
import { ThemeManager } from './ui/ThemeManager';
import { buildFlow, lastSelection, type FlowApi } from './screens/flow';
import { ReplayRuntime, GhostHud } from './replay';
import type { ReplayOutcome } from './replay';
import { InputReplayRecorder } from './replay/input/recorder';
import { ReplayInputSource } from './replay/input/source';
import { validateInputReplay, type InputReplayData } from './replay/input/types';
import {
  stepFreeCamera,
  lookFreeCamera,
  slowMoDelta,
  VIEWER_DEFAULTS,
  type FreeCameraState,
  type ViewerKeys,
} from './replay/viewer';
import type { TrackId } from './screens/TrackSelectScreen';
import type { ModeId } from './screens/ModeSelectScreen';
import { GAME_MODES, raceModeFor } from './game/GameModeConfig';
import { AIRuntime } from './ai/AIRuntime';
import { AIHud } from './ai/AIHud';
import { RaceDirector } from './game/RaceDirector';
import { tournamentManager } from './game/TournamentManager';
import type { DivisionId } from './game/TournamentManager';
import { victoryCeremony } from './ui/VictoryCeremony';
import type { DifficultyTier } from './ai/AIIdentity';
import { chameleonAdapter } from './ai/ChameleonAdapter';
import type { NetworkManager } from './network/NetworkManager';
import { RemotePlayerManager } from './network/RemotePlayerManager';
import { RaceFeedbackWatcher } from './ui/RaceFeedbackWatcher';
import { RaceResultGate } from './progression/RaceResultGate';

/** Maps a tournament division to an AI difficulty tier (GDD §9.3). */
function tierForDivision(division: DivisionId): DifficultyTier {
  switch (division) {
    case 'rookie':
      return 'easy';
    case 'pro':
      return 'medium';
    case 'elite':
      return 'hard';
    case 'champion':
      return 'expert';
    default:
      return 'medium';
  }
}

// ─── Core systems ──────────────────────────────────────────────────
const resources = new ResourceManager();
const bus = new EventBus();
const stateMachine = new StateMachine();
const saveManager = new SaveManager();
const audioManager = new AudioManager();
const inputManager = new InputManager(bus);
const phoneSource = new PhoneSource(bus);
const handSource = new HandSource();
inputManager.registerSource(phoneSource);
inputManager.registerSource(handSource);
const ui = new UIManager();
const themeManager = new ThemeManager(saveManager.a11y);

// Storm lightning edge-detect (GDD §12.2).
let lastWeatherKind: string = 'clear';

// ─── DOM refs ───────────────────────────────────────────────────────
const navTitle = document.querySelector('.nav-title') as HTMLElement;
const video = document.getElementById('webcam') as HTMLVideoElement;
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

// P4: Combo & Boost HUD
const hudCombo = document.getElementById('hud-combo')!;
const hudComboVal = document.getElementById('hud-combo-val')!;
const hudComboRingFill = document.getElementById('hud-combo-ring-fill');
const hudBoost = document.getElementById('hud-boost')!;
const hudBoostFill = document.getElementById('hud-boost-fill')!;
const hudBoostLabel = document.getElementById('hud-boost-label')!;

const statusAuto = document.getElementById('status-auto')!;
const statusAutoDot = document.getElementById('status-auto-dot')!;
const statusPhone = document.getElementById('status-phone')!;
const speedVignette = document.getElementById('speed-vignette')!;
const collisionFlash = document.getElementById('collision-flash')!;
const nearMissGlow = document.getElementById('near-miss-glow')!;

// P7.3: one-shot race-state feedback elements
const raceFlash = document.getElementById('race-flash')!;
const posChangePop = document.getElementById('pos-change-pop')!;
const posChangePopNum = document.getElementById('pos-change-pop-num')!;
const posChangePopArrow = document.getElementById('pos-change-pop-arrow')!;
const hudPositionChip = document.getElementById('hud-position-chip')!;

const resultsRetry = document.getElementById('results-retry')!;
const resultsReplay = document.getElementById('results-replay')!;
const resultsMenu = document.getElementById('results-menu')!;
const resultsGhostLine = document.getElementById('results-ghost-line')!;
const resultsWatchReplay = document.getElementById('results-watch-replay')!;
const replayActiveStrip = document.getElementById('replay-active-strip')!;
const replayActiveExit = document.getElementById('replay-active-exit')!;
const replayCompletePanel = document.getElementById('replay-complete-panel')!;
const replayCompleteMenu = document.getElementById('replay-complete-menu')!;

const replayOverlay = document.getElementById('replay-overlay')!;
const replayClose = document.getElementById('replay-close')!;
const replayCamChase = document.getElementById('replay-cam-chase')!;
const replayCamOrbit = document.getElementById('replay-cam-orbit')!;
const replayCamCine = document.getElementById('replay-cam-cine')!;
const replayCamFree = document.getElementById('replay-cam-free')!;
const replaySlowMo = document.getElementById('replay-slow-mo')!;
const replayFilterGrain = document.getElementById('replay-filter-grain') as HTMLInputElement;
const replayFilterContrast = document.getElementById('replay-filter-contrast') as HTMLInputElement;
const replayFilterFocus = document.getElementById('replay-filter-focus') as HTMLInputElement;
const replayPhoto = document.getElementById('replay-photo')!;

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
let replayRuntime: ReplayRuntime;
let aiRuntime: AIRuntime | null = null;
let aiHud: AIHud | null = null;
let raceDirector: RaceDirector | null = null;
let currentModeId: ModeId = 'survival';
let currentTrackId: TrackId = 'cyber-city';
let activeNetwork: NetworkManager | null = null;
let remotePlayers: RemotePlayerManager | null = null;

// P9: how the current race instance is executed. `replay` playback runs the
// real game loop and can reach game-over, but is barred from progression,
// persistence and tournament side effects (see the game-over handler).
let raceExecutionMode: 'live' | 'replay' = 'live';

// P9: session-only input replay (recorder → finished payload → playback
// source). Never persisted, never written into any storage key.
const inputReplayRecorder = new InputReplayRecorder();
let activeInputReplay: InputReplayData | null = null;
let replaySource: ReplayInputSource | null = null;
let lastReplayStripSec = -1;

// P8.2: single authoritative race-completion boundary. `currentRaceId` is the
// idempotency key for the running race instance (see RaceResultGate).
const raceResultGate = new RaceResultGate(profileManager, tournamentManager);
let currentRaceId = '';

// Multiplayer: throttle broadcast to ~20Hz
let lastNetSendTime = 0;
const NET_SEND_INTERVAL = 50; // ms

// ─── Race start (single authoritative pre-race pipeline) ──────────
let pipeline: RaceStartPipeline | null = null;
let isReplaying = false;

// ─── P10: replay viewer camera state ──────────────────────────────
let viewerCam: FreeCameraState = { ...VIEWER_DEFAULTS };
let viewerSlowMo = false;
let viewerDragging = false;
let viewerLastPointerX = 0;
let viewerLastPointerY = 0;

let overlayFps = 0;
let fpsCounter = 0;
let lastFpsTime = performance.now();
let lastAiTickTime = performance.now();

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
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
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
      ? dir === 'LEFT'
        ? 'Steering left'
        : dir === 'RIGHT'
          ? 'Steering right'
          : 'Keep hands steady'
      : handsDetected === 1
        ? 'Show both hands'
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
            (data.landmarks[0][0].y - data.landmarks[1][0].y) ** 2
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

  // P4: Combo HUD (survival only)
  if (state.comboMultiplier !== undefined && state.comboMultiplier > 1) {
    hudCombo.classList.remove('hidden');
    hudComboVal.textContent = `×${state.comboMultiplier}`;
    // Pulse animation on multiplier change
    if (hudCombo.dataset.prevMult !== String(state.comboMultiplier)) {
      hudCombo.classList.add('pulse');
      hudCombo.dataset.prevMult = String(state.comboMultiplier);
    }
    // Combo ring (GDD §6.7): fill arc tracks the multiplier up to ×5.
    if (hudComboRingFill) {
      const fill = Math.min(1, (state.comboMultiplier - 1) / 4);
      hudComboRingFill.setAttribute('stroke-dashoffset', `${107 - fill * 107}`);
      hudCombo.classList.toggle('max', state.comboMultiplier >= 5);
    }
  } else {
    hudCombo.classList.add('hidden');
    hudCombo.dataset.prevMult = '1';
    if (hudComboRingFill) {
      hudComboRingFill.setAttribute('stroke-dashoffset', '107');
      hudCombo.classList.remove('max');
    }
  }

  // P4: Boost HUD (survival only)
  if (state.boostActive) {
    hudBoost.classList.remove('hidden');
    const pct = Math.max(0, state.boostTimeLeft / (state.boostMaxTime || 1.5));
    hudBoostFill.style.width = `${pct * 100}%`;
    hudBoostLabel.textContent = `BOOST ${Math.ceil(state.boostTimeLeft)}s`;
  } else {
    hudBoost.classList.add('hidden');
  }

  // P4: Near-miss toast (triggered via state change)
  if (state.nearMissEvent && game) {
    // Use NotificationSystem for toast
    const notify = NotificationSystem.getInstance();
    notify.notify('NEAR MISS', `+${state.nearMissEvent.reward}`, { kind: 'success' });
    // Audio + glow (GDD §12.2 near-miss whoosh, §6.7 near-miss glow)
    audioManager.playNearMiss();
    fireOnce(nearMissGlow, 'nearmiss', 480);
  }

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
  statusPhone.textContent = phoneSource.phoneConnected ? 'Connected' : '—';
  statusPhone.className = `status-val ${phoneSource.phoneConnected ? '' : 'inactive'}`;
}

// ─── P7.3: Race-state feedback (presentation only) ─────────────────
/**
 * One-shot DOM effect: restart a CSS animation by class, auto-remove after
 * the animation duration. Event-driven only — never called per frame.
 */
function fireOnce(el: HTMLElement, cls: string, duration: number): void {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  window.setTimeout(() => el.classList.remove(cls), duration);
}

/** Position-change pop next to the standing chip. */
function popPositionChange(to: number, gain: boolean): void {
  posChangePopNum.textContent = `P${to}`;
  posChangePopArrow.textContent = gain ? '▲' : '▼';
  posChangePop.className = `pos-change-pop ${gain ? 'gain' : 'loss'}`;
  void posChangePop.offsetWidth;
  posChangePop.classList.add('pop');
}

/**
 * Edge-detects race-state changes (position, first place, draft zones,
 * boost activation, laps) and drives one-shot visual feedback. All triggers
 * are derived — no race logic is touched.
 */
const raceFeedback = new RaceFeedbackWatcher({
  onPositionChange: (from, to, dir) => {
    if (!game || game.getState().gameOver) return;
    popPositionChange(to, dir === 'gain');
  },
  onLeadChange: (leading) => {
    hudPositionChip.classList.toggle('lead', leading);
  },
  onDraftEnter: () => {
    aiHud?.pulseDraft();
  },
  onDraftExit: () => {
    // Draft meter colors/labels already communicate the state change.
  },
  onBoostStart: () => {
    fireOnce(raceFlash, 'boost', 600);
    fireOnce(hudBoost, 'pulse', 600);
    audioManager.playBoost();
  },
  onLapChange: (from, to, totalLaps) => {
    fireOnce(hudLap, 'pulse', 700);
    NotificationSystem.getInstance().notify(`LAP ${to}/${totalLaps}`, 'LAP COMPLETE', {
      kind: 'info',
    });
  },
});

// ─── Auto-accelerate UI sync ───────────────────────────────────────
function syncAutoUI(on: boolean): void {
  touchAuto.classList.toggle('active', on);
  uBox.classList.toggle('active', on);
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

bus.on(AppEvents.phoneState, (st: PhoneStatePayload) => {
  updateStatus();
  if (!st.connected && game) {
    inputManager.setBase('phone', {
      steer: 0,
      throttle: game.handsDetected / 2,
      brake: 0,
      boostButton: false,
    });
    game.setHandData(0.5, game.handsDetected);
  }
});

// ─── Screen state → overlays ───────────────────────────────────────────
stateMachine.onChange((from, to) => {
  ui.sync(to);
  if (to === 'gameover') {
    // Audio lifecycle: stop the race music bed at the finish line.
    audioManager.stopMusic();
    const state = game.getState();
    const score = Math.floor(state.score);

    // ─── P9: replay playback reaching game-over ─────────────────────────
    // A replay can execute the full loop and finish, but it must never
    // produce progression, persistence, high-score or tournament side
    // effects. RaceResultGate is never consulted here.
    if (raceExecutionMode === 'replay') {
      stopReplayPlayback();
      replayActiveStrip.classList.add('hidden');
      const ceremonyContainer = document.getElementById('results-ceremony-container');
      if (ceremonyContainer) ceremonyContainer.classList.add('hidden');
      const actions = document.querySelector<HTMLElement>('.results-actions');
      if (actions) actions.classList.add('hidden');
      replayCompletePanel.classList.toggle('visible', true);
      // Defensive: ensure strip stays hidden after panel shows
      replayActiveStrip.classList.add('hidden');
      SoundHooks.raceFinish();
    } else {
      // ─── LIVE race: the only rewarded path ────────────────────────────
      ui.finalScore.textContent = `${score}`;
      saveManager.setBestScore(score);

      // P12: multiplayer race ended — release remote visuals now (the peer
      // connection stays alive until the player returns to the menu).
      if (remotePlayers) {
        remotePlayers.dispose();
        remotePlayers = null;
      }

      // Finalize the P9 input recording for this race (session-only).
      activeInputReplay = inputReplayRecorder.finish(score, state.raceTime);

      const outcome = replayRuntime.finish(score, state.raceTime);
      updateResultsGhostLine(outcome);
      const isAIRace = GAME_MODES[currentModeId].features.ai;
      const finishPos = raceDirector ? raceDirector.getState().position : isAIRace ? 6 : 0;
      // GDD §12.2: distinct victory / defeat audio instead of the generic fanfare.
      if (isAIRace) {
        if (finishPos === 1) audioManager.playVictory();
        else audioManager.playDefeat();
      } else {
        audioManager.playVictory();
      }
      SoundHooks.raceFinish();

      // P8.2: the ONLY progression boundary for completed races. The gate
      // awards rewards at most once per race instance no matter how many times
      // this transition is observed (retry/re-entry/duplicate callbacks).
      const gateOutcome = currentRaceId
        ? raceResultGate.complete({
            raceId: currentRaceId,
            mode: currentModeId,
            position: finishPos,
            score,
            division: isAIRace ? tournamentManager.activeState.division : null,
          })
        : null;
      const completion = gateOutcome?.completion ?? null;

      const ceremonyContainer = document.getElementById('results-ceremony-container');

      if (ceremonyContainer) {
        if (isAIRace) {
          const finishPos = raceDirector ? raceDirector.getState().position : 6;
          // Feed the Chameleon adapter so the Adaptive tier can recalibrate.
          chameleonAdapter.recordRace({ position: finishPos, gridSize: 6 });

          victoryCeremony.show(ceremonyContainer, {
            position: finishPos,
            pointsAwarded: gateOutcome?.tournament?.pointsAwarded ?? 0,
            coinsAwarded: completion?.rewards.coins ?? 0,
            xpAwarded: completion?.rewards.xp ?? 0,
            promoted: gateOutcome?.tournament?.promoted ?? false,
            finishedChampionship: gateOutcome?.tournament?.finishedChampionship ?? false,
            averageFinish: gateOutcome?.tournament?.averageFinish ?? 0,
            division: tournamentManager.activeState.division,
            nextTrackName: null,
            // P8.4: presentation straight from the gate outcome.
            totalXp: completion?.xpAfter ?? 0,
            totalCoins: completion?.coinsAfter ?? 0,
            levelBefore: completion?.levelBefore ?? 1,
            levelAfter: completion?.levelAfter ?? 1,
            levelsGained: completion?.levelsGained ?? 0,
            title: completion?.title ?? null,
            unlocked: completion?.unlocked ?? [],
          });
        } else {
          // P4c: Add score to high-score table
          const state = game.getState();
          saveManager.addHighScore({
            score,
            track: currentModeId === 'survival' ? 'endless' : currentModeId,
            mode: currentModeId,
            distance: state.playerDistance,
            combo: state.comboStreak,
          });

          // Check if this is a new high score for this track/mode
          const isNewRecord = saveManager.isHighScore(
            score,
            currentModeId === 'survival' ? 'endless' : currentModeId,
            currentModeId
          );
          if (isNewRecord) SoundHooks.newRecord();

          // Reset to default standard results screen layout
          const rewardsXp = completion?.rewards.xp ?? 0;
          const rewardsCoins = completion?.rewards.coins ?? 0;
          const levelUpBlock =
            (completion?.levelsGained ?? 0) > 0
              ? `<div class="ceremony-levelup" role="status">
                 <div class="ceremony-levelup-title">LEVEL UP!</div>
                 <div class="ceremony-levelup-text">LEVEL ${completion?.levelBefore} → LEVEL ${completion?.levelAfter}</div>
               </div>`
              : '';
          ceremonyContainer.innerHTML = `
          <div class="results-crown">&#127942;</div>
          <div class="results-title">RACE COMPLETE</div>
          <div class="results-score-row">
            <span class="results-label">SCORE</span>
            <span class="results-score" id="final-score">${score}</span>
            ${isNewRecord ? '<span class="results-new-record">NEW RECORD!</span>' : ''}
          </div>
          <div class="results-ghost-line ${outcome.ghostPresent ? '' : 'hidden'}" id="results-ghost-line"></div>
          <div class="results-highscores" id="results-highscores"></div>
          <div class="results-rewards">
            <div class="ceremony-grid">
              <div class="ceremony-stat">
                <div class="ceremony-stat-val">+${rewardsXp}</div>
                <div class="ceremony-stat-lbl">XP</div>
              </div>
              <div class="ceremony-stat">
                <div class="ceremony-stat-val">+${rewardsCoins}</div>
                <div class="ceremony-stat-lbl">COINS</div>
              </div>
            </div>
            <div class="ceremony-totals">
              <div class="ceremony-total">
                <div class="ceremony-total-val">${completion?.xpAfter ?? 0}</div>
                <div class="ceremony-total-lbl">TOTAL XP</div>
              </div>
              <div class="ceremony-total">
                <div class="ceremony-total-val">${completion?.coinsAfter ?? 0}</div>
                <div class="ceremony-total-lbl">COIN BALANCE</div>
              </div>
            </div>
            ${levelUpBlock}
          </div>
        `;
          // Make sure ghost line is correctly updated since we reset innerHTML
          const gl = ceremonyContainer.querySelector('#results-ghost-line');
          if (gl) {
            gl.textContent = resultsGhostLine.textContent;
            if (resultsGhostLine.classList.contains('hidden')) gl.classList.add('hidden');
            else gl.classList.remove('hidden');
          }

          // Render high-score table
          const hsContainer = ceremonyContainer.querySelector('#results-highscores');
          if (hsContainer) {
            const trackId = currentModeId === 'survival' ? 'endless' : currentModeId;
            const highScores = saveManager.getHighScores(trackId, currentModeId);
            if (highScores.length > 0) {
              const esc = (v: string | number): string =>
                String(v).replace(/[&<>"']/g, (c) => {
                  const m: Record<string, string> = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;',
                  };
                  return m[c] ?? c;
                });
              hsContainer.innerHTML = `
              <div class="results-hs-title">HIGH SCORES</div>
              <table class="results-hs-table">
                <thead>
                  <tr><th>RANK</th><th>SCORE</th><th>DATE</th></tr>
                </thead>
                <tbody>
                  ${highScores
                    .map(
                      (hs, i) => `
                    <tr class="${hs.timestamp === Date.now() ? 'new-record' : ''}">
                      <td>#${i + 1}</td>
                      <td>${esc(hs.score)}</td>
                      <td>${esc(new Date(hs.timestamp).toLocaleDateString())}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            `;
            }
          }
        }
      }
    } // end LIVE race branch (P9 isolation)

    // Tear down AI race systems
    if (aiRuntime) {
      aiRuntime.dispose();
      aiRuntime = null;
    }
    if (aiHud) {
      aiHud.setVisible(false);
    }
    if (raceDirector) {
      raceDirector.setGameOver();
    }
  }
});

/**
 * Race start (single path: resets game, starts replay + AI clocks).
 * P2.4: only reached from the pipeline countdown completion; the `started`
 * guard makes `Game.start()` fire exactly once per race attempt.
 */
function startGame(): void {
  victoryCeremony.stop();
  if (game.started) return;
  const isAIRace = GAME_MODES[currentModeId].features.ai;

  if (raceExecutionMode === 'live') {
    // P8.2: each race instance gets a fresh completion identity. Retry and
    // replay re-enter through this same single start path.
    currentRaceId = raceResultGate.beginRace();

    // P9: one race seed per live attempt. AI races keep the historical
    // deterministic grid seed (1337); other modes get a fresh random seed.
    // The seed is captured into the replay so playback reproduces setup.
    const seed = isAIRace ? 1337 : Math.floor(Math.random() * 0x7fffffff);
    game.setRaceSeed(seed);
    inputReplayRecorder.begin({
      mode: currentModeId,
      track: currentTrackId,
      seed,
      sensitivity: saveManager.sensitivity,
      trafficEnabled: game.gesturesEnabled,
      duration: game.getState().raceDuration,
    });
  } else {
    // P9 replay playback: restore the recorded deterministic setup. The
    // replay source (registered before the pipeline) is the only input.
    const replay = activeInputReplay;
    if (replay) {
      game.setRaceSeed(replay.seed);
      game.setSensitivity(replay.sensitivity);
      game.gesturesEnabled = replay.trafficEnabled;
    }
  }

  // P7.3: clean presentation edge state + one-shot GO kick.
  raceFeedback.reset();
  fireOnce(raceFlash, 'go', 450);

  // Configure game mode before start()
  game.setRaceMode(raceModeFor(currentModeId));
  game.start();
  stateMachine.set('racing');
  replayRuntime.begin(game.getState().raceDuration);
  // GDD §12.1 adaptive music: race bed keyed to intensity (updated per frame).
  audioManager.startMusic('race');

  // ─ AI Race: spin up the grid and HUD ───────────────────────────────
  if (isAIRace) {
    if (aiRuntime) aiRuntime.dispose();
    aiRuntime = new AIRuntime({
      scene: game.scene3d,
      carCount: 5,
      tier: tierForDivision(tournamentManager.activeState.division),
      // P9: the grid seed is deterministic and identical for live (1337)
      // and replay (recorded seed) — a replay reproduces the same grid.
      seed: raceExecutionMode === 'live' ? 1337 : (activeInputReplay?.seed ?? 1337),
      trackDistance: 2400,
    });
    aiRuntime.start();

    if (!aiHud) aiHud = new AIHud();
    aiHud.setVisible(true);

    if (!raceDirector) raceDirector = new RaceDirector();
    raceDirector.start(1, 6); // 1 lap, 6 total cars
  } else if (GAME_MODES[currentModeId].features.multiplayer && activeNetwork) {
    // Multiplayer: set up remote player visuals + listen for peer state.
    // P12: clear stale callbacks from previous races so handlers never
    // accumulate across repeated multiplayer sessions.
    activeNetwork.clearListeners();
    if (remotePlayers) remotePlayers.dispose();
    remotePlayers = new RemotePlayerManager(game.scene3d);

    activeNetwork.onMessage((_senderId, msg) => {
      if ((msg as { type?: string }).type === 'player_state') {
        const payload = (msg as { type: string; payload: unknown })
          .payload as import('./network/RemotePlayerManager').RemotePlayerState;
        remotePlayers?.receiveUpdate(payload);
      }
    });
    activeNetwork.onPeerDisconnected((id) => remotePlayers?.remove(id));

    if (!raceDirector) raceDirector = new RaceDirector();
    raceDirector.start(1, activeNetwork.getConnections().length + 1);
  } else {
    if (remotePlayers) {
      remotePlayers.dispose();
      remotePlayers = null;
    }
    if (aiRuntime) {
      aiRuntime.dispose();
      aiRuntime = null;
    }
    if (aiHud) aiHud.setVisible(false);
  }
}

function updateResultsGhostLine(outcome: ReplayOutcome): void {
  // Set text first so it is available regardless of visibility
  if (outcome.newBest && outcome.beatGhost) {
    resultsGhostLine.textContent = `NEW RECORD · GHOST BEATEN +${outcome.distDelta.toFixed(1)}m`;
  } else if (outcome.newBest) {
    resultsGhostLine.textContent = `NEW RECORD`;
  } else if (outcome.beatGhost) {
    resultsGhostLine.textContent = `GHOST BEATEN +${outcome.distDelta.toFixed(1)}m`;
  } else if (outcome.ghostPresent) {
    resultsGhostLine.textContent = `GHOST AHEAD −${(-outcome.distDelta).toFixed(1)}m`;
  } else {
    resultsGhostLine.textContent = '';
  }

  // Toggle visibility
  const shouldShow = outcome.ghostPresent || outcome.newBest;
  resultsGhostLine.classList.toggle('hidden', !shouldShow);

  // Show replay button if player drove enough distance
  resultsReplay.style.display = game && game.playerDistance > 100 ? 'block' : 'none';

  // P9: the deterministic input replay is offered only when a valid
  // recording exists for the race that just finished.
  resultsWatchReplay.style.display =
    activeInputReplay && game && game.playerDistance > 100 ? 'block' : 'none';
}

/**
 * P9 — deactivate replay playback; live input takes over again.
 */
function stopReplayPlayback(): void {
  if (replaySource) {
    replaySource.stop();
    inputManager.unregisterSource('replay');
    replaySource = null;
  }
}

/**
 * P9 — replay progress strip. DOM is touched at most once per second; the
 * strip is purely informational and never drives any game logic.
 */
function updateReplayStrip(): void {
  if (replaySource && !replayActiveStrip.classList.contains('hidden')) {
    const sec = Math.floor((game?.getState().raceTime ?? 0) / 1000);
    if (sec !== lastReplayStripSec) {
      lastReplayStripSec = sec;
      replayActiveStrip.setAttribute('data-progress', `${sec}`);
    }
  }
}

// ─── Countdown ─────────────────────────────────────────────────────
function restartCountdownAnim(): void {
  ui.countdownNum.style.animation = 'none';
  void ui.countdownNum.offsetHeight;
  ui.countdownNum.style.animation = '';
}

/**
 * Build the one authoritative race-start pipeline.
 *
 * P2.1 staging: a deterministic cinematic pull-in over the game camera.
 * P2.2 countdown: 3·2·1·GO backed by the single `Countdown` owner.
 * Racing can only start from the countdown completion beat.
 */
function buildRacePipeline(): RaceStartPipeline {
  const introTarget: RaceIntroTarget = {
    prepare() {
      game.cameraMode = 'cinematic';
      game.camera.fov = 90;
      game.camera.updateProjectionMatrix();
    },
    frame(p) {
      const eased = 1 - Math.pow(1 - p, 2);
      game.camera.position.set(Math.sin(p * Math.PI) * 3, 3.6 - 2.3 * eased, -7 + 7 * eased);
      game.camera.lookAt(0, 0.5, -1.5);
    },
    settle() {
      game.cameraMode = 'chase';
      game.updateCamera(1 / 60);
    },
  };

  const intro = new RaceIntro(introTarget, { duration: 1600, now: () => performance.now() });

  const countdown = new Countdown(
    {
      tick: (step) => {
        ui.showCountdown();
        ui.countdownNum.textContent = `${step}`;
        ui.countdownNum.className = 'countdown-num';
        restartCountdownAnim();
        SoundHooks.countdownTick();
      },
      go: () => {
        ui.countdownNum.textContent = 'GO';
        ui.countdownNum.className = 'countdown-num go';
        restartCountdownAnim();
        SoundHooks.raceStart();
      },
      clear: () => ui.hideCountdown(),
    },
    { intervalMs: 250 }
  );

  return new RaceStartPipeline({
    stateMachine,
    countdown,
    intro,
    onRacing: () => startGame(),
  });
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
    const steer = newKeys.left ? -1 : newKeys.right ? 1 : 0;
    const throttle = newKeys.up
      ? 1
      : newKeys.left || newKeys.right
        ? inputManager.autoAccelerate
          ? 1
          : 0.8
        : inputManager.autoAccelerate
          ? 1
          : 0;
    const brake = newKeys.down ? 1 : 0;

    inputManager.setBase('keyboard', {
      steer,
      throttle,
      brake,
      boostButton: false,
    });
  }
}

// ─── Hand tracker callback ────────────────────────────────────────
let lastHandDetectedTime = 0;
const HAND_PRESENCE_TIMEOUT_MS = 3000;
let handPresenceWarningShown = false;

function onHandData(data: HandData): void {
  handTrackingActive = true;
  updateStatus();

  if (!game) return;

  // Track hand presence for timeout warning
  if (data.handPresent) {
    lastHandDetectedTime = performance.now();
    if (handPresenceWarningShown) {
      handPresenceWarningShown = false;
      // Hand returned - could notify recovery if needed
    }
  }

  // Hand tracking always provides steering (centerX) for the game via the
  // base layer. The game loop applies keyboard/touch/phone overrides on top.
  handSource.update(data);
  const handFrame = handSource.read();
  const isKeyboardActive =
    inputManager.keys.left || inputManager.keys.right || inputManager.keys.up || inputManager.keys.down;
  if (!isKeyboardActive) {
    inputManager.setBase('hand', {
      steer: handFrame.steer,
      throttle: inputManager.autoAccelerate ? 1 : handFrame.throttle,
      brake: 0,
      boostButton: false,
    });
  }

  if (data.landmarks.length > 0) {
    game.setHandSkeleton(data.landmarks[0]);
  }

  drawCamOverlay(data);
  drawHandSkeleton(data);
  updateTelemetry(data);
}

// ─── Game loop ─────────────────────────────────────────────────────
function gameLoop(): void {
  fpsCounter++;
  const now = performance.now();
  const loopStart = performance.now();
  if (now - lastFpsTime >= 1000) {
    overlayFps = fpsCounter;
    fpsCounter = 0;
    lastFpsTime = now;
  }

  if (game) {
    // Unified input frame (phone → auto-accelerate → gyro → base priority).
    // The base layer holds hand/keyboard/touch values published by callbacks.
    const frame = inputManager.frame(game.steerCenterX);
    game.setHandData(centerFromSteer(frame.steer), handsFromThrottle(frame.throttle));

    // Drive the pre-race staging timeline (no-op outside the intro phase).
    pipeline?.tick(performance.now());

    game.update();
    // P12: the menu/settings screens are fully opaque DOM, so the 3D scene is
    // never visible while idle — skip the render to avoid burning GPU on
    // hidden frames. Rendering resumes the moment a race phase begins.
    if (!stateMachine.isIdle()) {
      game.render();
    }

    const state = game.getState();
    updateSteeringUI(game.steerCenterX, game.handsDetected);
    updateGameHUD(state);

    // P9: capture the exact input frame applied this iteration (live races
    // only). Playback replays the same per-iteration frame sequence.
    if (raceExecutionMode === 'live') {
      inputReplayRecorder.record(frame, state.raceTime);
    }
    updateReplayStrip();

    // P4c: Hand presence timeout warning
    if (state.started && !state.gameOver) {
      if (!handTrackingActive && !handPresenceWarningShown) {
        // Camera not active at all
      } else if (lastHandDetectedTime > 0 && now - lastHandDetectedTime > HAND_PRESENCE_TIMEOUT_MS) {
        if (!handPresenceWarningShown) {
          handPresenceWarningShown = true;
          NotificationSystem.getInstance().warn(
            'Hand Tracking',
            'No hands detected. Please place both hands in view.'
          );
        }
      } else if (
        handPresenceWarningShown &&
        handTrackingActive &&
        now - lastHandDetectedTime <= HAND_PRESENCE_TIMEOUT_MS
      ) {
        handPresenceWarningShown = false;
      }
    }

    // Juice: speed lines + vignette
    if (state.started && !state.gameOver) {
      if (!themeManager.get().reducedMotion) {
        drawSpeedLines(state.speed, game.steerCenterX);
        speedVignette.style.opacity = `${Math.max(0, (state.speed - 0.3) / 2.5) * 0.8}`;
      } else {
        const ctx = gameOverlayCanvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, gameOverlayCanvas.width, gameOverlayCanvas.height);
        speedVignette.style.opacity = '0';
      }
      audioManager.updateEngineSound(state.speed);
      audioManager.updateGear(game.getGear());
      audioManager.updateWeather(game.getWeather());
      audioManager.updateMusic(state.speed / 3);
      // Lightning rumble on storm entry (GDD §12.2). Edge-detected.
      if (game.getWeather() === 'storm' && lastWeatherKind !== 'storm') {
        audioManager.playLightningRumble();
      }
      lastWeatherKind = game.getWeather();
    } else {
      audioManager.stopEngine();
      const ctx = gameOverlayCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, gameOverlayCanvas.width, gameOverlayCanvas.height);
      speedVignette.style.opacity = '0';
    }

    // Juice: collision flash
    if (state.justCollided) {
      if (!themeManager.get().reducedMotion) {
        collisionFlash.classList.add('active');
        setTimeout(() => collisionFlash.classList.remove('active'), 450);
      }
      audioManager.playCollision();
    }

    // Screen state derived from game phase. `intro` is pipeline-owned, so the
    // pre-race staging/countdown is never overwritten by the reconciliation.
    const s = stateMachine.get();
    let desired: GamePhase;
    if (s === 'idle') {
      desired = 'idle';
    } else if (state.gameOver) {
      desired = 'gameover';
    } else if (state.started) {
      desired = 'racing';
    } else if (s === 'ready' || s === 'intro') {
      desired = s;
    } else {
      desired = 'ready';
    }
    if (desired !== s) {
      stateMachine.set(desired);
    }

    replayRuntime.tick(state.raceTime, game.cameraX, state.speed);

    // ─── AI Race tick ───────────────────────────────────────────────
    if (aiRuntime && state.started && !state.gameOver) {
      const now2 = performance.now();
      const aiDt = Math.min((now2 - lastAiTickTime) / 1000, 0.1);
      lastAiTickTime = now2;

      // moveAmount mirrors Game.update() world movement
      const moveAmount = state.speed * aiDt;
      aiRuntime.tick(aiDt, game.playerDistance, state.speed, moveAmount);

      // Check AI collision with player (bump contact)
      if (aiRuntime.checkPlayerCollision(game.cameraX, game.playerDistance)) {
        game.triggerNudge(0.06);
      }

      // Update RaceDirector standings
      if (raceDirector) {
        const snapshots = aiRuntime.getSnapshots(game.playerDistance, state.lap);
        raceDirector.update(aiDt, snapshots);
        const raceState = raceDirector.getState();
        game.setPosition(raceState.position, raceState.totalCars);
      }

      // Update AI HUD
      if (aiHud && aiRuntime && raceDirector) {
        const raceState = raceDirector.getState();
        const telemetry = aiRuntime.getHUDTelemetry(game.playerDistance, state.speed, state.lap, raceState);
        aiHud.update(telemetry);

        // P7.3: presentation edge detection (position/draft/boost/lap).
        raceFeedback.tick({
          position: raceState.position,
          totalCars: raceState.totalCars,
          lap: raceState.lap,
          totalLaps: raceState.totalLaps,
          draftZone: telemetry.draftZone,
          boostActive: state.boostActive,
          racing: true,
        });
      }
    } // end if aiRuntime block

    // ─── Multiplayer tick ────────────────────────────────────────────
    if (
      GAME_MODES[currentModeId].features.multiplayer &&
      activeNetwork &&
      remotePlayers &&
      state.started &&
      !state.gameOver
    ) {
      const now2 = performance.now();
      const mpDt = Math.min((now2 - lastAiTickTime) / 1000, 0.1);
      lastAiTickTime = now2;

      // Tick remote player interpolation
      remotePlayers.update(game.playerDistance, mpDt);

      // Broadcast our state at ~20Hz
      if (now2 - lastNetSendTime > NET_SEND_INTERVAL) {
        lastNetSendTime = now2;
        activeNetwork.broadcast({
          type: 'player_state',
          payload: {
            id: activeNetwork.getPeerId(),
            distance: game.playerDistance,
            speed: state.speed,
            lap: state.lap,
            x: game.cameraX,
            timestamp: now2,
          },
        });
      }

      // Update RaceDirector with remote player standings
      if (raceDirector) {
        const remoteSnapshots = remotePlayers.getStates().map((s) => ({
          id: s.id,
          z: s.distance,
          lap: s.lap,
          isPlayer: false,
        }));
        const playerSnapshot = { id: 'player', z: game.playerDistance, lap: state.lap, isPlayer: true };
        raceDirector.update(mpDt, [...remoteSnapshots, playerSnapshot]);
        const raceState = raceDirector.getState();
        game.setPosition(raceState.position, raceState.totalCars);

        // P7.3: presentation edge detection for multiplayer races.
        raceFeedback.tick({
          position: raceState.position,
          totalCars: raceState.totalCars,
          lap: raceState.lap,
          totalLaps: raceState.totalLaps,
          draftZone: 'none',
          boostActive: state.boostActive,
          racing: true,
        });
      }
    }

    if (isReplaying) {
      // P10: slow motion (Shift hold / SLOW-MO toggle) scales the camera dt.
      const camDt = slowMoDelta(1 / 60, viewerSlowMo);
      if (game.cameraMode === 'free') {
        const keys: ViewerKeys = {
          forward: inputManager.keys.up,
          back: inputManager.keys.down,
          left: inputManager.keys.left,
          right: inputManager.keys.right,
        };
        viewerCam = stepFreeCamera(viewerCam, keys, camDt);
        game.freeCameraPos.set(viewerCam.x, viewerCam.y, viewerCam.z);
        game.freeCameraRot.set(viewerCam.pitch, viewerCam.yaw, 0, 'XYZ');
      }
      game.updateCamera(camDt);
    }

    // Dynamic resolution scaling (GDD §15): rolling 2s frame budget.
    const frameMs = performance.now() - loopStart;
    frameBudgetScaler.record(frameMs);
    const mult = frameBudgetScaler.resolutionMultiplier;
    if (mult !== lastAppliedResolutionMult) {
      lastAppliedResolutionMult = mult;
      applyQuality();
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
  // P7.3: refresh the cached overlay canvas size here instead of per frame.
  speedCanvasW = gameOverlayCanvas.clientWidth;
  speedCanvasH = gameOverlayCanvas.clientHeight;
}

// ─── Touch Controls ────────────────────────────────────────────────
/**
 * Publish the COMPLETE touch state on every change — including the fully
 * released state. The base layer is a shared single slot: publishing only
 * press states left a stale throttle/steer frame behind after release
 * (stuck input when auto-accelerate is off). Always publishing keeps the
 * layer neutral the moment nothing is held.
 */
function applyTouchState(): void {
  if (!game) return;
  const touch = inputManager.touch;
  if (inputManager.oneHand) {
    // One-hand mode: steering side doubles as throttle (GDD §2.4).
    inputManager.setBase('touch', {
      steer: touch.left ? -1 : touch.right ? 1 : 0,
      throttle: touch.left || touch.right ? 1 : 0,
      brake: 0,
      boostButton: false,
    });
    return;
  }
  inputManager.setBase('touch', {
    steer: touch.left ? -1 : touch.right ? 1 : 0,
    throttle: touch.up ? 1 : touch.left || touch.right ? (inputManager.autoAccelerate ? 1 : 0.5) : 0,
    brake: 0,
    boostButton: false,
  });
}

// ─── Speed Lines ───────────────────────────────────────────────────
let speedLineOffset = 0;
// P7.3: canvas dimensions cached at resize — no per-frame layout reads.
let speedCanvasW = 0;
let speedCanvasH = 0;

function drawSpeedLines(speed: number, steerX: number): void {
  if (!speedCanvasW) {
    speedCanvasW = gameOverlayCanvas.clientWidth;
    speedCanvasH = gameOverlayCanvas.clientHeight;
  }
  gameOverlayCanvas.width = speedCanvasW;
  gameOverlayCanvas.height = speedCanvasH;
  const w = speedCanvasW;
  const h = speedCanvasH;
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
    const seed = ((i * 7919 + 31) % 1000) / 1000;
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

// ─── Quality tiers (GDD §11.2/§15) ───────────────────────────────
const frameBudgetScaler = new FrameBudgetScaler();
/** Last multiplier applied to the renderer so recovery re-applies full ratio. */
let lastAppliedResolutionMult = 1;

function applyQuality(): void {
  if (!game) return;
  const config = resolveQualityConfig(
    saveManager.graphicsQuality,
    window.devicePixelRatio || 1,
    saveManager.shadows,
    saveManager.particles
  );
  const effective = frameBudgetScaler.effectivePixelRatio(config);
  game.setQuality({ ...config, pixelRatio: effective });
}

async function init(): Promise<void> {
  const gc = document.getElementById('game') as HTMLCanvasElement;
  if (!gc) throw new Error('Canvas #game not found');

  game = new Game(gc, resources);
  handleResize();
  window.addEventListener('resize', handleResize);

  replayRuntime = new ReplayRuntime({
    scene: game.scene3d,
    hud: new GhostHud('ghost-hud', (ahead) => audioManager.playGhostTick(ahead)),
    onNotice: (message) => notify.notify('Ghost', message),
  });

  // Restore persisted settings
  inputManager.autoAccelerate = saveManager.autoAccelerate;
  inputManager.gyroscopeMode = saveManager.gyroscopeMode;
  inputManager.oneHand = saveManager.oneHand;
  game.reducedMotion = themeManager.get().reducedMotion;
  applyQuality();

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
  const initAudioOnce = () => {
    audioManager.init();
    window.removeEventListener('click', initAudioOnce);
    window.removeEventListener('keydown', initAudioOnce);
    window.removeEventListener('touchstart', initAudioOnce);
  };
  window.addEventListener('click', initAudioOnce, { once: true });
  window.addEventListener('keydown', initAudioOnce, { once: true });
  window.addEventListener('touchstart', initAudioOnce, { once: true });

  // ─── Menu flow (UI framework) ─────────────────────────────────
  SoundHooks.enabled = saveManager.uiSounds;
  SoundHooks.volume = saveManager.masterVolume;
  audioManager.masterVolume = saveManager.masterVolume;
  inputManager.autoAccelerate = saveManager.autoAccelerate;
  inputManager.gyroscopeMode = saveManager.gyroscopeMode;

  const uiRoot = document.getElementById('ui-root')!;
  const nav = new NavigationSystem(uiRoot);
  const notify = NotificationSystem.getInstance();
  FocusRing.getInstance();

  const settingsApi: FlowApi['settings'] = {
    get: () => ({
      a11y: themeManager.get(),
      sensitivity: saveManager.sensitivity,
      autoAccelerate: inputManager.autoAccelerate,
      gyroscopeMode: inputManager.gyroscopeMode,
      oneHand: inputManager.oneHand,
      graphicsQuality: saveManager.graphicsQuality,
      shadows: saveManager.shadows,
      particles: saveManager.particles,
      masterVolume: audioManager.masterVolume,
      uiSounds: saveManager.uiSounds,
    }),
    save: (patch) => {
      if (patch.a11y) {
        themeManager.set(patch.a11y);
        saveManager.setA11y(patch.a11y);
        if (game) game.reducedMotion = themeManager.get().reducedMotion;
      }
      if (patch.sensitivity !== undefined) {
        saveManager.sensitivity = patch.sensitivity;
        applySensitivity(patch.sensitivity);
        sensitivitySlider.value = `${patch.sensitivity}`;
      }
      if (patch.autoAccelerate !== undefined) inputManager.setAutoAccelerate(patch.autoAccelerate);
      if (patch.gyroscopeMode !== undefined) {
        inputManager.gyroscopeMode = patch.gyroscopeMode;
        saveManager.gyroscopeMode = patch.gyroscopeMode;
      }
      if (patch.oneHand !== undefined) {
        inputManager.oneHand = patch.oneHand;
        saveManager.oneHand = patch.oneHand;
      }
      if (patch.masterVolume !== undefined) {
        audioManager.masterVolume = patch.masterVolume;
        SoundHooks.volume = patch.masterVolume;
        saveManager.masterVolume = patch.masterVolume;
      }
      if (patch.uiSounds !== undefined) {
        SoundHooks.enabled = patch.uiSounds;
        saveManager.uiSounds = patch.uiSounds;
      }
      if (patch.graphicsQuality !== undefined) {
        saveManager.graphicsQuality = patch.graphicsQuality;
        applyQuality();
      }
      if (patch.shadows !== undefined) {
        saveManager.shadows = patch.shadows;
        applyQuality();
      }
      if (patch.particles !== undefined) {
        saveManager.particles = patch.particles;
        applyQuality();
      }
    },
    // calibrateGesture is now handled by SettingsScreen via gestureCalibration
    onBack: () => {
      notify.success('Settings', 'Saved');
      void nav.go('menu', {}, { transition: 'slide-right' });
    },
  };

  pipeline = buildRacePipeline();

  const startRace = (trackId: TrackId, modeId: ModeId, network?: NetworkManager): void => {
    uiRoot.hidden = true;
    document.body.classList.add('race-active');
    document.body.classList.toggle('ai-race', !!GAME_MODES[modeId].features.ai);
    inputManager.setAutoAccelerate(true);
    replayRuntime.arm(trackId, modeId);
    currentModeId = modeId;
    currentTrackId = trackId;
    // P9: leave replay presentation entirely when a fresh live race starts.
    stopReplayPlayback();
    replayActiveStrip.classList.add('hidden');
    replayCompletePanel.classList.toggle('visible', false);
    inputManager.setModeConfig(GAME_MODES[modeId]);
    activeNetwork = network ?? null;
    ui.setIntroInfo(trackId, modeId);
    game.prepareRace();
    // Audio lifecycle: silence any stale layers, then the cinematic intro sting (GDD §12.2).
    audioManager.stopAll();
    audioManager.playIntroSting();
    pipeline?.start({ reducedMotion: themeManager.get().reducedMotion });
    notify.success(`${trackId.replace(/-/g, ' ')}`, `${modeId.replace(/-/g, ' ')} race started`);
  };

  const showMenu = (): void => {
    uiRoot.hidden = false;
    document.body.classList.remove('race-active', 'ai-race');
    // Menu music bed (−6dB per GDD §12.3) after any race.
    audioManager.stopAll();
    audioManager.startMusic('menu');
  };

  buildFlow(nav, {
    getBestScore: () => saveManager.bestScore,
    settings: settingsApi,
    phone: phoneSource,
    garage: new (await import('./screens/GarageScreen')).GarageScreen(),
    howToPlay: new (await import('./screens/HowToPlayScreen')).HowToPlayScreen(),
    achievements: new (await import('./screens/AchievementsScreen')).AchievementsScreen(),
    profile: new (await import('./screens/ProfileScreen')).ProfileScreen(),
    leaderboard: new (await import('./screens/LeaderboardScreen')).LeaderboardScreen(),
    startRace: (trackId, modeId, network) => startRace(trackId, modeId, network),
  });
  showMenu();
  void nav.go('splash');

  // Results buttons
  resultsRetry.addEventListener('click', () => {
    victoryCeremony.stop();
    audioManager.stopAll();
    audioManager.playIntroSting();
    pipeline?.cancel();
    const last = lastSelection();
    currentModeId = last.mode;
    currentTrackId = last.track;
    replayRuntime.arm(last.track, last.mode);
    ui.setIntroInfo(last.track, last.mode);
    game.prepareRace();
    pipeline?.start({ reducedMotion: themeManager.get().reducedMotion });
  });

  resultsReplay.addEventListener('click', () => {
    victoryCeremony.stop();
    ui.sync('racing'); // hide game over overlay
    replayOverlay.classList.remove('hidden');
    replayOverlay.setAttribute('aria-hidden', 'false');
    isReplaying = true;

    // Reset photo-mode state to defaults on open.
    viewerSlowMo = false;
    replaySlowMo.classList.remove('active');
    replayFilterFocus.value = '0';
    if (game.postProcessor) game.postProcessor.focus = 0;

    // Switch to Replay Camera Mode
    setReplayCam('orbit');

    // Move focus into the viewer so keyboard users aren't stranded.
    replayClose.focus();
  });

  replayClose.addEventListener('click', () => {
    isReplaying = false;
    replayOverlay.classList.add('hidden');
    replayOverlay.setAttribute('aria-hidden', 'true');
    game.cameraMode = 'chase';
    // Reset photo-mode filters to defaults
    if (game.postProcessor) {
      game.postProcessor.grain = 0;
      game.postProcessor.contrast = 1.0;
      game.postProcessor.focus = 0;
    }
    replayFilterGrain.value = '0';
    replayFilterContrast.value = '1';
    replayFilterFocus.value = '0';
    ui.sync('gameover');
    // Restore focus to the results actions.
    resultsRetry.focus();
  });

  const setReplayCam = (mode: 'chase' | 'orbit' | 'cinematic' | 'free'): void => {
    game.cameraMode = mode;
    replayCamChase.classList.toggle('active', mode === 'chase');
    replayCamOrbit.classList.toggle('active', mode === 'orbit');
    replayCamCine.classList.toggle('active', mode === 'cinematic');
    replayCamFree.classList.toggle('active', mode === 'free');
    if (mode === 'free') {
      // Seed the free camera from the current camera pose so the transition
      // is seamless instead of snapping to the default.
      viewerCam = {
        x: game.camera.position.x,
        y: game.camera.position.y,
        z: game.camera.position.z,
        yaw: game.camera.rotation.y,
        pitch: game.camera.rotation.x,
      };
    }
  };

  replayCamChase.addEventListener('click', () => setReplayCam('chase'));
  replayCamOrbit.addEventListener('click', () => setReplayCam('orbit'));
  replayCamCine.addEventListener('click', () => setReplayCam('cinematic'));
  replayCamFree.addEventListener('click', () => setReplayCam('free'));

  replaySlowMo.addEventListener('click', () => {
    viewerSlowMo = !viewerSlowMo;
    replaySlowMo.classList.toggle('active', viewerSlowMo);
  });

  replayFilterGrain.addEventListener('input', () => {
    if (game.postProcessor) {
      game.postProcessor.grain = parseFloat(replayFilterGrain.value);
    }
  });

  replayFilterContrast.addEventListener('input', () => {
    if (game.postProcessor) {
      game.postProcessor.contrast = parseFloat(replayFilterContrast.value);
    }
  });

  replayFilterFocus.addEventListener('input', () => {
    if (game.postProcessor) {
      game.postProcessor.focus = parseFloat(replayFilterFocus.value);
    }
  });

  /**
   * Capture a screenshot through the PostProcessor so photo-mode filters
   * (grain/contrast/focus) are baked into the image, then share it via the
   * Web Share API when available (GDD §745) with a download fallback.
   */
  const capturePhoto = (): void => {
    replayOverlay.classList.add('hidden');
    setTimeout(() => {
      game.postProcessor.render(game.scene, game.camera);
      const canvas = game.renderer.domElement;
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'virtual-steering-photo.png', { type: 'image/png' });
          const nav = navigator as Navigator & {
            canShare?: (data?: ShareData) => boolean;
            share?: (data?: ShareData) => Promise<void>;
          };
          if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
            nav
              .share({ files: [file], title: 'Virtual Steering — Replay Photo' })
              .catch(() => downloadBlob(blob));
          } else {
            downloadBlob(blob);
          }
        }
        replayOverlay.classList.remove('hidden');
      }, 'image/png');
    }, 100);
  };

  const downloadBlob = (blob: Blob): void => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'virtual-steering-photo.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  replayPhoto.addEventListener('click', capturePhoto);

  // P10 keyboard shortcuts (GDD §5.2) — active only while the replay viewer
  // is open: Shift (hold) = slow motion, C = free camera, F12 = screenshot.
  const onReplayKeyDown = (e: KeyboardEvent): void => {
    if (!isReplaying) return;
    const k = e.key;
    if (k === 'Shift') {
      viewerSlowMo = true;
      replaySlowMo.classList.add('active');
      return;
    }
    if (k === 'c' || k === 'C') {
      e.preventDefault();
      setReplayCam(game.cameraMode === 'free' ? 'orbit' : 'free');
      return;
    }
    if (k === 'F12') {
      e.preventDefault();
      capturePhoto();
    }
  };
  const onReplayKeyUp = (e: KeyboardEvent): void => {
    if (e.key !== 'Shift' || !isReplaying) return;
    viewerSlowMo = false;
    replaySlowMo.classList.remove('active');
  };
  window.addEventListener('keydown', onReplayKeyDown);
  window.addEventListener('keyup', onReplayKeyUp);

  // P10 free-camera pointer look: drag rotates yaw/pitch while in FREE mode.
  const viewport = document.getElementById('game-viewport')!;
  const onViewerPointerDown = (e: PointerEvent): void => {
    if (!isReplaying || game.cameraMode !== 'free') return;
    viewerDragging = true;
    viewerLastPointerX = e.clientX;
    viewerLastPointerY = e.clientY;
    viewport.setPointerCapture(e.pointerId);
  };
  const onViewerPointerMove = (e: PointerEvent): void => {
    if (!viewerDragging || !isReplaying || game.cameraMode !== 'free') return;
    const dx = e.clientX - viewerLastPointerX;
    const dy = e.clientY - viewerLastPointerY;
    viewerLastPointerX = e.clientX;
    viewerLastPointerY = e.clientY;
    viewerCam = lookFreeCamera(viewerCam, dx, dy);
  };
  const onViewerPointerUp = (e: PointerEvent): void => {
    viewerDragging = false;
    try {
      viewport.releasePointerCapture(e.pointerId);
    } catch {
      // pointer already released
    }
  };
  viewport.addEventListener('pointerdown', onViewerPointerDown);
  viewport.addEventListener('pointermove', onViewerPointerMove);
  viewport.addEventListener('pointerup', onViewerPointerUp);
  viewport.addEventListener('pointercancel', onViewerPointerUp);

  /**
   * P9 — start deterministic replay playback of the last finished race.
   * Validates the recording, restores its setup (seed/sensitivity/traffic),
   * registers the replay input source as the authoritative input, and runs
   * the normal race pipeline. No reward path exists in this mode.
   */
  const startReplay = (): void => {
    const replay = activeInputReplay;
    if (!replay) return;
    const validation = validateInputReplay(replay);
    if (!validation.valid) {
      notify.error('Replay unavailable', validation.errors[0] ?? 'invalid replay data');
      return;
    }
    if (game.started && !game.getState().gameOver) return;

    raceExecutionMode = 'replay';
    victoryCeremony.stop();
    pipeline?.cancel();

    const cfg = GAME_MODES[replay.mode];
    currentModeId = replay.mode;
    uiRoot.hidden = true;
    document.body.classList.add('race-active');
    document.body.classList.toggle('ai-race', !!cfg.features.ai);
    inputManager.setModeConfig(cfg);
    inputManager.setAutoAccelerate(true);

    // Deterministic setup restoration.
    game.setRaceMode(raceModeFor(replay.mode));
    game.setRaceSeed(replay.seed);
    game.setSensitivity(replay.sensitivity);
    game.gesturesEnabled = replay.trafficEnabled;

    // Playback is the only input authority from here until exit.
    stopReplayPlayback();
    replaySource = new ReplayInputSource(replay);
    inputManager.registerSource(replaySource);

    lastReplayStripSec = -1;
    replayActiveStrip.classList.remove('hidden');
    replayActiveStrip.setAttribute('data-progress', '0');
    ui.setIntroInfo(replay.track, replay.mode);
    game.prepareRace();
    pipeline?.start({ reducedMotion: themeManager.get().reducedMotion });
  };

  /** Shared "back to main menu" path for results / replay exits. */
  const goToMainMenu = (): void => {
    victoryCeremony.stop();
    pipeline?.cancel();
    stateMachine.set('idle');
    if (game) game.setGameOver();
    stopReplayPlayback();
    raceExecutionMode = 'live';
    inputReplayRecorder.abort();
    replayRuntime.abort();
    replayActiveStrip.classList.add('hidden');
    replayCompletePanel.classList.toggle('visible', false);
    inputManager.setModeConfig(null);
    // P12: tear down multiplayer peers + remote visuals when leaving the race.
    if (remotePlayers) {
      remotePlayers.dispose();
      remotePlayers = null;
    }
    if (activeNetwork) {
      activeNetwork.disconnect();
      activeNetwork = null;
    }
    showMenu();
    void nav.reset('menu');
  };

  resultsMenu.addEventListener('click', goToMainMenu);
  resultsWatchReplay.addEventListener('click', startReplay);
  replayCompleteMenu.addEventListener('click', goToMainMenu);
  replayActiveExit.addEventListener('click', goToMainMenu);

  navTitle.addEventListener('click', goToMainMenu);
  navTitle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goToMainMenu();
    }
  });
  navTitle.style.cursor = 'pointer';
  navTitle.setAttribute('role', 'button');
  navTitle.setAttribute('tabindex', '0');
  navTitle.setAttribute('aria-label', 'Back to main menu');

  const navSettingsBtn = document.getElementById('btn-settings') as HTMLElement;
  SoundHooks.attach(navTitle);
  SoundHooks.attach(navSettingsBtn);
  navSettingsBtn.addEventListener('click', () => {
    if (!uiRoot.hidden) void nav.go('settings');
  });

  if (!resources.externalHandsReady() || !resources.externalCameraUtilsReady()) {
    throw new Error(
      'MediaPipe scripts failed to load — camera hand tracking unavailable. Keyboard and touch still work.'
    );
  }

  tracker = new HandTracker(video, onHandData);
  tracker.setSmoothing(1 - (saveManager.sensitivity / 100) * 0.6);

  const camStartBtn = document.getElementById('cam-start-btn') as HTMLButtonElement;
  const camStartWrap = document.getElementById('cam-start-wrap') as HTMLElement;
  camStartBtn.addEventListener('click', async () => {
    camStartWrap.style.display = 'none';
    try {
      await tracker.start();
      cameraActive = true;
      if (game) game.gesturesEnabled = true;
      camError.classList.add('hidden');
    } catch {
      cameraActive = false;
      camError.classList.remove('hidden');
      camError.querySelectorAll('span')[1].textContent = 'Camera permission denied';
      faceLabel.style.display = 'none';
      handLeftLabel.style.display = 'none';
      handRightLabel.style.display = 'none';
      camStartWrap.style.display = 'flex';
    }
  });

  window.addEventListener('beforeunload', () => {
    pipeline?.cancel();
    inputReplayRecorder.abort();
    stopReplayPlayback();
    game?.dispose();
    audioManager.dispose();
    replayRuntime?.dispose();
    aiRuntime?.dispose();
    aiHud?.dispose();
    victoryCeremony.stop();
    if (remotePlayers) remotePlayers.dispose();
    if (activeNetwork) activeNetwork.disconnect();
    tracker?.stop();
    phoneSource.stop();
  });

  updateStatus();
  gameLoop();
}

init().catch((err: unknown) => {
  const msg = err instanceof Error ? err.stack || err.message : String(err);
  const el =
    document.getElementById('error-display') ||
    (() => {
      const d = document.createElement('div');
      d.id = 'error-display';
      d.style.cssText =
        'position:fixed;top:0;left:0;right:0;z-index:99999;background:#e10600;color:#fff;padding:16px 24px;font-family:monospace;font-size:14px;white-space:pre-wrap;word-break:break-all;border-bottom:3px solid #ff4444';
      document.body.prepend(d);
      return d;
    })();
  el.textContent = 'ERROR: ' + msg;
  el.style.display = 'block';
});
