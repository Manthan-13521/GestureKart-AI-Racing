import { describe, it, expect, beforeEach } from 'vitest';
import { BoostController, BOOST_DURATION, BOOST_SPEED_BONUS } from './boost';

describe('BoostController', () => {
  let boost: BoostController;

  beforeEach(() => {
    boost = new BoostController();
  });

  it('starts inactive', () => {
    expect(boost.state.active).toBe(false);
    expect(boost.state.timeLeft).toBe(0);
    expect(boost.state.invulnerable).toBe(false);
  });

  it('activates on activate()', () => {
    boost.activate();
    expect(boost.state.active).toBe(true);
    expect(boost.state.timeLeft).toBe(BOOST_DURATION);
    expect(boost.state.invulnerable).toBe(true);
    expect(boost.state.speedBonus).toBe(BOOST_SPEED_BONUS);
  });

  it('ticks down and expires', () => {
    boost.activate();
    expect(boost.tick(0.5)).toBe(true);
    expect(boost.state.timeLeft).toBeCloseTo(BOOST_DURATION - 0.5, 2);

    boost.tick(BOOST_DURATION);
    expect(boost.state.active).toBe(false);
    expect(boost.state.timeLeft).toBe(0);
    expect(boost.state.invulnerable).toBe(false);
  });

  it('does not go negative', () => {
    boost.activate();
    boost.tick(BOOST_DURATION + 10);
    expect(boost.state.timeLeft).toBe(0);
  });

  it('refreshes duration on new activation (no stacking)', () => {
    boost.activate();
    boost.tick(0.5);
    const timeAfterFirst = boost.state.timeLeft;
    boost.activate(); // refresh
    expect(boost.state.timeLeft).toBe(BOOST_DURATION);
    expect(boost.state.timeLeft).toBeGreaterThan(timeAfterFirst);
  });

  it('resets cleanly', () => {
    boost.activate();
    boost.reset();
    expect(boost.state.active).toBe(false);
    expect(boost.state.timeLeft).toBe(0);
  });
});
