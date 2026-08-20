<div align="center">

<img src="https://img.shields.io/badge/Virtual_Steering-v1.0-22d3ee?style=for-the-badge&labelColor=09090B&logo=gamepad&logoColor=22d3ee" alt="Virtual Steering" height="32"/>

<h1>
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/car.svg" width="28" style="vertical-align:middle;" />
  &nbsp;Virtual Steering
</h1>

<p><strong>AAA Gesture-Controlled Racing — The world's first browser-based gesture racing experience</strong></p>

<p>
  <a href="https://car--raceing.vercel.app">
    <img src="https://img.shields.io/badge/🚀_Live_Demo-car--raceing.vercel.app-22d3ee?style=for-the-badge&labelColor=09090B" alt="Live Demo"/>
  </a>
</p>

<p>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=1a1a2e" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Three.js-0.170-000000?style=for-the-badge&logo=threedotjs&logoColor=white&labelColor=0f172a" alt="Three.js"/>
  <img src="https://img.shields.io/badge/MediaPipe-Hands-FF6D00?style=for-the-badge&labelColor=09090B" alt="MediaPipe Hands"/>
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white&labelColor=1a1a2e" alt="Vite"/>
  <img src="https://img.shields.io/badge/WebGL-✅-990024?style=for-the-badge&labelColor=09090B" alt="WebGL"/>
</p>

<p>
  <img src="https://img.shields.io/github/last-commit/Manthan-13521/GestureKart-AI-Racing?style=flat-square&color=22d3ee&labelColor=09090B&label=Last+Commit" alt="Last Commit"/>
  <img src="https://img.shields.io/github/repo-size/Manthan-13521/GestureKart-AI-Racing?style=flat-square&color=6366f1&labelColor=09090B&label=Repo+Size" alt="Repo Size"/>
  <img src="https://img.shields.io/badge/AI_Powered-Computer_Vision-22d3ee?style=flat-square&labelColor=09090B" alt="AI Powered"/>
  <img src="https://img.shields.io/badge/Open_Source-Community-4ade80?style=flat-square&labelColor=09090B" alt="Open Source"/>
</p>

<br/>

<p>
  <a href="#-game-modes">Game Modes</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-how-it-works">How It Works</a> ·
  <a href="#-system-architecture">Architecture</a> ·
  <a href="#-tech-stack">Tech Stack</a> ·
  <a href="#-getting-started">Getting Started</a>
</p>

</div>

---

**Virtual Steering** is a premium browser racing experience with a signature innovation: **your hands are the steering wheel** in Endless Survival mode. One cohesive game — not four — with a unified flow: **PLAY → SELECT TRACK → SELECT MODE → RACE**.

Race through three premium tracks (Cyber City, Mountain Highway, Space Highway) with dynamic weather, at 60 FPS on desktop and adaptive quality on mobile. Fall back to keyboard, touch, gyroscope, or phone-as-controller on any device.

---

## 🏎️ Game Modes

| Mode                        | Description                                                                      | Controls                            | Track                                         |
| --------------------------- | -------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------- |
| **Endless Survival**        | Flagship gesture mode — dodge traffic, chain combos, survive as long as possible | ✋ **Gesture (MediaPipe Hands)**    | Cyber City / Mountain Highway / Space Highway |
| **AI Race**                 | Competitive racing vs 5 named AI personalities with adaptive difficulty          | ⌨️ Keyboard / 🎮 Gamepad            | All 3 tracks (3 races per tournament)         |
| **You vs You** (Time Trial) | Race against your own best ghost — delta timer, sector splits                    | ⌨️ Keyboard / 🎮 Gamepad            | All 3 tracks                                  |
| **Multiplayer**             | Up to 4 players online via WebRTC (PeerJS public cloud)                          | ⌨️ Keyboard / 🎮 Gamepad / 👆 Touch | Endless Survival (no traffic)                 |
| **Tournament**              | Division ladder (Rookie → Pro → Elite → Champion), 3 races per division          | ⌨️ Keyboard / 🎮 Gamepad            | All 3 tracks                                  |

**Control method is communicated on the Mode Select screen** — Endless Survival shows ✋ Gesture, others show ⌨️ Keyboard / 🎮 Gamepad.

---

## ✨ Features

