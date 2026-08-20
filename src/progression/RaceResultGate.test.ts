import { describe, it, expect, beforeEach } from 'vitest';
import { RaceResultGate, type ProgressionStore, type TournamentPort } from './RaceResultGate';
import { applyXp, levelForXp } from './XpProgression';
import { ProfileManager } from '../managers/ProfileManager';
import type { DivisionId } from '../game/TournamentManager';
import type { RaceResult } from './types';

interface Backing {
  xp: number;
  coins: number;
  completed: string[];
  races: number;
}

function makeBacking(xp = 0, coins = 0): Backing {
  return { xp, coins, completed: [], races: 0 };
}

/** A store whose state lives in a shared backing object (reload-able). */
function makeStore(backing: Backing): ProgressionStore {
  return {
    get xp() {
      return backing.xp;
    },
    get coins() {
      return backing.coins;
    },
    get level() {
      return levelForXp(backing.xp);
    },
    get racesFinished() {
      return backing.races;
    },
    isRaceCompleted: (id) => backing.completed.includes(id),
    markRaceCompleted: (id) => {
      if (!backing.completed.includes(id)) {
        backing.completed.push(id);
        backing.races += 1;
      }
    },
    applyRewards: (xp, coins) => {
      const r = applyXp(backing.xp, xp);
      if (!r) return null;
      backing.xp = r.xp;
      backing.coins += coins;
      return {
        levelBefore: r.levelBefore,
        levelAfter: r.levelAfter,
        levelsGained: r.levelsGained,
        xp: r.xp,
        coins: backing.coins,
      };
    },
  };
}

function makeTournament(division: DivisionId = 'rookie'): TournamentPort & { finishes: number[] } {
  const finishes: number[] = [];
  return {
    finishes,
    activeState: { division },
    recordFinish: (position) => {
      finishes.push(position);
      return { pointsAwarded: 10, promoted: false, finishedChampionship: false, averageFinish: 0 };
    },
  };
}

function survival(raceId: string, score: number): RaceResult {
  return { raceId, mode: 'survival', position: 0, score, division: null };
}

function versus(raceId: string, score: number): RaceResult {
  return { raceId, mode: 'versus', position: 0, score, division: null };
}

function aiRace(raceId: string, position: number, division: DivisionId | null = 'rookie'): RaceResult {
  return { raceId, mode: 'ai-race', position, score: 0, division };
}

