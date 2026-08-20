# REPORT-11 :: P2.1 + P2.2 — RACE INTRO / COUNTDOWN

## Verdict

P2.1 (Race Intro / Camera Staging) and P2.2 (Pre-Race Countdown / Race Start
Handoff) COMPLETE. One tightly-scoped race-start pipeline was built on the
existing `StateMachine`/`AppState` architecture. No P2.3 work was started.

Gate results: **180 tests passing** (18 files), **typecheck clean**, **lint
clean**, **production build green** (1.09s), and both `/` and
`/phone-controller.html` served with HTTP 200 from the dev server.

---

## 1. Verdict

**P2.1 + P2.2 COMPLETE.** The game now enters a genuine deterministic
PRE-RACE/staging state on the `intro` phase before any race can start, and the
only normal path into `racing` is the completion of a single authoritative,
cancellable countdown.

---

## 2. Before → After architecture

### Before (P1.x)

```
GameplayScreen (Start Race button)
   ↓  api.startRace(...)
main.ts startRace():
   stateMachine.set('ready')            ← brief READY overlay
   startCountdown(startGame)            ← countdown armed immediately
   ↓  3·2·1·GO
startGame(): game.start(); stateMachine.set('racing')
```

- Countdown was also startable from **5 redundant trigger sites**: W key,
  two-hands gesture, touch GAS, auto-accelerate layer, and the results Retry
  button. `countdownActive`/`countdownInterval` globals gated duplicates.
- No dedicated pre-race cinematic phase existed; no deterministic camera
  staging; input could (re)arm the countdown from several surfaces.

### After (P2.1 + P2.2)

```
GameplayScreen (Start Race button)
   ↓  api.startRace(...)
main.ts startRace():
   game.prepareRace(); currentModeId/config/network set; replayRuntime.arm()
   stateMachine.set('ready') → set('intro')   ← NEW pre-race phase
   RaceStartPipeline.start()
      ↓  staging (RaceIntro, tick-driven from the render loop, dt-determined)
introTarget.prepare() → frame(p) sweep → settle()
   ↓  intro complete
beginCountdown()  ← Countdown class (explicit single owner)
   ↓  3·2·1·GO (interval 250ms, cancellable, guarded against double-start)
goRacing()  ← PRIVATE, reached ONLY from countdown completion
   ↓
stateMachine.set('racing'); startGame()
```

- **Three new owned modules**: `Countdown`, `RaceIntro`, `RaceStartPipeline`.
- All five ad-hoc countdown trigger sites were **removed**; input cannot start
  a race anymore, it can only steer once the race has started via the pipeline.

---

## 3. Exact state transitions

`GamePhase` is extended to `'idle' | 'ready' | 'intro' | 'racing' | 'gameover'`.

Canonical race-start path through the validated `GAME_PHASE_GRAPH`:

```
idle ──set('ready')──> ready ──set('intro')──> intro
                                                  │  staging (RaceIntro)
                                                  │  countdown (Countdown)
                                                  ▼
                                               racing ──> gameover ──> idle / back to ready (retry)
```

Graph edges (`src/core/AppState.ts`):

```
idle:     ['ready', 'racing']
ready:    ['intro', 'racing', 'idle', 'gameover']
intro:    ['racing', 'ready', 'idle', 'gameover']
racing:   ['gameover', 'idle', 'ready', 'intro']
gameover: ['idle', 'ready', 'intro', 'racing']
```

`phaseRoute('intro')` maps to the `gameplay` route (like `ready` and
`racing`). All pre-existing edges are preserved (no regressions).

---

## 4. Files created / modified

