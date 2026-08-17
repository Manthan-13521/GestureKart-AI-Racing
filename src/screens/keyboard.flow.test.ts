import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigationSystem } from '../ui/core/NavigationSystem';
import { buildFlow, type FlowApi } from './flow';
import type { Screen } from '../ui/components/Screen';
import { FocusNavigator } from '../ui/core/FocusNavigator';
import type { PhoneSource } from '../input/PhoneSource';
import type { GarageScreen } from './GarageScreen';
import type { HowToPlayScreen } from './HowToPlayScreen';

vi.mock('../ui/core/AnimationSystem', () => ({
  AnimationSystem: {
    play: vi.fn(async () => undefined),
    stagger: vi.fn(async () => undefined),
    wait: vi.fn(async () => undefined),
  },
  isMotionReduced: () => false,
}));

vi.mock('../ui/core/SoundHooks', () => ({
  SoundHooks: {
    unlock: vi.fn(),
    dispose: vi.fn(),
    hover: vi.fn(),
    press: vi.fn(),
    confirm: vi.fn(),
    back: vi.fn(),
    error: vi.fn(),
    attach: vi.fn(),
    tone: vi.fn(),
    enabled: true,
  },
}));

const SETTINGS = {
  a11y: { highContrast: false, colorblind: false, largeHud: false, reducedMotion: false },
  sensitivity: 75,
  autoAccelerate: false,
  gyroscopeMode: false,
  graphicsQuality: 'balanced' as const,
  shadows: true,
  particles: true,
  masterVolume: 1,
  uiSounds: true,
};

function makeSettings(): FlowApi['settings'] {
  return {
    get: () => SETTINGS,
    save: vi.fn(),
    calibrateGesture: vi.fn(),
    onBack: vi.fn(),
  };
}

function makePhone(): PhoneSource {
  return {
    phoneConnected: false,
    roomCode: null,
    start: vi.fn(async () => undefined),
    stop: vi.fn(),
    send: vi.fn(),
    onMessage: vi.fn(),
    controllerUrl: vi.fn(() => 'https://example.local/pair'),
    onState: vi.fn(() => () => {}),
  } as unknown as PhoneSource;
}

const settle = (ms = 40) => new Promise((r) => setTimeout(r, ms));

function press(root: HTMLElement, key: string): void {
  root.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function focusedText(screen: Screen): string | null {
  return screen.focused?.textContent ?? null;
}

describe('keyboard flow (FocusNavigator through real screens)', () => {
  let mount: HTMLElement;
  let nav: NavigationSystem;

  beforeEach(async () => {
    mount = document.createElement('div');
    document.body.innerHTML = '';
    document.body.appendChild(mount);
    nav = new NavigationSystem(mount);
    buildFlow(nav, {
      getBestScore: () => 0,
      settings: makeSettings(),
      garage: {} as GarageScreen,
      howToPlay: {} as HowToPlayScreen,
      phone: makePhone(),
      startRace: vi.fn(),
    });
    await nav.go('menu');
    await settle();
  });

  function screenAs<T = Screen>(): T {
    return nav.currentScreen as T;
  }

  it('menu arrows move focus between buttons; track arrows + Enter open mode-select', async () => {
    const menu = screenAs<Screen>();
    // focusFirst targets the Race button
    expect(focusedText(menu)).toBe('Race');
    press(menu.el, 'ArrowDown'); // vertical stack crosses button → button
    expect(focusedText(menu)).toBe('Garage');
    press(menu.el, 'ArrowUp');
    expect(focusedText(menu)).toBe('Race');

    // Enter on a native button is left to the browser; click is the pointer path.
    document.querySelector('.menu-actions .btn')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle();
    expect(nav.current).toBe('track-select');

    const tracks = screenAs<Screen>();
    expect(focusedText(tracks)).toContain('Cyber City');
    press(tracks.el, 'ArrowRight');
    expect(focusedText(tracks)).toContain('Mountain Highway');

    // Enter activates a card (article[role=button]) via the navigator.
    press(tracks.el, 'Enter');
    await settle();
    expect(nav.current).toBe('mode-select');
  });

  it('mode-select arrows cross mode grid → control chips; Escape returns to track-select', async () => {
    document.querySelector('.menu-actions .btn')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle();
    const tracks = screenAs<Screen>();
    press(tracks.el, 'Enter'); // select Cyber City → mode-select
    await settle();
    expect(nav.current).toBe('mode-select');

    const modes = screenAs<Screen>();
    // modes cluster: versus → multiplayer → ai-race → survival → chips cluster
    press(modes.el, 'ArrowDown');
    expect(focusedText(modes)).toContain('Multiplayer');
    press(modes.el, 'ArrowDown');
    press(modes.el, 'ArrowDown');
    expect(focusedText(modes)).toContain('Endless Survival');
    press(modes.el, 'ArrowDown'); // cross into control chips
    expect(focusedText(modes)).toBe('Keyboard');
    press(modes.el, 'ArrowRight');
    press(modes.el, 'ArrowRight');
    press(modes.el, 'ArrowRight');
    expect(focusedText(modes)).toContain('Phone Wheel');

    // Escape invokes onBack → track-select
    press(modes.el, 'Escape');
    await settle();
    expect(nav.current).toBe('track-select');
  });

  it('keyboard focuses the phone chip; versus routes to phone-pairing with phone control', async () => {
    document.querySelector('.menu-actions .btn')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle();
    const tracks = screenAs<Screen>();
    press(tracks.el, 'Enter');
    await settle();
    expect(nav.current).toBe('mode-select');

    const modes = screenAs<{ controlMethod: string; el: HTMLElement } & Screen>();
    // cross to chips cluster and land on the phone chip
    for (let i = 0; i < 4; i++) press(modes.el, 'ArrowDown');
    for (let i = 0; i < 3; i++) press(modes.el, 'ArrowRight');
    expect(focusedText(modes)).toContain('Phone Wheel');

    // Native button activation is real-browser territory; click simulates the
    // activation the Enter key performs in a browser.
    const phoneChip = document.querySelector('.control-chip[data-method="phone"]') as HTMLElement;
    phoneChip.click();
    expect(modes.controlMethod).toBe('phone');

    // versus allows phone (P0.2) → phone-pairing route
    const modeCards = document.querySelectorAll('.glass-card');
    (modeCards[0] as HTMLElement).click();
    await settle();
    expect(nav.current).toBe('phone-pairing');
    expect(nav.currentScreen!.el.textContent).toContain('Phone Controller');
  });

  it('FocusNavigator command API remains usable without a gamepad attached', () => {
    const root = nav.currentScreen!.el;
    const nav2 = new FocusNavigator(root, {});
    nav2.bind();
    nav2.focusFirst();
    expect(nav2.active).toBeTruthy();
    nav2.move('down');
    nav2.activate();
    nav2.cancel();
    nav2.dispose();
  });
});
