/**
 * RaceResultGate — the single authoritative boundary for completed races.
 *
 * Every finished race flows through `complete()` exactly once per race
 * instance. The gate:
 *
 *   1. validates the completion (registered race id, known mode/division),
 *   2. detects already-processed completions (persisted, survives reload),
 *   3. computes rewards via RewardCalculator (P8.1 formulas, unchanged),
 *   4. advances the tournament ONLY for ai-race completions (once),
 *   5. applies XP/coins to the ProgressionStore,
 *   6. records the completion identity, and
 *   7. returns a RaceCompletion summary for presentation.
 *
 * The gate is the ONLY progression entry point for race results. Nothing
 * else in the app awards XP/coins for finishing a race.
 */
import { TITLE_TIERS, titleForLevel } from './ContentCatalog';
import { calculateRaceRewards } from './RewardCalculator';
import type { RaceCompletion, RaceResult } from './types';
import type { DivisionId } from '../game/TournamentManager';

const KNOWN_MODES = new Set(['ai-race', 'multiplayer', 'survival', 'versus']);
const KNOWN_DIVISIONS = new Set<DivisionId>(['rookie', 'pro', 'elite', 'champion']);

/** Structural dependency: what the gate needs from the tournament layer. */
export interface TournamentPort {
  activeState: { division: DivisionId };
  recordFinish(position: number): {
    pointsAwarded: number;
    promoted: boolean;
    finishedChampionship: boolean;
    averageFinish: number;
  };
}

/** Structural dependency: the persistence-backed progression store. */
export interface ProgressionStore {
  readonly xp: number;
  readonly coins: number;
  readonly level: number;
  readonly racesFinished: number;
  isRaceCompleted(raceId: string): boolean;
  markRaceCompleted(raceId: string): void;
  applyRewards(
    xp: number,
    coins: number
  ): {
    levelBefore: number;
    levelAfter: number;
    levelsGained: number;
    xp: number;
    coins: number;
  } | null;
}

/** Tournament advancement result, surfaced for presentation only. */
export interface TournamentSummary {
  pointsAwarded: number;
  promoted: boolean;
  finishedChampionship: boolean;
  averageFinish: number;
}

export interface RaceGateOutcome {
  /** True when this call applied the rewards (first completion). */
  applied: boolean;
  /** True when this race id was already processed in the past. */
  alreadyProcessed: boolean;
  /** Reward summary; null only for rejected/invalid completions. */
  completion: RaceCompletion | null;
  /** Tournament advancement; present only for ai-race completions. */
  tournament: TournamentSummary | null;
}

const REJECTED: RaceGateOutcome = {
  applied: false,
  alreadyProcessed: false,
  completion: null,
  tournament: null,
};

function defaultIdFactory(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `race-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export class RaceResultGate {
  private registered = new Set<string>();
  private resolved = new Map<string, RaceCompletion>();

  constructor(
    private store: ProgressionStore,
    private tournament: TournamentPort | null,
    private idFactory: () => string = defaultIdFactory
  ) {}

  /** Register a new race instance; returns its completion identity. */
  beginRace(): string {
    const id = this.idFactory();
    this.registered.add(id);
    return id;
  }

  /**
   * The single completion entry point. Returns the same outcome shape for
   * every call; rewards are applied at most once per race id.
   */
  complete(result: RaceResult): RaceGateOutcome {
    const rejected = this.validate(result);
    if (rejected) return REJECTED;

    // The PERSISTED token is the authoritative duplicate signal: it survives
    // reloads and remounts even when this gate instance never registered the
    // race (e.g. a duplicate completion call after a browser refresh).
    if (this.store.isRaceCompleted(result.raceId)) {
      return {
        applied: false,
        alreadyProcessed: true,
        completion: this.resolved.get(result.raceId) ?? this.replayCompletion(result),
        tournament: null,
      };
    }

    if (!this.registered.has(result.raceId)) {
      return REJECTED;
    }

    const rewards = calculateRaceRewards(result);

    const xpBefore = this.store.xp;
    const coinsBefore = this.store.coins;
    const applied = this.store.applyRewards(rewards.xp, rewards.coins);
    if (!applied) return REJECTED;

    // P12: advance the tournament only after rewards were actually applied so
    // a rejected reward can never leave the division/points already advanced.
    let tournament: TournamentSummary | null = null;
    if (result.mode === 'ai-race' && this.tournament) {
      const t = this.tournament.recordFinish(result.position);
      tournament = {
        pointsAwarded: t.pointsAwarded,
        promoted: t.promoted,
        finishedChampionship: t.finishedChampionship,
        averageFinish: t.averageFinish,
      };
    }

    this.store.markRaceCompleted(result.raceId);

    const completion: RaceCompletion = {
      rewards,
      xpBefore,
      xpAfter: applied.xp,
      levelBefore: applied.levelBefore,
      levelAfter: applied.levelAfter,
      levelsGained: applied.levelsGained,
      coinsBefore,
      coinsAfter: applied.coins,
      title: titleForLevel(applied.levelAfter),
      unlocked: this.newlyGrantedTitles(applied.levelBefore, applied.levelAfter),
      racesFinished: this.store.racesFinished,
    };
    this.resolved.set(result.raceId, completion);

    return { applied: true, alreadyProcessed: false, completion, tournament };
  }

  /** Titles granted purely by crossing their level threshold. */
  private newlyGrantedTitles(levelBefore: number, levelAfter: number): string[] {
    return TITLE_TIERS.filter((t) => t.level > levelBefore && t.level <= levelAfter).map((t) => t.title);
  }

  /**
   * Summary for an already-processed race after a reload (in-memory cache
   * is gone). Rewards are recomputed deterministically from the result; the
   * historical level snapshot is not available, so current state is shown.
   */
  private replayCompletion(result: RaceResult): RaceCompletion {
    return {
      rewards: calculateRaceRewards(result),
      xpBefore: this.store.xp,
      xpAfter: this.store.xp,
      levelBefore: this.store.level,
      levelAfter: this.store.level,
      levelsGained: 0,
      coinsBefore: this.store.coins,
      coinsAfter: this.store.coins,
      title: titleForLevel(this.store.level),
      unlocked: [],
      racesFinished: this.store.racesFinished,
    };
  }

  private validate(result: RaceResult): string | null {
    if (!result || typeof result.raceId !== 'string' || result.raceId === '') {
      return 'missing raceId';
    }
    if (!KNOWN_MODES.has(result.mode)) {
      return 'unknown mode';
    }
    if (result.mode === 'ai-race' && result.division !== null && !KNOWN_DIVISIONS.has(result.division)) {
      return 'unknown division';
    }
    if (typeof result.score !== 'number' || !Number.isFinite(result.score)) {
      return 'invalid score';
    }
    if (typeof result.position !== 'number' || !Number.isFinite(result.position)) {
      return 'invalid position';
    }
    return null;
  }
}
