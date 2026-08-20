import { describe, it, expect, beforeEach } from 'vitest';
import { CollisionJuice, HIT_STOP_DURATION, SLOW_MO_DURATION, SLOW_MO_SCALE } from './collisionJuice';

describe('CollisionJuice', () => {
  let juice: CollisionJuice;

  beforeEach(() => {
    juice = new CollisionJuice();
  });

  it('starts idle', () => {
    expect(juice.isActive()).toBe(false);
    expect(juice.state.phase).toBe('idle');
    expect(juice.state.timeScale).toBe(1);
  });

  it('activates hit-stop phase', () => {
    juice.activate();
    expect(juice.isActive()).toBe(true);
    expect(juice.state.phase).toBe('hitstop');
    expect(juice.state.timeScale).toBe(0);
    expect(juice.state.timeLeft).toBeCloseTo(HIT_STOP_DURATION, 2);
  });

  it('transitions to slow-mo after hit-stop', () => {
    juice.activate();
    juice.tick(HIT_STOP_DURATION);
    expect(juice.state.phase).toBe('slowmo');
    expect(juice.state.timeScale).toBe(SLOW_MO_SCALE);
  });

  it('completes slow-mo after ~0.4s', () => {
    juice.activate();
    juice.tick(HIT_STOP_DURATION);
    const done = juice.tick(SLOW_MO_DURATION);
    expect(done).toBe(true); // tick returns true while active
    expect(juice.state.phase).toBe('done');
    expect(juice.isActive()).toBe(true); // still active until consumed
  });

  it('consumeDone returns true once and resets', () => {
    juice.activate();
    juice.tick(HIT_STOP_DURATION + SLOW_MO_DURATION);
    expect(juice.consumeDone()).toBe(true);
    expect(juice.isActive()).toBe(false);
    expect(juice.consumeDone()).toBe(false);
  });

  it('timeScale progression: 1 -> 0 -> 0.25 -> 1', () => {
    juice.activate();
    expect(juice.state.timeScale).toBe(0); // hit-stop
    juice.tick(HIT_STOP_DURATION);
    expect(juice.state.timeScale).toBe(SLOW_MO_SCALE); // slow-mo
    juice.tick(SLOW_MO_DURATION);
    juice.consumeDone();
    expect(juice.state.timeScale).toBe(1); // back to normal
  });

  it('reset clears everything', () => {
    juice.activate();
    juice.tick(0.1);
    juice.reset();
    expect(juice.isActive()).toBe(false);
    expect(juice.state.phase).toBe('idle');
    expect(juice.state.timeScale).toBe(1);
  });

  it('tick returns false when idle', () => {
    expect(juice.tick(0.1)).toBe(false);
  });

  it('does not over-tick into negative', () => {
    juice.activate();
    juice.tick(HIT_STOP_DURATION + SLOW_MO_DURATION + 10);
    expect(juice.state.timeLeft).toBe(0);
    expect(juice.consumeDone()).toBe(true);
  });
});
