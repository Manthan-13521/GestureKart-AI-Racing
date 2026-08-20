import { describe, it, expect } from 'vitest';
import { InputManager, type TouchElements } from './InputManager';
import { EventBus } from '../core/EventBus';

/**
 * P7.2 — Input reliability tests (Phase 7).
 *
 * The touch buttons bind to Pointer Events (pointerdown/pointerup/
 * pointercancel/pointerleave + pointer capture). These tests assert the
 * "no stuck control" invariants: every press path has a matching release
 * path, cancellation releases, and the touchApply callback is invoked on
 * EVERY transition — including the fully-released state — so the base
 * layer can publish neutral and never goes stale.
 */

function makeTouchUI(): { im: InputManager; els: TouchElements } {
  const im = new InputManager(new EventBus());
  const el = (): HTMLElement => document.createElement('button');
  const els: TouchElements = {
    left: el(),
    right: el(),
    accel: el(),
    auto: el(),
    modeLabel: el(),
  };
  im.bindTouchControls(els);
  return { im, els };
}

/** happy-dom ships PointerEvent; if not, fall back to a plain Event cast. */
function pointer(el: HTMLElement, type: string, init: PointerEventInit = {}): void {
  const ev =
    typeof PointerEvent !== 'undefined'
      ? new PointerEvent(type, { bubbles: true, button: 0, pointerType: 'touch', pointerId: 1, ...init })
      : (new Event(type, { bubbles: true }) as unknown as PointerEvent);
  el.dispatchEvent(ev);
}

/** Mirror of main.ts applyTouchState: always publish the complete state. */
function wireNeutralPublisher(im: InputManager): void {
  im.onTouchChanged(() => {
    const touch = im.touch;
    im.setBase('touch', {
      steer: touch.left ? -1 : touch.right ? 1 : 0,
      throttle: touch.up ? 1 : touch.left || touch.right ? 0.5 : 0,
      brake: 0,
      boostButton: false,
    });
  });
}

describe('touch buttons — pointer lifecycle', () => {
  it('pointerdown presses GAS and pointerup releases it', () => {
    const { im, els } = makeTouchUI();
    let calls = 0;
    im.onTouchChanged(() => calls++);

    pointer(els.accel, 'pointerdown');
    expect(im.touch.up).toBe(true);
    expect(im.touch.active).toBe(true);
    expect(els.accel.classList.contains('pressed')).toBe(true);

    pointer(els.accel, 'pointerup');
    expect(im.touch.up).toBe(false);
    expect(im.touch.active).toBe(false);
    expect(els.accel.classList.contains('pressed')).toBe(false);
    expect(calls).toBe(2); // press AND release both notify
  });

  it('pointercancel releases the button (browser takes the gesture)', () => {
    const { im, els } = makeTouchUI();
    pointer(els.accel, 'pointerdown');
    pointer(els.accel, 'pointercancel');
    expect(im.touch.up).toBe(false);
    expect(im.touch.active).toBe(false);
  });

  it('pointerleave releases when there is no active capture', () => {
    const { im, els } = makeTouchUI();
    pointer(els.left, 'pointerdown');
    pointer(els.left, 'pointerleave');
    expect(im.touch.left).toBe(false);
    expect(im.touch.active).toBe(false);
  });

  it('pointerleave does NOT release while a capture is active', () => {
    const { im, els } = makeTouchUI();
    let captured = false;
    els.left.setPointerCapture = () => {
      captured = true;
    };
    els.left.hasPointerCapture = () => captured;

    pointer(els.left, 'pointerdown');
    pointer(els.left, 'pointerleave');
    expect(im.touch.left).toBe(true); // capture holds the press

    pointer(els.left, 'pointerup');
    expect(im.touch.left).toBe(false);
  });

  it('ignores non-primary pointer buttons (right-click must not steer)', () => {
    const { im, els } = makeTouchUI();
    pointer(els.right, 'pointerdown', { button: 2, pointerType: 'mouse' });
    expect(im.touch.right).toBe(false);
    expect(im.touch.active).toBe(false);
  });

  it('setPointerCapture failure must not break the press', () => {
    const { im, els } = makeTouchUI();
    els.left.setPointerCapture = () => {
      throw new DOMException('InvalidPointerId');
    };
    pointer(els.left, 'pointerdown');
    expect(im.touch.left).toBe(true);
    pointer(els.left, 'pointerup');
    expect(im.touch.left).toBe(false);
  });
});

