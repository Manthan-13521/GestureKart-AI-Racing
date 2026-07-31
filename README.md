<div align="center">

<img src="https://img.shields.io/badge/Gesture_Kart-v2.0-22d3ee?style=for-the-badge&labelColor=09090B&logo=gamepad&logoColor=22d3ee" alt="GestureKart" height="32"/>

<h1>
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/car.svg" width="28" style="vertical-align:middle;" />
  &nbsp;GestureKart AI Racing
</h1>

<p><strong>AI Gesture-Controlled Racing — Steer With Your Hands, No Controller Needed</strong></p>

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
  <a href="#-games-included">Games</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-how-it-works">How It Works</a> ·
  <a href="#-system-architecture">Architecture</a> ·
  <a href="#-tech-stack">Tech Stack</a> ·
  <a href="#-getting-started">Getting Started</a>
</p>

</div>

---

**GestureKart AI Racing** is a browser racing experience with a twist: **your hands are the steering wheel**. Two games in one — a 3D night-drive racing sim controlled entirely by webcam hand gestures, plus a classic arcade Kart Racing mode. Built with **Three.js** for 3D rendering and **MediaPipe Hands** for real-time hand tracking.

Race through a neon-lit cyberpunk tunnel at 60 FPS — or fall back to keyboard, touch, or even phone gyroscope controls on any device.

---

## 🏎️ Games Included

| Mode | Description | Controls |
|------|-------------|----------|
| **Virtual Steering** | 3D first-person racer through a neon tunnel with HUD, speed gauge, gearbox, and obstacle traffic | Hands (webcam) · Keyboard · Touch |
| **Kart Racing** | Fast-paced arcade kart racer with its own menu, tracks, and gameplay loop | Keyboard · Touch |

---

## ✨ Features

### 🖐️ Hand-Gesture Steering (Flagship)
- **Drive with both hands** — car accelerates when both hands are detected; palms mapped to steering angle
- **Smooth tracking** — exponential landmark smoothing + dead zone + non-linear steering curve for natural feel
- **Live camera panel** — see your hand skeleton overlay while you play

### 🎮 Multi-Input System
- **Keyboard** — `W` gas · `A`/`D` steer · `U` auto-accelerate
- **Touch controls** — on-screen buttons for mobile play
- **Gyroscope mode** — tilt your phone to steer
- **Auto-accelerate** — toggle for hands-free gas

### 🎨 Game Systems
- **3D cockpit** — dashboard, gauges, steering wheel with real-time rotation, mirrors, windshield
- **Obstacle traffic** — AI cars to dodge; collisions end the race with screen shake
- **Race timer & score** — 90-second race, lap tracking, position, and final results screen
- **Procedural engine audio** — Web Audio API synth engine sound scaled to speed
- **Speed lines & vignette** — dynamic juice effects at high velocity
- **Sensitivity calibration** — adjustable steering sensitivity and smoothing

---

## 🕹️ How It Works

```mermaid
flowchart LR
    A[Webcam] --> B[MediaPipe Hands]
    B --> C[Palm Center Extraction]
    C --> D[Smoothing Filter]
    D --> E[Steering Mapping]
    E --> F[3D Camera & Car]
    F --> G[Collision / Score / HUD]

    H[Keyboard] --> D
    I[Touch] --> D
    J[Gyroscope] --> D
```

1. MediaPipe extracts 21 hand landmarks per frame (up to 2 hands)
2. The palm center (wrist + index + middle MCP) is mapped to a 0–1 steering axis
3. Exponential smoothing removes jitter; a dead zone prevents drift
4. The steering axis drives the 3D camera, cockpit, and headlights in Three.js

---

## 🏗️ System Architecture

```
src/
├── main.ts                 # Entry point: UI, menu flow, game loop
├── game/
│   └── Game.ts             # Three.js scene, physics, collisions, HUD state
├── input/
│   ├── HandTracker.ts      # MediaPipe hand pipeline + steering mapping
│   └── Keyboard.ts         # Keyboard state handler
├── utils/
│   └── smoothing.ts        # Exponential moving-average filter
└── style.css               # Full UI styling (HUD, panels, overlays)

public/
└── kart-racing/            # Kart Racing arcade game (standalone page)
```

**Design principles:** the hand tracker is input-agnostic — keyboard, touch, and gyro overrides plug into the same steering pipeline.

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript |
| 3D Rendering | Three.js · WebGL |
| Vision AI | MediaPipe Hands |
| Build | Vite |
| Audio | Web Audio API (procedural) |
| Deployment | Vercel |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A webcam (for hand tracking)

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

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview the production build |

---

## 🔭 Roadmap

- [ ] Multi-track selection & lap racing
- [ ] Leaderboards (local + online)
- [ ] Gesture calibration screen
- [ ] Two-hand asymmetric steering (gas + steer)
- [ ] Mobile PWA install support

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

<a href="https://car--raceing.vercel.app">🏎️ Play GestureKart</a>

</div>
