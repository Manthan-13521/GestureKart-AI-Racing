import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Countdown, type CountdownHooks } from './Countdown';

function makeHooks() {
  return { tick: vi.fn(), go: vi.fn(), clear: vi.fn() } satisfies CountdownHooks;
}

describe('Countdown (P2.2)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('ticks 3 → 2 → 1 → GO and fires onDone exactly once', () => {
    const hooks = makeHooks();
    const done = vi.fn();
    const cd = new Countdown(hooks, { intervalMs: 250 });

    cd.start(done);
    expect(cd.isActive).toBe(true);
    expect(hooks.tick).toHaveBeenCalledWith(3);

    vi.advanceTimersByTime(250);
    expect(hooks.tick).toHaveBeenLastCalledWith(2);
    vi.advanceTimersByTime(250);
    expect(hooks.tick).toHaveBeenLastCalledWith(1);
    vi.advanceTimersByTime(250);
    expect(hooks.go).toHaveBeenCalledTimes(1);
    expect(done).not.toHaveBeenCalled();

    vi.advanceTimersByTime(250);
    expect(done).toHaveBeenCalledTimes(1);
    expect(cd.isActive).toBe(false);

    // Timer released: no further beats, no duplicated completion.
    vi.advanceTimersByTime(5000);
    expect(hooks.tick).toHaveBeenCalledTimes(3);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('cancel() halts the beat and never calls onDone', () => {
    const hooks = makeHooks();
    const done = vi.fn();
    const cd = new Countdown(hooks, { intervalMs: 250 });

    cd.start(done);
    vi.advanceTimersByTime(250);
    cd.cancel();

    expect(cd.isActive).toBe(false);
    expect(hooks.clear).toHaveBeenCalled();
    vi.advanceTimersByTime(5000);
    expect(done).not.toHaveBeenCalled();
    expect(hooks.tick).toHaveBeenCalledTimes(2); // 3 + 2 only
  });

  it('start() while already running is a no-op (no duplicate timers)', () => {
    const hooks = makeHooks();
    const done1 = vi.fn();
    const done2 = vi.fn();
    const cd = new Countdown(hooks, { intervalMs: 250 });

    cd.start(done1);
    cd.start(done2);

    vi.advanceTimersByTime(1000);
    expect(done1).toHaveBeenCalledTimes(1);
    expect(done2).not.toHaveBeenCalled();
    expect(hooks.tick).toHaveBeenCalledTimes(3); // a single 3·2·1
  });

  it('cancel() is safe before start and idempotent', () => {
    const hooks = makeHooks();
    const cd = new Countdown(hooks, { intervalMs: 250 });
    expect(() => cd.cancel()).not.toThrow();
    cd.cancel();
    expect(cd.isActive).toBe(false);
  });

  it('restart works after the countdown finished', () => {
    const hooks = makeHooks();
    const done = vi.fn();
    const cd = new Countdown(hooks, { intervalMs: 100 });

    cd.start(done);
    vi.advanceTimersByTime(500);
    expect(done).toHaveBeenCalledTimes(1);

    cd.start(done);
    expect(cd.isActive).toBe(true);
    expect(hooks.tick).toHaveBeenLastCalledWith(3);
    vi.advanceTimersByTime(500);
    expect(done).toHaveBeenCalledTimes(2);
  });
});
