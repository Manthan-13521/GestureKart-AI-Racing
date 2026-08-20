# REPORT-12-P2.3-P2.4-RACE-INTRO-UX-GAMEPLAY-ENTRY

**Pass:** P2.3 (Race Intro Presentation / Countdown UX) + P2.4 (Race Start /
Gameplay Entry). Implemented strictly from on-disk code +
`REPORT-ROADMAP-NEXT-PHASES.md`. No P2.5 / P3.1 / later work was started.

---

## 1. Verdict

**COMPLETE.** The pre-race sequence now presents deliberately and
accessibly: the game HUD is hidden until `racing`, a `#intro-overlay`
presentation shows the chosen track · mode, the 3·2·1·GO countdown is rendered
by the single authoritative `Countdown` through `UIManager`, and `racing` →
`Game.start()` occurs exactly once per attempt at the GO boundary only. All
gates green (205 tests / 20 files, typecheck, lint, build).

## 2. P2.3 implementation

- New `#intro-overlay` presentation surface in `index.html` (badge + GET READY
  title + `#intro-sub` track · mode label), mounted once, hidden on
  cancellation/navigation/game-over, never re-created.
- `UIManager` is now the one presentation surface for the race-start sequence:
  `sync(phase)` derives intro/HUD/countdown visibility from the
  `StateMachine`, `setIntroInfo()` labels the presentation, and
  `showCountdown()` / `hideCountdown()` manage the live region.
- Countdown beats 3→2→1→GO are driven exclusively by `Countdown` (P2.2) via
  its injected hooks in `main.ts`; the UI holds no timer.
- HUD lifecycle: `.hud` now carries `id="game-hud"` and is `hidden` by default,
  toggled only by `sync('racing')` — it can no longer appear live before the
  race starts.
- Responsive tokens reused (no second token namespace); intro sizes compact at
  ≤600px and short (≤500px-high) landscape viewports without overflow.
- Camera staging/cinematics unchanged — reuse `RaceIntro` (P2.1); `prepare →
frame → settle` untouched, reduced-motion skip preserved.

## 3. P2.4 implementation

- Single racing entry already guaranteed by `RaceStartPipeline.goRacing()`
  (private, only from the countdown completion beat); verified by tests.
- `startGame()` (the `onRacing` callback) gained a `if (game.started) return;`
  guard so `Game.start()` fires exactly once per attempt even against
  double-clicks, repeated Enter/Space, duplicate pipeline/completion events,
  retry-while-active, stale callbacks, or rapid navigation.
- Input lock: unchanged and structurally safe — every source (keyboard / hand /
  gyro / phone / auto-accelerate) publishes into `InputManager.frame()`, and
  `Game.update()` early-returns until `started`, so pre-GO input is inert.
  GO is deterministic: countdown completion → `racing` → `Game.start()` →
  replay/AI/network begin — no arbitrary timeout between these.
- Retry, cancel, navigation (`resultsMenu`, `navTitle`, `beforeunload`) all
  call `pipeline.cancel()` and reset `stateMachine` to `idle`; no stale
  countdown/GO/timer survives (phase-driven `sync` also retires the UI).
- Multiplayer + replay untouched code-wise; verified compatible with the GO
  boundary (their init lives inside `startGame`, which runs once at GO).

## 4. Files changed

| File                                    | Change                                                                                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `index.html`                            | `#game-hud` on `.hud` (now `hidden` by default); countdown `role/live/atomic/aria-hidden`; new `#intro-overlay` + `#intro-sub`.                                          |
| `src/style.css`                         | `.intro-overlay/.intro-content/.intro-badge/.intro-title/.intro-sub` (tokens, `inset:0`, `max-width:90vw`, z-25); responsive compaction in `≤600px` and `≤500px` blocks. |
| `src/managers/UIManager.ts`             | Added `hud`/`intro`/`introSub` refs; `sync` derives intro/HUD/countdown from phase; `setIntroInfo`, `setIntroVisible`, `showCountdown`, `hideCountdown`.                 |
| `src/main.ts`                           | Countdown hooks routed through `ui.showCountdown()/hideCountdown()`; `ui.setIntroInfo` in `startRace` + RACE AGAIN retry; `startGame` once-guard.                        |
| `src/managers/UIManager.test.ts`        | **New** — 15 presentation tests.                                                                                                                                         |
| `src/core/RaceStartPipeline.ui.test.ts` | **New** — 10 integration tests (pipeline + real UIManager wiring).                                                                                                       |

## 5. Architecture impact

None — extended the existing P2.1/P2.2 chain. One authoritative start path
stands as before: `AppState/StateMachine → RaceStartPipeline → (RaceIntro +
Countdown) → racing → Game.start()`. `UIManager` gained presentation duties only;
it owns no timers/audio/state, and nothing was duplicated.

## 6. State transition diagram

```
idle → ready → intro ─ staging (RaceIntro, intro overlay visible)
                    └ countdown 3·2·1·GO (countdown overlay on top)
                    └ GO → racing → Game.start() → gameplay HUD active
  racing → gameover → (results) retry/menu → idle
  any pre-race stage ─ cancel ────────────→ idle (all presentation retired)
```

## 7. Countdown ownership

