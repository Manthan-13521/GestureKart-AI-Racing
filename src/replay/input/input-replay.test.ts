import { describe, it, expect } from 'vitest';
import { InputReplayRecorder } from './recorder';
import { ReplayInputSource } from './source';
import {
  INPUT_REPLAY_MAX_FRAMES,
  INPUT_REPLAY_MIN_FRAMES,
  INPUT_REPLAY_VERSION,
  NEUTRAL_INPUT_FRAME,
  createReplayId,
  decodeInputFrame,
  encodeInputFrame,
  quantizeSteer,
  quantizeUnit,
  validateInputReplay,
  type InputReplayData,
} from './types';
import { SmoothFilter } from '../../utils/smoothing';
import { centerFromSteer, NEUTRAL_FRAME } from '../../input/InputFrame';
import { mulberry32 } from '../../ai/AIIdentity';
import { InputManager } from '../../managers/InputManager';
import { EventBus } from '../../core/EventBus';

function validReplay(frames = 120): InputReplayData {
  const steers = new Int8Array(frames);
  const throttles = new Uint8Array(frames).fill(100);
  const brakes = new Uint8Array(frames);
  const boosts = new Uint8Array(frames);
  const ticks = new Uint16Array(frames);
  for (let i = 0; i < frames; i++) {
    steers[i] = Math.round(Math.sin(i / 10) * 80);
    ticks[i] = Math.floor(i / 2);
  }
  return {
    version: INPUT_REPLAY_VERSION,
    replayId: createReplayId(),
    mode: 'survival',
    track: 'cyber-city',
    seed: 1337,
    sensitivity: 100,
    trafficEnabled: true,
    duration: 90,
    score: 1234,
    frames,
    ticks,
    steers,
    throttles,
    brakes,
    boosts,
  };
}

describe('validateInputReplay — boundary validation', () => {
  it('accepts a well-formed payload', () => {
    expect(validateInputReplay(validReplay()).valid).toBe(true);
  });

  it('rejects non-object payloads', () => {
    for (const bad of [null, undefined, 42, 'replay', []]) {
      expect(validateInputReplay(bad).valid).toBe(false);
    }
  });

  it('rejects wrong version / missing identity', () => {
    const r = validReplay();
    expect(validateInputReplay({ ...r, version: 99 }).valid).toBe(false);
    expect(validateInputReplay({ ...r, replayId: '' }).valid).toBe(false);
  });

  it('rejects invalid mode and track', () => {
    const r = validReplay();
    expect(validateInputReplay({ ...r, mode: 'arcade' }).valid).toBe(false);
    expect(validateInputReplay({ ...r, track: 'moon' }).valid).toBe(false);
  });

  it('rejects invalid seed, sensitivity, trafficEnabled, duration, score', () => {
    const r = validReplay();
    expect(validateInputReplay({ ...r, seed: -1 }).valid).toBe(false);
    expect(validateInputReplay({ ...r, sensitivity: 150 }).valid).toBe(false);
    expect(validateInputReplay({ ...r, trafficEnabled: 'yes' }).valid).toBe(false);
    expect(validateInputReplay({ ...r, duration: 0 }).valid).toBe(false);
    expect(validateInputReplay({ ...r, score: -5 }).valid).toBe(false);
  });

  it('rejects out-of-range frame counts', () => {
    const r = validReplay();
    expect(validateInputReplay({ ...r, frames: INPUT_REPLAY_MIN_FRAMES - 1 }).valid).toBe(false);
    expect(validateInputReplay({ ...r, frames: INPUT_REPLAY_MAX_FRAMES + 1 }).valid).toBe(false);
  });

  it('rejects wrong typed-array payloads', () => {
    const r = validReplay();
    expect(validateInputReplay({ ...r, ticks: new Float64Array(120) }).valid).toBe(false);
    expect(validateInputReplay({ ...r, steers: new Float32Array(120) }).valid).toBe(false);
    expect(validateInputReplay({ ...r, throttles: undefined }).valid).toBe(false);
  });

  it('rejects arrays shorter than the declared frame count', () => {
    const r = validReplay();
    expect(validateInputReplay({ ...r, steers: new Int8Array(10) }).valid).toBe(false);
  });

  it('rejects non-monotonic ticks and out-of-range channel values', () => {
    const r = validReplay();
    const descending = new Uint16Array(120);
    for (let i = 0; i < 120; i++) descending[i] = 119 - i;
    expect(validateInputReplay({ ...r, ticks: descending }).valid).toBe(false);
    const mono = new Uint16Array(120);
    for (let i = 0; i < 120; i++) mono[i] = i;
    expect(validateInputReplay({ ...r, ticks: mono, steers: new Int8Array(120).fill(120) }).valid).toBe(
      false
    );
    expect(validateInputReplay({ ...r, ticks: mono, throttles: new Uint8Array(120).fill(101) }).valid).toBe(
      false
    );
    expect(validateInputReplay({ ...r, ticks: mono, brakes: new Uint8Array(120).fill(255) }).valid).toBe(
      false
    );
    const boosts = new Uint8Array(120);
    boosts[3] = 2;
    expect(validateInputReplay({ ...r, ticks: mono, boosts }).valid).toBe(false);
  });
});

