# REPORT-14-P4-AUDIT.md

**Task type:** Read-only P4 "Endless Survival upgrade" discovery / audit. **No implementation was performed.**
**Date:** 2026-08-18
**Baseline:** Verified prior gate GREEN at 211 tests / 21 files (REPORT-13). Working tree carries the uncommitted P2.1–P3.1 changesets (`git status` captured; this audit added/modified nothing but this report).

---

## 1. Current P4 status (verified on disk)

| P4 requirement (GDD §17)                                                  | Status      | Evidence                                                                                                                                                              |
| ------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Combo multiplier (×2…×10)                                                 | **MISSING** | `features.combo` set `true` on survival but zero consuming logic anywhere in `src/`                                                                                   |
| Near-miss (<1.5 m clearance)                                              | **MISSING** | No clearance/sweep detection; only binary collision `dx < 1.5 && dz < 2.5` (`Game.ts:771-773`)                                                                        |
| Boost pickup + invulnerability                                            | **MISSING** | `boostButton` reserved in `InputFrame` but `false` in every source; no pickup, no invulnerability concept in `Game`                                                   |
| Dynamic difficulty (wave-based)                                           | **PARTIAL** | Linear time ramp only: `difficulty = min(1, raceTime/60)`, `maxSpeed = 2.0 + difficulty*2.5`, `spawnInterval = 120 - difficulty*90`; no waves, no distance milestones |
| Gesture calibration                                                       | **FAKE**    | `main.ts:1072` `calibrateGesture` = toast-only stub; real calibration exists only for phone (not gesture)                                                             |
| High-score table                                                          | **MISSING** | `SaveManager.bestScore` = single best only; no per-track table/leaderboard UI                                                                                         |
| HUD tier 2 (boost bar, combo, near-miss toasts)                           | **MISSING** | `updateGameHUD` renders speed/gear/score only; no combo/boost/near-miss elements in `index.html`                                                                      |
| Collision juice (hit-stop / slow-mo 0.4 s / red flash)                    | **PARTIAL** | Red flash + camera shake + FOV punch exist (`Game.ts:774-778`, `main.ts` `collisionFlash`); hit-stop and slow-mo absent                                               |
| Visual feedback (speed lines / boost flare / combo ring / near-miss glow) | **PARTIAL** | Speed lines exist (`main.ts` `drawSpeedLines`); flare/ring/glow absent                                                                                                |
| Input: GestureSource required, keyboard fallback + banner                 | **MISSING** | `survival.input = ['hand']` (`GameModeConfig.ts:102`); keyboard silently blocked (`GameModeConfig.test.ts:74`), no fallback banner                                    |
| Steering: adaptive EMA + dead-zone calibration                            | **MISSING** | `SmoothFilter(0.45)` and `HandTracker` EMA 0.55 are fixed; `deadZone = 0.02` hardcoded (`Game.ts:720`)                                                                |
| Palm-center + hand-presence timeout                                       | **PARTIAL** | Palm-center averaging exists (`HandTracker.ts:124-130`); presence timeout/warning absent (status is a text toggle only)                                               |

**Bottom line: P4 is a greenfield build.** Only speed lines, collision flash/shake, palm-center tracking, a sensitivity slider, and the `InputFrame`/`GameModeConfig` contract scaffolding exist. Combo, near-miss, boost, dynamic difficulty, gesture calibration, and the high-score table are entirely absent from `src/`.

---

## 2. Authoritative requirements (GDD)

- **§17 P4 "Endless Survival upgrade"** — scope: Combo, near-miss, boost, dynamic difficulty, gesture calibration, high-score table. Exit criteria: **"Current game + new juice, no regressions."**
- **§18 MoSCoW** — maps the same features to P4.
- **§6.7 Mode 4 Endless Survival IMPROVE table**:
  - Steering smoothing: adaptive EMA + dead-zone calibration; gesture accuracy / palm-center / hand-presence timeout / calibration screen.
  - Combo ×2…×10, built by near-miss OR lane-switch streak, resets on hit.
  - Near-miss bonus: clearance < 1.5 m → +combo, +points, "NEAR MISS" pop.
  - Boost: glowing pickup in a lane, +speed, 1.5 s invulnerability.
  - Dynamic difficulty: wave-based calm → intense → calm; progressive speed cap rising with distance milestones.
  - Collision effects: hit-stop / camera shake / slow-mo 0.4 s / red flash.
  - High-score leaderboard: local best + track table.
  - Rich visual feedback: boost flare / combo ring / speed lines / near-miss glow.
- **§3.2 HUD tiers** — T2 adds boost bar, combo multiplier, near-miss toasts; wireframe shows `COMBO ×5`, `BOOST bar`, `NEAR MISS +120`.
- **§6.2 Input Manager** — Endless Survival → GestureSource required; keyboard fallback allowed **with warning banner**; unified `InputFrame { steer, throttle, brake, boostButton }`; one-hand mode = TouchSource.

