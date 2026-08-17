import { NavigationSystem } from '../ui/core/NavigationSystem';
import { SplashScreen } from './SplashScreen';
import { LoadingScreen } from './LoadingScreen';
import { MainMenuScreen } from './MainMenuScreen';
import { TrackSelectScreen, type TrackId } from './TrackSelectScreen';
import { ModeSelectScreen, type ModeId, type ControlMethod } from './ModeSelectScreen';
import { LobbyScreen } from './LobbyScreen';
import { GameplayScreen } from './GameplayScreen';
import { SettingsScreen, type SettingsApi } from './SettingsScreen';
import { GarageScreen } from './GarageScreen';
import { HowToPlayScreen } from './HowToPlayScreen';
import { PhoneControllerScreen } from './PhoneControllerScreen';
import type { PhoneSource } from '../input/PhoneSource';
import { GAME_MODES, isSourceAllowed } from '../game/GameModeConfig';

export interface FlowApi {
  getBestScore: () => number;
  settings: SettingsApi;
  garage: GarageScreen;
  howToPlay: HowToPlayScreen;
  phone: PhoneSource;
  startRace: (
    trackId: TrackId,
    modeId: ModeId,
    network?: import('../network/NetworkManager').NetworkManager
  ) => void;
}

let lastTrack: TrackId = 'cyber-city';
let lastMode: ModeId = 'survival';

/** Internal: decides the next route from mode-select given (mode, controlMethod). */
function resolveNextRoute(
  modeId: ModeId,
  controlMethod: ControlMethod,
  track: TrackId
): { route: string; params: Record<string, unknown> } {
  const mode = GAME_MODES[modeId];
  const phoneAllowed = isSourceAllowed(modeId, 'phone');

  if (controlMethod === 'phone' && phoneAllowed) {
    return {
      route: 'phone-pairing',
      params: { track, mode: modeId },
    };
  }

  if (mode.features.multiplayer) {
    return {
      route: 'lobby',
      params: { track },
    };
  }

  return {
    route: 'loading',
    params: {
      label: 'Preparing race',
      next: 'gameplay',
      track,
      mode: modeId,
    },
  };
}

export function lastSelection(): { track: TrackId; mode: ModeId } {
  return { track: lastTrack, mode: lastMode };
}

/**
 * Registers all screens and wires the canonical flow:
 * Home → Track Select → Mode Select → Control Method → Phone Pairing (if Phone) → Loading → Gameplay.
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
        const p = screen.params as { next?: string; track?: TrackId; mode?: ModeId; network?: unknown };
        if (p.next === 'gameplay') {
          void nav.go('gameplay', { track: p.track, mode: p.mode, network: p.network });
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
      screen.onGarage = () => void nav.go('garage');
      screen.onHowToPlay = () => void nav.go('how-to-play');
      api.garage.onBack = () => void nav.go('menu');
      api.howToPlay.onBack = () => void nav.go('menu');
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
        const { route, params } = resolveNextRoute(modeId, screen.controlMethod, lastTrack);
        void nav.go(route, params);
      };
      screen.onBack = () => void nav.go('track-select', {}, { transition: 'slide-right' });
      return screen;
    },
  });

  nav.register('phone-pairing', {
    create: () => {
      const screen = new PhoneControllerScreen(api.phone);
      screen.onBack = () => {
        api.phone.stop();
        void nav.go('mode-select', {}, { transition: 'slide-right' });
      };
      screen.onStartRace = (track, mode) => {
        lastTrack = track;
        lastMode = mode;
        void nav.go('loading', {
          label: 'Preparing race',
          next: 'gameplay',
          track,
          mode,
        });
      };
      return screen;
    },
  });

  nav.register('gameplay', {
    create: () => {
      const screen = new GameplayScreen();
      screen.startRace = (track, mode, network) => {
        lastTrack = track;
        lastMode = mode;
        api.startRace(track, mode, network);
      };
      return screen;
    },
  });

  nav.register('lobby', {
    create: () => {
      const screen = new LobbyScreen();
      screen.onBack = () => void nav.go('mode-select', {}, { transition: 'slide-right' });
      screen.onStartRace = (_hostId, _isHost) => {
        void nav.go('loading', {
          label: 'Syncing grid...',
          next: 'gameplay',
          track: lastTrack,
          mode: 'multiplayer',
          network: screen.getNetworkInstance(),
        });
      };
      return screen;
    },
  });

  nav.register('settings', {
    create: () => {
      const screen = new SettingsScreen();
      screen.api = api.settings;
      api.settings.onBack = () => void nav.go('menu', {}, { transition: 'slide-right' });
      return screen;
    },
  });

  nav.register('garage', {
    create: () => {
      const screen = api.garage;
      screen.onBack = () => void nav.go('menu', {}, { transition: 'slide-right' });
      return screen;
    },
  });

  nav.register('how-to-play', {
    create: () => {
      const screen = api.howToPlay;
      screen.onBack = () => void nav.go('menu', {}, { transition: 'slide-right' });
      return screen;
    },
  });
}
