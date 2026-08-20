import { NetworkManager } from '../network/NetworkManager';
import { PhoneSensor } from './PhoneSensor';

const codeInput = document.getElementById('ctl-code') as HTMLInputElement;
const connectBtn = document.getElementById('ctl-connect') as HTMLButtonElement;
const disconnectBtn = document.getElementById('ctl-disconnect') as HTMLButtonElement;
const calibrateBtn = document.getElementById('ctl-calibrate') as HTMLButtonElement;
const statusEl = document.getElementById('ctl-status') as HTMLElement;
const msgEl = document.getElementById('ctl-msg') as HTMLElement;
const dirEl = document.getElementById('ctl-dir') as HTMLElement;
const angleEl = document.getElementById('ctl-angle') as HTMLElement | null;
const orientationBadge = document.getElementById('ctl-orientation-badge') as HTMLElement | null;
const gaugeArc = document.getElementById('ctl-gauge-arc') as SVGPathElement | null;
const wheelEl = document.getElementById('ctl-wheel') as HTMLElement;
const sensitivityInput = document.getElementById('ctl-sensitivity') as HTMLInputElement;
const sensitivityVal = document.getElementById('ctl-sensitivity-val') as HTMLElement;
const connectCard = document.getElementById('ctl-connect-card') as HTMLElement | null;

const sensor = new PhoneSensor({ rangeDeg: 25, deadzoneDeg: 2, sensitivity: 1 });
let network: NetworkManager | null = null;
let connected = false;
let lastSteering = 0;
let lastAngleDeg = 0; // eslint-disable-line @typescript-eslint/no-unused-vars
let lastSend = 0;
const SEND_INTERVAL = 33; // ~30 Hz
const packet = { type: 'phone_steering', payload: { s: 0, t: 0 } };

function vibrate(ms: number | number[] = 20): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  } catch {
    // Ignore unsupported
  }
}

const statusDot = document.getElementById('ctl-status-dot') as HTMLElement | null;

function updateOrientationBadge(): void {
  if (!orientationBadge) return;
  const isLandscape =
    (typeof window !== 'undefined' &&
      (window.screen?.orientation?.type?.includes('landscape') || window.innerWidth > window.innerHeight)) ??
    false;
  orientationBadge.textContent = isLandscape ? 'LANDSCAPE' : 'PORTRAIT';
}

function setStatus(text: string, kind: 'dim' | 'ok' | 'error' = 'dim'): void {
  statusEl.textContent = text;
  msgEl.className = `ctl-msg${kind === 'ok' ? ' ok' : kind === 'error' ? ' error' : ''}`;
  msgEl.textContent = '';
}

function setMsg(text: string, kind: 'ok' | 'error' = 'ok'): void {
  msgEl.className = `ctl-msg ${kind}`;
  msgEl.textContent = text;
}

function updateWheel(steering: number, rawAngle: number): void {
  // Rotate visual wheel smoothly (up to ~75deg visual deflection)
  wheelEl.style.transform = `rotate(${steering * 70}deg)`;

  // Update direction label
  if (steering < -0.05) {
    dirEl.textContent = 'LEFT';
    dirEl.className = 'ctl-dir left';
  } else if (steering > 0.05) {
    dirEl.textContent = 'RIGHT';
    dirEl.className = 'ctl-dir right';
  } else {
    dirEl.textContent = 'CENTER';
    dirEl.className = 'ctl-dir';
  }

  // Update numerical angle display
  if (angleEl) {
    const sign = rawAngle > 0 ? '+' : '';
    angleEl.textContent = `${sign}${rawAngle.toFixed(1)}°`;
    if (steering < -0.05) {
      angleEl.style.borderColor = 'var(--c-cyan)';
      angleEl.style.color = 'var(--c-cyan)';
    } else if (steering > 0.05) {
      angleEl.style.borderColor = 'var(--c-gold)';
      angleEl.style.color = 'var(--c-gold)';
    } else {
      angleEl.style.borderColor = 'rgba(255,255,255,0.1)';
      angleEl.style.color = 'var(--c-text)';
    }
  }

  // Update gauge arc
  if (gaugeArc) {
    const baseOffset = 190;
    const maxDeflect = 120;
    const fill = steering * maxDeflect;
    gaugeArc.setAttribute('stroke-dashoffset', `${baseOffset - fill}`);
    if (steering < -0.05) {
      gaugeArc.style.stroke = 'var(--c-cyan)';
    } else if (steering > 0.05) {
      gaugeArc.style.stroke = 'var(--c-gold)';
    } else {
      gaugeArc.style.stroke = 'rgba(255,255,255,0.2)';
    }
  }
}

