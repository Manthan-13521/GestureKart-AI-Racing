# REPORT-30 — P9 COMPLETE: REPLAY + ADVANCED RACE SYSTEMS

## Objective

Build a robust replay / ghost / advanced-race-system layer on top of the existing
racing architecture so that races are reproducible and replayable WITHOUT changing
the authoritative race physics, reward formulas, progression economy, or any P8
contract. Replay sits at the **input/control boundary** (not a second physics
simulation), is deterministic, is fully isolated from RaceResultGate, and leaves
no progression or persistence side effects. Entire P9 executed in a single run on
the frozen P8 baseline.

## Architecture Before P9

- **Input**: multiple live sources (keyboard, touch, phone/gyro, hand) resolved by
  `InputManager` into a unified `InputFrame` (`steer / throttle / brake / boostButton`).
- **Game loop** (`main.ts`): build `frame` → `game.update()` → `game.render()` → HUD.
- **Race lifecycle**: `StateMachine` phases `idle → ready → intro → racing → gameover`,
  reconciled each frame from `game.getState()`.
- **Progression**: `RaceResultGate` (P8.2) is the ONLY reward boundary; ceremony
  rendered by `VictoryCeremony` from the gate outcome. `ProfileManager` is the
  persistence authority. `ContentCatalog` is the cosmetic authority.
- **Replay (P8 photo replay)**: `ReplayRuntime` + `replay/codec.ts` + `replay/ghost.ts`
  - `ReplayOverlay` — a camera/orbit presentation layer over a _just-finished live race_
    that replays the player's kart visuals; it does NOT re-simulate the race.
- **AI**: `AIRuntime` + `RaceDirector`, seeded per race.
- **Randomness**: `game.rng` (mulberry32) seeded at race prepare; several gameplay
  calls were unseeded (obstacle/pickup/traffic/effects spawn).

## Architecture After P9

A new **deterministic input-replay layer** added in parallel to the photo replay:

```
INPUT (live) ──► InputManager ──► InputFrame ──► Game.update ──► physics ──► race state ──► gameover
                      ▲
                      │ registerSource
   ReplayInputSource ─┘            (replay frames are the authoritative input during playback)
```

- **Recording** captures the exact normalized `InputFrame` applied each game-loop
  iteration (live races only) into a session-only buffer.
- **Playback** registers a `ReplayInputSource` with `InputManager`; the SAME game
  loop, physics, seeded RNG, and pipeline run the race again with zero live-input
  interference.
- **`raceExecutionMode: 'live' | 'replay'`** is the single gate that (a) decides
  whether recording happens and (b) decides, on the gameover transition, whether
  RaceResultGate is consulted (live only). Replay playback can reach gameover but
  produces no progression, no persistence, no high-score, no tournament effect.
- **P8 photo replay** is untouched and still present (`virtual-steering:replays:v1`,
  `#results-replay`).

## Replay Data Model

`src/replay/input/types.ts` — strongly typed, validated at the boundary:

```
InputReplayData {
  schema: number            // 1
  version: number           // 1
  id: string                // replay identity (uuid-ish, session-only)
  gameMode: string          // normalized mode id
  track: string
  seed: number              // original race's seeded RNG seed
  sensitivity: number       // steer sensitivity used in the original race
  trafficEnabled: boolean
  startedAt: number
  playerDistance: number    // total distance driven (used to keep replay comparable)
  frames: ReplayInputFrame[]  // unified control states, not device events
  score: number
  raceTime: number
  durationMs: number
}
ReplayInputFrame { steer: number; throttle: number; brake: number; boostButton: boolean; }
```

- Records **normalized control output only** — no DOM events, mouse/touch coords,
  hand landmarks, gyroscope values, or device specifics.
- `validateInputReplay()` enforces schema/version, mode whitelist, frame count
  bounds, and range-checks every field (steer ∈ [-1,1], throttle/brake/boost ∈
  {0,1}). Malformed data fails safely (returns `{ valid:false, errors[] }`) and
  never crashes the game; the UI hides the replay button for invalid data.
- Output is defensive (frozen copy returned by `finish()`), so external consumers
  cannot mutate recorded frames.

## Recording Pipeline

`src/replay/input/recorder.ts`:

- `begin()` — called ONLY in the live-race gameover path? No: called at the race
  start (GO) for live races, so frames are captured from the authoritative start.
  Resets the buffer and captures setup (seed, sensitivity, trafficEnabled, mode,
  track, id).
- `record(frame, raceTime)` — appends the exact frame applied this iteration
  (invoked from the game loop only when `raceExecutionMode === 'live'`).
