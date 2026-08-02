/**
 * AIPersonality — data-driven AI archetypes.
 *
 * Each personality owns a full set of coefficients. No branching in
 * the decision loop — the personality constants do the heavy lifting.
 * Add new personalities simply by extending this object.
 */
export type PersonalityId = 'smooth' | 'aggressive' | 'defensive' | 'erratic' | 'tactical' | 'rookie';

export interface Personality {
  id: PersonalityId;
  /** Display name shown in HUD / results. */
  name: string;
  /** Base speed relative to player max (0–1.2). */
  speedFactor: number;
  /** How quickly the AI reacts to changed conditions (seconds of lag). */
  reactionTime: number;
  /** 0 = cautious, 1 = reckless overtaker. */
  aggression: number;
  /** Probability per second of making a random mistake. */
  mistakeRate: number;
  /** How willing the AI is to block the player. 0 = never, 1 = always. */
  blockingFrequency: number;
  /** How aggressively the AI exploits the slipstream draft. */
  draftUsage: number;
  /** How fast the AI recovers from a mistake. */
  recoverySpeed: number;
  /**
   * How tightly the AI follows the "ideal" offset vs wandering slightly.
   * 1 = laser-precise, 0 = loose.
   */
  cornerConfidence: number;
  /** How quickly they reach max boost when available. */
  boostStrategy: number;
}

export const PERSONALITIES: Record<PersonalityId, Personality> = {
  smooth: {
    id: 'smooth',
    name: 'Smooth',
    speedFactor: 1.0,
    reactionTime: 0.15,
    aggression: 0.4,
    mistakeRate: 0.004,
    blockingFrequency: 0.2,
    draftUsage: 0.9,
    recoverySpeed: 0.8,
    cornerConfidence: 0.95,
    boostStrategy: 0.7,
  },
  aggressive: {
    id: 'aggressive',
    name: 'Aggressive',
    speedFactor: 1.08,
    reactionTime: 0.08,
    aggression: 0.9,
    mistakeRate: 0.012,
    blockingFrequency: 0.8,
    draftUsage: 0.6,
    recoverySpeed: 0.9,
    cornerConfidence: 0.75,
    boostStrategy: 1.0,
  },
  defensive: {
    id: 'defensive',
    name: 'Defensive',
    speedFactor: 0.94,
    reactionTime: 0.25,
    aggression: 0.1,
    mistakeRate: 0.006,
    blockingFrequency: 0.9,
    draftUsage: 0.4,
    recoverySpeed: 0.5,
    cornerConfidence: 0.85,
    boostStrategy: 0.3,
  },
  erratic: {
    id: 'erratic',
    name: 'Erratic',
    speedFactor: 1.02,
    reactionTime: 0.35,
    aggression: 0.7,
    mistakeRate: 0.04,
    blockingFrequency: 0.5,
    draftUsage: 0.3,
    recoverySpeed: 0.7,
    cornerConfidence: 0.5,
    boostStrategy: 0.8,
  },
  tactical: {
    id: 'tactical',
    name: 'Tactical',
    speedFactor: 1.05,
    reactionTime: 0.12,
    aggression: 0.6,
    mistakeRate: 0.002,
    blockingFrequency: 0.6,
    draftUsage: 1.0,
    recoverySpeed: 0.95,
    cornerConfidence: 1.0,
    boostStrategy: 0.9,
  },
  rookie: {
    id: 'rookie',
    name: 'Rookie',
    speedFactor: 0.82,
    reactionTime: 0.5,
    aggression: 0.2,
    mistakeRate: 0.025,
    blockingFrequency: 0.1,
    draftUsage: 0.1,
    recoverySpeed: 0.3,
    cornerConfidence: 0.6,
    boostStrategy: 0.2,
  },
};

/**
 * Return a grid of personalities tuned to a 0–1 difficulty setting.
 * Easy: rookies + one defensive.
 * Hard: tactical + aggressive + smooth mix.
 */
export function buildGrid(count: number, difficulty: number): Personality[] {
  const pool: PersonalityId[] =
    difficulty < 0.35
      ? ['rookie', 'rookie', 'defensive', 'erratic', 'smooth', 'defensive']
      : difficulty < 0.65
        ? ['defensive', 'smooth', 'erratic', 'tactical', 'aggressive', 'smooth']
        : ['tactical', 'aggressive', 'smooth', 'aggressive', 'tactical', 'aggressive'];

  return Array.from({ length: count }, (_, i) => PERSONALITIES[pool[i % pool.length]]);
}
