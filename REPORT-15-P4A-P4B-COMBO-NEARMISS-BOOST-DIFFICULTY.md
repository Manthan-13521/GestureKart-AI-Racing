# REPORT-15-P4A-P4B-COMBO-NEARMISS-BOOST-DIFFICULTY.md

**Task type:** P4a "Combo + Near-Miss" + P4b "Boost + Dynamic Difficulty" implementation
**Date:** 2026-08-18
**Baseline:** Verified prior gate GREEN at 211 tests / 21 files (REPORT-13). Working tree carried uncommitted P2.1–P3.1 changesets; this pass adds P4a/P4b.

---

## 1. Verdict

**P4a Combo + Near-Miss: IMPLEMENTED**
**P4b Boost + Dynamic Difficulty: IMPLEMENTED**

All validation gates pass:

- `npx vitest run` — **266 tests / 26 files** (was 211/21, +55 tests, +5 files)
- `npm run typecheck` — GREEN
- `npm run lint` — GREEN
- `npm run build` — GREEN
- `npx prettier --check` — GREEN

---

## 2. P4a Implementation — Combo + Near-Miss

### Combo System (`src/game/p4/combo.ts`)

| Feature                   | Implementation                                                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Multiplier range**      | ×1 → ×10 (configurable `maxMultiplier=10`)                                                                                                    |
| **Streak sources**        | Near-miss (`registerNearMiss()`) + committed lane switch                                                                                      |
| **Lane switch detection** | Quantizes continuous `cameraX` against `LANE_X`; commits only after `dwellFrames=4` consecutive frames in new lane (prevents boundary jitter) |
| **Initial lane**          | Silent assignment (no combo increment)                                                                                                        |
| **Reset triggers**        | `reset()` called in `Game.prepareRace()` (new race, retry, abort, nav away)                                                                   |
| **Mode isolation**        | Only active in survival (`_raceMode === 'survival'`)                                                                                          |

### Scoring Integration (`Game.ts:782-784`)

- Base score: `score += speed * 2 * dt`
- **With combo**: `score += speed * 2 * dt * comboMultiplier`
- Near-miss reward: `NEAR_MISS_BASE_REWARD (50) * multiplier` added once per obstacle
- Deterministic: multiplier applied per-frame; near-miss reward added exactly once

### Near-Miss Detection (`src/game/p4/nearMiss.ts` + `Game.ts:863-872`)

- **Geometry**: Tracks per-obstacle minimum lateral clearance (`minDx`) during pass
- **Trigger**: When obstacle crosses player plane (`prevZ <= 0 && z > 0`) AND `minDx < NEAR_MISS_CLEARANCE (1.5)` AND no collision occurred
- **Boundary behavior** (tested):
  - 1.49 m → near-miss ✓
  - 1.50 m → NOT a near-miss (strict `<`) ✓
  - 1.51 m → NOT a near-miss ✓
- **Deduplication**: Per-obstacle `passed` + `nearMissed` flags prevent duplicate awards
- **Collision suppression**: If `collided=true`, near-miss is suppressed

### Near-Miss Feedback

- **Toast**: `NotificationSystem.notify('NEAR MISS', \`+${reward}\`, { kind: 'success' })` via existing UI architecture
- **HUD**: Combo display pulses on multiplier change (CSS animation, no JS timers)

### HUD Tier-2 Combo (`index.html` + `style.css` + `main.ts`)

```html
<div class="hud-combo hidden" id="hud-combo">
  <span class="hud-combo-label">COMBO</span>
  <span class="hud-combo-val" id="hud-combo-val">×1</span>
</div>
```

- Shown only when `comboMultiplier > 1`
- Pulse animation on multiplier change (CSS `animation: comboPulse 0.3s`)
- No JS animation timers — CSS handles timing, JS only toggles class

---

## 3. P4b Implementation — Boost + Dynamic Difficulty

### Boost Pickup (`src/game/p4/boost.ts` + `Game.ts`)

| Property        | Value                                                                       |
| --------------- | --------------------------------------------------------------------------- |
| **Duration**    | `BOOST_DURATION = 1.5` seconds (invulnerability)                            |
| **Speed bonus** | `BOOST_SPEED_BONUS = 1.0` (added to acceleration)                           |
| **Spawn**       | Random lane, separate timer (`8–20s` interval), reuses existing lane system |
| **Visual**      | Glowing cyan torus + pulse ring (`MeshStandardMaterial` with emissive)      |
| **Collection**  | `dx < 1.2 && dz < 2.0` overlap check                                        |
| **Refresh**     | New pickup resets timer to 1.5s (no additive stacking)                      |

