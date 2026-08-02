# REPORT 1 — Current Game Structure & How It Works

> Complete codebase scan of **Virtual Steering** — what the code contains, how the game runs, and how to play it today.

---

## 1. What This Project Is

**Virtual Steering** is a browser-based, hand-gesture **3D racing game**. You drive a car through a procedurally generated neon cyberpunk tunnel by moving your hands in front of the webcam. It also supports keyboard, touch, and phone gyroscope as fallback inputs.

- **Main game:** `src/` — TypeScript + Three.js + MediaPipe Hands (the real game).
- **Side project:** `public/kart-racing/` — a separate, simpler 2D top-down kart game (Canvas 2D) that was bundled along for reference/extra content. It is NOT part of the main game loop.

---

## 2. Tech Stack

| Layer         | Technology                                                                            |
| ------------- | ------------------------------------------------------------------------------------- |
| Language      | TypeScript 5 (strict mode), ES2020 target                                             |
| 3D Engine     | Three.js r170 (`three` npm package)                                                   |
| Hand Tracking | MediaPipe Hands + Camera Utils (CDN scripts in `index.html`)                          |
| Build Tool    | Vite 6 (`vite.config.ts`, dev port 3000)                                              |
| Styling       | Single CSS file `src/style.css` (1346 lines, custom design system with CSS variables) |
| Audio         | Web Audio API (no assets — synthesized engine + collision sounds)                     |
| Backend       | None — pure static frontend, deployed on Vercel                                       |

### Dependencies (`package.json`)

```json
dependencies:   three ^0.170.0
devDependencies: @types/three, typescript, vite
```

### Available Scripts

```bash
npm run dev       # vite dev server (port 3000, auto-opens)
npm run build     # tsc type-check + vite production build → dist/
npm run preview   # preview the production build
```

---

## 3. Project Structure (Scanned)

```
Virtual-Steering/
├── index.html                        # Full UI markup: landing, panels, HUD, overlays
├── package.json / tsconfig.json / vite.config.ts / vercel.json
├── src/
│   ├── main.ts                       # Entry point: UI wiring, menu flow, game loop (989 lines)
│   ├── style.css                     # All design system + UI styles (1346 lines)
│   ├── game/
│   │   └── Game.ts                   # Three.js scene, physics, steering, collision, spawning (755 lines)
│   ├── input/
│   │   ├── HandTracker.ts            # MediaPipe wrapper, palm-center, EMA smoothing (150 lines)
│   │   └── Keyboard.ts               # WASD/arrow key handler (65 lines)
│   └── utils/
│       └── smoothing.ts              # Generic EMA smooth filter (16 lines)
├── public/
│   └── kart-racing/                  # SEPARATE 2D kart game (own HTML + 5 JS files)
│       ├── index.html  style.css
│       └── js/  cars.js tracks.js ai.js ui.js game.js
├── GAME UI:UX SKILL/                 # Design reference docs (menu flow, HUD design, etc.)
└── dist/                             # Built output (gitignored? no — checked in, stale)
```

---

## 4. How the Game Runs — Architecture Walkthrough

### 4.1 Startup (`src/main.ts`)

1. `init()` creates a single `Game` instance bound to the `<canvas id="game">`.
2. It wires up: `KeyboardHandler`, sensitivity slider, touch controls, gyroscope init, and audio-on-first-interaction.
3. Creates a `HandTracker` bound to the `<video id="webcam">` and `await tracker.start()` — **camera permission is requested immediately on load**.
4. Starts the infinite `gameLoop()` via `requestAnimationFrame`.

### 4.2 The Game Loop (main.ts:482)

Each frame:

1. Update FPS counter.
2. Apply input layers in priority order: **Touch → Gyroscope → Keyboard → Hand tracking (base)**.
3. Call `game.update()` → `game.render()` (Three.js).
4. Read `game.getState()` and refresh HUD (position, lap, time, score, speed, gear).
5. Draw juice: speed lines, vignette, collision flash, engine sound.

### 4.3 The 3D World (`src/game/Game.ts`)

- **Tunnel:** 18 procedurally-built segments (`buildSeg`, `buildSegments`) that loop infinitely by shifting `z` — neon strips, ceiling lights, lane dashes, barriers. Constant forward motion illusion.
- **Road:** 3 lanes at `LANE_X = [-3.3, 0, 3.3]`, road width 10.
- **Cockpit:** first-person hood, dashboard, steering wheel, mirrors (drawn on a tiny canvas), attached to the camera.
- **Obstacles:** AI "traffic" cars (`spawnCar`) — box cars with emissive bodies, headlights, tail lights, random colors, placed in lanes. Max 10.
- **Lighting:** ambient, hemisphere, 2 spot headlights, 1 directional (deliberately kept light for performance).
- **Particles:** speed dust streaks.

### 4.4 Data Flow (steering)

```
Webcam → MediaPipe Hands → palm-center (avg of wrist + index MCP + middle MCP)
        → EMA smoothing (HandTracker.smoothedX)
        → setHandData(centerX, handsDetected)
        → Game.update() maps to steering: non-linear curve + dead zone → smoothSteer filter
        → cameraX → camera position + cockpit + headlights move
```