- `finish(score, raceTime)` → returns a defensive (frozen) `InputReplayData`, or
  `null` if the recording is empty (e.g., a race with zero recorded frames).
- `abort()` — discards the in-progress recording (used by `goToMainMenu` and
  beforeunload). An abandoned race NEVER becomes a completed replay and NEVER
  awards progression.
- Recorder lifecycle is reset cleanly on every live-race start/retry.

## Playback Pipeline

`src/replay/input/source.ts` — `ReplayInputSource`:

- implements the same `InputSource` contract as keyboard/touch/phone/hand sources
  so `InputManager` resolves it like any other source.
- `sourceId === 'replay'` — registered with **top priority**, making replay input
  authoritative over every live source during playback.
- `update(frame, ...)` writes the recorded frame at a deterministic rate derived
  from the recorded `raceTime` deltas (one recorded frame per race-time step),
  and sets `active` while frames remain.
- `stop()` / exhaustion: when the recorded frames are exhausted, playback ends
  deterministically and the source is unregistered; live input is restored.
- Malformed/exhausted data fails safely (empty/neutral frames, source deactivated).
- On replay exit (`goToMainMenu` / `replay-active-exit`), `stopReplayPlayback()`
  unregisters the source and live input is restored.

## InputSource Integration

- `InputManager` (P3-era) already resolves multiple sources with priority;
  `ReplayInputSource` has the highest priority id (`'replay'`), so during playback
  keyboard/touch/gyro/hand cannot modify the race. Verified in-browser: pressing
  arrow keys during playback did not disturb the run.
- On playback end/exit, `unregisterSource('replay')` restores normal input.

## Determinism Strategy

- `Game.setRaceSeed(seed)` seeds the authoritative `mulberry32` RNG.
- Five previously-unseeded gameplay calls were converted to the seeded RNG:
  obstacle spawn, pickup spawn, traffic spawn, AI personality/challenge draw,
  and effects variation (all cosmetic-independent gameplay). All other seeded
  sources (AI, RaceDirector) were already seed-derived.
- Replay playback restores `seed`, `sensitivity`, and `trafficEnabled` via
  `setRaceMode` + `setRaceSeed` + `setSensitivity` + `gesturesEnabled` before
  starting the pipeline.
- Deterministic tests prove: same seed + same recorded `InputFrame` sequence →
  same outcome (see `input-replay.test.ts` — `replay is deterministic with a fixed seed`)
  using stable assertions appropriate to the simulation.
- Replay playback does NOT mutate the source data (frozen defensive copy).

## Ghost / Presentation Architecture

- The existing **photo-ghost replay** (`ReplayRuntime` + `replay/ghost.ts` +
  `replay/codec.ts` + `ReplayOverlay`) is preserved and untouched — it presents a
  ghost kart of the finished race for the P8 `#results-replay` button.
- The new input-replay (`#results-watch-replay`) re-simulates the full race under
  deterministic input. Both are **presentation-only**: neither affects player
  physics, AI, rewards, or race completion.
- No new rendering framework was introduced; both use the existing canvas pipeline.

## Replay Lifecycle

All lifecycle paths verified in `src/replay/replay-lifecycle.test.ts` and the
browser probe:

| Path                          | Behavior                                                                                                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Normal race → record → finish | recording finalized once; `#results-watch-replay` appears                                                                                                                         |
| Retry                         | new race id, fresh recorder, fresh replay                                                                                                                                         |
| Replay → playback             | `raceExecutionMode='replay'`, no reward, no progression                                                                                                                           |
| New race after replay         | normal input restored, new recorder, independent race                                                                                                                             |
| Abandoned race                | recording aborted; no reward, no replay                                                                                                                                           |
| Reload                        | replay state cannot corrupt ProfileManager                                                                                                                                        |
| Navigation away               | `goToMainMenu` + beforeunload abort the recording safely                                                                                                                          |
| Game over                     | recorder finalizes exactly once; duplicate gameover observations do not duplicate finalization (gameover branch is guarded by `raceExecutionMode` and RaceResultGate idempotency) |

## RaceResultGate / Progression Isolation

