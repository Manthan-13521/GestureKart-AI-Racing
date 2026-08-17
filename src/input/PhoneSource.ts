import { NetworkManager, type NetMessage } from '../network/NetworkManager';
import { AppEvents, type EventBus } from '../core/EventBus';
import type { InputFrame, InputSource, InputSourceId } from './InputFrame';
import { STEER_GAIN } from './InputFrame';

export interface PhoneStatePayload {
  connected: boolean;
  roomCode: string | null;
}

export interface SanitizedSteering {
  v: number;
  t: number;
}

/**
 * Sanitize an untrusted phone-steering packet.
 * Rejects NaN/Infinity, non-numbers, malformed payloads and stale timestamps.
 * Returns null when the packet must be dropped; otherwise a clamped steering
 * value in [-1, 1] and its timestamp.
 */
export function sanitizeSteering(payload: unknown, lastT: number): SanitizedSteering | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const p = payload as Record<string, unknown>;
  const s = p.s;
  const t = p.t;
  if (typeof s !== 'number' || !Number.isFinite(s)) return null;
  if (typeof t !== 'number' || !Number.isFinite(t)) return null;
  if (t <= lastT) return null;
  return { v: Math.max(-1, Math.min(1, s)), t };
}

/**
 * Laptop-side phone steering integration.
 *
 * Hosts a dedicated PeerJS room (unreliable steering channel), listens for
 * `phone_steering` packets, sanitizes them and exposes them as an
 * `InputSource`. While connected it owns the steering + full throttle;
 * any disconnect immediately removes the source from the active set so the
 * pre-existing input hierarchy resumes.
 */
export class PhoneSource implements InputSource {
  readonly id: InputSourceId = 'phone';
  private network: NetworkManager | null = null;
  private _phoneConnected = false;
  private _roomCode: string | null = null;
  private _lastT = -Infinity;
  private _steering = 0;

  constructor(private bus: EventBus) {}

  get phoneConnected(): boolean {
    return this._phoneConnected;
  }

  get roomCode(): string | null {
    return this._roomCode;
  }

  isAvailable(): boolean {
    return this._phoneConnected;
  }

  read(): InputFrame {
    return {
      steer: this._steering * STEER_GAIN,
      throttle: 1,
      brake: 0,
      boostButton: false,
    };
  }

  /** Subscribe to phone connection-state changes. Returns an unsubscribe fn. */
  onState(cb: (s: PhoneStatePayload) => void): () => void {
    return this.bus.on(AppEvents.phoneState, cb);
  }

  /** Host a pairing room. Resolves with the room code. */
  async start(): Promise<string> {
    this.stop();
    const network = new NetworkManager();
    this.network = network;
    network.onMessage((_senderId, msg) => this.handleMessage(msg));
    network.onPeerConnected(() => this.setConnected(true));
    network.onPeerDisconnected(() => this.setConnected(false));
    const code = await network.createLobby();
    this._roomCode = code;
    this._lastT = -Infinity;
    this.bus.emit(AppEvents.phoneState, { connected: false, roomCode: code } satisfies PhoneStatePayload);
    return code;
  }

  /** Disconnect any phone and release the room. */
  stop(): void {
    this.network?.disconnect();
    this.network = null;
    this._roomCode = null;
    this._lastT = -Infinity;
    this._steering = 0;
    this.setConnected(false);
  }

  /** Controller page URL for the current room (used for the QR code). */
  controllerUrl(): string {
    const code = this._roomCode ?? '';
    return `${location.origin}/phone-controller.html?room=${encodeURIComponent(code)}`;
  }

  private handleMessage(msg: NetMessage): void {
    if (!msg || (msg as { type?: unknown }).type !== 'phone_steering') return;
    const clean = sanitizeSteering(msg.payload, this._lastT);
    if (!clean) return;
    this._lastT = clean.t;
    this._steering = clean.v;
  }

  private setConnected(on: boolean): void {
    if (this._phoneConnected === on) return;
    this._phoneConnected = on;
    if (!on) this._steering = 0;
    this.bus.emit(AppEvents.phoneState, {
      connected: on,
      roomCode: this._roomCode,
    } satisfies PhoneStatePayload);
  }
}
