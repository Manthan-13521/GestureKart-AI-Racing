import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NavigationSystem } from '../ui/core/NavigationSystem';
import { buildFlow, type FlowApi } from './flow';
import { ModeSelectScreen, CONTROL_METHODS } from './ModeSelectScreen';
import { TrackSelectScreen } from './TrackSelectScreen';
import { GameplayScreen } from './GameplayScreen';
import { spawnRoad } from './ambient';
import type { PhoneSource } from '../input/PhoneSource';
import { ThemeManager } from '../ui/ThemeManager';

vi.mock('../ui/core/AnimationSystem', () => ({
  AnimationSystem: {
    play: vi.fn(async () => undefined),
    stagger: vi.fn(async () => undefined),
    wait: vi.fn(async () => undefined),
  },
  isMotionReduced: () => ThemeManager.getInstance().reducedMotion,
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

function makeSettings(): FlowApi['settings'] {
  return {
    get: () => ({
      a11y: {
        highContrast: false,
        colorblind: false,
        colorblindMode: 'none',
        largeHud: false,
        reducedMotion: false,
      },
      sensitivity: 75,
      autoAccelerate: false,
      gyroscopeMode: false,
      oneHand: false,
      graphicsQuality: 'balanced' as const,
      shadows: true,
      particles: true,
      masterVolume: 1,
      uiSounds: true,
    }),
    save: vi.fn(),
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

function buildNav(container: HTMLElement): NavigationSystem {
  const nav = new NavigationSystem(container);
  buildFlow(nav, {
    getBestScore: () => 0,
    settings: makeSettings(),
    garage: { onBack: vi.fn() } as never,
    howToPlay: { onBack: vi.fn() } as never,
    achievements: { onBack: vi.fn() } as never,
    profile: { onBack: vi.fn() } as never,
    leaderboard: { onBack: vi.fn() } as never,
    phone: makePhone(),
    startRace: vi.fn(),
  });
  return nav;
}

describe('P1.2 control-method chips UX', () => {
  let mount: HTMLElement;
  let nav: NavigationSystem;

  beforeEach(async () => {
    document.body.innerHTML = '';
    mount = document.createElement('div');
    document.body.appendChild(mount);
    nav = buildNav(mount);
    await nav.go('mode-select');
  });

  it('renders one chip per CONTROL_METHODS entry with data-method and role', () => {
    const chips = Array.from(mount.querySelectorAll<HTMLElement>('.control-chip'));
    expect(chips.length).toBe(CONTROL_METHODS.length);
    for (const def of CONTROL_METHODS) {
      expect(mount.querySelector(`.control-chip[data-method="${def.id}"]`)?.textContent).toContain(def.label);
    }
    const group = mount.querySelector('.control-method-chips');
    expect(group?.getAttribute('role')).toBe('group');
    expect(group?.getAttribute('aria-label')).toBe('Control method');
  });

  it('marks the pending gamepad chip as unavailable and disabled', () => {
    const chip = mount.querySelector<HTMLButtonElement>('.control-chip[data-method="gamepad"]');
    expect(chip).toBeTruthy();
    expect(chip!.disabled).toBe(true);
    expect(chip!.classList.contains('is-unavailable')).toBe(true);
    expect(chip!.classList.contains('is-pending')).toBe(true);
    expect(chip!.querySelector('.control-chip-pending')?.textContent).toBe('Soon');
  });

  it('keeps mode-disallowed methods focusable but labelled unavailable', () => {
    // Survival allows hand only → phone becomes unavailable on preview.
    const survival = Array.from(mount.querySelectorAll('.glass-card')).find((c) =>
      c.textContent?.includes('Endless Survival')
    ) as HTMLElement;
    survival.dispatchEvent(new Event('pointerenter', { bubbles: true }));
    const phone = mount.querySelector<HTMLButtonElement>('.control-chip[data-method="phone"]');
    expect(phone!.disabled).toBe(false);
    expect(phone!.classList.contains('is-unavailable')).toBe(true);
    expect(phone!.getAttribute('aria-disabled')).toBe('true');
    expect(phone!.title).toContain('Unavailable');

    // The hand chip remains available for survival.
    const hand = mount.querySelector<HTMLButtonElement>('.control-chip[data-method="hand"]');
    expect(hand!.disabled).toBe(false);
    expect(hand!.getAttribute('aria-disabled')).toBe('false');
  });

  it('selects a method and announces it via a live region', () => {
    const live = mount.querySelector('[data-live="control-method"]');
    const screen = nav.currentScreen as unknown as ModeSelectScreen;
    const phone = mount.querySelector<HTMLButtonElement>('.control-chip[data-method="phone"]');
    phone!.click();
    expect(screen.controlMethod).toBe('phone');
    expect(phone!.getAttribute('aria-pressed')).toBe('true');
    expect(live?.textContent).toContain('phone selected');
    expect(mount.querySelector('.control-chip[data-method="keyboard"]')?.getAttribute('aria-pressed')).toBe(
      'false'
    );
  });

  it('announces the clamped method when a hand-only mode is selected', () => {
    const screen = nav.currentScreen as unknown as ModeSelectScreen;
    const phone = mount.querySelector<HTMLButtonElement>('.control-chip[data-method="phone"]');
    phone!.click(); // controlMethod = 'phone'
    const survival = Array.from(mount.querySelectorAll('.glass-card')).find((c) =>
      c.textContent?.includes('Endless Survival')
    ) as HTMLElement;
    survival.click(); // clamps phone → hand for survival
    const hand = mount.querySelector<HTMLButtonElement>('.control-chip[data-method="hand"]');
    expect(screen.controlMethod).toBe('hand');
    expect(hand!.getAttribute('aria-pressed')).toBe('true');
    const live = mount.querySelector('[data-live="control-method"]');
    expect(live?.textContent).toContain('hand selected');
  });

  it('removes dangling live-region/no-op accessors safely when disposed', () => {
    const screen = nav.currentScreen;
    screen!.dispose();
    expect(mount.querySelector('.control-method-chips')).toBeFalsy();
  });
});

describe('P1.3 cinematic home + transitions', () => {
  let mount: HTMLElement;
  let nav: NavigationSystem;

  beforeEach(async () => {
    document.body.innerHTML = '';
    mount = document.createElement('div');
    document.body.appendChild(mount);
    ThemeManager.instance = new ThemeManager({ reducedMotion: false });
    nav = buildNav(mount);
    await nav.go('menu');
  });

  afterEach(() => {
    ThemeManager.instance = null;
  });

  it('adds a racing lane layer to the home screen', () => {
    expect(mount.querySelector('.home-road')).toBeTruthy();
    expect(mount.querySelector('.home-road')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('skips the cinematic road when reduced motion is requested', async () => {
    document.body.innerHTML = '';
    mount = document.createElement('div');
    document.body.appendChild(mount);
    ThemeManager.instance = new ThemeManager({ reducedMotion: true });
    nav = buildNav(mount);
    await nav.go('menu');
    expect(mount.querySelector('.home-road')).toBeFalsy();
  });

  it('pauses ambient layers while the screen is hidden', () => {
    const roadPseudo = mount.querySelector('.home-road');
    mount.querySelector<HTMLElement>('.screen')!.setAttribute('aria-hidden', 'true');
    expect(roadPseudo).toBeTruthy();
  });

  it('uses directional transitions along the canonical route', async () => {
    const nav2 = new NavigationSystem(mount);
    const screen = new TrackSelectScreen();
    expect(screen.getTransition()).toBe('slide-left');
    expect(new ModeSelectScreen().getTransition()).toBe('slide-left');
    expect(new GameplayScreen().getTransition()).toBe('scale');
    expect(nav2).toBeTruthy();
  });

  it('walk-through: home → track → mode keeps one mounted screen', async () => {
    await nav.go('track-select');
    expect(nav.current).toBe('track-select');
    await nav.go('mode-select');
    expect(nav.current).toBe('mode-select');
    expect(mount.querySelectorAll('.screen').length).toBe(1);
  });

  it('spawnRoad honours reduced motion preference', () => {
    const container = document.createElement('div');
    ThemeManager.instance = new ThemeManager({ reducedMotion: true });
    expect(spawnRoad(container)).toBeNull();
    ThemeManager.instance = new ThemeManager({ reducedMotion: false });
    expect(spawnRoad(container)?.className).toBe('home-road');
  });
});
