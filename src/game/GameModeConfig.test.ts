import { describe, it, expect } from 'vitest';
import {
  GAME_MODES,
  MODE_ORDER,
  isSourceAllowed,
  isTrackAllowed,
  raceModeFor,
  sourceAllowed,
  trackAllowed,
  type GameModeConfig,
} from './GameModeConfig';
import type { InputSourceId } from '../input/InputFrame';

const INPUT_SOURCES: InputSourceId[] = ['keyboard', 'touch', 'gyro', 'hand', 'phone', 'gamepad'];

describe('GAME_MODES table', () => {
  it('defines exactly the four modes', () => {
    expect(MODE_ORDER).toEqual(['versus', 'multiplayer', 'ai-race', 'survival']);
    expect(MODE_ORDER.map((id) => GAME_MODES[id].id)).toEqual(MODE_ORDER);
  });

  it('only references valid input sources and tracks', () => {
    for (const id of MODE_ORDER) {
      const mode = GAME_MODES[id];
      for (const s of mode.input) {
        expect(INPUT_SOURCES).toContain(s);
      }
      expect(mode.tracks.length).toBeGreaterThan(0);
    }
  });

  it('assigns features to exactly one mode each', () => {
    const withFeature = (key: 'ghost' | 'ai' | 'multiplayer' | 'combo') =>
      MODE_ORDER.filter((id) => GAME_MODES[id].features[key]);
    expect(withFeature('ghost')).toEqual(['versus']);
    expect(withFeature('ai')).toEqual(['ai-race']);
    expect(withFeature('multiplayer')).toEqual(['multiplayer']);
    expect(withFeature('combo')).toEqual(['survival']);
  });

  it('restricts survival to gesture input only', () => {
    expect(GAME_MODES.survival.input).toEqual(['hand']);
  });

  it('carries presentation data per mode', () => {
    for (const id of MODE_ORDER) {
      const mode = GAME_MODES[id];
      expect(mode.name.length).toBeGreaterThan(0);
      expect(mode.ui.gradient).toContain('rgba');
      expect(mode.ui.durationLabel.length).toBeGreaterThan(0);
    }
  });
});

describe('sourceAllowed / trackAllowed', () => {
  const mode: GameModeConfig = {
    ...GAME_MODES.versus,
    input: ['keyboard', 'gamepad'],
    tracks: ['cyber-city', 'mountain-highway'],
  };

  it('tests membership against a config', () => {
    expect(sourceAllowed(mode, 'keyboard')).toBe(true);
    expect(sourceAllowed(mode, 'hand')).toBe(false);
    expect(trackAllowed(mode, 'cyber-city')).toBe(true);
    expect(trackAllowed(mode, 'space-highway')).toBe(false);
  });
});

describe('mode-level helpers', () => {
  it('isSourceAllowed reads the real game modes', () => {
    expect(isSourceAllowed('versus', 'keyboard')).toBe(true);
    expect(isSourceAllowed('versus', 'hand')).toBe(false);
    expect(isSourceAllowed('survival', 'keyboard')).toBe(false);
    expect(isSourceAllowed('survival', 'hand')).toBe(true);
  });

  it('isTrackAllowed accepts every track currently', () => {
    for (const id of MODE_ORDER) {
      expect(isTrackAllowed(id, 'cyber-city')).toBe(true);
      expect(isTrackAllowed(id, 'mountain-highway')).toBe(true);
      expect(isTrackAllowed(id, 'space-highway')).toBe(true);
    }
  });

  it('raceModeFor maps modes onto Game race semantics', () => {
    expect(raceModeFor('ai-race')).toBe('ai-race');
    expect(raceModeFor('versus')).toBe('versus');
    expect(raceModeFor('multiplayer')).toBe('survival');
    expect(raceModeFor('survival')).toBe('survival');
  });
});
