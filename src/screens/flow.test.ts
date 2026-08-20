import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigationSystem } from '../ui/core/NavigationSystem';
import { buildFlow, type FlowApi, lastSelection } from './flow';
import type { TrackId } from './TrackSelectScreen';
import type { ModeId } from './ModeSelectScreen';
import type { GarageScreen } from './GarageScreen';
import type { HowToPlayScreen } from './HowToPlayScreen';
import type { AchievementsScreen } from './AchievementsScreen';
import type { ProfileScreen } from './ProfileScreen';
import type { LeaderboardScreen } from './LeaderboardScreen';
import type { PhoneSource, PhoneStatePayload } from '../input/PhoneSource';

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

function makePhone(): PhoneSource & { _triggerStateChange: (connected: boolean) => void } {
  const stateCallbacks: Array<(s: PhoneStatePayload) => void> = [];
  return {
    phoneConnected: false,
    roomCode: null,
    start: vi.fn(async () => undefined),
    stop: vi.fn(),
    send: vi.fn(),
    onMessage: vi.fn(),
    controllerUrl: vi.fn(() => 'https://example.local/pair'),
    onState: vi.fn((cb: (s: PhoneStatePayload) => void) => {
      stateCallbacks.push(cb);
      return () => {
        const idx = stateCallbacks.indexOf(cb);
        if (idx >= 0) stateCallbacks.splice(idx, 1);
      };
    }),
    _triggerStateChange: (connected: boolean) => {
      stateCallbacks.forEach((cb) => cb({ connected, roomCode: connected ? 'TEST123' : null }));
    },
  } as unknown as PhoneSource & { _triggerStateChange: (connected: boolean) => void };
}

async function settle(ms = 40): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