describe('quantization round-trips', () => {
  it('steer ×100 round-trips within quantization error', () => {
    for (const steer of [-1, -0.345, 0, 0.42, 1]) {
      expect(decodeInputFrameFor(steer).steer).toBeCloseTo(steer, 2);
    }
  });

  it('clamps out-of-range steering and unit channels', () => {
    expect(quantizeSteer(3)).toBe(100);
    expect(quantizeSteer(-3)).toBe(-100);
    expect(quantizeUnit(2)).toBe(100);
    expect(quantizeUnit(-1)).toBe(0);
  });

  it('encodes boost as 0/1 and throttle/brake in 0..100', () => {
    const steer = new Int8Array(1);
    const throttle = new Uint8Array(1);
    const brake = new Uint8Array(1);
    const boost = new Uint8Array(1);
    encodeInputFrame(
      { steer: 0.5, throttle: 0.75, brake: 0.25, boostButton: true },
      steer,
      throttle,
      brake,
      boost,
      0
    );
    expect(steer[0]).toBe(50);
    expect(throttle[0]).toBe(75);
    expect(brake[0]).toBe(25);
    expect(boost[0]).toBe(1);
  });
});

describe('InputReplayRecorder', () => {
  it('records frames and finalizes a valid payload with metadata', () => {
    const rec = new InputReplayRecorder();
    rec.begin({
      mode: 'survival',
      track: 'cyber-city',
      seed: 42,
      sensitivity: 60,
      trafficEnabled: true,
      duration: 90,
    });
    for (let i = 0; i < 200; i++) {
      rec.record({ steer: Math.sin(i / 20) * 0.8, throttle: 1, brake: 0, boostButton: i % 60 === 0 }, i / 60);
    }
    const data = rec.finish(12345, 3334);
    expect(data).not.toBeNull();
    expect(data!.frames).toBe(200);
    expect(data!.seed).toBe(42);
    expect(data!.sensitivity).toBe(60);
    expect(data!.mode).toBe('survival');
    expect(data!.track).toBe('cyber-city');
    expect(data!.score).toBe(12345);
    expect(data!.duration).toBe(3334);
    for (let i = 1; i < data!.frames; i++) {
      expect(data!.ticks[i]).toBeGreaterThanOrEqual(data!.ticks[i - 1]);
    }
    expect(data!.ticks[199]).toBe(199);
  });

  it('clamps out-of-range input during recording', () => {
    const rec = new InputReplayRecorder();
    rec.begin({
      mode: 'survival',
      track: 'cyber-city',
      seed: 1,
      sensitivity: 100,
      trafficEnabled: true,
      duration: 90,
    });
    for (let i = 0; i < 70; i++) {
      rec.record({ steer: 5, throttle: 3, brake: -2, boostButton: true }, i / 60);
      rec.record({ steer: -5, throttle: -1, brake: 2, boostButton: false }, (i + 0.5) / 60);
    }
    const data = rec.finish(0, 90);
    expect(data!.steers[0]).toBe(100);
    expect(data!.throttles[0]).toBe(100);
    expect(data!.brakes[0]).toBe(0);
    expect(data!.boosts[0]).toBe(1);
    expect(data!.steers[1]).toBe(-100);
    expect(data!.throttles[1]).toBe(0);
  });

  it('returns null for recordings below the minimum frame count', () => {
    const rec = new InputReplayRecorder();
    rec.begin({
      mode: 'survival',
      track: 'cyber-city',
      seed: 1,
      sensitivity: 100,
      trafficEnabled: true,
      duration: 90,
    });
    for (let i = 0; i < INPUT_REPLAY_MIN_FRAMES - 1; i++) rec.record(NEUTRAL_FRAME, i);
    expect(rec.finish(0, 90)).toBeNull();
  });

  it('finalizes exactly once', () => {
    const rec = new InputReplayRecorder();
    rec.begin({
      mode: 'survival',
      track: 'cyber-city',
      seed: 1,
      sensitivity: 100,
      trafficEnabled: true,
      duration: 90,
    });
    for (let i = 0; i < 120; i++) rec.record(NEUTRAL_FRAME, i);
    const first = rec.finish(0, 90);
    const second = rec.finish(0, 90);
    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });

  it('abort discards the recording', () => {
    const rec = new InputReplayRecorder();
    rec.begin({
      mode: 'survival',
      track: 'cyber-city',
      seed: 1,
      sensitivity: 100,
      trafficEnabled: true,
      duration: 90,
    });
    for (let i = 0; i < 120; i++) rec.record(NEUTRAL_FRAME, i);
    rec.abort();
    expect(rec.finish(0, 90)).toBeNull();
    expect(rec.isActive).toBe(false);
  });

  it('record is a no-op while inactive', () => {
    const rec = new InputReplayRecorder();
    rec.record({ steer: 1, throttle: 1, brake: 0, boostButton: true }, 0);
    expect(rec.frameCount).toBe(0);
  });

  it('finish returns a defensive copy immune to later begin()/record()', () => {
    const rec = new InputReplayRecorder();
    rec.begin({
      mode: 'survival',
      track: 'cyber-city',
      seed: 1,
      sensitivity: 100,
      trafficEnabled: true,
      duration: 90,
    });
    for (let i = 0; i < 120; i++) rec.record({ steer: 0.5, throttle: 1, brake: 0, boostButton: true }, i);
    const data = rec.finish(0, 90)!;
    rec.begin({
      mode: 'ai-race',
      track: 'space-highway',
      seed: 99,
      sensitivity: 10,
      trafficEnabled: false,
      duration: 60,
    });
    for (let i = 0; i < 200; i++) rec.record({ steer: -1, throttle: 0, brake: 1, boostButton: false }, i);
    rec.finish(1, 60);
    expect(data.frames).toBe(120);
    expect(data.steers[119]).toBe(50);
    expect(data.boosts[119]).toBe(1);
  });
});

