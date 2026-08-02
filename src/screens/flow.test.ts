import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigationSystem } from '../ui/core/NavigationSystem';
import { buildFlow, type FlowApi } from './flow';
import type { TrackId } from './TrackSelectScreen';
import type { ModeId } from './ModeSelectScreen';
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

function makeSettings(): FlowApi['settings'] {
  return {
    get: () => ({
      a11y: { highContrast: false, colorblind: false, largeHud: false, reducedMotion: false },
      sensitivity: 75,
      autoAccelerate: false,
      gyroscopeMode: false,
      graphicsQuality: 'balanced' as const,
      shadows: true,
      particles: true,
      masterVolume: 1,
      uiSounds: true,
    }),
    save: vi.fn(),
    calibrateGesture: vi.fn(),
    onBack: vi.fn(),
  };
}

async function settle(ms = 40): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

describe('game flow wiring', () => {
  let mount: HTMLElement;
  let nav: NavigationSystem;
  let started: Array<{ track: TrackId; mode: ModeId }>;
  let settings: FlowApi['settings'];

  beforeEach(() => {
    mount = document.createElement('div');
    document.body.appendChild(mount);
    nav = new NavigationSystem(mount);
    started = [];
    settings = makeSettings();
    buildFlow(nav, {
      getBestScore: () => 999,
      settings,
      garage: { onBack: vi.fn() } as unknown as GarageScreen,
      howToPlay: { onBack: vi.fn() } as unknown as HowToPlayScreen,
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

    const cards = mount.querySelectorAll('.glass-card');
    expect(cards.length).toBe(3);
    (cards[0] as HTMLElement).click();
    await settle();
    expect(nav.current).toBe('mode-select');
    expect(mount.querySelectorAll('.glass-card').length).toBe(4);
  });

  it('never shows the gesture icon on competitive modes', async () => {
    await nav.go('mode-select');
    const icons = Array.from(mount.querySelectorAll('.input-icon'));
    const gesture = icons.filter((i) => i.textContent?.includes('🖐'));
    expect(gesture.length).toBe(1);
    const gestureCard = Array.from(mount.querySelectorAll('.glass-card')).find((c) =>
      c.textContent?.includes('🖐')
    ) as HTMLElement;
    expect(gestureCard.textContent).toContain('Endless Survival');
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
});