describe('RaceResultGate', () => {
  it('first completion applies rewards once', () => {
    const backing = makeBacking();
    const gate = new RaceResultGate(makeStore(backing), null);
    const raceId = gate.beginRace();
    const out = gate.complete(survival(raceId, 1200));
    expect(out.applied).toBe(true);
    expect(out.alreadyProcessed).toBe(false);
    expect(out.completion?.rewards).toEqual({ xp: 22, coins: 29 });
    expect(backing.xp).toBe(22);
    expect(backing.coins).toBe(29);
    expect(out.completion?.racesFinished).toBe(1);
  });

  it('same completion id called twice only awards once', () => {
    const backing = makeBacking();
    const gate = new RaceResultGate(makeStore(backing), null);
    const raceId = gate.beginRace();
    gate.complete(survival(raceId, 1200));
    const again = gate.complete(survival(raceId, 1200));
    expect(again.applied).toBe(false);
    expect(backing.xp).toBe(22);
    expect(backing.coins).toBe(29);
  });

  it('duplicate completion returns alreadyProcessed with the resolved summary', () => {
    const backing = makeBacking();
    const gate = new RaceResultGate(makeStore(backing), null);
    const raceId = gate.beginRace();
    const first = gate.complete(survival(raceId, 1200));
    const dup = gate.complete(survival(raceId, 1200));
    expect(dup.alreadyProcessed).toBe(true);
    expect(dup.completion).not.toBeNull();
    expect(dup.completion?.rewards).toEqual(first.completion?.rewards);
    expect(dup.completion?.levelsGained).toBe(0);
  });

  it('a new race id (retry) awards its own reward independently', () => {
    const backing = makeBacking();
    const gate = new RaceResultGate(makeStore(backing), null);
    const first = gate.beginRace();
    gate.complete(survival(first, 1200));
    const second = gate.beginRace();
    const out2 = gate.complete(survival(second, 1200));
    expect(out2.applied).toBe(true);
    expect(out2.alreadyProcessed).toBe(false);
    expect(backing.xp).toBe(44);
    expect(backing.coins).toBe(58);
    expect(backing.races).toBe(2);
  });

  it('survival completion awards the GDD floor formula once', () => {
    const backing = makeBacking();
    const gate = new RaceResultGate(makeStore(backing), null);
    const raceId = gate.beginRace();
    const out = gate.complete(survival(raceId, 4500));
    expect(out.completion?.rewards).toEqual({ xp: 55, coins: 95 });
    expect(backing.xp).toBe(55);
    expect(backing.coins).toBe(95);
  });

  it('versus completion awards the score formula once', () => {
    const backing = makeBacking();
    const gate = new RaceResultGate(makeStore(backing), null);
    const raceId = gate.beginRace();
    const out = gate.complete(versus(raceId, 3000));
    expect(out.completion?.rewards).toEqual({ xp: 40, coins: 65 });
    expect(backing.xp).toBe(40);
    expect(backing.coins).toBe(65);
  });

  it('AI completion preserves P8.1 payout parity and advances the tournament once', () => {
    const backing = makeBacking();
    const tournament = makeTournament('rookie');
    const gate = new RaceResultGate(makeStore(backing), tournament);
    const raceId = gate.beginRace();
    const out = gate.complete(aiRace(raceId, 1));
    expect(out.completion?.rewards).toEqual({ xp: 900, coins: 450 });
    expect(out.tournament?.pointsAwarded).toBe(10);
    expect(tournament.finishes).toEqual([1]);
    const dup = gate.complete(aiRace(raceId, 1));
    expect(dup.applied).toBe(false);
    expect(tournament.finishes).toEqual([1]);
  });

  it('champion division AI payout uses the 4x multiplier', () => {
    const backing = makeBacking();
    const tournament = makeTournament('champion');
    const gate = new RaceResultGate(makeStore(backing), tournament);
    const raceId = gate.beginRace();
    const out = gate.complete(aiRace(raceId, 4, 'champion'));
    expect(out.completion?.rewards).toEqual({ xp: 2400, coins: 1200 });
  });

  it('tournament does not advance when rewards are rejected (P12 atomicity)', () => {
    const backing = makeBacking();
    // Reject all rewards: coins must be NaN for the currency validator to fail.
    const rejectStore: ProgressionStore = {
      ...makeStore(backing),
      applyRewards: () => null,
    };
    const tournament = makeTournament('rookie');
    const gate = new RaceResultGate(rejectStore, tournament);
    const raceId = gate.beginRace();
    const out = gate.complete(aiRace(raceId, 1));
    expect(out.applied).toBe(false);
    expect(tournament.finishes).toEqual([]);
  });

  it('XP overflow and level-ups are preserved through the gate', () => {
    const backing = makeBacking(950, 0);
    const gate = new RaceResultGate(makeStore(backing), null);
    const raceId = gate.beginRace();
    // survival reward worth 250 XP: 10 + floor(score/100) = 250 → score 24000
    const out = gate.complete(survival(raceId, 24000));
    expect(out.completion?.levelBefore).toBe(1);
    expect(out.completion?.levelAfter).toBe(2);
    expect(out.completion?.levelsGained).toBe(1);
    expect(backing.xp).toBe(1200);
    expect(backing.coins).toBe(5 + 480);
  });

  it('a duplicate completion cannot duplicate a level-up', () => {
    const backing = makeBacking(950, 0);
    const gate = new RaceResultGate(makeStore(backing), null);
    const raceId = gate.beginRace();
    const first = gate.complete(survival(raceId, 24000));
    const dup = gate.complete(survival(raceId, 24000));
    // The cached summary re-reports the ORIGINAL level-up (historical), but
    // the level-up effect is never re-applied: XP is unchanged.
    expect(dup.completion?.levelsGained).toBe(first.completion?.levelsGained);
    expect(dup.completion?.levelsGained).toBe(1);
    expect(backing.xp).toBe(1200);
    expect(levelForXp(backing.xp)).toBe(2);
  });

  it('reload does not re-pay the same completion (shared persisted tokens)', () => {
    const backing = makeBacking();
    const gate1 = new RaceResultGate(makeStore(backing), null);
    const raceId = gate1.beginRace();
    gate1.complete(survival(raceId, 1200));

    // Simulated reload: brand-new gate + store over the same persisted state.
    const gate2 = new RaceResultGate(makeStore(backing), null);
    const out = gate2.complete(survival(raceId, 1200));
    expect(out.alreadyProcessed).toBe(true);
    expect(out.applied).toBe(false);
    expect(backing.xp).toBe(22);
    expect(backing.coins).toBe(29);
  });

  it('a fresh race after reload awards its own reward', () => {
    const backing = makeBacking();
    const gate1 = new RaceResultGate(makeStore(backing), null);
    const raceId = gate1.beginRace();
    gate1.complete(survival(raceId, 1200));

    const gate2 = new RaceResultGate(makeStore(backing), null);
    const nextId = gate2.beginRace();
    const out = gate2.complete(survival(nextId, 1200));
    expect(out.applied).toBe(true);
    expect(backing.xp).toBe(44);
  });

  it('rejects completions for unregistered race ids (replay/never-started)', () => {
    const backing = makeBacking();
    const gate = new RaceResultGate(makeStore(backing), null);
    const out = gate.complete(survival('never-registered', 1200));
    expect(out.applied).toBe(false);
    expect(out.alreadyProcessed).toBe(false);
    expect(out.completion).toBeNull();
    expect(backing.xp).toBe(0);
    expect(backing.coins).toBe(0);
  });

  it('rejects unknown modes and rogue divisions safely', () => {
    const backing = makeBacking();
    const gate = new RaceResultGate(makeStore(backing), null);
    const raceId = gate.beginRace();
    const badMode = gate.complete({ ...survival(raceId, 100), mode: 'rally' as RaceResult['mode'] });
    expect(badMode.applied).toBe(false);
    expect(badMode.completion).toBeNull();
    const badDivision = gate.complete({ ...aiRace(raceId, 1), division: 'legend' as DivisionId });
    expect(badDivision.applied).toBe(false);
    expect(badDivision.completion).toBeNull();
    expect(backing.xp).toBe(0);
  });

  it('rejects malformed inputs (missing raceId, non-finite values)', () => {
    const backing = makeBacking();
    const gate = new RaceResultGate(makeStore(backing), null);
    const raceId = gate.beginRace();
    expect(gate.complete({ ...survival(raceId, 100), raceId: '' }).applied).toBe(false);
    expect(gate.complete({ ...survival(raceId, 100), score: NaN }).applied).toBe(false);
    expect(gate.complete({ ...aiRace(raceId, 1), position: Infinity }).applied).toBe(false);
    expect(gate.complete({ ...aiRace(raceId, 1), position: NaN }).applied).toBe(false);
    expect(backing.xp).toBe(0);
  });

  it('negative scores are clamped to the GDD floor, not rejected', () => {
    const backing = makeBacking();
    const gate = new RaceResultGate(makeStore(backing), null);
    const raceId = gate.beginRace();
    const out = gate.complete(survival(raceId, -100));
    expect(out.applied).toBe(true);
    expect(out.completion?.rewards).toEqual({ xp: 10, coins: 5 });
  });

  it('completion state is deterministic across independent gate instances', () => {
    const a = makeBacking(0, 0);
    const b = makeBacking(0, 0);
    const gateA = new RaceResultGate(makeStore(a), null);
    const gateB = new RaceResultGate(makeStore(b), null);
    const idA = gateA.beginRace();
    const idB = gateB.beginRace();
    const outA = gateA.complete(survival(idA, 24000));
    const outB = gateB.complete(survival(idB, 24000));
    expect(outA.completion).toEqual(outB.completion);
    expect(outA.applied).toBe(outB.applied);
    expect(outA.alreadyProcessed).toBe(outB.alreadyProcessed);
    expect(a.xp).toBe(b.xp);
    expect(a.coins).toBe(b.coins);
    expect(a.races).toBe(b.races);
  });

  it('level-ups grant titles in the completion summary', () => {
    const backing = makeBacking(0, 0);
    const gate = new RaceResultGate(makeStore(backing), null);
    const raceId = gate.beginRace();
    // 299000 score → xp = 10 + 2990 = 3000 → level 4: crosses Street Racer
    // (level 3). Rookie (level 1) is the starting title, not an unlock.
    const out = gate.complete(survival(raceId, 299000));
    expect(out.completion?.levelAfter).toBe(4);
    expect(out.completion?.levelsGained).toBe(3);
    expect(out.completion?.unlocked).toEqual(['Street Racer']);
    expect(out.completion?.title).toBe('Street Racer');
  });

  it('distinct registrations are independent even with a fixed id factory', () => {
    const gate = new RaceResultGate(makeStore(makeBacking()), null, () => 'fixed');
    const first = gate.beginRace();
    const second = gate.beginRace();
    expect(first).toBe(second);
    expect(gate.complete(survival(first, 100)).applied).toBe(true);
    expect(gate.complete(survival(second, 100)).applied).toBe(false);
  });
});