---

## 3. Existing implementation mapping

| Piece (P4-adjacent)                                    | Status                  | Location                                                                |
| ------------------------------------------------------ | ----------------------- | ----------------------------------------------------------------------- |
| Unified `InputFrame` incl. reserved `boostButton`      | Present (unused)        | `src/input/InputFrame.ts:14-23,61-68`                                   |
| Mode input gate (`survival` → `['hand']`)              | Present                 | `GameModeConfig.ts:97-112,118-120`; enforced in `InputManager.ts:85-91` |
| `features.combo` flag on survival                      | Present but dead        | `GameModeConfig.ts:106`                                                 |
| Speed lines juice                                      | Present                 | `src/main.ts` `drawSpeedLines` (~L926)                                  |
| Collision flash + camera shake + FOV punch             | Present                 | `Game.ts:774-778`; `main.ts` `collisionFlash`                           |
| Palm-center smoothing (EMA 0.55, landmarks 0/5/9)      | Present                 | `HandTracker.ts:124-132`                                                |
| Sensitivity slider → tracker smoothing + game gain     | Present                 | `main.ts` `applySensitivity`; `HandTracker.ts:87-89`; `Game.ts:719-727` |
| Steering dead-zone (hardcoded 0.02) + power curve 0.85 | Present (fixed)         | `Game.ts:719-728`                                                       |
| Score = distance×2 while 2 hands detected              | Present (flat)          | `Game.ts:699-705`                                                       |
| Obstacle spawner (random lane) + collision             | Present                 | `Game.ts:646-689,749-759,771-779`                                       |
| Single best score persistence                          | Present                 | `SaveManager.ts:6,148-153`                                              |
| Phone calibration (real, phone-only)                   | Present                 | `PhoneSensor.ts:74`; `src/controller/main.ts:122-125`                   |
| Gesture calibration UI row + button                    | Present (wired to fake) | `SettingsScreen.ts:240-248` → `api.calibrateGesture()`                  |

---

## 4. Missing functionality (build list)

1. **Combo system** — multiplier state (×2…×10), streak sources (near-miss or lane switch), reset on hit, scoring integration, HUD display, combo ring effect.
2. **Near-miss detection** — per-obstacle clearance sweep as the car passes (< 1.5 m without collision), "NEAR MISS +N" popup, combo + points reward. Requires a per-obstacle "passed-player" state (`Game.ts` obstacle loop).
3. **Boost** — glowing pickup placed in a lane, pickup on overlap, speed burst, 1.5 s invulnerability window, boost bar HUD, boost flare effect.
4. **Dynamic difficulty** — replace the single linear `min(1, raceTime/60)` ramp with wave-based calm→intense→calm and distance-milestone speed-cap rises; keep current traffic model.
5. **Gesture calibration** — real capture of palm-center neutral, per-user dead-zone, adaptive EMA alpha (speed- and/or signal-driven) replacing hardcoded `deadZone=0.02` + fixed EMA 0.45/0.55; calibration screen replacing the `main.ts:1072` stub.
6. **Hand-presence timeout** — timer since last valid hand frame → warning/toast after N seconds without hands.
7. **High-score table** — per-track (or per-mode×track) persisted table; new `SaveData` fields (`SAVE_VERSION` 2 → 3) + results-screen UI.
8. **HUD tier 2** — boost bar, combo multiplier, near-miss toast DOM in `index.html` + `style.css` + `main.ts` `updateGameHUD`.
9. **Collision juice** — hit-stop + 0.4 s slow-mo on top of existing flash/shake.
10. **Keyboard-fallback banner** for survival (GDD §6.2) if keyboard is allowed to steer.
11. **Lane-switch streak** — requires discretizing continuous `cameraX` into nearest `LANE_X` and tracking change events (`Game.ts` has no player-lane state; `lane` exists only for spawning).

---

## 5. Broken / misleading functionality

