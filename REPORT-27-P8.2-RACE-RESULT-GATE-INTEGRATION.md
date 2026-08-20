# REPORT-27-P8.2-RACE-RESULT-GATE-INTEGRATION.md

## Objective

Integrate the P8.1 progression domain into the real race-completion lifecycle with a single authoritative, idempotent completion boundary (`RaceResultGate`). A completed race must award XP/coins exactly once — never twice, regardless of duplicate callbacks, retry, re-entry, or reload. Payout formulas from P8.1 remain untouched.

## Architecture / Context

Pre-P8.2, rewards were awarded directly inside the `stateMachine` 'gameover' handler (main.ts): `tournamentManager.recordFinish(finishPos)` → `profileManager.addRewards(...)`. There was no idempotency, and survival/versus paid nothing at all.

P8.2 introduces one boundary between the authoritative result and the progression store:

```
RACE SIMULATION (Game/AIRuntime/RaceDirector)          ← untouched
      │
      ▼  stateMachine 'gameover' transition (main.ts)  ← single completion point
RaceResultGate.complete(result)                        ← ONE entry point
      ├── validate (known mode/division, finite values)
      ├── persisted-token check (isRaceCompleted)      ← duplicate detection
      ├── session-registration check (beginRace)       ← rejects unregistered/replay ids
      ├── RewardCalculator.calculateRaceRewards        ← P8.1 formulas
      ├── TournamentPort.recordFinish (AI races only)  ← tournament state, once
      ├── ProgressionStore.applyRewards (XP/coins)     ← ProfileManager (persisted)
      └── markRaceCompleted (idempotency token)        ← persisted, capped 64 FIFO
      │
      ▼
RaceCompletion summary → ceremony/results UI
```

## Answers to the required report questions

### Where is the authoritative race completion point?

The `stateMachine` 'gameover' transition (main.ts `onChange`, the existing single authority). It was NOT moved. `StateMachine.set()` already ignores same-state sets and invalid transitions (core/StateMachine.ts:19-29), and every normal exit path (time limit, collision) funnels through the reconciliation in `gameLoop`.

### What is the race completion identity?

A race-instance id returned by `RaceResultGate.beginRace()`. It is generated with `crypto.randomUUID()` (injectable factory, deterministic in tests) in `startGame()` (main.ts) — the single race-start path (P2.4 pipeline). Retry and replay re-enter through this same path:

- retry → new `beginRace()` → new id → new payout (verified in browser),
- replay → never calls `beginRace()`/`startGame()` → unregistered id → completion rejected → no reward (unit-tested),
- duplicate completion calls for one race → same id → token already present → no second payout.

Timestamps are not part of the identity.

### How is duplicate completion detected?

Two layers:

1. **Persisted token**: `store.isRaceCompleted(raceId)` — the authoritative signal. Tokens are written by `ProfileManager.markRaceCompleted` into the profile save (`completedRaces`, FIFO-capped at 64) and therefore survive reload, remount, and a brand-new gate instance.
2. **Session registration**: `beginRace()` registers the id; `complete()` rejects unregistered ids (catches replay/never-started completions).

The persisted check runs BEFORE the registration check, so a duplicate completion after a reload (unregistered on the new session) still resolves to `alreadyProcessed`.

### What happens on the second completion call?

`{ applied: false, alreadyProcessed: true, completion, tournament: null }`. No XP, no coins, no level-up effects, no tournament advancement, no second `racesFinished` increment. The `completion` summary is the cached first-resolution when in-session, or a deterministic recompute (rewards are a pure function of the result; historical level snapshot is unavailable after reload) otherwise.

### Where are XP/coins persisted?

`ProfileManager` (existing store, `vs_profile_state` key) — extended, not replaced. `applyRewards(xp, coins)` validates integer/non-negative amounts (rejects negative/non-integer/NaN with no mutation), applies XP through the P8.1 `XpProgression` math (level derived from total XP, overflow carried), and persists atomically. `SaveManager` was NOT touched.

### How are Survival/Versus/AI rewards integrated?

`complete()` receives a `RaceResult { raceId, mode, position, score, division }`; main.ts builds it at gameover:

- `ai-race`: position from `raceDirector`, division from `tournamentManager.activeState` → RewardCalculator position formula (with division multiplier) + tournament advancement via `recordFinish` (guarded to run once per race by the gate).
- `multiplayer`: position from `raceDirector`, no division → position formula, multiplier 1 (P8.1 behavior).
- `survival`/`versus`: score-based formula (GDD floor) — previously these modes paid NOTHING; now they pay exactly once.

All modes now flow through the same boundary; the old `profileManager.addRewards(res.xpAwarded, res.coinsAwarded)` direct call in main.ts was removed.

### How was payout parity preserved?

The gate uses `RewardCalculator.calculateRaceRewards` (P8.1, unchanged). The P8.1 "tournament parity" test still asserts calculator values equal `TournamentManager.recordFinish` payouts for every position at rookie. `TournamentManager`'s `coinsAwarded`/`xpAwarded` fields remain as the compatibility/reference implementation (its 30+ tests unchanged and passing); the gate uses its `pointsAwarded`/`promoted`/etc. only for the tournament summary. Browser verification confirmed: P6 finish → exactly 400 XP / 200 coins stored AND displayed.

