import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { GhostHud } from './hud';

describe('GhostHud delta tick (GDD §12.2)', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="ghost-hud">
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
  });
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('fires when the whole-second delta boundary is crossed', () => {
    const onTick = vi.fn();
    new GhostHud('ghost-hud', onTick);
    const hud = new GhostHud('ghost-hud', onTick);
    hud.update({ delta: 0.2, ahead: true });
    expect(onTick).not.toHaveBeenCalled();
    hud.update({ delta: 1.1, ahead: true });
    expect(onTick).toHaveBeenCalledWith(true);
  });

  it('fires on ahead/behind flips even within a second', () => {
    const onTick = vi.fn();
    const hud = new GhostHud('ghost-hud', onTick);
    hud.update({ delta: 0.3, ahead: true });
    expect(onTick).not.toHaveBeenCalled();
    hud.update({ delta: -0.3, ahead: false });
    expect(onTick).toHaveBeenCalledTimes(1);
    expect(onTick).toHaveBeenCalledWith(false);
  });

  it('is a silent no-op without a callback', () => {
    const hud = new GhostHud('ghost-hud');
    expect(() => hud.update({ delta: 2.5, ahead: true })).not.toThrow();
  });

  it('does not fire on tiny same-second changes', () => {
    const onTick = vi.fn();
    const hud = new GhostHud('ghost-hud', onTick);
    hud.update({ delta: 0.2, ahead: true });
    hud.update({ delta: 0.4, ahead: true });
    hud.update({ delta: 0.9, ahead: true });
    expect(onTick).not.toHaveBeenCalled();
  });
});