| Item                              | Problem                                                                                                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features.combo: true` (survival) | Dead flag — no consumer. Misleads readers into thinking combo exists.                                                                                                                   |
| `InputFrame.boostButton`          | Reserved by contract, always `false` in every source (`KeyboardSource`, `TouchSource`, `GyroSource`, `PhoneSource`, `HandSource`, `InputManager` auto/gyro paths). No physics reads it. |
| `calibrateGesture` (settings)     | UI advertises a real calibration; handler is a 2-second toast (`main.ts:1072-1075`). Fake feature.                                                                                      |
| `GameModeConfig.rules.spawning`   | Declared per-mode but not wired — `Game` spawns traffic for every non-ai-race mode regardless (`Game.ts:288-292,749-759`); file header notes this is deferred to P4/P5.                 |
| "Endless" vs 90 s cap             | Survival labelled Endless (`durationLabel: 'Endless'`, `finish: 'collision'`) yet `RACE_DURATION = 90` force-ends the run (`Game.ts:710-712`).                                          |
| Hand tracking status              | `statusHand` is Active/Inactive text only — no presence timeout, no low-confidence warning.                                                                                             |

---

## 6. Dependencies

- Combo / near-miss ← obstacle spawn + collision loop in `Game.ts` (LANE_X, obstacle `z` sweep past player).
- Boost / invulnerability ← new `GameState` fields (`invulnerable`, boost timer) + collision gating in `Game.ts:773`.
- Dynamic difficulty ← existing `difficulty` ramp + `spawnInterval`/`maxSpeed` formulas + distance accumulator (`playerDistance`, `score`).
- Gesture calibration ← `HandTracker` smoothing + `Game.ts:719-728` steering path (deadZone/sensitivity currently internal constants) + `SettingsScreen`/main wiring.
- High-score table ← `SaveManager` (bump `SAVE_VERSION`), results screen (`#final-score` path, `NavigationSystem`).
- HUD tier 2 ← `index.html` + `style.css` + `main.ts` `updateGameHUD`.
- Keyboard-fallback banner ← `InputManager.isSourceAllowed`/`frame()` + survival config change (`input: ['hand']`).
- Collision juice (hit-stop/slow-mo) ← `Game.ts` update loop + `stateMachine` phase timing.

---

## 7. Risks

1. **`src/game/simulation/` dead scaffolding** (`RaceSimulation`, `CollisionManager`, etc.) — zero imports in HEAD; a prior attempt at a simulation layer. **Do not wire it during P4** (scope creep); note as debt.
2. **Regression mandate** — P4 exit is "current game + no regressions". Collision = instant game over is core; boost invulnerability must not mask it. `justCollided` drives audio/`stateMachine`/particles — keep semantics.
3. **MediaPipe CDN dependency** — hand tracking loads MediaPipe from jsDelivr (`HandTracker.ts:62`); device/playtest needed for calibration + presence.
4. **2-hands gate** — score/accel require `handsDetected >= 2` (`Game.ts:699`); near-miss rewards must not penalize the same frame as a near collision.
5. **Uncommitted baseline** — P2.1–P3.1 changesets are still uncommitted; P4 work stacks on them.
6. **Continuous `cameraX`** — no discrete lane model for the player; lane-switch streaks need quantization (nearest `LANE_X`).

---

## 8. Recommended implementation order

1. **Combo + Near-Miss** (state machine + scoring + HUD, self-contained in `Game.ts` + HUD).
2. **Boost + Dynamic Difficulty** (pickups, invulnerability, hit-stop/slow-mo, waves + milestones — also all in `Game.ts`).
3. **Gesture Calibration + High-Score Table** (input-path refactor + persistence/UI, independent of 1–2).

Each pair is independently shippable and matches the two-phase-per-pass convention used by P2.3+P2.4.

---

## 9. Proposed next batch (concrete)

> **Batch: "P4 — Combo + Near-Miss" then "P4 — Boost + Dynamic Difficulty"**
>
> - P4a **Combo + Near-Miss**: combo multiplier ×2…×10 (near-miss or lane-switch streak, reset on hit); near-miss sweep (< 1.5 m clearance) → "NEAR MISS +N" pop + combo; HUD tier-2 combo element + combo ring; scoring integration; unit tests.
> - P4b **Boost + Dynamic Difficulty**: glowing boost pickup lanes + 1.5 s invulnerability + boost flare + boost bar; wave-based calm→intense→calm difficulty and distance-milestone speed caps; hit-stop + 0.4 s slow-mo (keeping existing flash/shake); tests.

Gesture calibration + high-score table remain as the follow-on batch.

---

## 10. Validation / gate requirements (for the implementation passes)

- `npm run typecheck` — GREEN
- `npm run lint` — GREEN
- `npx vitest run` — all existing **211** tests (21 files) plus new: combo math/streak/reset; near-miss boundary (clearance 1.49 / 1.50 / 1.51); boost invulnerability window + pickup overlap; wave-difficulty phase transitions + distance milestones; slow-mo/hit-stop timers; HUD DOM presence (boost bar, combo, NEAR MISS).
- `npm run build` — GREEN
- `npx prettier --check` (repo convention) — GREEN
- Device playtest (gesture camera) for calibration, presence timeout, and near-miss feel.

---

## 11. Confirmation — NO CODE WAS CHANGED

This audit performed only read-only operations (Read / Grep / node extraction to `/tmp`). **No source, markup, stylesheet, or test file was created or modified.** The sole artifact written is this report (`REPORT-14-P4-AUDIT.md`). `git status` is unchanged from the pre-audit baseline (P2.1–P3.1 changesets).
