/**
 * TournamentManager — Tracks divisions (Rookie, Pro, Elite, Champion) and
 * points standings across 3 races per track.
 */

export type DivisionId = 'rookie' | 'pro' | 'elite' | 'champion';

export interface TournamentState {
  division: DivisionId;
  currentRace: number; // 0, 1, 2
  points: number;
  history: number[]; // Positions finished in this division
  active: boolean;
}

const TOURNAMENT_VERSION = 1;

const DIVISIONS: DivisionId[] = ['rookie', 'pro', 'elite', 'champion'];

function isFiniteNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function sanitizeState(raw: unknown): TournamentState | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  if (!DIVISIONS.includes(s.division as DivisionId)) return null;
  if (!isFiniteNum(s.currentRace) || s.currentRace < 0 || s.currentRace > 2) return null;
  if (!isFiniteNum(s.points) || s.points < 0) return null;
  if (!Array.isArray(s.history) || !s.history.every((p) => isFiniteNum(p) && p >= 1 && p <= 6)) {
    return null;
  }
  if (typeof s.active !== 'boolean') return null;
  return {
    division: s.division as DivisionId,
    currentRace: s.currentRace,
    points: s.points,
    history: s.history,
    active: s.active,
  };
}

export class TournamentManager {
  private state: TournamentState = {
    division: 'rookie',
    currentRace: 0,
    points: 0,
    history: [],
    active: false,
  };

  private readonly storageKey = 'vs_tournament_state';

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { version?: number } & Record<string, unknown>;
      // P12: fail closed on unknown future schema versions and on any
      // malformed shape (division, race index, points, history, active).
      const state = sanitizeState(parsed);
      if (!state || (isFiniteNum(parsed.version) && parsed.version > TOURNAMENT_VERSION)) {
        this.reset();
        return;
      }
      this.state = state;
    } catch {
      this.reset();
    }
  }

  private save(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({ version: TOURNAMENT_VERSION, ...this.state }));
    } catch {
      // storage unavailable (private mode / quota) — keep in-memory state
    }
  }

  public get activeState(): TournamentState {
    return { ...this.state };
  }

  public startNew(): void {
    this.state = {
      division: 'rookie',
      currentRace: 0,
      points: 0,
      history: [],
      active: true,
    };
    this.save();
  }

  public reset(): void {
    this.state = {
      division: 'rookie',
      currentRace: 0,
      points: 0,
      history: [],
      active: false,
    };
    this.save();
  }

  /**
   * Computes points for a race finish.
   * P1: 10, P2: 8, P3: 6, P4: 4, P5: 2, P6: 1
   */
  public recordFinish(position: number): {
    pointsAwarded: number;
    coinsAwarded: number;
    xpAwarded: number;
    promoted: boolean;
    finishedChampionship: boolean;
    averageFinish: number;
  } {
    if (!this.state.active) {
      this.startNew();
    }

    const pos = Math.max(1, Math.min(6, position));
    const pointsMap = [10, 8, 6, 4, 2, 1];
    const pointsAwarded = pointsMap[pos - 1] ?? 1;

    // Rewards scale with division difficulty and placement
    const multiplier =
      this.state.division === 'champion'
        ? 4
        : this.state.division === 'elite'
          ? 3
          : this.state.division === 'pro'
            ? 2
            : 1;

    const coinsAwarded = (10 - pos) * 50 * multiplier;
    const xpAwarded = (10 - pos) * 100 * multiplier;

    this.state.points += pointsAwarded;
    this.state.history.push(pos);

    let promoted = false;
    let finishedChampionship = false;
    let averageFinish = 0;

    if (this.state.currentRace >= 2) {
      finishedChampionship = true;
      const sum = this.state.history.reduce((a, b) => a + b, 0);
      averageFinish = sum / this.state.history.length;

      // Promotion requires top-3 average finish
      if (averageFinish <= 3) {
        promoted = true;
        this.promote();
      } else {
        // Reset division progress on failure
        this.state.currentRace = 0;
        this.state.points = 0;
        this.state.history = [];
      }
    } else {
      this.state.currentRace++;
    }

    this.save();

    return {
      pointsAwarded,
      coinsAwarded,
      xpAwarded,
      promoted,
      finishedChampionship,
      averageFinish,
    };
  }

  private promote(): void {
    const nextMap: Record<DivisionId, DivisionId> = {
      rookie: 'pro',
      pro: 'elite',
      elite: 'champion',
      champion: 'champion', // Maximum reached
    };
    this.state.division = nextMap[this.state.division];
    this.state.currentRace = 0;
    this.state.points = 0;
    this.state.history = [];
  }
}
export const tournamentManager = new TournamentManager();