function sendLoop(): void {
  if (connected && network) {
    const now = Date.now();
    if (now - lastSend >= SEND_INTERVAL) {
      lastSend = now;
      packet.payload.s = lastSteering;
      packet.payload.t = now;
      network.broadcast(packet);
    }
  }
  requestAnimationFrame(sendLoop);
}

async function connect(): Promise<void> {
  const room = codeInput.value.trim().toUpperCase();
  if (room.length !== 6) {
    setMsg('Enter the 6-character room code from your laptop screen.', 'error');
    return;
  }

  connectBtn.disabled = true;
  setMsg('Requesting sensor access…');

  const permission = await sensor.requestPermission();
  if (permission === 'denied') {
    connectBtn.disabled = false;
    setMsg('Sensor permission denied. Enable motion sensors in phone settings.', 'error');
    return;
  }

  // Start sensor immediately so feedback is instant
  sensor.start((steering, rawAngle) => {
    lastSteering = steering;
    lastAngleDeg = rawAngle;
    updateWheel(steering, rawAngle);
  });

  setMsg('Connecting to game…');
  network = new NetworkManager();
  try {
    await network.joinLobby(room, { reliable: false });
  } catch (err: unknown) {
    connectBtn.disabled = false;
    setMsg(`Connection failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
    network = null;
    return;
  }

  connected = true;
  statusDot?.classList.add('connected');
  vibrate([40, 60, 40]);
  setStatus('Connected — Rotate wheel to steer', 'ok');
  if (connectCard) connectCard.style.display = 'none';
  disconnectBtn.hidden = false;
  setMsg('');
}

function disconnect(): void {
  connected = false;
  statusDot?.classList.remove('connected');
  sensor.stop();
  network?.disconnect();
  network = null;
  lastSteering = 0;
  lastAngleDeg = 0;
  updateWheel(0, 0);
  setStatus('Disconnected');
  if (connectCard) connectCard.style.display = 'block';
  disconnectBtn.hidden = true;
  connectBtn.disabled = false;
}

// Touch/drag fallback on wheel for devices without gyro
let touchStartX = 0;
let isTouchingWheel = false;

wheelEl.addEventListener(
  'touchstart',
  (e) => {
    if (e.touches.length > 0) {
      isTouchingWheel = true;
      touchStartX = e.touches[0].clientX;
    }
  },
  { passive: true }
);

wheelEl.addEventListener(
  'touchmove',
  (e) => {
    if (!isTouchingWheel || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - touchStartX;
    const steer = Math.max(-1, Math.min(1, dx / 70));
    const rawAngle = steer * 25;
    lastSteering = steer;
    lastAngleDeg = rawAngle;
    updateWheel(steer, rawAngle);
  },
  { passive: true }
);

wheelEl.addEventListener(
  'touchend',
  () => {
    isTouchingWheel = false;
  },
  { passive: true }
);

const roomFromUrl = new URLSearchParams(location.search).get('room');
if (roomFromUrl) {
  codeInput.value = roomFromUrl.toUpperCase().slice(0, 6);
}

connectBtn.addEventListener('click', () => void connect());
disconnectBtn.addEventListener('click', disconnect);

calibrateBtn.addEventListener('click', () => {
  sensor.calibrate();
  vibrate(35);
  setMsg('Center calibrated. Keep wheel level.');
  setTimeout(() => {
    if (msgEl.textContent === 'Center calibrated. Keep wheel level.') {
      msgEl.textContent = '';
    }
  }, 2500);
});

sensitivityInput.addEventListener('input', () => {
  const val = parseInt(sensitivityInput.value, 10);
  sensitivityVal.textContent = `${val}%`;
  sensor.setSensitivity(val / 100);
});

window.addEventListener('resize', updateOrientationBadge);
window.addEventListener('orientationchange', updateOrientationBadge);
updateOrientationBadge();

// Start sensor immediately for testing preview if no prompt needed
if (!sensor.needsPermission && sensor.supported) {
  sensor.start((steering, rawAngle) => {
    if (!isTouchingWheel) {
      lastSteering = steering;
      lastAngleDeg = rawAngle;
      updateWheel(steering, rawAngle);
    }
  });
}

if (!sensor.supported) {
  setStatus('Motion sensors unavailable (Touch steering active)', 'dim');
} else {
  setStatus(
    sensor.needsPermission ? 'Tap ALLOW to enable steering sensor' : 'Enter room code to connect',
    'dim'
  );
}

requestAnimationFrame(sendLoop);