### 4.5 Game State & Rules (Game.ts)

- **`start()`** resets score/speed/timer, clears obstacles, spawns 3 initial cars.
- **Acceleration:** only if `handsDetected >= 2` (or auto-accelerate / keyboard). Speed ramps to `maxSpeed = 2.0 + difficulty*2.5`.
- **Scoring:** `score += speed * 2 * dt` while accelerating.
- **Timer:** `RACE_DURATION = 90` seconds → `raceTime >= 90` ⇒ **game over**.
- **Laps:** 2 laps tracked via `lap` (though the tunnel is endless/linear, laps increment by time).
- **Position:** derived from `obstacles.length` (rough heuristic), max `totalCars = 6`.
- **Collision:** if `|cameraX - car.x| < 1.5 && |car.z| < 2.5` ⇒ **game over immediately** + screen shake + collision flash + FOV kick.
- **Difficulty:** ramps over time — faster max speed and faster obstacle spawn interval.

### 4.6 HUD Elements (index.html + main.ts updateGameHUD)

Position (e.g. `2/6`), Lap (`1/2`), Race timer (top-center ring), Score, Speed (digital + analog arc gauge), Gear, track name.

---

## 5. Screens & Menu Flow (Current)

```
landing (title screen)
   ├─ PLAY           → countdown → race starts (auto-accelerate ON)
   ├─ SETTINGS       → settings overlay (sensitivity, auto-accel)
   └─ HOW TO PLAY    → how-to overlay
nav-title click      → back to landing

menu-overlay (in-game main menu)   [visible after landing PLAY? no — landing.play jumps straight to countdown]
   ├─ START RACE     → countdown → race
   ├─ HOW TO PLAY    → how-to overlay
   └─ SETTINGS       → settings overlay

game-over overlay (results)
   ├─ RACE AGAIN     → countdown → restart
   └─ MAIN MENU      → landing
```

Key wiring in `main.ts`: `landingPlay`, `menuStart`, `resultsRetry`, `resultsMenu`, `navTitle`, plus `showMenu(screen)` helper and overlay show/hide logic inside `gameLoop()`.

---

## 6. Input Systems

| Input         | How it works                                                                                 | State location                         |
| ------------- | -------------------------------------------------------------------------------------------- | -------------------------------------- |
| **Hands**     | 2 hands detected ⇒ accelerate; average palm-center X ⇒ steer (mirrored); 1 hand ⇒ steer only | `HandTracker.onResults` → `onHandData` |
| **Keyboard**  | W/↑ gas, A/← left, D/→ right, U auto-accel                                                   | `KeyboardHandler` → `onKeys`           |
| **Touch**     | On-screen LEFT/RIGHT/GAS/AUTO buttons                                                        | `setupTouchControls`                   |
| **Gyroscope** | Double-tap mode label ⇒ gyro steering on mobile                                              | `deviceOrientationInit`                |

**Input priority (main.ts:493):** touch > gyro > keyboard > hands (hands always feed steering as a base).

---

## 7. How to Play (Current Rules)

1. Open the game (Vite dev server or Vercel), **allow camera**.
2. Show **both hands** to the camera to accelerate; move both hands left/right to steer. Or use `W A D`.
3. Dodge incoming **traffic cars** in the tunnel. A hit ends the race.
4. Race lasts **90 seconds**; keep dodging and staying fast to maximize **score**.
5. Race ends when the timer runs out or you crash → see final score → Race Again / Main Menu.

---

## 8. The Separate `kart-racing` Game (Not the Main Game)

`public/kart-racing/` is an independent 2D Canvas kart racer: car select (5 cars with stats), track select (looping waypoint tracks with zones: boost/hazard/ice/spin), 3 AI opponents with rubber-banding (`ai.js`), lap/checkpoint system, minimap, pause. It is linked from the nav bar (`/kart-racing/`). It is vanilla JS, no build step. **It is the strongest reference for "racing vs. opponents" mechanics** (waypoint following, position ranking, laps) that the new multiplayer/continuous modes can borrow conceptually.

---

## 9. Deployment & Config

- `vercel.json`: build `npm run build`, output `dist/`, framework vite.
- Hand tracking needs **HTTPS** (or localhost) for camera permission.
- `dist/` is committed but stale (last built before recent fixes).

---

## 10. Summary — What Exists vs. What's Missing

| Capability                                               | Status                                            |
| -------------------------------------------------------- | ------------------------------------------------- |
| Single endless tunnel race, hand/kybd/touch/gyro input   | ✅ Working                                        |
| Obstacle traffic to dodge, score, 90s timer, collisions  | ✅ Working (this is the future **Obstacle Mode**) |
| Landing page + settings + how-to + results               | ✅ Working                                        |
| Racing **against opponents / a ghost / a second player** | ❌ Not present                                    |
| Mode selection (Continuous / Obstacle / Multiplayer)     | ❌ Not present                                    |
| Any networking / online multiplayer                      | ❌ Not present                                    |
| Pause menu during race                                   | ❌ Not present                                    |
| Best-score persistence (localStorage)                    | ❌ Not present                                    |

---

_Prepared from a full scan of `src/`, `index.html`, `public/kart-racing/`, configs, and git history._