### 🖐️ Hand-Gesture Steering (Flagship — Endless Survival Only)

- **Drive with both hands** — car accelerates when both hands detected; palm centers mapped to steering angle
- **Smooth tracking** — exponential landmark smoothing + dead zone + non-linear steering curve for natural feel
- **Live camera panel** — see your hand skeleton overlay while you play
- **Interactive calibration** — capture neutral center, dead zone, and EMA smoothing in Settings → Accessibility

### 🎮 Multi-Input System (All Other Modes)

- **Keyboard** — `W` gas · `A`/`D` steer · `U` auto-accelerate toggle
- **Touch controls** — on-screen buttons with one-hand mode (steering + throttle on one side)
- **Gyroscope mode** — tilt your phone/laptop to steer
- **Phone as controller** — scan QR, pair via PeerJS, use device orientation
- **Gamepad** — standard Gamepad API support (where browser supports it)
- **Unified InputFrame contract** — priority resolution: Replay → Phone → Auto → Gyro → Base (hand/keyboard/touch)

### 🎨 Game Systems

- **3 Premium Tracks** — Cyber City (neon/rain), Mountain Highway (fog/sunrise), Space Highway (stars/nebula)
- **Dynamic Weather** — per-track state machines (Clear → Fog → Rain → Storm), seeded for replay consistency
- **3D Cockpit HUD** — speed gauge, gear indicator, position/lap, score, combo ring, boost bar, draft meter
- **AI Opponents** — 6 personalities (Blaze, Shield, Vector, Risky, Chameleon, Comet) with 7-parameter deterministic model, 5 difficulty tiers, adaptive Chameleon
- **Tournament Ladder** — 4 divisions, 3 races each, promotion on top-3 average, division-scaled rewards
- **Race Result Gate** — idempotent completion (dedupes by raceId), zero progression from replays
- **Procedural Engine Audio** — Web Audio API synth scaled to speed, adaptive music stems (menu −6dB, race layers)
- **Speed Lines & Vignette** — dynamic juice effects at high velocity
- **Collision Juice** — hit-stop + slow-mo crash sequence, screen shake

### 📊 Progression & Cosmetics

- **Coins & XP** — earned every race (even losses), flat 1000 XP/level
- **Cosmetic Catalog** — car skins, neon trails, driver titles (visual-only, no stat impact)
- **High Scores** — local per track/mode, sanitized storage, XSS-hardened
- **Driver Profile** — level, XP, equipped cosmetics, completed races

### 🎬 Replay & Photo Mode

- **Deterministic Replay** — fixed 30Hz InputFrame recording, binary codec, seeded RNG
- **Ghost Racing** — holographic ghost car (45% transparent cyan, light trail), delta timer (green/red), 3 sector splits
- **Replay Viewer** — 4 camera modes (Chase, Orbit, Cinematic, Free), slow-mo (toggle + hold-Shift), Depth of Field (FOCUS slider)
- **Photo Mode** — screenshot capture with baked filters (grain, contrast, focus), Web Share API + download fallback
- **Session-Only Persistence** — replays never leave the session (by design)

### ♿ Accessibility (Complete Surface)

- **Colorblind Presets** — Deuteranopia / Protanopia / Tritanopia (CSS token overrides)
- **One-Hand Mode** — steering + throttle composed on single touch side
- **Reduced Motion** — disables camera fly-through, screen shake, particles, shortens cinematic intros
- **High Contrast HUD Theme** — CSS token overrides
- **Hold-to-Confirm** — destructive actions (Quit, Leave Lobby) require hold
- **Touch Targets ≥ 48px** — WCAG 2.1 AA compliant

### ⚡ Performance (Adaptive)

- **Quality Tiers** — Performance (1.0×, no post/shadows/weather), Balanced (1.5×, light bloom), Quality (2.0×, full effects)
- **Auto-Tier Selection** — device-based initial tier
- **Dynamic Resolution** — rolling 2s frame budget: sustained >18ms → step down ×0.8, <16ms → recover, floor 0.6×
- **GPU Resource Lifecycle** — full disposal of geometries/materials on object removal
- **Menu Render Gating** — game renders only during race phases (idle menus skip GPU)

---

## 🕹️ How It Works