| File                                 | Change                                                                                                                                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/core/AppState.ts`               | Added `intro` to `GamePhase`, extended `GAME_PHASE_GRAPH`, `phaseRoute('intro') → 'gameplay'`, doc-table updated.                                                                                                              |
| `src/core/Countdown.ts`              | **New** — single-owner countdown (3·2·1·GO): optional interval/scheduler injection, double-start guard, cancellable, `onDone` fires exactly once, no leaked timers.                                                            |
| `src/core/RaceIntro.ts`              | **New** — deterministic staging timeline: `prepare` → `frame(p)` → `settle`; injected clock, per-begin overrides, double-begin guard, cancel-safe, reduced-motion shortcut preserving the state sequence.                      |
| `src/core/RaceStartPipeline.ts`      | **New** — authoritative gate: `start()` (ready→intro), `tick()` (drives staging), private `beginCountdown()`/`goRacing()`, `cancel()`. `goRacing` only reachable from countdown completion.                                    |
| `src/game/Game.ts`                   | Added `prepareRace()` (reset world without starting the clock); `start()` now delegates to it (behaviour preserved; AI-race spawn logic untouched).                                                                            |
| `src/main.ts`                        | Removed global countdown + all ad-hoc input triggers; built the pipeline (`buildRacePipeline`), wired `pipeline.tick` into the loop, introduced an intro-aware phase reconciliation, retry/nav/unload now `pipeline.cancel()`. |
| `src/core/Countdown.test.ts`         | **New** — 5 tests (timing, cancel, duplicate-start, idempotent cancel, restart).                                                                                                                                               |
| `src/core/RaceIntro.test.ts`         | **New** — 6 tests (determinism, double-begin, cancel, clamping, reduced-motion, per-begin options).                                                                                                                            |
| `src/core/RaceStartPipeline.test.ts` | **New** — 9 tests (full pipeline, no time-bypass, cancel in staging/countdown, duplicate events, stray callback, restart, reduced-motion, public-bypass guard).                                                                |
| `src/core/AppState.test.ts`          | +3 tests for the `intro` phase (walk, abort, invalid jumps).                                                                                                                                                                   |
| `src/screens/flow.test.ts`           | Robustness fix for one pre-existing timing flake (switched `settle(50)` → `vi.waitFor(..., timeout 3000)` for the "Survival + keyboard" test, matching its siblings).                                                          |

---

## 5. P2.1 — Race Intro / Camera Staging

- `GameplayScreen` no longer starts gameplay directly. Its Start Race button
  calls `startRace`, which enters the `intro` phase and runs the pipeline; the
  race cannot begin before staging + countdown.
- `RaceIntro` owns a **deterministic, cancel-safe** timeline driven from the
  existing render loop (`pipeline.tick(performance.now())`) — no new rAF/timer
  ownership, so disposal cannot leave callbacks behind.
- Camera staging reuses the existing `Game` camera + `updateCamera`:
  `prepare()` switches to a cinematic framing, `frame(p)` moves the camera
  along a pull-in sweep (eased, clamped to p∈[0,1]), `settle()` returns to
  `'chase'` via `game.updateCamera(1/60)`.
- `Game.prepareRace()` anchors the vehicle/world in a clean pre-race state
  before the countdown begins; the verified `game.start()` path (traffic
  spawn, AI handling) is still the single GO-time initializer.
- Vehicle/world correctness, existing track init, `InputManager`/`InputFrame`
  architecture, replay arming and mode config are untouched.

## 6. P2.2 — Countdown / Race Start Handoff

- One authoritative `Countdown` instance (explicit owner) replaces the global
  `startCountdown`/`cancelCountdown`.
- No duplicate timers: `Countdown.start()` is a no-op while active.
- Cancellable: `pipeline.cancel()` tears down intro + countdown together.
- Transitions through the validated machine: `ready → intro → racing`.
- `goRacing()` is **private** and only invoked from the countdown completion
  beat; it is the only normal path enabling racing.
- `startRace` is not triggered prematurely: staging completes first, then the
  countdown, then GO.
- Input sources (keyboard/touch/gyro/phone/auto) all observe the same GO time
  because they only steer the started `Game` after `stateMachine` reaches
  `racing`.

## 7. Input-lock behavior

- All five legacy input-initiated countdown triggers were removed:
  W key, two-hands gesture, touch GAS, auto-accelerate layer, and (via the
  results screen) any implicit restart.
- During `intro` the `Game.update()` early-returns (not `started`), so no
  source can move the vehicle; input publishing is retained but inert
  pre-start, and nothing arms a countdown.
- Results Retry now goes through the full pipeline (cancel → arm → prepare →
  `pipeline.start()`).

## 8. Phone behavior

- `PhoneSource` remains connected and publishes into the `phone` layer
  unchanged; it cannot start or advance the race early.
- The phone `frame()` path is only consumed by `Game.setHandData` once racing,
  so phone steering becomes effective exactly at GO, identical to every other
  source.
- `phone-pairing` route and `resolveNextRoute` gating are unchanged.

## 9. Multiplayer behavior

- Multiplayer network state (`activeNetwork`, `RemotePlayerManager`,
  `RaceDirector`) is configured at GO inside `startGame` exactly as before.
- Broadcasts and remote-player ticks remain gated on `state.started`, so no
  network traffic or standings changes occur during `intro`/countdown.
- Lobby → loading → gameplay handoff is untouched; `network` flows through the
  existing params to `startRace`.

## 10. Replay / ghost behavior

- `replayRuntime.arm(track, mode)` still happens in `startRace`; `begin()` is
  still called at GO inside `startGame`; `tick/finish/abort` are unchanged.
- Ghost load/duel timing is unmodified; the ghost simply idles at the start
  grid during staging/countdown (same behaviour as the legacy countdown).
- Replay player/camera routes are untouched.

## 11. Reduced-motion behavior

- `RaceIntro` accepts a `reducedMotion` flag (driven from
  `themeManager.get().reducedMotion`). When set, `prepare()` is still called,
  then it jumps to `settle()` + completion **on the same logical state
  sequence** (`ready → intro → countdown → racing`) with no camera sweep —
  matching P1.3's OS-level `prefers-reduced-motion` handling for the Home.
- Pipeline stage order is identical whether or not the sweep is skipped.

## 12. Cancellation / disposal guarantees

`pipeline.cancel()` calls `intro.cancel()` (settles, drops `onComplete`) and
`countdown.cancel()` (clears the interval, drops `onDone`). It is invoked from:

- `resultsMenu` (race abort),
- `navTitle` (navigation away / quit),
- `resultsRetry` (restart — cancel any in-flight pipeline first),
- `beforeunload` (page disposal).

Because `RaceIntro` holds no timers and is driven only by `pipeline.tick()`,
no animation callback can fire after cancellation; any stray tick is inert once
the stage leaves `staging`.

## 13. Tests added

- `Countdown.test.ts` (5): beat sequence 3·2·1·GO, `onDone` exactly once,
  timer release, cancel-before-done, duplicate-start no-op, safe/idempotent
  cancel, restart-after-finish.
- `RaceIntro.test.ts` (6): prepare→frame→settle determinism from injected
  clock, double-begin guard, cancel settles without `onComplete` and blocks
  later frames, progress clamped to [0,1], reduced-motion shortcut preserves
  sequence, per-begin duration override.
- `RaceStartPipeline.test.ts` (9): full `ready→intro→staging→countdown→racing`
  with `onRacing` exactly once; time-passing alone cannot start racing; cancel
  during staging; cancel during countdown; duplicate start ignored; stray
  duplicate countdown callback cannot double-start; restart-after-cancel;
  reduced-motion pipeline; no public input/bypass path to racing.
- `AppState.test.ts` (+3): intro walk-through, intro abort to idle/gameover,
  invalid intro jumps rejected.

## 14. Full test count

**18 test files · 180 tests passing** (was 157 → +23).

## 15. typecheck

`npm run typecheck` → clean (`tsc --noEmit`, zero errors).

## 16. lint

`npm run lint` → clean (`eslint .`, zero errors).

## 17. build

`npm run build` → `✓ built in 1.09s` (production bundle). Only the pre-existing

> 500 kB main-chunk warning remains (three.js/mediapipe glue — out of scope).

## 18. Manual / device verification

**Not performed — no physical hardware / browser automation available in this
environment.** The dev-server smoke test returned HTTP 200 for both `/` and
`/phone-controller.html`, and `src/main.ts` (which loads `Game`,
`RaceStartPipeline`, `Countdown`, `RaceIntro`) transformed successfully. Camera
staging, phone pairing and real-device countdown behaviour must be confirmed on
hardware.

## 19. Known limitations

- Cinematic staging camera sweep is a lightweight eased pull-in over the
  existing camera; it intentionally does not move the road/track meshes.
- No browser automation: the reduced-motion timer-then-GO path is verified by
  unit/integration tests and code review, not a real-device visual pass.
- `Game.prepareRace()` placement of position/obstacles mirrors the legacy
  `start()` reset; AI/versus semantics are unchanged.
- One pre-existing flaky flow test was hardened (see files table); it is not a
  behaviour regression.

## 20. P2.3 NOT STARTED

P2.3 and any later phase were **not** started. Gamepad implementation, backend,
networking changes, Game.ts redesign, UI redesign, new dependencies, and any
speculative refactors were all intentionally avoided. The next batch should be
**P2.3 + P2.4** with a full gate + report per the new 2-phase-per-pass rule.