describe('ReplayInputSource', () => {
  it('feeds frames in recorded order and holds the last frame when exhausted', () => {
    const replay = validReplay(5);
    replay.steers = new Int8Array([10, 20, 30, 40, 50]);
    const src = new ReplayInputSource(replay);
    const got: number[] = [];
    for (let i = 0; i < 8; i++) got.push(src.read().steer);
    expect(got).toEqual([0.1, 0.2, 0.3, 0.4, 0.5, 0.5, 0.5, 0.5]);
    expect(src.exhausted).toBe(true);
    expect(src.frameIndex).toBe(5);
  });

  it('returns the neutral frame for an empty payload', () => {
    const replay = validReplay(5);
    replay.frames = 0;
    const src = new ReplayInputSource(replay);
    expect(src.read()).toEqual(NEUTRAL_INPUT_FRAME);
    expect(src.exhausted).toBe(true);
  });

  it('stop() deactivates the source', () => {
    const src = new ReplayInputSource(validReplay(5));
    expect(src.isAvailable()).toBe(true);
    src.stop();
    expect(src.isAvailable()).toBe(false);
  });

  it('round-trips throttle, brake and boost through quantization', () => {
    const replay = validReplay(3);
    replay.throttles = new Uint8Array([0, 50, 100]);
    replay.brakes = new Uint8Array([100, 50, 0]);
    replay.boosts = new Uint8Array([1, 0, 1]);
    const src = new ReplayInputSource(replay);
    expect(src.read()).toMatchObject({ throttle: 0, brake: 1, boostButton: true });
    expect(src.read()).toMatchObject({ throttle: 0.5, brake: 0.5, boostButton: false });
    expect(src.read()).toMatchObject({ throttle: 1, brake: 0, boostButton: true });
  });
});