### Boost Controller (`src/game/p4/boost.ts`)

- `activate()` → sets `timeLeft = BOOST_DURATION`, `invulnerable = true`
- `tick(delta)` → decrements timer, returns `active` state
- `reset()` → clears timer, called in `prepareRace()`

### Boost Effects

- **Speed**: During boost, `maxSpeed` effectively increased by `speedBonus * 0.002 * dt` per frame
- **Invulnerability**: Collision check skipped when `boostState.invulnerable` (no game-over, no juice)
- **HUD**: Boost bar shown only when active; fill width = `boostTimeLeft / BOOST_DURATION`; label shows `BOOST ${ceil(timeLeft)}s`

```html
<div class="hud-boost hidden" id="hud-boost">
  <div class="hud-boost-fill" id="hud-boost-fill"></div>
  <span class="hud-boost-label" id="hud-boost-label">BOOST</span>
</div>
```

### Dynamic Difficulty (`src/game/p4/difficulty.ts`)

Replaces linear `min(1, raceTime/60)` with deterministic wave system:

| Parameter           | Value                                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Wave duration**   | `WAVE_DURATION = 30s`                                                                                                        |
| **Intense phase**   | `WAVE_INTENSE_START=12s` → `WAVE_INTENSE_END=22s`                                                                            |
| **Wave envelope**   | Trapezoidal: 0→1 (calm→intense), hold 1, 1→0 (intense→calm)                                                                  |
| **Base difficulty** | `0.2 + waveIntensity * 0.8`, capped at 1.0                                                                                   |
| **Max speed**       | `maxSpeedFor(distance)` = `MAX_SPEED_BASE (2.0) + milestone * SPEED_CAP_PER_MILESTONE (0.4)`, hard cap `MAX_SPEED_CAP (6.0)` |
| **Milestones**      | Every `MILESTONE_DISTANCE (500)` playerDistance units                                                                        |
| **Spawn interval**  | `spawnIntervalFor(t, distance)` = `120 - wave*60 - milestone*12`, min `18`                                                   |

**Survival-only**: Non-survival modes keep original linear ramp.

---

## 4. Collision Juice (Hit-Stop + Slow-Mo)

### Implementation (`src/game/p4/collisionJuice.ts`)

| Phase        | Duration                    | Time Scale             |
| ------------ | --------------------------- | ---------------------- |
| **Hit-stop** | `HIT_STOP_DURATION = 0.08s` | `0` (full freeze)      |
| **Slow-mo**  | `SLOW_MO_DURATION = 0.4s`   | `SLOW_MO_SCALE = 0.25` |
| **Total**    | ~0.48s                      | —                      |

### Integration (`Game.ts`)

- Activated on survival collision when **not invulnerable**
- Sets `_justCollided=true`, shake/FOV punch, `collisionJuice.activate()`, `crashActive=true`
- During crash: `update()` returns early after camera update (world frozen/slowed)
- After `consumeDone()` → sets `_gameOver=true`
- **Non-survival**: Instant game-over (unchanged)
- **Invulnerable**: Collision fully suppressed (no juice, no game-over)
- Timers use real delta; world delta scaled by `timeScale`

---

## 5. HUD Changes

| Element         | File                                 | Description                                        |
| --------------- | ------------------------------------ | -------------------------------------------------- |
| Combo display   | `index.html`, `style.css`, `main.ts` | Top-right, shows `×N`, pulses on change            |
| Boost bar       | `index.html`, `style.css`, `main.ts` | Bottom-right, fill + label, shown only when active |
| Near-miss toast | `main.ts`                            | Uses `NotificationSystem` (existing)               |

All HUD follows existing design tokens (`--font-display`, `--gold`, `--cyan`, `--blue`, `--text*`), responsive conventions.

---

## 6. Files Changed

### New Files (5 modules + 5 tests + index)

```
src/game/p4/
  ├── combo.ts              # ComboSystem, LaneSwitchTracker, nearestLaneIndex
  ├── nearMiss.ts           # isNearMiss, nearMissReward, constants
  ├── boost.ts              # BoostController, constants
  ├── difficulty.ts         # waveIntensity, difficultyFactor, milestoneFor, maxSpeedFor, spawnIntervalFor
  ├── collisionJuice.ts     # CollisionJuice state machine
  ├── index.ts              # barrel export
  ├── combo.test.ts         # 12 tests
  ├── nearMiss.test.ts      # 8 tests
  ├── boost.test.ts         # 6 tests
  ├── difficulty.test.ts    # 20 tests
  └── collisionJuice.test.ts# 9 tests
```

