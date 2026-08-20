import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ReplayRuntime } from './runtime';
import { ReplayRecorder, recordingToReplayData } from './recorder';
import { ReplayStore } from './store';
import { GhostHud } from './hud';

function mockStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
}

function setupHudDom(): void {
  document.body.innerHTML = `
    <div id="ghost-hud" class="hidden">
      <div>
        <span id="ghost-delta">+0.00</span>
        <span id="ghost-state">TIED</span>
      </div>
      <div>
        <span>BEST <b id="ghost-best">0:00</b></span>
        <span>NOW <b id="ghost-now">0:00</b></span>
      </div>
      <div>
        <span id="ghost-sec-0">S1 —</span>
        <span id="ghost-sec-1">S2 —</span>
        <span id="ghost-sec-2">S3 —</span>
      </div>
    </div>
  `;
}

const TRACK = 'cyber-city';
const MODE = 'versus';

/** Records a normal-length run so store has a Best + ghost to race against. */
function seedBest(store: ReplayStore, duration = 30): void {
  const rec = new ReplayRecorder();
  rec.begin(TRACK, MODE, duration);
  const dt = 1 / 30;
  for (let t = 0; t <= duration; t += dt) {
    rec.pump(t, Math.sin(t) * 2, 20 + Math.sin(t) * 5);
  }
  const recording = rec.finish(500, duration);
  expect(recording).not.toBeNull();
  store.save(TRACK, MODE, recordingToReplayData(recording!));
}

interface Harness {
  runtime: ReplayRuntime;
  store: ReplayStore;
  hud: GhostHud;
  notices: string[];
  hudEl: HTMLElement;
  deltaEl: HTMLElement;
  sector0El: HTMLElement;
}

function makeHarness(withGhost: boolean): Harness {
  const scene = new THREE.Scene();
  const storage = mockStorage();
  const store = new ReplayStore('replays:test', storage);
  if (withGhost) seedBest(store);
  const notices: string[] = [];
  const hud = new GhostHud('ghost-hud');
  const runtime = new ReplayRuntime({
    scene,
    store,
    hud,
    onNotice: (m) => notices.push(m),
    now: () => 0,
  });
  return {
    runtime,
    store,
    hud,
    notices,
    hudEl: document.getElementById('ghost-hud')!,
    deltaEl: document.getElementById('ghost-delta')!,
    sector0El: document.getElementById('ghost-sec-0')!,
  };
}

/** Mirrors main.ts wiring: arm → (GO) begin → per-frame tick. */
function tickUntil(h: Harness, raceTime: number): void {
  for (let t = 0; t <= raceTime; t += 1 / 30) {
    h.runtime.tick(t, Math.sin(t) * 2, 60);
  }
}

describe('replay lifecycle (P3.1)', () => {
  beforeEach(() => setupHudDom());
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('does not record before GO; recording starts at GO exactly once per attempt', () => {
    const h = makeHarness(false);
    h.runtime.arm(TRACK, MODE);

    for (let i = 0; i < 50; i++) h.runtime.tick(i * 0.016, 0, 20);
    expect(h.runtime.distance).toBe(0);

    h.runtime.begin(20);
    h.runtime.tick(0, 0, 20);
    h.runtime.tick(2, 0, 20);
    h.runtime.tick(4, 0, 20);
    const afterOne = h.runtime.distance;
    expect(afterOne).toBeGreaterThan(0);

    h.runtime.begin(20);
    h.runtime.tick(0, 0, 20);
    h.runtime.tick(2, 0, 20);
    h.runtime.tick(4, 0, 20);
    expect(h.runtime.distance).toBeCloseTo(afterOne, 6);
  });

  it('ghost stays invisible and frozen before GO; playback begins at GO', () => {
    const h = makeHarness(true);
    h.runtime.arm(TRACK, MODE);
    const ghost = (h.runtime as unknown as { ghost: { visible: boolean; group: THREE.Group } }).ghost;
    const startZ = ghost.group.position.z;

    for (let i = 0; i < 60; i++) h.runtime.tick(i * 0.016, 0, 20);
    expect(ghost.visible).toBe(false);
    expect(ghost.group.position.z).toBeCloseTo(startZ, 6);

    h.runtime.begin(30);
    h.runtime.tick(0, 0, 20);
    expect(ghost.visible).toBe(true);
  });

  it('first run (no ghost) races normally with no delta HUD and records a new best', () => {
    const h = makeHarness(false);
    h.runtime.arm(TRACK, MODE);

    expect(h.hudEl.classList.contains('hidden')).toBe(true);
    expect(h.notices.join()).toContain('No ghost');

    h.runtime.begin(30);
    tickUntil(h, 20);
    expect(h.hudEl.classList.contains('hidden')).toBe(true);

    const outcome = h.runtime.finish(1200, 20);
    expect(outcome.newBest).toBe(true);
    expect(outcome.ghostPresent).toBe(false);
    expect(h.store.bestScore(TRACK, MODE)).toBe(1200);
  });

  it('retry resets sectors and delta — no stale values leak into the next attempt', () => {
    const h = makeHarness(true);
    h.runtime.arm(TRACK, MODE);
    h.runtime.begin(30);
    tickUntil(h, 30);

    expect(h.runtime.getSectorDeltas()[0]).not.toBeNull();

    h.runtime.abort();
    h.runtime.arm(TRACK, MODE);
    h.runtime.begin(30);

    expect(h.runtime.getSectorDeltas().every((s) => s === null)).toBe(true);
    expect(h.deltaEl.textContent).toBe('+0.00s');
    expect(h.sector0El.textContent).toBe('S1 —');

    tickUntil(h, 30);
    expect(h.runtime.getSectorDeltas()[0]).not.toBeNull();
  });

  it('a cancelled run is never stored, even under a stray finish() callback', () => {
    const h = makeHarness(true);
    h.runtime.arm(TRACK, MODE);
    h.runtime.begin(30);
    tickUntil(h, 10);

    expect(h.store.bestScore(TRACK, MODE)).toBe(500);
    h.runtime.abort();

    const outcome = h.runtime.finish(9999, 30);
    expect(outcome.ghostPresent).toBe(false);
    expect(h.store.bestScore(TRACK, MODE)).toBe(500);
  });

  it('cleanup via dispose leaves stale callbacks inert', () => {
    const h = makeHarness(true);
    h.runtime.arm(TRACK, MODE);
    h.runtime.begin(30);

    h.runtime.dispose();
    const ghost = (h.runtime as unknown as { ghost: { built: boolean } }).ghost;
    expect(ghost.built).toBe(false);

    expect(() => h.runtime.tick(5, 0, 20)).not.toThrow();
    expect(() => h.runtime.finish(100, 5)).not.toThrow();
    expect(() => h.hud.setVisible(true)).not.toThrow();
  });

  it('rejects persisted runs with negative scores (P12)', () => {
    const storage = mockStorage();
    storage.setItem(
      'replays:p12',
      JSON.stringify({
        version: 1,
        entries: {
          'cyber-city:versus': {
            best: { data: 'abc', score: -50, duration: 30, date: 1 },
            latest: { data: 'abc', score: -50, duration: 30, date: 1 },
          },
        },
      })
    );
    const store = new ReplayStore('replays:p12', storage);
    expect(store.hasBest(TRACK, MODE)).toBe(false);
    expect(store.bestScore(TRACK, MODE)).toBeNull();
  });
});
