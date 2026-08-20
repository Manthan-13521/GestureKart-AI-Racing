import { describe, it, expect, vi } from 'vitest';
import { RaceFeedbackWatcher, type RaceFeedbackInput } from './RaceFeedbackWatcher';

function racing(overrides: Partial<RaceFeedbackInput> = {}): RaceFeedbackInput {
  return {
    position: 2,
    totalCars: 6,
    lap: 1,
    totalLaps: 2,
    draftZone: 'none',
    boostActive: false,
    racing: true,
    ...overrides,
  };
}

describe('RaceFeedbackWatcher — position changes', () => {
  it('fires onPositionChange once per change with the correct direction', () => {
    const onPositionChange = vi.fn();
    const w = new RaceFeedbackWatcher({ onPositionChange });

    w.tick(racing({ position: 4 }));
    w.tick(racing({ position: 4 })); // no change → nothing
    w.tick(racing({ position: 3 })); // gain
    w.tick(racing({ position: 5 })); // loss

    expect(onPositionChange).toHaveBeenCalledTimes(2);
    expect(onPositionChange).toHaveBeenNthCalledWith(1, 4, 3, 'gain');
    expect(onPositionChange).toHaveBeenNthCalledWith(2, 3, 5, 'loss');
  });

  it('does not fire on the first racing frame (baseline only)', () => {
    const onPositionChange = vi.fn();
    const w = new RaceFeedbackWatcher({ onPositionChange });
    w.tick(racing({ position: 1 }));
    expect(onPositionChange).not.toHaveBeenCalled();
  });

  it('does not fire outside a race even if values differ', () => {
    const onPositionChange = vi.fn();
    const w = new RaceFeedbackWatcher({ onPositionChange });
    w.tick(racing({ racing: false, position: 1 }));
    w.tick(racing({ racing: false, position: 6 }));
    expect(onPositionChange).not.toHaveBeenCalled();
  });

  it('resets edge state so a new race starts with a clean baseline', () => {
    const onPositionChange = vi.fn();
    const w = new RaceFeedbackWatcher({ onPositionChange });
    w.tick(racing({ position: 4 }));
    w.reset();
    w.tick(racing({ position: 4 }));
    expect(onPositionChange).not.toHaveBeenCalled();
  });
});

describe('RaceFeedbackWatcher — lead changes', () => {
  it('fires lead change when entering and leaving first place', () => {
    const onLeadChange = vi.fn();
    const w = new RaceFeedbackWatcher({ onLeadChange });
    w.tick(racing({ position: 2 }));
    w.tick(racing({ position: 1 })); // → lead
    w.tick(racing({ position: 1 })); // still lead
    w.tick(racing({ position: 3 })); // lost lead
    expect(onLeadChange).toHaveBeenCalledTimes(2);
    expect(onLeadChange).toHaveBeenNthCalledWith(1, true);
    expect(onLeadChange).toHaveBeenNthCalledWith(2, false);
  });
});

describe('RaceFeedbackWatcher — draft edges', () => {
  it('fires draft enter once when moving into optimal or entry', () => {
    const onDraftEnter = vi.fn();
    const w = new RaceFeedbackWatcher({ onDraftEnter });
    w.tick(racing({ draftZone: 'none' }));
    w.tick(racing({ draftZone: 'entry' }));
    w.tick(racing({ draftZone: 'entry' })); // no repeat
    w.tick(racing({ draftZone: 'optimal' })); // deepen, but still inside → no enter
    expect(onDraftEnter).toHaveBeenCalledTimes(1);
    expect(onDraftEnter).toHaveBeenCalledWith('entry');
  });

  it('fires draft enter from dirty and cooldown too', () => {
    const onDraftEnter = vi.fn();
    const w = new RaceFeedbackWatcher({ onDraftEnter });
    w.tick(racing({ draftZone: 'dirty' }));
    w.tick(racing({ draftZone: 'optimal' }));
    w.tick(racing({ draftZone: 'cooldown' }));
    w.tick(racing({ draftZone: 'entry' }));
    expect(onDraftEnter).toHaveBeenCalledTimes(2);
  });

  it('fires draft exit only when leaving entry/optimal to none/cooldown', () => {
    const onDraftExit = vi.fn();
    const w = new RaceFeedbackWatcher({ onDraftExit });
    w.tick(racing({ draftZone: 'optimal' }));
    w.tick(racing({ draftZone: 'dirty' })); // slip out of optimal: still near, not a full exit
    w.tick(racing({ draftZone: 'none' })); // leaves dirty air for open road: no drafting exit either
    w.tick(racing({ draftZone: 'entry' }));
    w.tick(racing({ draftZone: 'cooldown' })); // left drafting → exit
    expect(onDraftExit).toHaveBeenCalledTimes(1);
    expect(onDraftExit).toHaveBeenCalledWith('entry', 'cooldown');

    w.reset();
    w.tick(racing({ draftZone: 'optimal' }));
    w.tick(racing({ draftZone: 'none' })); // direct exit from optimal
    expect(onDraftExit).toHaveBeenCalledTimes(2);
    expect(onDraftExit).toHaveBeenNthCalledWith(2, 'optimal', 'none');
  });

  it('does not treat a direct none→none or entry→optimal as enter/exit', () => {
    const onDraftEnter = vi.fn();
    const onDraftExit = vi.fn();
    const w = new RaceFeedbackWatcher({ onDraftEnter, onDraftExit });
    w.tick(racing({ draftZone: 'none' }));
    w.tick(racing({ draftZone: 'none' }));
    w.tick(racing({ draftZone: 'entry' }));
    w.tick(racing({ draftZone: 'optimal' }));
    expect(onDraftEnter).toHaveBeenCalledTimes(1);
    expect(onDraftExit).not.toHaveBeenCalled();
  });
});

describe('RaceFeedbackWatcher — boost & lap', () => {
  it('fires boost start only on the rising edge', () => {
    const onBoostStart = vi.fn();
    const w = new RaceFeedbackWatcher({ onBoostStart });
    w.tick(racing({ boostActive: false }));
    w.tick(racing({ boostActive: true }));
    w.tick(racing({ boostActive: true })); // still active
    w.tick(racing({ boostActive: false }));
    w.tick(racing({ boostActive: true })); // second pickup
    expect(onBoostStart).toHaveBeenCalledTimes(2);
  });

  it('fires lap change only for forward progress', () => {
    const onLapChange = vi.fn();
    const w = new RaceFeedbackWatcher({ onLapChange });
    w.tick(racing({ lap: 1, totalLaps: 3 }));
    w.tick(racing({ lap: 2, totalLaps: 3 }));
    w.tick(racing({ lap: 2, totalLaps: 3 }));
    w.tick(racing({ lap: 3, totalLaps: 3 }));
    expect(onLapChange).toHaveBeenCalledTimes(2);
    expect(onLapChange).toHaveBeenNthCalledWith(1, 1, 2, 3);
    expect(onLapChange).toHaveBeenNthCalledWith(2, 2, 3, 3);
  });
});
