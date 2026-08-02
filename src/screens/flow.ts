import { NavigationSystem } from '../ui/core/NavigationSystem';
import { SplashScreen } from './SplashScreen';
import { LoadingScreen } from './LoadingScreen';
import { MainMenuScreen } from './MainMenuScreen';
import { TrackSelectScreen, type TrackId } from './TrackSelectScreen';
import { ModeSelectScreen, type ModeId } from './ModeSelectScreen';
import { GameplayScreen } from './GameplayScreen';
import { SettingsScreen, type SettingsApi } from './SettingsScreen';

export interface FlowApi {
  getBestScore: () => number;
  settings: SettingsApi;
  startRace: (trackId: TrackId, modeId: ModeId) => void;
}

let lastTrack: TrackId = 'cyber-city';
let lastMode: ModeId = 'survival';

/**
 * Registers all screens and wires the canonical flow:
 * Splash → Loading → Main Menu → Track Select → Mode Select → Loading → Gameplay.
 * Screens stay navigation-agnostic; callbacks are injected here.
 */
export function buildFlow(nav: NavigationSystem, api: FlowApi): void {
  nav.register('splash', {
    create: () => {
      const screen = new SplashScreen();
      screen.onContinue = () => void nav.go('loading', { label: 'Entering the grid' });
      return screen;
    },
  });

  nav.register('loading', {
    create: () => {
      const screen = new LoadingScreen();
      screen.onDone = () => {
        const p = screen.params as { next?: string; track?: TrackId; mode?: ModeId };
        if (p.next === 'gameplay') {
          void nav.go('gameplay', { track: p.track, mode: p.mode });
        } else {
          void nav.go('menu');
        }
      };
      return screen;
    },
  });

  nav.register('menu', {
    create: () => {
      const screen = new MainMenuScreen();
      screen.bestScore = api.getBestScore();
      screen.onPlay = () => void nav.go('track-select');
      screen.onSettings = () => void nav.go('settings');
      screen.onHowToPlay = () => {
        void import('../ui/components/Dialog').then(({ showDialog }) =>
          showDialog({
            title: 'How to Play',
            message:
              'Steer with your hands, the arrow keys, or touch controls.\n\n' +
              'Endless Survival is the only gesture mode — competitive modes use keyboard or gamepad.\n\n' +
              'Avoid traffic, chain drifts, and survive the countdown.',
            confirmLabel: 'Got it',
          })
        );
      };
      return screen;
    },
  });

  nav.register('track-select', {
    create: () => {
      const screen = new TrackSelectScreen();
      screen.onSelect = (trackId) => {
        lastTrack = trackId;
        void nav.go('mode-select');
      };
      screen.onBack = () => void nav.go('menu', {}, { transition: 'slide-right' });
      return screen;
    },
  });

  nav.register('mode-select', {
    create: () => {
      const screen = new ModeSelectScreen();
      screen.trackId = lastTrack;
      screen.onSelect = (modeId) => {
        lastMode = modeId;
        void nav.go('loading', {
          label: 'Preparing race',
          next: 'gameplay',
          track: lastTrack,
          mode: modeId,
        });
      };
      screen.onBack = () => void nav.go('track-select', {}, { transition: 'slide-right' });
      return screen;
    },
  });

  nav.register('gameplay', {
    create: () => {
      const screen = new GameplayScreen();
      screen.startRace = (track, mode) => {
        lastTrack = track;
        lastMode = mode;
        api.startRace(track, mode);
      };
      return screen;
    },
  });

  nav.register('settings', {
    create: () => {
      const screen = new SettingsScreen();
      screen.api = api.settings;
      return screen;
    },
  });
}

export function lastSelection(): { track: TrackId; mode: ModeId } {
  return { track: lastTrack, mode: lastMode };
}