```mermaid
flowchart LR
    A[Webcam] --> B[MediaPipe Hands]
    B --> C[Palm Center Extraction]
    C --> D[Smoothing Filter (EMA + Dead Zone)]
    D --> E[Steering Mapping]
    E --> F[InputFrame (Unified Contract)]
    F --> G[InputManager (Priority Resolution)]
    G --> H[Game Simulation]
    H --> I[Three.js Rendering]
    I --> J[HUD / Feedback / Audio]

    K[Keyboard] --> F
    L[Touch] --> F
    M[Gyroscope] --> F
    N[Phone Controller] --> F
    O[Gamepad] --> F
    P[Replay Playback] -.->|Highest Priority| F
```

1. **MediaPipe** extracts 21 hand landmarks per frame (up to 2 hands)
2. **Palm center** (wrist + index MCP + middle MCP) mapped to 0–1 steering axis
3. **Exponential smoothing** removes jitter; **dead zone** prevents drift
4. **InputFrame** normalized (steering ∈ [−1,1], throttle ∈ [0,1], brake ∈ [0,1])
5. **InputManager** resolves priority layers — Replay > Phone > Auto > Gyro > Base
6. **Game simulation** runs at 60Hz, Three.js renders, HUD/audio update

---

## 🏗️ System Architecture

```
src/
├── main.ts                    # Game bootstrap, game loop, state machine wiring
├── game/
│   ├── Game.ts                # Main simulation (road, obstacles, physics, rendering)
│   ├── GameModeConfig.ts      # Declarative mode/track config (4 modes, 3 tracks)
│   ├── RaceDirector.ts        # Race standings, timing, lap counting
│   ├── TournamentManager.ts   # Division ladder (Rookie→Pro→Elite→Champion)
│   └── p4/                    # Survival mechanics (boost, combo, near-miss, collision juice)
├── ai/                        # AI Race subsystem
│   ├── AICar.ts               # Individual AI car (perception→decision→action)
│   ├── AIPersonality.ts       # Personality profiles + Chameleon adapter
│   ├── AIRuntime.ts           # Race orchestrator (grid, tick loop, HUD telemetry)
│   └── CatchUp.ts             # Rubber-band catch-up logic
├── input/                     # Unified input system
│   ├── HandTracker.ts         # MediaPipe Hands pipeline
│   ├── GestureCalibration.ts  # Neutral center + dead-zone + EMA
│   ├── InputFrame.ts          # Normalized input contract
│   ├── InputManager.ts        # Priority resolution (replay→phone→auto→gyro→base)
│   └── sources/               # Adapters: Hand, Keyboard, Touch, Gyro, Phone
├── replay/                    # Replay + Ghost system
│   ├── recorder.ts            # Fixed 30Hz race state recording
│   ├── player.ts              # Deterministic playback
│   ├── ghost.ts               # Holographic ghost renderer
│   ├── hud.ts                 # Ghost duel HUD (delta, sectors)
│   ├── viewer.ts              # Free camera + slow-mo + DoF
│   └── store.ts               # IndexedDB best-replay storage
├── progression/               # XP/coins, cosmetic catalog, rewards, completion gate
├── network/                   # PeerJS multiplayer (lobby, WebRTC mesh, remote ghosts)
├── graphics/                  # PostProcessor (bloom/DoF/grain), WeatherSystem, ParticlePool
├── managers/                  # Singletons: Audio, Profile, Quality, Save, Scene, UI
├── screens/                   # All 11 screens + navigation flow
├── ui/                        # Component library + core systems (focus, nav, transitions, theming)
└── core/                      # Architecture spine: StateMachine, NavigationSystem, EventBus, RaceStartPipeline
```

**Design Principles:**

- **Single authoritative flow** — NavigationSystem owns all screen transitions
- **Replay at input boundary** — ReplayInputSource has highest priority, zero progression
- **Determinism by default** — seeded RNG for AI, weather, traffic, replay
- **Cosmetics are visual-only** — ContentCatalog is sole authority, no stat-bearing items

---

## 🧰 Tech Stack