- `RaceResultGate` remains the ONLY reward boundary.
- The gameover `onChange` handler branches on `raceExecutionMode`:
  - `'live'` → `saveManager.setBestScore`, `inputReplayRecorder.finish`,
    `replayRuntime.finish`, `raceResultGate.complete` (idempotent per race id),
    ceremony render. This is the ONLY rewarded path.
  - `'replay'` → `stopReplayPlayback()`, hide strip + ceremony + results actions,
    show `#replay-complete-panel` ("No rewards, records or tournament progress
    were awarded"). RaceResultGate is never consulted.
- Replay cannot advance the tournament, cannot create a duplicate completion
  token, and cannot award XP/coins. Verified in-browser via localStorage snapshot
  equality before/after replay and after abandon.

## Persistence Decision

- Replay payloads are **session-only** (module memory). Not persisted to
  localStorage. Never written to `vs_profile_state`.
- Rationale: the GDD/product architecture does not require cross-session replay
  storage, and large frame arrays should not be serialized on every race.
- Only the P8 photo replay continues to persist via its existing
  `virtual-steering:replays:v1` key (unchanged).

## Performance Analysis

- Recording: one push per frame into a pre-sized array; no DOM access, no
  serialization, no per-frame allocations beyond the frame object already built
  by InputManager.
- Playback: source reads frames in order with no JSON conversion per frame; the
  replay progress strip is DOM-touched **at most once per second**
  (`updateReplayStrip` throttles on a `data-progress` second counter).
- No localStorage writes during gameplay/playback.
- Mobile performance strategy preserved; verified no horizontal overflow on
  mobile during strip and completion-panel states.

## Files Created / Modified

**Created (P9 core):**

- `src/replay/input/types.ts` — validated `InputReplayData` + `ReplayInputFrame` model
- `src/replay/input/recorder.ts` — `InputReplayRecorder` (begin/record/finish/abort)
- `src/replay/input/source.ts` — `ReplayInputSource` (playback input source)
- `src/replay/input/input-replay.test.ts` — 27 unit tests
- `src/replay/replay-lifecycle.test.ts` — lifecycle/progression isolation tests

**Modified (P9 wiring):**

- `src/main.ts` — `raceExecutionMode`, recorder wiring in game loop, gameover
  replay branch, `startReplay`, `goToMainMenu`, `updateReplayStrip`,
  `stopReplayPlayback`, button handlers, `startRace` replay cleanup,
  beforeunload abort, `startReplay` guard fix
- `index.html` — `#results-watch-replay`, `#replay-active-strip`,
  `#replay-complete-panel` (title uses dedicated `.replay-complete-title` class)
- `src/style.css` — `.replay-active-strip`, `.replay-complete-note`,
  `.replay-complete-title`, `.replay-btn`/`.replay-strip-*`
- `src/game/Game.ts` — `setRaceSeed` + 5 seeded RNG call sites
- `src/input/InputFrame.ts`, `src/managers/InputManager.ts` — replay source
  priority resolution

## Tests Added

- **`src/replay/input/input-replay.test.ts` (27 tests)**: valid replay; invalid
  version; invalid mode; missing/invalid fields; out-of-range steer; invalid
  throttle/brake/boost; malformed replay; recorder starts clean, records
  normalized frames in order, finalizes once, resets between races, abandons;
  defensive/frozen output; playback reads frames in order; deterministic end;
  exhausted replay safe; live input cannot override playback; input restored
  after playback; replay does not mutate source; determinism (same seed + same
  frames → same outcome); InputManager priority.
- **`src/replay/replay-lifecycle.test.ts`**: normal race vs replay isolation,
  retry/replay/new-race flow, abandon discard, duplicate gameover finalization
  once, no duplicate completion token, replay cannot advance tournament,
  RaceResultGate remains authoritative.
- Full unit suite now **571/571 passing across 41 files** (P8 baseline: 544/40).

## Browser Verification

Temporary probe specs (`e2e/p9-replay.probe.spec.ts`, `e2e/p9-diag.probe.spec.ts`)
were created, run against the real dev server via Playwright, and **deleted after
verification** (per P9 Phase 13).

**Desktop (chromium, versus "You vs You" mode, 90s time-limit):**

1. Complete a normal race → ceremony renders with `.ceremony-stat` — PASS
2. Replay becomes available (`#results-watch-replay` visible) — PASS
3. Start replay → `#replay-active-strip` appears ("REPLAY · LIVE INPUT DISABLED") — PASS
4. Playback proceeds deterministically (sm intro→racing→gameover) — PASS
5. Live input cannot interfere (arrow/space presses during playback) — PASS
6. Replay reaches completion safely (`#replay-complete-panel` "No rewards") — PASS
7. XP/coins do NOT increase from replay — PASS (localStorage snapshot equality)
8. Tournament does NOT advance from replay — PASS (same snapshot key unchanged)
9. Exit replay → `#replay-active-strip` hidden, panel hidden — PASS
10. Start a new normal race → live input works, fresh strip hidden — PASS
11. New race gets a new recording — PASS (fresh race + abandon path)
12. Reload does not corrupt progression state — PASS
13. Abandoned race produces no completed replay/reward — PASS (goto + snapshot equality)
14. No console errors during flow — PASS

**Mobile (mobile-chromium):** 15. Tap replay through to completion without horizontal overflow — PASS
(overflow ≤ 1px with strip and with completion panel)

## Bugs Found and Fixed

1. **`startReplay` early-return blocked replay** (`src/main.ts`): the guard
   `if (game.started) return;` bailed because a versus crash-gameover leaves
   `_started=true`. Fixed to `if (game.started && !game.getState().gameOver) return;`.
2. **Replay completion panel never visible** (`index.html`): `#replay-complete-panel`
   carried the `hidden` class in markup; `.hidden { display: none !important }`
   defeated the `.visible` opacity toggle. Removed `hidden` from the panel markup.
3. **`.results-title` strict-mode collision (P8 regression)**: the replay panel
   reused `class="results-title"` ("REPLAY COMPLETE"), so the P8 ceremony test
   (`game-flow.spec.ts:196`) hit a strict-mode violation with 2 `.results-title`
   elements. Fixed by using a dedicated `.replay-complete-title` class in
   `index.html` + `style.css`.
4. **Probe: `.ceremony-stat` strict-mode mismatch** — the locator resolved to 2
   elements (XP + COINS); `isVisible()` threw a strict-mode violation that
   `.catch(() => false)` masked. Fixed the probe to use `.first()`.
5. **Probe: opacity-hidden overlays misread as "visible"** — `.game-overlay`
   hides via `opacity:0` (not `display:none`), which Playwright's `isVisible()`
   ignores. Fixed the probe's `waitForReplayEnd` to poll computed `opacity === '1'`
   and the post-exit panel assertions to assert `opacity === '0'`.

## Regression Results

- `npx vitest run` → **571 passed (41 files)** — PASS
- `npm run typecheck` → PASS
- `npm run lint` → PASS
- `npx prettier --check .` → PASS
- `npm run build` → PASS
- `npx playwright test --project=chromium` → **14 passed / 6 skipped / 0 failed**
  (matches P8 baseline)
- `npx playwright test --project=mobile-chromium` → **13 passed / 7 skipped / 0 failed**
  (matches P8 baseline)
- Targeted `game-flow.spec.ts:196` (AI ceremony) re-run after the class fix → PASS

## Known Limitations

- Replay is **session-only**; reloading loses input-replay availability (by
  design — persistence decision above).
- Replay playback re-simulates with the seeded RNG; cosmetic variation outside
  the five seeded call sites may differ but has no gameplay effect.
- `versus` ("You vs You") mode has no AI/traffic, so replay determinism was
  verified in that mode; AI races replay with the recorded seed and traffic flag.
- A crash-gameover mid-race is legitimately recorded (kart hit a wall); the
  replay faithfully reproduces it (verified: same gameover point as the live race).
- Large recorded buffers are in-memory only; no cap on race length (90s modes
  produce ~5400 frames — negligible).

## Required Invariants

- RaceResultGate is the only progression reward boundary — preserved.
- Replay playback awards zero progression — verified.
- ProfileManager remains the progression persistence authority — preserved.
- ContentCatalog remains the cosmetic authority — preserved.
- ProgressionView remains pure — preserved.
- Cosmetics remain visual-only — preserved.
- `.ceremony-stat` count remains exactly 3 — preserved.
- Menu/garage progression presentation intact — preserved.
- XP/coin formulas unchanged — preserved.
- Tournament payouts unchanged — preserved.
- AI behavior remains deterministic — preserved.
- Keyboard/touch/phone/hand input intact — preserved.
- Multiplayer behavior intact — preserved.
- NavigationSystem contracts intact — preserved.
- Mobile layout behavior intact (no overflow) — verified.

## Exact Validation Commands

```bash
npx vitest run                      # 571 passed (41 files)
npm run typecheck                   # PASS
npm run lint                        # PASS
npx prettier --check .              # PASS
npm run build                       # PASS
npx playwright test --project=chromium        # 14 passed / 6 skipped / 0 failed
npx playwright test --project=mobile-chromium # 13 passed / 7 skipped / 0 failed
```

## Final Verdict

**PASS.** P9 implementation complete; replay/ghost layer sits at the input
boundary, is deterministic and session-only, and is fully isolated from
RaceResultGate. All unit/type/lint/format/build gates are green, both E2E
projects match the P8 baseline, targeted browser verification passed on desktop
and mobile, and all P8 regression contracts remain intact. STOP after P9 — no
P10 started.
