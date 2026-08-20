import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StateMachine } from './StateMachine';
import { Countdown, type CountdownHooks } from './Countdown';
import { RaceIntro, type RaceIntroTarget } from './RaceIntro';
import { RaceStartPipeline } from './RaceStartPipeline';

interface Rig {
  stateMachine: StateMachine;
  pipeline: RaceStartPipeline;
  countdown: Countdown;
  intro: RaceIntro;
  onRacing: ReturnType<typeof vi.fn>;
  onCancel: ReturnType<typeof vi.fn>;
  target: RaceIntroTarget & {
    prepare: ReturnType<typeof vi.fn>;
    frame: ReturnType<typeof vi.fn>;
    settle: ReturnType<typeof vi.fn>;
  };
  hooks: CountdownHooks & {
    tick: ReturnType<typeof vi.fn>;
    go: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  };
  finishStaging: () => void;
}

function makeRig(): Rig {
  const stateMachine = new StateMachine();
  const hooks = { tick: vi.fn(), go: vi.fn(), clear: vi.fn() } as Rig['hooks'];
  const countdown = new Countdown(hooks, { intervalMs: 250 });
  const target = { prepare: vi.fn(), frame: vi.fn(), settle: vi.fn() } as Rig['target'];
  let clock = 0;
  const intro = new RaceIntro(target, { duration: 1000, now: () => clock });
  const onRacing = vi.fn();
  const onCancel = vi.fn();
  const pipeline = new RaceStartPipeline({ stateMachine, countdown, intro, onRacing, onCancel });
  const finishStaging = () => {
    clock = 1000;
    pipeline.tick(clock);
  };
  return { stateMachine, pipeline, countdown, intro, onRacing, onCancel, target, hooks, finishStaging };
}

describe('RaceStartPipeline (P2.1 + P2.2 integration)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('full pipeline: ready → intro → staging → countdown → racing (onRacing once)', () => {
    const rig = makeRig();
    expect(rig.pipeline.stage).toBe('idle');

    rig.pipeline.start();
    expect(rig.stateMachine.get()).toBe('intro');
    expect(rig.pipeline.stage).toBe('staging');
    expect(rig.intro.isActive).toBe(true);

    rig.finishStaging();
    expect(rig.pipeline.stage).toBe('countdown');
    expect(rig.countdown.isActive).toBe(true);

    vi.advanceTimersByTime(250);
    vi.advanceTimersByTime(250);
    vi.advanceTimersByTime(250); // GO
    expect(rig.onRacing).not.toHaveBeenCalled();
    vi.advanceTimersByTime(250); // final beat → race start
    expect(rig.onRacing).toHaveBeenCalledTimes(1);
    expect(rig.stateMachine.get()).toBe('racing');
    expect(rig.pipeline.stage).toBe('racing');
  });

  it('racing cannot start from time passing alone — staging is pipeline-ticked', () => {
    const rig = makeRig();
    rig.pipeline.start();
    vi.advanceTimersByTime(10000);
    expect(rig.pipeline.stage).toBe('staging');
    expect(rig.onRacing).not.toHaveBeenCalled();
  });

  it('cancel during staging prevents countdown/racing and cleans up timers', () => {
    const rig = makeRig();
    rig.pipeline.start();
    rig.pipeline.cancel();

    expect(rig.pipeline.stage).toBe('cancelled');
    expect(rig.intro.isActive).toBe(false);
    expect(rig.countdown.isActive).toBe(false);
    expect(rig.onRacing).not.toHaveBeenCalled();
    expect(rig.onCancel).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    expect(rig.onRacing).not.toHaveBeenCalled();
  });

  it('cancel during countdown stops the beat and never starts racing', () => {
    const rig = makeRig();
    rig.pipeline.start();
    rig.finishStaging();
    expect(rig.pipeline.stage).toBe('countdown');

    vi.advanceTimersByTime(250);
    rig.pipeline.cancel();
    expect(rig.countdown.isActive).toBe(false);

    vi.advanceTimersByTime(5000);
    expect(rig.onRacing).not.toHaveBeenCalled();
    expect(rig.stateMachine.get()).toBe('intro'); // nav handler resets to idle
  });

  it('starting twice while staging/countdown is active is ignored (no double race)', () => {
    const rig = makeRig();
    rig.pipeline.start();
    rig.pipeline.start(); // duplicate event → ignored
    rig.finishStaging();
    vi.advanceTimersByTime(1000);
    expect(rig.onRacing).toHaveBeenCalledTimes(1);
  });

  it('a stray duplicate countdown callback cannot double-start racing', () => {
    const rig = makeRig();
    rig.pipeline.start();
    rig.finishStaging();
    // Simulate a duplicate event trying to arm the same countdown again.
    rig.countdown.start(rig.onRacing as () => void);
    vi.advanceTimersByTime(1000);
    expect(rig.onRacing).toHaveBeenCalledTimes(1);
  });

  it('restarts cleanly after cancel (RACE AGAIN path)', () => {
    const rig = makeRig();
    rig.pipeline.start();
    rig.pipeline.cancel();
    rig.pipeline.start();

    expect(rig.pipeline.stage).toBe('staging');
    rig.finishStaging();
    vi.advanceTimersByTime(1000);
    expect(rig.onRacing).toHaveBeenCalledTimes(1);
    expect(rig.stateMachine.get()).toBe('racing');
  });

  it('reduced motion shortcuts staging but still needs the countdown to enable racing', () => {
    const rig = makeRig();
    rig.pipeline.start({ reducedMotion: true });

    expect(rig.pipeline.stage).toBe('countdown');
    expect(rig.countdown.isActive).toBe(true);
    expect(rig.target.prepare).toHaveBeenCalledTimes(1);
    expect(rig.target.settle).toHaveBeenCalledTimes(1);
    expect(rig.target.frame).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(rig.onRacing).toHaveBeenCalledTimes(1);
    expect(rig.stateMachine.get()).toBe('racing');
  });

  it('countdown completion is the only path into racing (no public bypass)', () => {
    const rig = makeRig();
    // Never started: input events and time cannot reach onRacing.
    vi.advanceTimersByTime(5000);
    expect(rig.onRacing).not.toHaveBeenCalled();

    // Out-of-band countdown hooks firing cannot reach the private goRacing().
    rig.hooks.go();
    rig.hooks.tick(1);
    expect(rig.onRacing).not.toHaveBeenCalled();
  });
});