| Layer        | Technology                                          |
| ------------ | --------------------------------------------------- |
| Language     | TypeScript 5 (strict)                               |
| 3D Rendering | Three.js 0.170 · WebGL 2                            |
| Vision AI    | MediaPipe Hands (CDN)                               |
| Build        | Vite 6                                              |
| Audio        | Web Audio API (procedural synthesis)                |
| Multiplayer  | PeerJS 1.5 (WebRTC mesh, public cloud signaling)    |
| Testing      | Vitest (unit), Playwright (E2E: Chromium + Pixel 5) |
| Lint/Format  | ESLint + TypeScript-Eslint + Prettier               |
| CI           | GitHub Actions (typecheck, lint, test, build)       |
| Deployment   | Vercel (static + SPA fallback)                      |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A webcam (for Endless Survival gesture mode)
- HTTPS or localhost (required for camera access)

### Installation

```bash
# 1. Clone & install
git clone https://github.com/Manthan-13521/GestureKart-AI-Racing.git
cd GestureKart-AI-Racing
npm install

# 2. Run the dev server
npm run dev

# 3. Open the game
# http://localhost:5173
```

### Scripts

| Script                  | Description                               |
| ----------------------- | ----------------------------------------- |
| `npm run dev`           | Start Vite dev server                     |
| `npm run build`         | Type-check + production build (`dist/`)   |
| `npm run preview`       | Preview production build locally          |
| `npm run typecheck`     | TypeScript compile check (`tsc --noEmit`) |
| `npm run lint`          | ESLint check                              |
| `npm run format`        | Prettier write                            |
| `npm run format:check`  | Prettier check                            |
| `npm run test`          | Vitest watch mode                         |
| `npm run test:coverage` | Vitest run with coverage                  |

---

## 🧪 Testing

```bash
# Unit tests (626 tests, 46 files)
npm run test -- --run

# E2E tests (Chromium + Mobile Pixel 5)
# Requires dev server running: npm run dev
npx playwright test

# E2E against production preview
npm run build && npm run preview
# In another terminal: npx playwright test -c playwright.prod.config.ts
```

---

## 📦 Deployment

**Vercel (recommended):**

1. Connect GitHub repo
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy — SPA fallback handles client-side routing

The build produces:

- `dist/index.html` — Main game (Virtual Steering)
- `dist/phone-controller.html` — Phone-as-controller page
- `dist/kart-racing/` — Legacy arcade kart racing game (standalone)

**No environment variables required** — all external services (MediaPipe, PeerJS, Google Fonts) use public CDNs.

---

## 🔒 Security & Privacy

- **No server, no database** — pure static frontend
- **Camera access** — only for MediaPipe hand landmarks; frames never leave the browser
- **PeerJS** — uses public signaling server; WebRTC is encrypted; no identity stored
- **localStorage/IndexedDB** — settings, high scores, profile, replays (all local)
- **XSS hardening** — sanitized storage boundaries + HTML escaping at render
- **No secrets, no API keys, no tokens** in the codebase

---

## 📊 Test & Quality Status

| Gate                    | Status                   |
| ----------------------- | ------------------------ |
| TypeScript compile      | ✅ PASS                  |
| ESLint                  | ✅ PASS                  |
| Prettier                | ✅ PASS                  |
| Production build        | ✅ PASS                  |
| Unit tests              | ✅ 626 passed (46 files) |
| E2E Chromium            | ✅ 14 passed / 6 skipped |
| E2E Mobile (Pixel 5)    | ✅ 13 passed / 7 skipped |
| Production browser test | ✅ Both projects green   |

---

## 🗺️ Roadmap (Post-Launch)

- [ ] Local multiplayer (split-screen, same device)
- [ ] Garage UI (turntable preview, cosmetic purchase flow)
- [ ] Achievements screen (badge grid, progress rings)
- [ ] Daily / Weekly challenges (return loops)
- [ ] Profile screen (level ring, XP bar, stats, best laps)
- [ ] Leaderboard screen (global/friends/track tabs)
- [ ] How to Play / Tutorial screen
- [ ] Friend ghost sync (cloud)
- [ ] Cloud leaderboards (serverless)
- [ ] SFU upgrade for larger multiplayer lobbies

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Fork the repo, make your change, and open a pull request.

---

## 📄 License

All rights reserved.

---

<div align="center">

**© 2026 Manthan Jaiswal** — Built with Three.js, MediaPipe & TypeScript.

<br/>

<a href="https://car--raceing.vercel.app">🏎️ Play Virtual Steering</a>

</div>
