import { describe, it, expect, vi } from 'vitest';
import { RaceIntro, type RaceIntroTarget } from './RaceIntro';

function makeTarget() {
  return { prepare: vi.fn(), frame: vi.fn(), settle: vi.fn() } satisfies RaceIntroTarget;
}

describe('RaceIntro staging timeline (P2.1)', () => {
  it('runs prepare → frame(p) and settles+completes exactly once at p=1', () => {
    const target = makeTarget();
    let now = 0;
    const intro = new RaceIntro(target, { duration: 1000, now: () => now });
    const done = vi.fn();

    intro.begin(done);
    expect(intro.isActive).toBe(true);
    expect(target.prepare).toHaveBeenCalledTimes(1);
    expect(target.frame).toHaveBeenLastCalledWith(0);
    expect(done).not.toHaveBeenCalled();

    now = 500;
    intro.update();
    expect(target.frame).toHaveBeenLastCalledWith(0.5);

    now = 999;
    intro.update();
    expect(target.frame).toHaveBeenLastCalledWith(0.999);

    now = 1000;
    intro.update();
    expect(target.settle).toHaveBeenCalledTimes(1);
    expect(done).toHaveBeenCalledTimes(1);
    expect(intro.isActive).toBe(false);

    // Further updates are inert after completion.
    now = 5000;
    intro.update();
    expect(target.frame.mock.calls.length).toBeGreaterThan(1);
    expect(target.settle).toHaveBeenCalledTimes(1);
  });

  it('begin() while already active is a no-op (staging happens once)', () => {
    const target = makeTarget();
    let now = 0;
    const intro = new RaceIntro(target, { duration: 1000, now: () => now });
    const done = vi.fn();

    intro.begin(done);
    intro.begin(done); // ignored
    now = 1000;
    intro.update();

    expect(target.prepare).toHaveBeenCalledTimes(1);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('cancel() settles without firing onComplete and blocks later frames', () => {
    const target = makeTarget();
    let now = 0;
    const intro = new RaceIntro(target, { duration: 1000, now: () => now });
    const done = vi.fn();

    intro.begin(done);
    now = 500;
    intro.update();
    const frameCalls = target.frame.mock.calls.length;

    intro.cancel();
    expect(target.settle).toHaveBeenCalledTimes(1);
    expect(done).not.toHaveBeenCalled();
    expect(intro.isActive).toBe(false);

    now = 9000;
    intro.update();
    expect(target.frame.mock.calls.length).toBe(frameCalls);
    expect(done).not.toHaveBeenCalled();
  });

  it('clamps progress into [0, 1] (deterministic, cancel-safe)', () => {
    const target = makeTarget();
    let now = -500;
    const intro = new RaceIntro(target, { duration: 1000, now: () => now });
    const done = vi.fn();

    intro.begin(done);
    expect(target.frame).toHaveBeenLastCalledWith(0); // start time baseline

    now = -600; // earlier than startTime → clamped to 0
    intro.update();
    expect(target.frame).toHaveBeenLastCalledWith(0);

    now = 2500; // far past the end → completes once
    intro.update();
    expect(target.settle).toHaveBeenCalledTimes(1);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('reduced motion preserves the logical sequence but skips the sweep', () => {
    const target = makeTarget();
    let now = 0;
    const intro = new RaceIntro(target, { duration: 1000, now: () => now });
    const done = vi.fn();

    intro.begin(done, { reducedMotion: true });
    expect(target.prepare).toHaveBeenCalledTimes(1);
    expect(target.settle).toHaveBeenCalledTimes(1);
    expect(done).toHaveBeenCalledTimes(1);
    expect(target.frame).not.toHaveBeenCalled();
    expect(intro.isActive).toBe(false);

    now = 5000;
    intro.update();
    expect(target.frame).not.toHaveBeenCalled();
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('per-begin options override the constructor defaults', () => {
    const target = makeTarget();
    let now = 0;
    const intro = new RaceIntro(target, { duration: 1000, now: () => now });
    const done = vi.fn();

    intro.begin(done, { duration: 500 });
    expect(intro.lengthMs).toBe(500);
    now = 250;
    intro.update();
    expect(target.frame).toHaveBeenLastCalledWith(0.5);
  });
});
