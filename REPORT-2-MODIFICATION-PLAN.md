# REPORT 2 — Powerful Modification Plan

> Goal: add a **Mode-Select start page** and implement **3 playable modes** on top of the current game:
>
> 1. **Continuous Mode** — "you vs. you": endless endurance race against your own best run (ghost car).
> 2. **Obstacle Mode** — the current obstacle-dodge race (already exists; repackaged).
> 3. **Multiplayer Mode** — race a friend on the same road, **no obstacle traffic in the middle** — just the two cars racing.
>
> This plan also includes the verification checklist ChatGPT should run to approve each stage.

---

## 1. Design Principles (from the project's own UI/UX skill docs)

- Main menu = small number of **clearly differentiated destinations** (Play modes, Settings), not a dense grid.
- One confirm / one back action used identically everywhere.
- "Select and go race" path must stay **short** (2 steps max).
- Results screen sequence: immediate result → standings → rewards/progression → leaderboard → post-race menu.
- Pause menu stays tiny: Resume (pre-selected) / Restart / Settings / Quit.
- Keep the whole thing **static-frontend friendly** (deployed on Vercel, no backend by default).

---

## 2. Target Screen Flow

```
            ┌─────────────────────────────────────────┐
            │         MAIN MENU (mode select)          │
            │  ┌──────────────────────────────────┐    │
            │  │   [ CONTINUOUS ]  (you vs you)    │    │
            │  │   [ OBSTACLE   ]  (current mode)  │    │
            │  │   [ MULTIPLAYER]  (race a friend) │    │
            │  └──────────────────────────────────┘    │
            │   SETTINGS         HOW TO PLAY           │
            └──────┬──────────────────────────┬────────┘
                   ▼                          ▼
        mode-specific "READY" screen     (settings/how-to unchanged)
                   │
        countdown (3-2-1-GO) → race
                   │
        results overlay (mode-aware)
                   │
        RACE AGAIN / CHANGE MODE (→ main menu)
```

- **Landing screen** becomes the mode-select hub (replaces the current single "PLAY" button with three mode buttons).
- Clicking a mode → optional mode pre-race screen (names/cars for multiplayer) → countdown → race.
- After race → **results overlay** (score/time, and for multiplayer the finishing order) → "RACE AGAIN" or "MAIN MENU".

---

## 3. Mode Designs

### 3.1 MODE A — Continuous Mode ("You vs. You")

**Concept:** An endless time-attack down the same tunnel, but you are racing against the **ghost of your best previous run**. No traffic, pure driving against yourself.

**Rules:**