describe('RaceResultGate — persistence & reload (P8.3)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('duplicate completion after reload stays idempotent (fresh manager + fresh gate)', () => {
    const store1 = new ProfileManager();
    const gate1 = new RaceResultGate(store1, makeTournament());
    const id = gate1.beginRace();
    const first = gate1.complete(aiRace(id, 3, 'rookie'));
    expect(first.applied).toBe(true);
    const snapshot = { xp: store1.xp, coins: store1.coins, races: store1.racesFinished };

    // Simulate a browser reload: brand-new manager and brand-new gate.
    const store2 = new ProfileManager();
    const gate2 = new RaceResultGate(store2, makeTournament());
    const second = gate2.complete(aiRace(id, 3, 'rookie'));
    expect(second.applied).toBe(false);
    expect(second.alreadyProcessed).toBe(true);
    expect(second.completion?.rewards).toEqual(first.completion?.rewards);
    expect(store2.xp).toBe(snapshot.xp);
    expect(store2.coins).toBe(snapshot.coins);
    expect(store2.racesFinished).toBe(snapshot.races);
  });

  it('abandoned race (beginRace, no complete) creates no token and no reward', () => {
    const store = new ProfileManager();
    const gate = new RaceResultGate(store, makeTournament());
    const abandonedId = gate.beginRace();
    expect(store.xp).toBe(0);
    expect(store.coins).toBe(0);
    expect(store.racesFinished).toBe(0);
    expect(store.isRaceCompleted(abandonedId)).toBe(false);
  });

  it('a new race after an abandoned one completes normally', () => {
    const store = new ProfileManager();
    const gate = new RaceResultGate(store, makeTournament());
    gate.beginRace(); // abandoned
    const newId = gate.beginRace();
    const out = gate.complete(aiRace(newId, 2, 'rookie'));
    expect(out.applied).toBe(true);
    expect(store.xp).toBeGreaterThan(0);
    expect(store.coins).toBeGreaterThan(0);
    expect(store.racesFinished).toBe(1);
    expect(store.isRaceCompleted(newId)).toBe(true);
  });

  it('completion tokens persist and remain recognized after reload', () => {
    const store1 = new ProfileManager();
    const gate1 = new RaceResultGate(store1, makeTournament());
    const id = gate1.beginRace();
    gate1.complete(aiRace(id, 4, 'rookie'));
    const store2 = new ProfileManager();
    expect(store2.isRaceCompleted(id)).toBe(true);
    expect(store2.racesFinished).toBe(1);
    expect(store2.xp).toBeGreaterThan(0);
  });

  it('profile migration repairs corrupt fields without erasing valid tokens', () => {
    const store1 = new ProfileManager();
    const gate1 = new RaceResultGate(store1, makeTournament());
    const id = gate1.beginRace();
    gate1.complete(aiRace(id, 4, 'rookie'));
    // Corrupt an unrelated field in storage, then reload.
    const raw = JSON.parse(localStorage.getItem('vs_profile_state') ?? '{}');
    raw.xp = 'corrupted';
    localStorage.setItem('vs_profile_state', JSON.stringify(raw));
    const store2 = new ProfileManager();
    expect(store2.isRaceCompleted(id)).toBe(true);
    expect(store2.xp).toBe(0); // invalid portion repaired
    expect(store2.coins).toBeGreaterThan(0); // valid portion preserved
    expect(store2.racesFinished).toBe(1);
  });
});
