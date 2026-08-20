import { describe, it, expect } from 'vitest';
import { SfxCooldown } from './SfxCooldown';

describe('SfxCooldown', () => {
  it('allows the first play of each kind', () => {
    const c = new SfxCooldown(() => 0);
    expect(c.tryAcquire('boost', 250)).toBe(true);
  });

  it('blocks re-plays inside the cooldown window', () => {
    let t = 0;
    const c = new SfxCooldown(() => t);
    expect(c.tryAcquire('boost', 250)).toBe(true);
    t = 100;
    expect(c.tryAcquire('boost', 250)).toBe(false);
    t = 251;
    expect(c.tryAcquire('boost', 250)).toBe(true);
  });

  it('tracks kinds independently', () => {
    let t = 0;
    const c = new SfxCooldown(() => t);
    expect(c.tryAcquire('nearmiss', 300)).toBe(true);
    t = 10;
    expect(c.tryAcquire('boost', 250)).toBe(true);
    expect(c.tryAcquire('nearmiss', 300)).toBe(false);
  });

  it('reset clears all cooldowns', () => {
    const t = 0;
    const c = new SfxCooldown(() => t);
    c.tryAcquire('boost', 250);
    c.reset();
    expect(c.tryAcquire('boost', 250)).toBe(true);
  });
});