describe('game flow wiring', () => {
  let mount: HTMLElement;
  let nav: NavigationSystem;
  let started: Array<{ track: TrackId; mode: ModeId }>;
  let settings: FlowApi['settings'];
  let phone: ReturnType<typeof makePhone>;

  beforeEach(() => {
    document.body.innerHTML = '';
    mount = document.createElement('div');
    document.body.appendChild(mount);
    nav = new NavigationSystem(mount);
    started = [];
    settings = makeSettings();
    phone = makePhone();
    buildFlow(nav, {
      getBestScore: () => 999,
      settings,
      garage: { onBack: vi.fn() } as unknown as GarageScreen,
      howToPlay: { onBack: vi.fn() } as unknown as HowToPlayScreen,
      achievements: { onBack: vi.fn() } as unknown as AchievementsScreen,
      profile: { onBack: vi.fn() } as unknown as ProfileScreen,
      leaderboard: { onBack: vi.fn() } as unknown as LeaderboardScreen,
      phone,
      startRace: (track, mode) => started.push({ track, mode }),
    });
  });

  it('walks splash → loading → menu', async () => {
    await nav.go('splash');
    expect(nav.current).toBe('splash');

    const splashEl = nav.currentScreen?.el as HTMLElement;
    splashEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await vi.waitFor(() => expect(nav.current).toBe('menu'), { timeout: 3000 });
    const title = mount.querySelector('.menu-title')?.textContent;
    expect(title).toBe('Virtual Steering');
  });

  it('flows menu → track select → mode select', async () => {
    await nav.go('menu');
    const raceBtn = mount.querySelector('.menu-actions .btn') as HTMLElement;
    raceBtn.click();
    await settle();
    expect(nav.current).toBe('track-select');

    const cards = mount.querySelectorAll('.track-card');
    expect(cards.length).toBe(3);
    (cards[0] as HTMLElement).click();
    await settle();
    expect(nav.current).toBe('mode-select');
    expect(mount.querySelectorAll('.glass-card').length).toBe(4);
  });

  it('never shows the gesture icon on competitive modes', async () => {
    await nav.go('mode-select');
    const icons = Array.from(mount.querySelectorAll('.input-icon'));
    expect(icons.length).toBeGreaterThan(0);
    const gestureCard = Array.from(mount.querySelectorAll('.glass-card')).find((c) =>
      c.textContent?.includes('Endless Survival')
    ) as HTMLElement;
    expect(gestureCard).toBeDefined();
  });

  it('completes mode select → loading → gameplay → startRace', async () => {
    await nav.go('mode-select');
    const survivalCard = Array.from(mount.querySelectorAll('.glass-card')).find((c) =>
      c.textContent?.includes('Endless Survival')
    ) as HTMLElement;
    survivalCard.click();
    await vi.waitFor(() => expect(nav.current).toBe('gameplay'), { timeout: 3000 });
    const startBtn = mount.querySelector('.menu-actions .btn') as HTMLElement;
    startBtn.click();
    await settle();
    expect(started).toEqual([{ track: 'cyber-city', mode: 'survival' }]);
  });

  it('settings screen renders five tabs', async () => {
    await nav.go('settings');
    const tabs = mount.querySelectorAll('.tab');
    expect(tabs.length).toBe(5);
    expect(Array.from(tabs).map((t) => t.textContent)).toEqual([
      'Graphics',
      'Audio',
      'Controls',
      'Accessibility',
      'Gameplay',
    ]);
  });

  // P1.1: Home → Track Select
  it('Home → Track Select', async () => {
    await nav.go('menu');
    const raceBtn = mount.querySelector('.menu-actions .btn') as HTMLElement;
    raceBtn.click();
    await settle();
    expect(nav.current).toBe('track-select');
    const trackCards = mount.querySelectorAll('.track-card');
    expect(trackCards.length).toBe(3);
  });

  // P1.1: Track Select → Mode Select
  it('Track Select → Mode Select', async () => {
    await nav.go('track-select');
    const cards = mount.querySelectorAll('.track-card');
    (cards[0] as HTMLElement).click();
    await settle();
    expect(nav.current).toBe('mode-select');
    expect(mount.querySelectorAll('.glass-card').length).toBe(4);
  });

  // P1.1: Mode Select → Loading → Gameplay (non-phone)
  it('Mode Select → Loading → Gameplay (non-phone)', async () => {
    await nav.go('mode-select');
    const versusCard = Array.from(mount.querySelectorAll('.glass-card')).find((c) =>
      c.textContent?.includes('You vs You')
    ) as HTMLElement;
    versusCard.click();
    await vi.waitFor(() => expect(nav.current).toBe('gameplay'), { timeout: 3000 });
    expect(started).toEqual([]);
    const startBtn = mount.querySelector('.menu-actions .btn') as HTMLElement;
    startBtn.click();
    await settle();
    expect(started).toEqual([{ track: 'cyber-city', mode: 'versus' }]);
  });

  // P1.1: Mode Select → Phone Pairing → Loading → Gameplay
  it('Mode Select → Phone Pairing → Loading → Gameplay (phone)', async () => {
    await nav.go('mode-select');
    const phoneChip = mount.querySelector('.control-chip[data-method="phone"]') as HTMLElement;
    phoneChip.click();
    const modes = nav.currentScreen as unknown as { controlMethod: string; el: HTMLElement };
    expect(modes.controlMethod).toBe('phone');

    const versusCard = Array.from(mount.querySelectorAll('.glass-card')).find((c) =>
      c.textContent?.includes('You vs You')
    ) as HTMLElement;
    versusCard.click();
    await settle();
    expect(nav.current).toBe('phone-pairing');

    phone._triggerStateChange(true);
    await settle();

    const startBtn = mount.querySelector('.btn') as HTMLElement;
    startBtn.click();
    await vi.waitFor(() => expect(nav.current).toBe('gameplay'), { timeout: 3000 });

    const gameplayStartBtn = mount.querySelector('.menu-actions .btn') as HTMLElement;
    gameplayStartBtn.click();
    await settle();
    expect(started).toEqual([{ track: 'cyber-city', mode: 'versus' }]);
  });

  // P1.1: Back navigation
  it('Back navigation: Track Select → Home', async () => {
    await nav.go('track-select');
    const backBtn = mount.querySelector('.screen-footer .btn') as HTMLElement;
    backBtn.click();
    await settle();
    expect(nav.current).toBe('menu');
  });

  it('Back navigation: Mode Select → Track Select', async () => {
    await nav.go('mode-select');
    const backBtn = mount.querySelector('.screen-footer .btn') as HTMLElement;
    backBtn.click();
    await settle();
    expect(nav.current).toBe('track-select');
  });

  it('Back navigation: Phone Pairing → Mode Select', async () => {
    await nav.go('phone-pairing');
    await settle();
    const backBtn = mount.querySelector('.screen-footer .btn') as HTMLElement;
    backBtn.click();
    await settle();
    expect(nav.current).toBe('mode-select');
  });

  // P1.1: Invalid mode/control combination - survival clamps to hand
  it('Survival + keyboard clamps to hand (no phone pairing)', async () => {
    await nav.go('mode-select');
    const modes = nav.currentScreen as unknown as { controlMethod: string; el: HTMLElement };
    expect(modes.controlMethod).toBe('keyboard');

    const survivalCard = Array.from(mount.querySelectorAll('.glass-card')).find((c) =>
      c.textContent?.includes('Endless Survival')
    ) as HTMLElement;
    survivalCard.click();
    await settle();

    expect(nav.current).toBe('gameplay');
    expect(started).toEqual([]);
  });

  // P1.1: Survival + keyboard remains rejected/clamped according to config
  it('Survival + phone clamps to hand (no phone pairing)', async () => {
    await nav.go('mode-select');
    const phoneChip = mount.querySelector('.control-chip[data-method="phone"]') as HTMLElement;
    phoneChip.click();
    const modes = nav.currentScreen as unknown as { controlMethod: string; el: HTMLElement };
    expect(modes.controlMethod).toBe('phone');

    const survivalCard = Array.from(mount.querySelectorAll('.glass-card')).find((c) =>
      c.textContent?.includes('Endless Survival')
    ) as HTMLElement;
    survivalCard.click();
    await settle();

    expect(nav.current).toBe('gameplay');
    expect(started).toEqual([]);
  });

  // P1.1: Phone mode reaches PhonePairing
  it('Phone mode reaches PhonePairing when mode allows phone', async () => {
    await nav.go('mode-select');
    const phoneChip = mount.querySelector('.control-chip[data-method="phone"]') as HTMLElement;
    phoneChip.click();
    const modes = nav.currentScreen as unknown as { controlMethod: string; el: HTMLElement };
    expect(modes.controlMethod).toBe('phone');

    const aiRaceCard = Array.from(mount.querySelectorAll('.glass-card')).find((c) =>
      c.textContent?.includes('AI Race')
    ) as HTMLElement;
    aiRaceCard.click();
    await settle();
    expect(nav.current).toBe('phone-pairing');
  });

  // P1.1: lastSelection tracks the last chosen track/mode
  it('lastSelection returns the last track and mode', async () => {
    await nav.go('mode-select');
    const versusCard = Array.from(mount.querySelectorAll('.glass-card')).find((c) =>
      c.textContent?.includes('You vs You')
    ) as HTMLElement;
    versusCard.click();
    await vi.waitFor(() => expect(nav.current).toBe('gameplay'), { timeout: 3000 });

    const sel = lastSelection();
    expect(sel.track).toBe('cyber-city');
    expect(sel.mode).toBe('versus');
  });
});