- Endless track (reuse the looping 18-segment tunnel), **no obstacle spawning**.
- Race ends when you **crash** (hitting nothing → replace crash rule with "lift hands / fall below minimum speed for X seconds") OR when you quit. Recommended: end the run when hands are hidden for > 3s (with a grace warning), keeping the "collision" only as an option if obstacles are later re-enabled.
- Goal: drive as far as possible. Track `distance` (total `z` traveled) and total time alive → **Score = distance + speed bonus**.
- **Ghost system:** during a run, record `{ timeMs, cameraX }` samples (throttled to ~20 Hz). On the next run, replay the best recorded run as a semi-transparent car in the scene at `cameraX(time)` position. The ghost visibly pulls ahead / falls behind → "you vs. you".
- **Persistence:** store best run samples in `localStorage` (they're just small arrays — ~20 samples/sec × a few minutes ≈ few KB, fine).

**Why "you vs. you":** the ghost is literally your past self. Add a HUD delta readout "You: +12m / -30m vs best".

**Reuse:** 90% of `Game.ts`. Changes: a `mode` flag to disable `spawnCar`, a `recording` buffer, a `GhostCar` renderer (reuse `spawnCar`'s car mesh), remove the 90s timer cap, replace collision-end with "no-hands timeout".

### 3.2 MODE B — Obstacle Mode (Current, Repackaged)

**Concept:** exactly the current game — dodge AI traffic in the tunnel for 90 seconds, score, crash ends race.

**Changes (small):**

- Wire it behind the new "OBSTACLE" button in the mode-select menu.
- Keep timer, laps HUD, position, collision → all unchanged.
- Bonus: save best score in `localStorage` and show "BEST: 0000" on the results screen (cheap, high value).

### 3.3 MODE C — Multiplayer Mode (Race a Friend)

**Concept (per user):** race on the **same road**, **no obstacle cars in the middle** — just two cars racing.

**Two sub-implementations (phase 1 local, phase 2 online):**

#### C1. LOCAL SAME-SCREEN MULTIPLAYER (Recommended first — zero infra)

- Two cars in the **same 3D scene**, same road, fixed lanes (`-3.3` and `+3.3`), no traffic.
- **Split-screen viewport:** split `#game-viewport` into two halves; render the same scene with **two cameras and two renderers** (one per player). This is the cleanest for a cockpit game. Reuse all scene-building code; only cameras/renderers differ.
- **Inputs (choose one scheme):**
  - P1 = left hand (or WASD), P2 = right hand (or Arrow keys). MediaPipe already returns handedness — split by handedness.
  - Or simpler: P1 keyboard (W/A/D), P2 keyboard (Arrow keys) — deterministic and playable with one webcam unavailable.
- **Race logic:** first across the finish distance wins (no 90s timer, or keep it and compare distance). Show live HUD delta "P1 +120m" and a 1st/2nd result screen.
- **Collision between players:** optional off — they're in separate lanes, so it's a pure drag race.

#### C2. ONLINE MULTIPLAYER (Future / stretch — needs a network layer)

- No backend exists. Two viable paths on a static Vercel host:
  1. **WebRTC + PeerJS** (free public signaling) — host creates a room code, friend joins. Game is deterministic (same seeded tunnel), so **only car positions sync** over a DataChannel at ~30 Hz with interpolation on the receiving side. No authoritative server needed.
  2. **Lightweight backend** (e.g., a tiny Node server or Firebase Realtime DB) — simpler to reason about, but adds infrastructure.
- Same rule: **no traffic** — only the two player cars on the road.
- Keep the network layer behind a `MultiplayerNet` interface so C1 (local) and C2 (online) share the same game-mode code.

---

## 4. Architecture Changes Needed

### 4.1 Introduce a `GameMode` concept (`src/game/Game.ts`)

```ts
export type GameMode = 'continuous' | 'obstacle' | 'multiplayer';
```

- `Game` constructor takes `{ mode, playerCount }`.
- Branch points gated by mode:
  - `obstacle` → current behavior (spawn cars, 90s timer, collision death).
  - `continuous` → no spawn, ghost replay, distance scoring, no-hands timeout.
  - `multiplayer` → no spawn, per-player steering, split render, finish-distance win.

### 4.2 Refactor `main.ts` (UI)

- Replace the single `PLAY` button on the landing with **three mode buttons** (CONTINUOUS / OBSTACLE / MULTIPLAYER) + Settings + How-to.
- Add a tiny mode state variable; pass it when constructing/resetting `Game`.
- For multiplayer local: create a second camera/renderer and route P1/P2 inputs into `game.setPlayerInput(0|1, ...)`.
- Results overlay becomes mode-aware (score for A/B, 1st/2nd for C).

### 4.3 New modules

```
src/
├── game/
│   ├── Game.ts          (refactor: mode-aware)
│   ├── GhostRecorder.ts (record/replay player runs)   [MODE A]
│   └── MultiplayerNet.ts(interface + local + WebRTC impls) [MODE C]
├── ui/
│   └── ModeSelect.ts    (renders + wires the 3-button menu) [optional split]
└── main.ts              (orchestrates modes)
```

### 4.4 Persistence

- `localStorage` keys: `vs.bestContinuous`, `vs.bestObstacle`, `vs.bestMultiplayer` (and ghost run samples for continuous).

### 4.5 HUD additions

- Continuous: distance + ghost delta readout.
- Multiplayer: split HUD per player, "P1/P2" labels, finish position.

---

## 5. Implementation Plan (Phased, each phase shippable)

| Phase  | Scope                                                                                             | Deliverable                                | Est. effort        |
| ------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------ |
| **P0** | Refactor menu: landing → 3 mode buttons; add `GameMode` type; wire current game behind "OBSTACLE" | Mode-select page + obstacle mode unchanged | 0.5 day            |
| **P1** | **Continuous mode**: ghost recorder + replay, no traffic, distance scoring, localStorage best     | Working "you vs you" mode                  | 1–2 days           |
| **P2** | **Local multiplayer**: split-screen render, per-player input, finish-distance win, no traffic     | Same-screen 2-player race                  | 2–3 days           |
| **P3** | Mode-aware results, best-score display, pause menu (Resume/Restart/Settings/Quit), polish         | Polished UX per skill docs                 | 1 day              |
| **P4** | **Online multiplayer** (WebRTC/PeerJS room code, position sync + interpolation)                   | Play-with-a-friend over internet           | 3–5 days (stretch) |

**Recommended order:** P0 → P1 → P2 → P3 → P4. Each phase ends with a build + manual playtest.

---

## 6. Risks & Mitigations

| Risk                                                           | Mitigation                                                                                     |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Hand tracking splits (which hand = which player) is unreliable | Make hand-vs-keyboard assignment a toggle; keyboard is always a fallback                       |
| Split-screen halves performance                                | Reduce pixel ratio per viewport, disable shadows on mobile, keep low-poly scene                |
| Ghost run data grows large                                     | Sample at 20 Hz, round to 2 decimals, cap at ~10 min                                           |
| Online sync jitter                                             | Send only (x,z,yaw) per player at 30 Hz + client-side interpolation; deterministic tunnel seed |
| 90s timer conflicts with endless/continuous                    | Gate timer & lap HUD behind mode flag                                                          |
| Big `main.ts` becomes hard to manage                           | Extract `ModeSelect.ts` + `ResultsOverlay.ts` UI modules                                       |

---

## 7. Verification Checklist (for ChatGPT to verify each stage)

1. **Build passes:** `npm run build` (tsc strict + vite) with zero errors.
2. **Dev server:** `npm run dev` → landing shows 3 mode buttons, no console errors.
3. **Obstacle mode:** behaves identically to today (traffic, 90s, collision, score).
4. **Continuous mode:** no traffic spawns; ghost of previous best appears and races you; best distance persists after reload.
5. **Local multiplayer:** two cars on the same road, no traffic between them; P1 input doesn't steer P2 and vice-versa; clear 1st/2nd result.
6. **Back navigation:** BACK / MAIN MENU / CHANGE MODE always returns to the mode-select menu (single consistent back action).
7. **Pause:** Resume is pre-selected; Restart/Settings/Quit behave.
8. **Mobile/touch:** touch controls still work; split-screen degrades gracefully (or disables with a notice).
9. **Performance:** stays ≥ 40 fps on a mid phone in all three modes.
10. **No regressions:** HUD, audio, camera permission flow, results screen still work in obstacle mode.

---

## 8. Files Expected to Change (Summary)

| File                         | Change                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------- |
| `index.html`                 | Landing → mode-select buttons; multiplayer HUD containers                         |
| `src/main.ts`                | Mode state, per-mode wiring, split-screen, results logic                          |
| `src/game/Game.ts`           | `GameMode`, no-traffic/no-timer branches, distance & ghost hooks, 2-camera render |
| `src/game/GhostRecorder.ts`  | **new** — record/replay best run                                                  |
| `src/game/MultiplayerNet.ts` | **new** — local + WebRTC transport abstraction                                    |
| `src/style.css`              | Mode menu styles, split-screen layout, multiplayer HUD                            |
| `src/input/HandTracker.ts`   | Expose per-hand steering (P1/P2) for local multiplayer                            |
| `src/input/Keyboard.ts`      | Split key sets (WASD vs arrows)                                                   |

---

_This plan turns the single-mode game into a proper racing hub (mode-select → 3 distinct game modes) while reusing ~90% of the existing Three.js engine._
