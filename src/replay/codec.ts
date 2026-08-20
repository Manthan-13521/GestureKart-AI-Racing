import {
  REPLAY_MAGIC,
  REPLAY_VERSION,
  REPLAY_TICKS_PER_SEC,
  REPLAY_MAX_TRACK_MODE_LEN,
  REPLAY_MAX_FRAMES,
  REPLAY_MIN_FRAMES,
  REPLAY_MAX_DURATION_TICKS,
  REPLAY_SAMPLE_RATE,
  type ReplayData,
} from './types';

// magic(4) + ver(1) + rate(1) + trackLen(1) + modeLen(1) + score(4) + duration(2) + sec0(4) + sec1(4) + count(2)
const HEADER_FIXED = 4 + 1 + 1 + 1 + 1 + 4 + 2 + 4 + 4 + 2;
const FRAME_BYTES = 5;

export interface EncodeSource {
  track: string;
  mode: string;
  score: number;
  durationTicks: number;
  sectorDists: [number, number];
  times: Int16Array;
  xs: Int16Array;
  speeds: Int8Array;
}

/**
 * Compact binary storage format:
 *   magic(4) version(1) sampleRate(1) trackLen(1) track(n) modeLen(1) mode(n)
 *   score(4) durationTicks(2) sectorDist0(4) sectorDist1(4) frameCount(2)
 *   frames(5n: t u16 ticks, x u16 cm+2000, s u8) checksum(4)
 * Frames are 5 bytes each (~13.5 KB for a 90 s race at 30 Hz).
 */
export function encodeReplay(src: EncodeSource): string {
  const track = src.track.slice(0, REPLAY_MAX_TRACK_MODE_LEN);
  const mode = src.mode.slice(0, REPLAY_MAX_TRACK_MODE_LEN);
  const n = src.times.length;

  const size = HEADER_FIXED + track.length + mode.length + n * FRAME_BYTES + 4;
  const bytes = new Uint8Array(size);
  const view = new DataView(bytes.buffer);

  let o = 0;
  for (let i = 0; i < REPLAY_MAGIC.length; i++) view.setUint8(o++, REPLAY_MAGIC.charCodeAt(i));
  view.setUint8(o++, REPLAY_VERSION);
  view.setUint8(o++, REPLAY_SAMPLE_RATE);
  view.setUint8(o++, track.length);
  for (let i = 0; i < track.length; i++) view.setUint8(o++, track.charCodeAt(i));
  view.setUint8(o++, mode.length);
  for (let i = 0; i < mode.length; i++) view.setUint8(o++, mode.charCodeAt(i));
  view.setUint32(o, src.score, true);
  o += 4;
  view.setUint16(o, src.durationTicks, true);
  o += 2;
  view.setFloat32(o, src.sectorDists[0], true);
  o += 4;
  view.setFloat32(o, src.sectorDists[1], true);
  o += 4;
  view.setUint16(o, n, true);
  o += 2;

  for (let i = 0; i < n; i++) {
    view.setUint16(o, src.times[i], true);
    o += 2;
    view.setUint16(o, src.xs[i], true);
    o += 2;
    view.setUint8(o, src.speeds[i]);
    o += 1;
  }

  const checksum = fnv1a(bytes.subarray(0, o));
  view.setUint32(o, checksum, true);

  return bytesToB64(bytes);
}

/**
 * Decodes a stored replay. Every failure mode — bad magic, version mismatch,
 * tampered checksum, out-of-range values, non-monotonic timestamps, wrong
 * track/mode — returns null. Never throws.
 */
export function decodeReplay(encoded: string, expect?: { track: string; mode: string }): ReplayData | null {
  if (typeof encoded !== 'string' || encoded.length < 24) return null;
  let bytes: Uint8Array;
  try {
    bytes = b64ToBytes(encoded);
  } catch {
    return null;
  }
  if (bytes.length < HEADER_FIXED + REPLAY_MIN_FRAMES * FRAME_BYTES + 4) return null;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  let o = 0;
  for (let i = 0; i < REPLAY_MAGIC.length; i++) {
    if (view.getUint8(o++) !== REPLAY_MAGIC.charCodeAt(i)) return null;
  }
  const version = view.getUint8(o++);
  if (version !== REPLAY_VERSION) return null;

  const sampleRate = view.getUint8(o++);
  if (sampleRate < 1 || sampleRate > 240) return null;

  const trackLen = view.getUint8(o++);
  if (trackLen === 0 || trackLen > REPLAY_MAX_TRACK_MODE_LEN) return null;
  let track = '';
  for (let i = 0; i < trackLen; i++) track += String.fromCharCode(view.getUint8(o++));

  const modeLen = view.getUint8(o++);
  if (modeLen === 0 || modeLen > REPLAY_MAX_TRACK_MODE_LEN) return null;
  let mode = '';
  for (let i = 0; i < modeLen; i++) mode += String.fromCharCode(view.getUint8(o++));

  const score = view.getUint32(o, true);
  o += 4;

  const durationTicks = view.getUint16(o, true);
  o += 2;
  if (durationTicks === 0 || durationTicks > REPLAY_MAX_DURATION_TICKS) return null;

  const sec0 = view.getFloat32(o, true);
  o += 4;
  const sec1 = view.getFloat32(o, true);
  o += 4;
  if (!Number.isFinite(sec0) || !Number.isFinite(sec1) || sec0 < 0 || sec1 < sec0) return null;

  const count = view.getUint16(o, true);
  o += 2;
  if (count < REPLAY_MIN_FRAMES || count > REPLAY_MAX_FRAMES) return null;
  if (bytes.length !== o + count * FRAME_BYTES + 4) return null;

  const checksum = view.getUint32(o + count * FRAME_BYTES, true);
  if (fnv1a(bytes.subarray(0, o + count * FRAME_BYTES)) !== checksum) return null;

  const times = new Int16Array(count);
  const xs = new Int16Array(count);
  const speeds = new Int8Array(count);
  let prevTick = -1;
  for (let i = 0; i < count; i++) {
    const tick = view.getUint16(o, true);
    o += 2;
    const x = view.getUint16(o, true);
    o += 2;
    const s = view.getUint8(o);
    o += 1;
    if (tick <= prevTick) return null;
    if (tick > REPLAY_MAX_DURATION_TICKS) return null;
    if (x > 4000) return null;
    if (s > 127) return null;
    times[i] = tick;
    xs[i] = x;
    speeds[i] = s;
    prevTick = tick;
  }

  if (expect && (track !== expect.track || mode !== expect.mode)) return null;

  const dist = new Float32Array(count);
  dist[0] = 0;
  for (let i = 1; i < count; i++) {
    const dt = (times[i] - times[i - 1]) / REPLAY_TICKS_PER_SEC;
    const avgSpeed = (speeds[i - 1] + speeds[i]) / 2 / 20;
    dist[i] = dist[i - 1] + avgSpeed * dt;
  }

  return {
    version,
    sampleRate,
    track,
    mode,
    score,
    duration: durationTicks / REPLAY_TICKS_PER_SEC,
    sectorDists: [sec0, sec1],
    count,
    times,
    xs,
    speeds,
    dist,
  };
}

export function ticksToSeconds(ticks: number): number {
  return ticks / REPLAY_TICKS_PER_SEC;
}

function fnv1a(bytes: Uint8Array): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h = Math.imul(h ^ bytes[i], 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
