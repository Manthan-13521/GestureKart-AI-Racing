import { NetworkManager } from '../network/NetworkManager';
import { PhoneSensor } from './PhoneSensor';

const codeInput = document.getElementById('ctl-code') as HTMLInputElement;
const connectBtn = document.getElementById('ctl-connect') as HTMLButtonElement;
const disconnectBtn = document.getElementById('ctl-disconnect') as HTMLButtonElement;
const calibrateBtn = document.getElementById('ctl-calibrate') as HTMLButtonElement;
const statusEl = document.getElementById('ctl-status') as HTMLElement;
const msgEl = document.getElementById('ctl-msg') as HTMLElement;
const dirEl = document.getElementById('ctl-dir') as HTMLElement;
const wheelEl = document.getElementById('ctl-wheel') as HTMLElement;
const sensitivityInput = document.getElementById('ctl-sensitivity') as HTMLInputElement;
const sensitivityVal = document.getElementById('ctl-sensitivity-val') as HTMLElement;

const sensor = new PhoneSensor({ rangeDeg: 25, deadzoneDeg: 2, sensitivity: 1 });
let network: NetworkManager | null = null;
let connected = false;
let lastSteering = 0;
let lastSend = 0;
const SEND_INTERVAL = 33; // ~30 Hz
const packet = { type: 'phone_steering', payload: { s: 0, t: 0 } };

function setStatus(text: string, kind: 'dim' | 'ok' | 'error' = 'dim'): void {
  statusEl.textContent = text;
  msgEl.className = `ctl-msg${kind === 'ok' ? ' ok' : kind === 'error' ? ' error' : ''}`;
  msgEl.textContent = '';
}

function setMsg(text: string, kind: 'ok' | 'error' = 'ok'): void {
  msgEl.className = `ctl-msg ${kind}`;
  msgEl.textContent = text;
}

function updateWheel(steering: number): void {
  wheelEl.style.transform = `rotate(${steering * 55}deg)`;
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
}

function sendLoop(now: number): void {
  if (connected && network && now - lastSend >= SEND_INTERVAL) {
    lastSend = now;
    packet.payload.s = lastSteering;
    packet.payload.t = now;
    network.broadcast(packet);
  }
  requestAnimationFrame(sendLoop);
}

async function connect(): Promise<void> {
  const room = codeInput.value.trim().toUpperCase();
  if (room.length !== 6) {
    setMsg('Enter the 6-character room code from your laptop.', 'error');
    return;
  }

  connectBtn.disabled = true;
  setMsg('Requesting sensor access…');

  const permission = await sensor.requestPermission();
  if (permission !== 'granted') {
    connectBtn.disabled = false;
    setMsg(
      permission === 'unsupported'
        ? 'This browser does not support device orientation sensors. Try the latest mobile browser over HTTPS.'
        : 'Sensor permission denied. Enable it in your browser settings and try again.',
      'error'
    );
    return;
  }

  setMsg('Connecting…');
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
  sensor.start((steering) => {
    lastSteering = steering;
    updateWheel(steering);
  });
  setStatus('Connected — hold your phone like a steering wheel', 'ok');
  connectBtn.hidden = true;
  disconnectBtn.hidden = false;
  setMsg('');
}

function disconnect(): void {
  connected = false;
  sensor.stop();
  network?.disconnect();
  network = null;
  lastSteering = 0;
  updateWheel(0);
  setStatus('Disconnected');
  connectBtn.hidden = false;
  disconnectBtn.hidden = true;
  connectBtn.disabled = false;
}

const roomFromUrl = new URLSearchParams(location.search).get('room');
if (roomFromUrl) {
  codeInput.value = roomFromUrl.toUpperCase().slice(0, 6);
}

connectBtn.addEventListener('click', () => void connect());
disconnectBtn.addEventListener('click', disconnect);
calibrateBtn.addEventListener('click', () => {
  if (connected) {
    sensor.calibrate();
    setMsg('Center calibrated. Keep the wheel straight.');
  }
});

sensitivityInput.addEventListener('input', () => {
  const val = parseInt(sensitivityInput.value, 10);
  sensitivityVal.textContent = `${val}%`;
  sensor.setSensitivity(val / 100);
});

if (!sensor.supported) {
  setStatus('Device orientation sensors unavailable', 'error');
  connectBtn.disabled = true;
} else {
  setStatus(
    sensor.needsPermission ? 'Tap ALLOW to enable the steering sensor' : 'Enter the room code to connect',
    sensor.needsPermission ? 'dim' : 'dim'
  );
}

requestAnimationFrame(sendLoop);