## Files Created / Modified

| File                                     | Change                                                                                                                                                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/progression/RaceResultGate.ts`      | NEW — gate (store + tournament ports, beginRace/complete, validation, replayCompletion)                                                                                                                          |
| `src/progression/RaceResultGate.test.ts` | NEW — 19 tests                                                                                                                                                                                                   |
| `src/managers/ProfileManager.ts`         | Extended — `completedRaces` tokens (cap 64 FIFO), `lifetimeStats.racesFinished`, `applyRewards`, `isRaceCompleted`, `markRaceCompleted`, `xp/coins/level/racesFinished` getters; defaults via deep-fresh factory |
| `src/managers/ProfileManager.test.ts`    | NEW — 13 tests (rewards, tokens, reload, legacy-shape load, corrupt JSON, purchases)                                                                                                                             |
| `src/main.ts`                            | `raceResultGate` singleton wiring; `currentRaceId` + `beginRace()` in `startGame()`; gameover block routed through `complete()`; ceremony fed from gate outcome                                                  |

## Implementation Details

- **Store/tournament ports**: structural interfaces (`ProgressionStore`, `TournamentPort`) keep the gate testable without DOM or storage; main.ts satisfies them with `profileManager` + `tournamentManager`.
- **Rejected completions**: `{ applied: false, alreadyProcessed: false, completion: null, tournament: null }` for: missing/empty raceId, unknown mode, rogue division on ai-race, non-finite score/position, unregistered raceId. Negative scores are clamped to the GDD floor by the calculator (documented, not rejected).
- **Ceremony continuity**: duplicate gameover observations still render the ceremony with the (already-awarded) reward numbers — display is stable, payout is not duplicated.

## Tests Added / Changed

- `RaceResultGate.test.ts` (19): first-completion applies; same id twice → once; `alreadyProcessed` semantics; new id awards independently; survival once; versus once; AI parity + tournament advanced exactly once; champion multiplier; XP overflow/level-up preserved; duplicate cannot re-apply level-up; reload does not re-pay; fresh race after reload pays; unregistered id rejected (replay); unknown mode/division rejected; malformed inputs rejected; negative score clamped; determinism across gate instances; title unlocks in summary; fixed-factory registration independence.
- `ProfileManager.test.ts` (13): validated rewards, overflow/multi-level, invalid-amount rejection without mutation, `addRewards` compat, token dedupe + FIFO cap, reload persistence, legacy-shape save with defaults, corrupt JSON recovery, defensive `currentState` copy, purchase contract.

## Bug Found & Fixed (P8.2)

**Shallow default-copy state leak**: `{ ...DEFAULT_PROFILE }` shared the nested `lifetimeStats` object and `completedRaces` array across instances, so `markRaceCompleted` mutated the shared default template — a second `ProfileManager` instance in the same JS context saw phantom progress even with empty storage (reproduced in a probe test: `localStorage.clear()` + fresh instance → `racesFinished` still 70). Fixed by a `makeDefaultProfile()` factory returning deep-fresh defaults; load path already re-copies parsed nested fields. This latent hazard existed in the original code (shared arrays) and is now eliminated.

## Validation — exact commands and results

```bash
npx vitest run                                     # 479 passed, 38 files (447 baseline + 32 new)
npm run typecheck                                  # PASS
npm run lint                                       # PASS
npx prettier --check .                             # PASS
npm run build                                      # ✓ built in 1.32s
npx playwright test --project=chromium             # 14 passed / 6 intentional skips / 0 failed
```

## Browser (targeted) verification performed

Temporary probe spec (deleted after the run, no sleeps — synchronized on domain state via `expect.poll`):

1. Full AI race → game-over ceremony: `vs_profile_state` = `{xp:400, coins:200, races:1, tokens:1}` — P6 rookie payout exactly `(10-6)*100×1` / `(10-6)*50×1`.
2. Ceremony rendered `XP 400 / COINS 200` — identical to stored values (parity through the real integration).
3. Second read while ceremony open: token/xp/coins unchanged (no duplicate application).
4. Retry → second full race: `{xp:800, coins:400, races:2, tokens:2}` — new race id, independent second payout.

## Regressions / Known Limitations

- **No regressions**: full unit suite 479/479 (includes all 447 baseline), chromium E2E 14/6/0 identical to baseline. TournamentManager, SaveManager, NavigationSystem, AI, replay untouched. `flow.test.ts` and mobile E2E are re-run in the P8.9 regression phase.
- **After-reload duplicate summary**: an `alreadyProcessed` completion after a reload reports current profile state (historical level snapshot is only cached in-session); rewards are deterministically recomputed. Payout protection is unaffected (unit-tested).
- **Races abandoned mid-run** (browser closed before gameover) award nothing — payout happens only at the authoritative finish transition (GDD-compliant; noted for P8.3/8.8 discussion).
- **Abandoned-race recovery and deep profile validation/migration** (full P8.3 scope) not yet implemented; `completedRaces`/`lifetimeStats` defaults already cover legacy saves.

## Final Verdict

**PASS** — P8.2 COMPLETE. One authoritative completion boundary exists; duplicate completions cannot double-pay (persisted tokens + session registration); payout parity verified both in unit tests and in-browser; survival/versus now pay once; all gates green.
