<div align="center">

# 🏎️ Virtual Steering

**A browser-based hand-gesture racing game — drive by moving your hands in front of the webcam.**

Built with **Three.js** for 3D rendering and **MediaPipe Hands** for real-time hand tracking. Race through a neon-lit cyberpunk tunnel using nothing but your hands, keyboard, or touch.

[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Three.js](https://img.shields.io/badge/Three.js-r170-000000?logo=three.js&logoColor=white)](https://threejs.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-0097A7?logo=mediapipe&logoColor=white)](https://mediapipe.dev)
[![License](https://img.shields.io/badge/license-unspecified-lightgrey)](#-license)

[Features](#-features) •
[Tech Stack](#-tech-stack) •
[Getting Started](#-getting-started) •
[Scripts](#-available-scripts) •
[Controls](#-controls) •
[Deployment](#-deployment)

</div>

<br>

## ✨ Features

| | |
|---|---|
| ✋ **Hand Tracking** | Real-time steering with MediaPipe Hands — show both hands to accelerate, move left/right to steer |
| ⌨️ **Keyboard Controls** | Full keyboard fallback (`W` `A` `D` `U`) |
| 📱 **Touch & Gyroscope** | On-screen buttons + device orientation tilt steering on mobile |
| 🏎️ **3D Tunnel Racing** | Endless procedurally generated tunnel with neon strips, lane markings, and barrier lights |
| 🚗 **AI Traffic** | Procedurally spawned opponent cars with emissive bodies, headlights, and tail-light glow |
| 🎯 **Scoring & Timer** | 90-second race, position ranking, speed/score accumulation |
| 📊 **Full HUD** | Speed gauge (analog + digital), position, lap counter, countdown timer, score |
| 🎨 **Cockpit View** | First-person dashboard with steering wheel, hood, and green-glowing display |
| 🔊 **Engine Audio** | Web Audio API synthesized engine sound (pitch tracks speed) + collision sound |
| 🎬 **Juice Effects** | Speed lines, speed vignette, screen shake, collision flash, countdown animation |
| 📐 **Configurable Sensitivity** | Slider-adjustable steering responsiveness |
| 🔄 **Auto-Accelerate** | Toggle to keep the car moving automatically |
| 📱 **Responsive** | Adaptive layout across desktop, tablet, and mobile with touch controls |

<br>

## 🛠️ Tech Stack

<table>
<tr><td valign="top" width="50%">

### 🖥️ Frontend

- TypeScript 5 (strict)
- Three.js r170 (3D engine)
- MediaPipe Hands (hand tracking)
- MediaPipe Camera Utils
- Vite 6 (build tool)
- Web Audio API (sound)
- Device Orientation API (gyroscope)

</td><td valign="top" width="50%">

### ⚙️ Architecture

- Pure TypeScript — no framework
- ES2020 target
- Zustand-free: direct DOM + Three.js
- Exponential moving average smoothing
- Non-linear steering curve
- Module-based architecture (`game/`, `input/`, `utils/`)
- CSS custom properties design system

</td></tr>
</table>

<br>

## 📁 Project Structure

```
Virtual-Steering/
├── src/
│   ├── main.ts                 Entry point, UI, menu flow, game loop
│   ├── style.css               Full design system + all UI styles
│   ├── game/
│   │   └── Game.ts             Three.js scene, physics, steering, collision, spawning
│   ├── input/
│   │   ├── HandTracker.ts      MediaPipe wrapper, palm-center averaging, EMA smoothing
│   │   └── Keyboard.ts         Keyboard input handler
│   └── utils/
│       └── smoothing.ts        Generic EMA smooth filter
├── public/
│   └── kart-racing/            Additional content
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vercel.json                 Vercel deployment config
```

<br>

## 🚀 Getting Started

### Prerequisites

- Node.js `>= 18`
- A modern browser (Chrome, Edge, Firefox, Safari)
- WebRTC-compatible camera (for hand tracking)
- Camera permission must be granted

### Installation

```bash
git clone https://github.com/Manthan-13521/GestureKart-AI-Racing.git
cd Virtual-Steering
npm install
```

### Run in Development

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### Production Build

```bash
npm run build
npm run preview
```

<br>

## 📜 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript compile + Vite production build |
| `npm run preview` | Preview the production build locally |

<br>

## 🎮 Controls

### ✋ Hand Tracking (Primary)

| Gesture | Action |
|---|---|
| Show both hands | Car accelerates |
| Move both hands left | Steer left |
| Move both hands right | Steer right |
| Center both hands | Go straight |
| Hide hands | Car slows down |

> Palm-center (average of wrist + index MCP + middle MCP) is used instead of fingertips for stable, jitter-free tracking.

### ⌨️ Keyboard (Fallback)

| Key | Action |
|---|---|
| `W` / `Arrow Up` | Accelerate / Start race |
| `A` / `Arrow Left` | Steer left |
| `D` / `Arrow Right` | Steer right |
| `U` | Toggle auto-accelerate |

### 📱 Touch / Mobile

| Control | Action |
|---|---|
| On-screen left/right buttons | Steer |
| On-screen GAS button | Accelerate |
| On-screen AUTO button | Toggle auto-accelerate |
| Double-tap mode label | Switch between touch and gyroscope steering |

### Input Priority

1. Touch controls (if active)
2. Gyroscope (if enabled on mobile)
3. Keyboard
4. Hand tracking (always active as base layer)

<br>

## 🧠 Data Flow

```
Webcam → MediaPipe Hands → Palm-center landmarks (wrist + index MCP + middle MCP)
                              ↓
                        EMA Smoothing (adaptive)
                              ↓
                        Map to steering input (non-linear curve + dead zone)
                              ↓
                        Update camera + cockpit position
                              ↓
                        Move tunnel segments + obstacle cars
                              ↓
                        Render frame (Three.js)
                              ↓
                        Update HUD + juice effects
```

<br>

## 🎨 Visual & Audio Features

| Category | Details |
|---|---|
| **Tunnel** | Procedural 18-segment tunnel with neon wall strips, ceiling lights, lane markings, directional arrows |
| **Cockpit** | Low-poly hood, dashboard with green-glowing screen, steering wheel (rotates with input) |
| **Lighting** | Ambient, spot, hemisphere, and fill lights + ACES filmic tone mapping |
| **Fog** | Scene fog for depth perception (50–250 units) |
| **Headlights** | Two dynamic point lights that follow the steering position |
| **AI Cars** | Randomized colors, emissive bodies, tail lights with point-light glow, underbody glow |
| **Speed Lines** | Radial lines on overlay canvas, intensity scales with speed |
| **Vignette** | Radial gradient overlay that darkens edges at high speed |
| **Screen Shake** | Intensity-decaying camera shake on collision |
| **Collision Flash** | Red screen overlay with 450ms fade-out |
| **Countdown** | 3-2-1-GO with CSS scale animation |
| **Engine Sound** | Sawtooth oscillator via Web Audio API, frequency ramps with speed |
| **Collision Sound** | Square-wave burst |

<br>

## 🖥️ HUD Layout

```
┌──────────────────────────────────────────────────┐
│ [POS] 3/6         01:30              SCORE: 2840 │
│ [LAP] 1/2                                         │
│                                                   │
│                                                   │
│                                                   │
│                    NIGHT DRIVE                    │
│                                       ┌─────────┐ │
│                                       │  ╭──────╮│ │
│                                       │  │ 142  ││ │
│                                       │  ╰──────╯│ │
│                                       │  KM/H    │ │
│                                       └─────────┘ │
└──────────────────────────────────────────────────┘
```

<br>

## ☁️ Deployment

Configured for [Vercel](https://vercel.com) via `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

| | |
|---|---|
| **Platform** | Vercel (or any static host) |
| **Build** | `npm run build` outputs to `dist/` |
| **Requirements** | Camera permission (HTTPS required on mobile) |

<br>

## 🌐 Browser Support

| Browser | Hand Tracking | Keyboard | Touch | Gyroscope |
|---|---|---|---|---|
| Chrome | ✅ | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ | ✅ |
| Safari | ✅ | ✅ | ✅ | ✅ |

> **Note:** Hand tracking requires a webcam and HTTPS (or localhost). Camera permission must be granted.

<br>

## 📄 License

No license has been specified for this project yet. Consider adding a `LICENSE` file if you intend for others to use or contribute.

<br>

<div align="center">

Made with 🖤 by [Manthan-13521](https://github.com/Manthan-13521)

</div>