describe('touch buttons — multi-pointer independence', () => {
  it('left and right held together: releasing one keeps the other', () => {
    const { im, els } = makeTouchUI();
    pointer(els.left, 'pointerdown');
    pointer(els.right, 'pointerdown');
    expect(im.touch.left).toBe(true);
    expect(im.touch.right).toBe(true);
    expect(im.touch.active).toBe(true);

    pointer(els.left, 'pointerup');
    expect(im.touch.left).toBe(false);
    expect(im.touch.right).toBe(true);
    expect(im.touch.active).toBe(true);

    pointer(els.right, 'pointerup');
    expect(im.touch.active).toBe(false);
  });

  it('rapid press/release never leaves a button stuck', () => {
    const { im, els } = makeTouchUI();
    for (let i = 0; i < 10; i++) {
      pointer(els.accel, 'pointerdown');
      pointer(els.accel, 'pointerup');
    }
    expect(im.touch.up).toBe(false);
    expect(im.touch.active).toBe(false);
  });

  it('rapid press with interleaved cancels never leaves a button stuck', () => {
    const { im, els } = makeTouchUI();
    for (let i = 0; i < 10; i++) {
      pointer(els.accel, 'pointerdown');
      pointer(els.accel, 'pointercancel');
    }
    expect(im.touch.up).toBe(false);
  });
});

describe('touch buttons — no stuck input after release (base layer)', () => {
  it('frame() returns neutral after a full release when auto-accelerate is off', () => {
    const { im, els } = makeTouchUI();
    wireNeutralPublisher(im);
    im.autoAccelerate = false;

    pointer(els.accel, 'pointerdown');
    expect(im.frame(0.5).throttle).toBe(1);

    pointer(els.accel, 'pointerup');
    expect(im.frame(0.5).throttle).toBe(0);
    expect(im.frame(0.5).steer).toBe(0);
  });

  it('frame() returns neutral after pointercancel when auto-accelerate is off', () => {
    const { im, els } = makeTouchUI();
    wireNeutralPublisher(im);
    im.autoAccelerate = false;

    pointer(els.left, 'pointerdown');
    expect(im.frame(0.5).steer).toBe(-1);

    pointer(els.left, 'pointercancel');
    expect(im.frame(0.5).steer).toBe(0);
    expect(im.frame(0.5).throttle).toBe(0);
  });

  it('publishing a neutral base frame clears a previously held frame', () => {
    const im = new InputManager(new EventBus());
    im.setBase('keyboard', { steer: 1, throttle: 1, brake: 0, boostButton: false });
    im.setBase('keyboard', { steer: 0, throttle: 0, brake: 0, boostButton: false });
    expect(im.frame(0.5)).toEqual({ steer: 0, throttle: 0, brake: 0, boostButton: false });
  });
});

describe('touch buttons — toggles', () => {
  it('AUTO click toggles auto-accelerate and re-applies touch state', () => {
    const { im, els } = makeTouchUI();
    wireNeutralPublisher(im);
    pointer(els.accel, 'pointerdown'); // GAS held
    els.auto.click();
    expect(im.autoAccelerate).toBe(true);
    els.auto.click();
    expect(im.autoAccelerate).toBe(false);
  });

  it('double-tap TOUCH label toggles gyro mode', () => {
    const { im, els } = makeTouchUI();
    const originalNow = Date.now;
    let now = 1000;
    Date.now = () => now;

    els.modeLabel.click();
    expect(im.gyroscopeMode).toBe(false); // single tap: no toggle
    now += 100;
    els.modeLabel.click();
    expect(im.gyroscopeMode).toBe(true); // double tap

    now += 500; // outside the 400ms window
    els.modeLabel.click();
    now += 100;
    els.modeLabel.click();
    expect(im.gyroscopeMode).toBe(false);

    Date.now = originalNow;
  });
});

describe('one-hand mode (GDD §2.4)', () => {
  it('steering side also accelerates in one-hand mode', () => {
    const { im, els } = makeTouchUI();
    im.oneHand = true;
    pointer(els.right, 'pointerdown');
    const frame = im.touchSource.read();
    expect(frame.steer).toBe(1);
    expect(frame.throttle).toBe(1);
  });

  it('left side steers left and accelerates in one-hand mode', () => {
    const { im, els } = makeTouchUI();
    im.oneHand = true;
    pointer(els.left, 'pointerdown');
    const frame = im.touchSource.read();
    expect(frame.steer).toBe(-1);
    expect(frame.throttle).toBe(1);
  });

  it('releasing the only side returns to neutral', () => {
    const { im, els } = makeTouchUI();
    im.oneHand = true;
    pointer(els.right, 'pointerdown');
    pointer(els.right, 'pointerup');
    const frame = im.touchSource.read();
    expect(frame.steer).toBe(0);
    expect(frame.throttle).toBe(0);
  });

  it('standard mode keeps throttle on the accel button only', () => {
    const { im, els } = makeTouchUI();
    im.oneHand = false;
    pointer(els.right, 'pointerdown');
    const frame = im.touchSource.read();
    expect(frame.steer).toBe(1);
    expect(frame.throttle).toBe(0);
  });
});