describe('P9 determinism — input timeline reproduces the steering trajectory', () => {
  it('identical timelines produce identical smoothed steering trajectories', () => {
    const rng = mulberry32(12345);
    const frames = 400;
    const timeline = Array.from({ length: frames }, () => rng() * 2 - 1);

    const replay = validReplay(frames);
    for (let i = 0; i < frames; i++) {
      replay.steers[i] = quantizeSteer(timeline[i]);
      replay.throttles[i] = quantizeUnit(0.5 + rng() * 0.5);
    }

    const run = (): number[] => {
      const src = new ReplayInputSource(replay);
      const filter = new SmoothFilter(0.45, 0);
      const out: number[] = [];
      for (let i = 0; i < frames; i++) {
        const frame = src.read();
        const centerX = centerFromSteer(frame.steer);
        const rawSteer = (centerX - 0.5) * 2 * 1.0;
        out.push(filter.update(rawSteer));
      }
      return out;
    };

    const a = run();
    const b = run();
    expect(a).toEqual(b);
    expect(a.length).toBe(frames);

    // The decoded timeline stays within quantization error of the source.
    for (let i = 0; i < frames; i += 37) {
      expect(
        decodeInputFrame(replay.steers, replay.throttles, replay.brakes, replay.boosts, i).steer
      ).toBeCloseTo(timeline[i], 2);
    }
  });

  it('seed equality is the single setup knob: different seed, different layout', () => {
    const a = mulberry32(1337);
    const b = mulberry32(1338);
    const seqA = Array.from({ length: 8 }, () => a());
    const seqB = Array.from({ length: 8 }, () => b());
    expect(seqA).not.toEqual(seqB);
    expect(mulberry32(1337)()).toBe(seqA[0]);
  });
});

describe('InputManager — replay source is authoritative during playback', () => {
  it('replay frames win over the base layer and every priority layer', () => {
    const im = new InputManager(new EventBus());
    im.autoAccelerate = true;
    im.gyroscopeMode = true;
    im.setBase('keyboard', { steer: 0.9, throttle: 1, brake: 0, boostButton: true });

    const replay = validReplay(3);
    replay.steers = new Int8Array([-100, 0, 100]);
    replay.throttles = new Uint8Array([0, 100, 100]);
    const src = new ReplayInputSource(replay);
    im.registerSource(src);

    const first = im.frame(0.5);
    expect(im.lastLayer).toBe('replay');
    expect(first.steer).toBe(-1);
    expect(first.throttle).toBe(0);

    // Even after exhaustion the held last frame wins — live input cannot
    // modify a race under playback.
    im.frame(0.5);
    const held = im.frame(0.5);
    expect(held.steer).toBe(1);
    expect(im.lastLayer).toBe('replay');
  });

  it('unregistering the replay source restores live input immediately', () => {
    const im = new InputManager(new EventBus());
    im.setBase('keyboard', { steer: 0.25, throttle: 0.5, brake: 0, boostButton: false });
    const src = new ReplayInputSource(validReplay(3));
    im.registerSource(src);
    expect(im.frame(0.5).steer).toBe(0);

    src.stop();
    im.unregisterSource('replay');
    const f = im.frame(0.5);
    expect(im.lastLayer).toBe('base');
    expect(f.steer).toBeCloseTo(0.25);
  });
});

function decodeInputFrameFor(steer: number) {
  const s = new Int8Array(1);
  const t = new Uint8Array(1);
  const b = new Uint8Array(1);
  const bo = new Uint8Array(1);
  encodeInputFrame({ steer, throttle: 0, brake: 0, boostButton: false }, s, t, b, bo, 0);
  return decodeInputFrame(s, t, b, bo, 0);
}
