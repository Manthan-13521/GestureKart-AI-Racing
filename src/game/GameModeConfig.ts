/**
 * Declarative mode + track configuration (GDD §6).
 *
 * Every gameplay rule about a mode lives here once. Consumers (screen
 * presentation, input gates, race wiring) read from this single table instead
 * of maintaining their own per-mode copies. `features.*` and `rules.*` are
 * consumed by the game layer; `ui.*` by the presentation layer.
 *
 * NOTE: `rules.spawning` is the intended per-mode rule. Game.ts currently
 * spawns initial traffic uniformly for every non-ai-race mode; adapting that
 * spawn logic to this table is P4/P5 work and intentionally not wired here.
 */
import type { InputSourceId } from '../input/InputFrame';

export type ModeId = 'versus' | 'multiplayer' | 'ai-race' | 'survival';

export type TrackId = 'cyber-city' | 'mountain-highway' | 'space-highway';

export interface GameModeConfig {
  id: ModeId;
  name: string;
  subtitle: string;
  description: string;
  /** Input sources that may steer/accelerate in this mode. */
  input: InputSourceId[];
  /** Tracks selectable for this mode. */
  tracks: TrackId[];
  /** Race length in seconds (mirrors Game.RACE_DURATION). */
  duration: number;
  rules: {
    spawning: 'traffic' | 'none';
    scoring: 'distance' | 'time' | 'position';
    finish: 'time-limit' | 'collision' | 'finish-line';
  };
  features: {
    ghost: boolean;
    ai: boolean;
    combo: boolean;
    multiplayer: boolean;
  };
  ui: {
    gradient: string;
    difficulty: 1 | 2 | 3;
    durationLabel: string;
  };
}

export const GAME_MODES: Record<ModeId, GameModeConfig> = {
  versus: {
    id: 'versus',
    name: 'You vs You',
    subtitle: 'Your best lap, your worst enemy',
    description: 'Race the ghost of your previous best. Pure time attack.',
    input: ['keyboard', 'touch', 'gyro', 'phone', 'gamepad'],
    tracks: ['cyber-city', 'mountain-highway', 'space-highway'],
    duration: 90,
    rules: { spawning: 'none', scoring: 'time', finish: 'time-limit' },
    features: { ghost: true, ai: false, combo: false, multiplayer: false },
    ui: {
      gradient: 'rgba(56, 189, 248, 0.55), rgba(30, 64, 175, 0.4)',
      difficulty: 1,
      durationLabel: '~2:00',
    },
  },
  multiplayer: {
    id: 'multiplayer',
    name: 'Multiplayer',
    subtitle: 'Real rivals, real rubber',
    description: 'Online duels. Dash pushes rivals — physics apply to everyone.',
    input: ['keyboard', 'touch', 'gyro', 'phone', 'gamepad'],
    tracks: ['cyber-city', 'mountain-highway', 'space-highway'],
    duration: 90,
    rules: { spawning: 'none', scoring: 'position', finish: 'finish-line' },
    features: { ghost: false, ai: false, combo: false, multiplayer: true },
    ui: {
      gradient: 'rgba(255, 215, 0, 0.5), rgba(255, 77, 94, 0.35)',
      difficulty: 2,
      durationLabel: '~2:30',
    },
  },
  'ai-race': {
    id: 'ai-race',
    name: 'AI Race',
    subtitle: 'Outsmart the pack',
    description: 'Fight a grid of adaptive opponents to the chequered flag.',
    input: ['keyboard', 'touch', 'gyro', 'phone', 'gamepad'],
    tracks: ['cyber-city', 'mountain-highway', 'space-highway'],
    duration: 90,
    rules: { spawning: 'none', scoring: 'position', finish: 'finish-line' },
    features: { ghost: false, ai: true, combo: false, multiplayer: false },
    ui: {
      gradient: 'rgba(45, 255, 154, 0.5), rgba(5, 150, 105, 0.4)',
      difficulty: 2,
      durationLabel: '~2:30',
    },
  },
  survival: {
    id: 'survival',
    name: 'Endless Survival',
    subtitle: 'The road never ends',
    description: 'Gesture-only mode. Steer with your hands, dodge everything.',
    input: ['hand'],
    tracks: ['cyber-city', 'mountain-highway', 'space-highway'],
    duration: 90,
    rules: { spawning: 'traffic', scoring: 'distance', finish: 'collision' },
    features: { ghost: false, ai: false, combo: true, multiplayer: false },
    ui: {
      gradient: 'rgba(168, 85, 247, 0.55), rgba(236, 72, 153, 0.35)',
      difficulty: 1,
      durationLabel: 'Endless',
    },
  },
};

/** Display order for the mode selection screen. */
export const MODE_ORDER: ModeId[] = ['versus', 'multiplayer', 'ai-race', 'survival'];

export function sourceAllowed(config: GameModeConfig, source: InputSourceId): boolean {
  return config.input.includes(source);
}

export function trackAllowed(config: GameModeConfig, track: TrackId): boolean {
  return config.tracks.includes(track);
}

export function isSourceAllowed(mode: ModeId, source: InputSourceId): boolean {
  return sourceAllowed(GAME_MODES[mode], source);
}

export function isTrackAllowed(mode: ModeId, track: TrackId): boolean {
  return trackAllowed(GAME_MODES[mode], track);
}

/**
 * Maps a mode to the Game.ts race semantics. ai-race modes race against AI,
 * ghost modes race time, everything else uses survival (endless traffic)
 * physics.
 */
export function raceModeFor(mode: ModeId): 'survival' | 'ai-race' | 'versus' {
  const cfg = GAME_MODES[mode];
  if (cfg.features.ai) return 'ai-race';
  if (cfg.features.ghost) return 'versus';
  return 'survival';
}