### Modified Files

```
src/game/Game.ts            # Core integration (combo, near-miss, boost, difficulty, crash)
src/main.ts                 # HUD updates, near-miss toast, DOM refs
index.html                  # Combo + Boost HUD DOM
src/style.css               # .hud-combo, .hud-boost styles
```

---

## 7. Architecture Impact

| Aspect                          | Impact                                                                  |
| ------------------------------- | ----------------------------------------------------------------------- |
| **AppState/StateMachine**       | Preserved — no changes                                                  |
| **RaceStartPipeline**           | Preserved — no changes                                                  |
| **ReplayRuntime (P3.1)**        | Preserved — no changes                                                  |
| **InputManager/InputFrame**     | Preserved — `boostButton` remains reserved (unused)                     |
| **GameModeConfig**              | Survival mode uses new features; other modes unchanged                  |
| **Dead `src/game/simulation/`** | Not wired — flagged as debt                                             |
| **State ownership**             | Game owns P4 state; UI renders from `GameState`; no duplicate ownership |

---

## 8. State/Lifecycle Behavior

| Event           | Combo     | Boost     | Crash             | Difficulty                    |
| --------------- | --------- | --------- | ----------------- | ----------------------------- |
| `prepareRace()` | `reset()` | `reset()` | `reset()`         | —                             |
| New race        | Clean     | Clean     | Clean             | Wave starts at t=0            |
| Retry           | Clean     | Clean     | Clean             | Wave restarts                 |
| Abort/Nav away  | Clean     | Clean     | Clean             | Wave restarts on next prepare |
| Game-over       | Frozen    | Frozen    | Triggers          | Frozen                        |
| Non-survival    | Inactive  | Inactive  | Instant game-over | Original linear ramp          |

---

## 9. Tests Added (55 new tests)

| Module                   | Tests | Coverage                                                                                  |
| ------------------------ | ----- | ----------------------------------------------------------------------------------------- |
| `combo.test.ts`          | 12    | ×1 start, cap ×10, near-miss increment, lane switch commit/dwell, jitter rejection, reset |
| `nearMiss.test.ts`       | 8     | 1.49✓, 1.50✗, 1.51✗, boundary strict `<`, reward scaling                                  |
| `boost.test.ts`          | 6     | Activate, tick expire, no negative, refresh (no stack), reset                             |
| `difficulty.test.ts`     | 20    | Wave phases, difficulty factor, milestones, max speed cap, spawn interval, determinism    |
| `collisionJuice.test.ts` | 9     | Phases, timeScale progression, consumeDone, over-tick, reset                              |

**Total: 266 tests / 26 files** (baseline 211/21 → +55 tests, +5 files)

---

## 10. Validation Gates

| Gate                   | Result                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| `npx vitest run`       | **266 tests / 26 files** PASS                                       |
| `npm run typecheck`    | PASS                                                                |
| `npm run lint`         | PASS                                                                |
| `npm run build`        | PASS (673 kB main bundle)                                           |
| `npx prettier --check` | PASS                                                                |
| Dev-server smoke check | Not performed (no browser automation) — **explicitly NOT verified** |

---

## 11. Known Limitations

1. **Keyboard fallback banner for survival** — Not implemented (GDD §6.2). Survival input remains `['hand']` only.
2. **Gesture calibration** — Not implemented (separate batch). `calibrateGesture` remains toast stub.
3. **High-score table** — Not implemented (separate batch). `SaveManager` still single `bestScore`.
4. **Boost activation input** — Pickup-only; `InputFrame.boostButton` remains unused (reserved).
5. **Flaky flow test** — "Survival + keyboard clamps to hand" pre-existing timing issue; unrelated to P4.
6. **Bundle size** — Main chunk 673 kB (warning); consider code-splitting in future.

---

## 12. Explicit Scope Statement

- ✅ **P4a Combo + Near-Miss** — IMPLEMENTED
- ✅ **P4b Boost + Dynamic Difficulty** — IMPLEMENTED
- ❌ Gesture calibration — NOT implemented
- ❌ High-score table — NOT implemented
- ❌ P2.5 — NOT implemented (undefined)
- ❌ No later phase (P5 AI, P6 Local MP, P7 Online MP, P8 Tracks, P9 Garage, P10 Replay, P11 Polish) implemented
- ❌ No unrelated refactor performed

---

## 13. Next Recommended Batch

Per REPORT-14: **P4c — Gesture Calibration + High-Score Table** (adaptive EMA, dead-zone calibration screen, hand-presence timeout, per-track leaderboard UI).