`Countdown` (P2.2) remains the sole owner of countdown timing and completion.
UI merely renders its beats through hooks; `Countdown.start()` no-ops while
active, `cancel()` releases the timer without firing `onDone`. Test-proven: time
passing alone never advances the countdown; a stray `start()`/duplicate
completion cannot double-trigger `racing`.

## 8. Input-lock behavior

All input continues through `InputManager`/`InputFrame`. Pre-GO frames are
consumed but inert because `Game.update()` early-returns until `Game.start()`.
No input can move the phase machine or reach `startGame`. Tests assert that
time + stray inputs cannot reach `racing`, and that exactly the GO beat does.

## 9. HUD/intro lifecycle

`UIManager.sync` toggles deterministically (phase authority):

| phase    | intro overlay | HUD     | countdown           |
| -------- | ------------- | ------- | ------------------- |
| idle     | hidden        | hidden  | hidden              |
| ready    | visible       | hidden  | as-is (hidden)      |
| intro    | visible       | hidden  | beats render on top |
| racing   | hidden        | visible | hidden (post-GO)    |
| gameover | hidden        | hidden  | hidden              |

## 10. Accessibility

Countdown overlay is a `role="status" aria-live="polite" aria-atomic="true"`
live region; `aria-hidden` flips to `true` whenever hidden (after completion,
on cancel, on navigation). CT receives 4 meaningful announcements
(3·2·1·GO); the 120Hz loop never re-announces (tested). Intro overlay toggles
`aria-hidden` with visibility, and its badge is `aria-hidden`. No stale
"3/2/1/GO" remains exposed after racing (both `clear()` and `sync('racing')`
retire it).

## 11. Reduced-motion behavior

`prefers-reduced-motion` CSS shortens animations; `RaceIntro` reduced-motion
skips the sweep but staging still completes into the countdown on the same
authoritative path — no separate timer, and the logical sequence
ready → intro → countdown → racing is preserved (tested).

## 12. Retry/cancel behavior

RACE AGAIN: `pipeline.cancel()` → reset presentation (phase `idle`) → arm
replay → `prepareRace()` → `setIntroInfo` → `pipeline.start()`; fresh staging +
countdown, no stale UI/timer (tested: 25 single countdown/intro DOM nodes across
cycles). Cancel/nav/unload: no countdown/intro callback, no stale GO, no
transition to racing, no `Game.start()`.

## 13. Multiplayer compatibility

`Lobby → Loading → Gameplay → startRace → pipeline → startGame` untouched.
Network init runs inside `startGame` (once per attempt, guarded); `startRace`
still passes `network` through the pipeline start. No networking code changed.

## 14. Replay compatibility

`replayRuntime.arm(track, mode)` still precedes `pipeline.start()` in
`startRace` + retry; `begin()` remains inside `startGame`, i.e. recording and
ghost fade/start happen exactly at the GO boundary. `GhostHud` visibility is
managed by `ReplayRuntime` independently of `.hud` and stays hidden pre-GO.
Only the shared GO boundary was exercised; no replay code changed.

## 15. Tests added

- `src/managers/UIManager.test.ts` (15): unique intro overlay; intro on
  ready/intro; HUD hidden before racing; HUD visible during racing; overlay
  retirement after racing; live-region semantics + no spam; phase-driven
  countdown cleanup; cancellation clears; retry uniqueness; label formatting;
  results layout preserved; responsive CSS overflow audit (tokens + media).
- `src/core/RaceStartPipeline.ui.test.ts` (10): full authoritative
  3·2·1·GO sequence → HUD on; `Game.start()` exactly once (+ guard); duplicate
  `pipeline.start()` no-op; input cannot reach racing pre-GO; cancel during
  countdown → no stale racing; retry runs a fresh pipeline; navigation cancel;
  reduced-motion preserves stages; multiplayer/replay begin at GO once;
  game-over overlay derived from phase with HUD retired.

## 16. Final test count

**20 test files · 205 tests passing** (baseline 18 files / 180 → +25).

## 17. typecheck

`npm run typecheck` → clean (`tsc --noEmit`).

## 18. lint

`npm run lint` → clean (`eslint .`).

## 19. build

`npm run build` → `✓ built in 1.08s` (only the pre-existing >500 kB chunk warning).

## 20. manual/browser verification

Dev-server smoke: `/` → 200, `/phone-controller.html` → 200, and the served
`index.html` contains the `#game-hud`, `#intro-overlay`, and countdown
`role="status"` markers (grep: 3 matches). Full playtest checklist from the
implementation prompt was NOT run — no browser automation or physical
Android phone is available in this environment; hardware verification
(phone pairing through intro→GO, no steering before GO, steering exactly at GO,
post-navigation invalidation) must be confirmed on-device. **No hardware
verification is claimed.**

## 21. Known limitations

- Intro overlay is intentionally minimal (badge + title + track·mode) to honor
  performance/reduced-motion constraints; richer art/video is out of scope.
- Visual QA of the cinematic sweep + overlay stacking was not performed on a
  real device.
- Skip-on-input for the cinematic intro is explicitly NOT part of this pass
  (per scope lock); it remains GDD-risk #11 and would need its own defined phase.

## 22. P2.5 / P3.1 NOT IMPLEMENTED

Confirmed: **P2.5 and P3.1 were NOT implemented.** No P3 ghost feature work, AI
improvements, networking, gamepad, tracks, garage, weather, progression, or
dependency additions were made. This pass implemented exactly P2.3 + P2.4, then
**STOPPED**.
