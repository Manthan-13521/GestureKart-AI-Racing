# VIRTUAL STEERING — AAA GAME DESIGN DOCUMENT

**Document Version:** 2.0 (Planning Phase — no implementation)
**Prepared by:** Principal Game Director / AAA Design & Systems Team
**Project:** Virtual Steering — the world's first AAA gesture-controlled racing experience
**Supersedes:** v1.0 (strategic revision: unified race flow + input-mode split)

> **REVISION NOTE (v2.0):** This revision makes one major strategic change to the v1.0 plan —
> the game is no longer "four games sharing one engine." It becomes **one cohesive racing title**
> with a single flow — **PLAY → SELECT TRACK → SELECT MODE → RACE** — and a clear identity:
> **gesture control is the flagship innovation, exclusive to Endless Survival**; all competitive
> modes use keyboard/gamepad. Sections changed by this revision are marked **(REVISED v2.0)**.

---

# 01 — EXECUTIVE VISION

## 1.1 The Transformation **(REVISED v2.0)**

Virtual Steering evolves from a single-screen hand-tracking demo into a **premium, cohesive gesture-controlled racing title** — "the world's first AAA gesture-controlled racing game" — delivered entirely in the browser.

The product is ONE game, not four:

```
HOME
 └─ PLAY
     ├─ SELECT TRACK   (Cyber City / Mountain Highway / Space Highway)
     └─ SELECT MODE    (You vs You / Multiplayer / AI Race / Endless Survival)
         └─ RACE
```

Where today the player sees one road, one mode, and one screen, after this plan they see:

- A **cinematic animated home screen** that feels like a console title screen
- **Three premium tracks**, each with dynamic weather, unique lighting, audio, and UI theme
- **Four modes within one race system** — every race starts the same cinematic way
- **A signature identity:** ✋ **Endless Survival = the gesture showcase** (MediaPipe hands) · 🎮 **You vs You, Multiplayer, AI Race = polished competitive racing** (keyboard/gamepad)
- **Player progression** (coins, XP, levels, titles, achievements, daily/weekly challenges) and a **Garage** of cosmetic unlocks
- **Replay + Photo mode** after every race; **console-quality menus, HUD, and transitions**

## 1.2 The First-Impression Goal

The first frame a player sees must make them think: *"This doesn't look like a student project."*

This is achieved through:
1. A **living animated background** behind every menu (camera fly-through of a track with particles and dynamic lighting), never a static image
2. **Motion graphics** on every element — nothing appears, everything *arrives*
3. **Depth**: layered glass panels, parallax, glow, and blur — never flat rectangles
4. **Cinematic race intros**: drone fly-through → countdown lights → engine roar → GO (every race, every mode)

## 1.3 Design Pillars **(REVISED v2.0)**

| # | Pillar | Meaning |
|---|--------|---------|
| P1 | **Premium from frame one** | Every screen is designed, animated, and consistent. No HTML-looking UI. |
| P2 | **One game, not four** | Tracks and modes are variations of a single race system; the flow PLAY → Track → Mode → Race is always one muscle memory. |
| P3 | **Gestures are the flagship, not the requirement** | Hand tracking is the signature feature — showcased exclusively in Endless Survival. All other modes use keyboard/gamepad so the feature stays special and the game stays accessible. |
| P4 | **Racing authenticity** | Ghosts, deltas, sectors, laps, positions, podiums — mechanics that racing players respect. |
| P5 | **Short-to-race** | Max 2 interactions from boot to a race. Menus get out of the way. |
| P6 | **Progression that respects time** | Every race pays out (coins/XP) — even a lost race. Daily/weekly goals create return loops. |
| P7 | **The current game is sacred** | Endless Survival (traffic dodging with gesture control) is kept, repackaged, improved — and remains the ONLY hand-tracking mode. |

## 1.4 North-Star Metrics

| Metric | Target (post-launch of each feature) |
|---|---|
| Time-to-first-race | < 30 seconds from load (no camera → keyboard fallback accepted) |
| Session length | 10–20 min average |
| Mode diversity | ≥ 60% of players touch 3+ modes in a week |
| Endless Survival retention | Unchanged or improved (it must not regress) |
| Input-method clarity | 0 confusion errors: mode selection always shows required controls |
| 60 FPS | Desktop always; mobile 60 where device allows, min 30 with quality tier |

## 1.5 Scope Guardrails

- Pure static frontend deployment (Vercel) remains viable — networking uses WebRTC with public signaling; no serverless API required for the core loop.
- No external 3D asset pipeline required at launch — all art is procedural (Three.js primitives + shaders).
- The GDD is mode-, track-, and screen-complete but implementation is phased (see §17).

---

# 02 — COMPLETE UX RESEARCH

## 2.1 Reference Study (what we borrow and why) **(REVISED v2.0 — expanded inspiration list)**

| Reference | What we study | What we adopt |
|---|---|---|
| **Apple Vision Pro UI** | Spatial layering, glass materials, depth perception, eye/gesture affordances | Layered glass panels, depth-of-field menus, gesture affordance language |
| **Gran Turismo 7** | Menu showcase mode; ghost/time-trial flow; cinematic menus | Living-track backgrounds, ghost car system, sector deltas, "personal best" celebration |
| **Forza Horizon 5** | Horizon-UI card stacks, minimal clutter, celebratory results, garage flow | Card-based selection, victory fireworks/confetti, car-upgrade screens |
| **Need for Speed Unbound** | Neon grading, graffiti energy, speed sensation, fast typography | Velocity-based HUD flares, energetic transitions |
| **F1 24** | Telemetry readability, data hierarchy, race-director pacing | HUD tier system, sector timing, pre-race cinematic pacing |
| **Wipeout Omega Collection** | Futuristic HUD, speed lines, sci-fi typography, anti-grav feel | Space Highway theme, velocity motion language |
| **Assetto Corsa Competizione** | Racing simulation depth, delta/time systems | Ghost delta precision, lap-time breakdowns |
| **Cyberpunk 2077 HUD** | Diegetic UI, neon glows, menu-as-world | HUD blend with 3D world, track-themed UI |
| **PlayStation 5 system UI** | Focus-based navigation, card transitions, sound design of UI | D-pad/keyboard focus system, one confirm + one back |
| **Xbox UI** | Dense hubs, quick resume, accessibility | Quick-resume style session persistence |
| **Nothing OS animations** | Dot-matrix motion, micro-interactions, restrained color | Micro-interaction detail, signature motion quirks |
| **Mario Kart** | Approachable multiplayer, fairness, fun > sim | Near-miss/boost feedback juice, local multiplayer friendliness |
| **Asphalt 9** | Touch-first density, nitro/combo meters, campaign flow | Combo multiplier in Endless Survival, dense but readable HUD |
| **Apple HIG / Material 3** | Material hierarchy, tonal surfaces, elevation, focus states | Elevation-based panel system, clear focus ring |

## 2.2 Key Research Findings → Design Rules **(REVISED v2.0)**

1. **Racing players hate slow menus.** Every screen must have a visible path to race in ≤ 2 interactions. (Rule R1)
2. **Ghost racing is addictive because of the delta.** The delta timer must be unmissable. (Rule R2)
3. **Multiplayer needs perceived action.** Lobbies must show activity (player cards, ping, ready states, animated waiting), never a dead screen. (Rule R3)
4. **Hand-gesture fatigue is real.** Gesture play is tiring; competitive precision modes need conventional controls. This is a *feature split*, not a compromise — see §1.3 P3. (Rule R4)
5. **Hands must never navigate menus.** Menu navigation is focus-based (keyboard/touch/controller). Hand input activates only in Endless Survival races. (Rule R5)
6. **One confirm, one back, everywhere.** Enter = confirm, Esc = back, on every screen. (Rule R6)
7. **Touch hit targets ≥ 48px**, labels ≥ 14px at 1x, contrast ≥ 4.5:1. (Rule R7)
8. **Reduced motion and colorblind accessibility** are toggles, not afterthoughts. (Rule R8)

## 2.3 Personas **(REVISED v2.0)**

| Persona | Behavior | What they need |
|---|---|---|
| **Nova** — casual phone player | 5-min sessions, gesture input, plays Endless Survival | Instant boot-to-race, big touch targets, combo dopamine, gesture calibration |
| **Rex** — time-trial perfectionist | Desktop, keyboard, obsessive about ghosts | Sector deltas, best-lap breakdown, replay, ghost toggle, gamepad support |
| **Skye** — group player | Wants to race friends with gamepads | Room codes, lobby with ping/voice indicators, 4-player grid, standings |
| **Kit** — young player | Plays with siblings on one device | Local multiplayer, colorful feedback, no frustration states |

## 2.4 Accessibility & Inclusivity Plan **(REVISED v2.0)**

| Area | Commitment |
|---|---|
| Motion | "Reduced Motion" toggle: disables fly-through backgrounds, screen shake, particle bursts, cinematic intros shorten to countdown-only |
| Vision | Colorblind presets (deuteranopia/protanopia/tritanopia palettes), high-contrast HUD theme, large-HUD scale option |
| Hearing | All audio feedback has visual equivalent; subtitle captions for tutorial |
| Input | **One-hand mode** (steering+throttle on one hand/touch), full keyboard remap, gamepad support, gesture calibration screen, sensitivity slider |
| Motor | Hold-to-confirm for destructive actions (Quit, Leave Lobby); generous hit areas |
| Language | Single text-source file (i18n-ready JSON) so localization is a data change |

## 2.5 Motion Language

| Property | Menu | In-race HUD | Celebrations |
|---|---|---|---|
| Easing | cubic-bezier(0.22, 1, 0.36, 1) | linear + slight overshoot | overshoot/spring |
| Durations | 150–250ms enter, 120ms exit | 80–120ms updates | 300–600ms |
| Principles | Elements rise 8px + fade on enter; never scale-from-0; blur transitions | Values update with count-up + color flare; never flicker | Confetti/orbit camera; 1.2s locked celebration |

---

# 03 — AAA UI BREAKDOWN

## 3.1 Design Language: **"Neo-Transport Glass"** (unchanged base, v2.0 adds motion identity)

- **Base:** near-black carbon `#050709`
- **Surfaces:** `panel` (blur 24px, white 4% fill, 1px 8%-white stroke), `panel-raised` (blur 32px, white 8% fill, accent edge light)
- **Accents:** cyan `#00d4ff`, magenta `#ff2d95`, green `#00ff41`, gold `#ffd700`, red `#ff3355`; per-track UI theme accent (see §10)
- **Type:** Orbitron (display/numbers), Rajdhani (UI/labels), Inter (body)
- **Signature details:** 1px gradient edge-lines, corner glow notches, scanline sheen, KBD chips, tabular telemetry numerals, dot-matrix micro-ticks (Nothing-style)
- **Buttons:** Primary (accent gradient + glow), Secondary (glass), Ghost (text-only)
- **Rule: no element appears without an entrance animation; every interactive element animates on hover/press/focus.**

## 3.2 HUD Design System **(REVISED v2.0 — new HUD layout)**

HUD elements are tiered; every value animates (count-up, flare, slide):

| Tier | Elements |
|---|---|
| T1 — Always | Speed cluster (digital `132 KM/H` + arc gauge), rank, lap, timer, mode tag |
| T2 — Contextual | Boost bar, ghost delta (`+0.24` / `-0.18`), combo multiplier, near-miss toasts, minimap, FPS, sector splits, player cards |
| T3 — Cinematic | Countdown 3-2-1-GO, "NEW RECORD", finish banner, low-speed warning, boost-available pulse |

**Reference HUD composition (per mode):**
```
┌────────────────────────────────────────────────────────────┐
│ RANK 2/6   LAP 1/3        01:24            SCORE 12,480    │
│ [minimap]  (multiplayer: 4 player cards)   COINS +240      │
│                                                             │
│                    (race viewport)                          │
│                                                             │
│       COMBO ×5          BOOST ████████░░   GHOST +0.24     │
│  NEAR MISS +120 (toast)                                    │
│ ┌───────────────────────────────────────┐  FPS 60          │
│ │           132 KM/H  ╮ gauge           │  GEAR 3          │
│ └───────────────────────────────────────┘                  │
└────────────────────────────────────────────────────────────┘
```
- Bottom-center speed cluster (existing gauge re-skinned + digital readout)
- Top-left rank/lap + minimap below; top-center timer; top-right score + coins
- Right rail: boost bar (survival), ghost delta (You vs You), player cards (multiplayer)
- HUD scales to viewport; values never flicker — they count up/color-flare; notches-safe margins

## 3.3 Component Inventory

Buttons (3 tiers), mode cards, track cards, player cards, KBD chips, sliders, toggles, radio pills, badges, toasts, modals, stat bars, radial gauges, countdown, tab bars, list rows, room-code input, avatars (procedural), progress rings, banners, confirmation dialogs, tooltips, icon set (animated line icons), **control-method chips** (✋ Gesture / ⌨ Keyboard / 🎮 Gamepad).

## 3.4 Screen-by-Screen Specification **(REVISED v2.0 — garage/replay/weather added)**

| Screen | Purpose | Key elements | Motion signature |
|---|---|---|---|
| Boot/Splash | Brand beat, auto-skip 2s | Logo, "gesture racing" tagline | Scale+fade, shimmer sweep |
| Home | Hub | PLAY, GARAGE, PROFILE, LEADERBOARD, SETTINGS, HOW TO PLAY, EXIT; living background | Cinematic camera drift behind glass |
| Track Select | 3 tracks | Large track cards with live weather preview, difficulty chips | Cards rise staggered, hover = preview swap |
| Mode Select | 4 modes + **control method shown** | Mode cards with control chips (✋/⌨/🎮), description, back | Cards staggered; selected mode's control animates |
| Garage | Cosmetic unlocks | Wheel skins, gloves, neon trails, car themes, banners, name cards, titles; turntable preview | Turntable rotation, stat/purchase animations |
| Profile | Player identity | Level ring, XP bar, title, coins, achievements, stats, best laps | Count-up numbers, ring fill |
| Leaderboard | Rankings | Tabs (global/friends/track), podium, best laps, high score (survival) | Scroll rows fade in, highlight player |
| Settings | Preferences | Groups: Controls, Video, Audio, Accessibility (presets) | Grouped panels, live preview |
| How to Play | Tutorial | Gesture + keyboard/gamepad sections, tips carousel | Card flip, step progression |
| Lobby (multiplayer) | Pre-race room | Room code, animated player cards (avatar, name, ping, voice, car, ready), invite, host controls | Cards pulse on ready; ping bar animates |
| Matchmaking | Searching | Animated radar/pulse, estimated wait, cancel | Continuous search animation |
| Pre-Race / Cinematic Intro | Every race opener | Track name, weather, opponents, control-method banner → **drone fly-through → countdown lights → orbit → GO** | Camera choreography + slow-mo, engine sound build |
| Race (4 mode variants) | Core | T1/T2/T3 HUD per mode | Live, zero-lag updates |
| Pause | Mid-race menu | Resume (pre-selected), Restart, Settings, Quit | Blur + slide-in, 120ms |
| Results | Immediate finish | Position, time, best lap, delta vs ghost, rewards | Podium animation, count-up rewards |
| Replay | Post-race | Watch replay, free camera, slow motion, orbit camera, photo mode, share screenshot | Camera mode switching |
| Victory | Win celebration | Camera rotates, fireworks, confetti, trophy, XP/coins, achievements, NEW RECORD | 1.5s celebration lock, Forza-style |
| Defeat | Loss | Encouraging copy, retry prompts, rewards still shown | Softer palette, still rewarding |
| Rewards | Payout | Coins, XP bar fill, unlock toasts, combo chain | Cascading reward cards |
| Achievements | Milestones | Grid of badges, locked silhouettes, progress rings | Badge reveal animation |
| Loading | Transition | Track art, rotating tips, progress hint | Pulsing track preview |

---

# 04 — COMPLETE SCREEN FLOW **(REVISED v2.0 — unified race flow)**

```
BOOT
 └─> SPLASH (auto 2s / skip)
      └─> HOME
           ├─ PLAY ──────────► TRACK SELECT ──► MODE SELECT ──► PRE-RACE (cinematic intro)
           │                     │                 │                  │
           │                     │                 ▼                  ▼
           │                     │          (mode config)       COUNTDOWN → RACE → RESULTS
           │                     │                                      │
           │                     │               REWARDS → VICTORY/DEFEAT → REPLAY → STANDINGS
           │                     │                                        │
           │                     │                 RACE AGAIN / CHANGE TRACK / CHANGE MODE / HOME
           ├─ GARAGE ──► (cosmetics) ──► HOME / PLAY
           ├─ PROFILE ──► achievements/stats ──► HOME
           ├─ LEADERBOARD ──► tabs ──► HOME
           ├─ SETTINGS ──► groups ──► HOME
           ├─ HOW TO PLAY ──► steps ──► HOME
           └─ EXIT (web: confirmation → "thanks" overlay)
```

**Play shortcut:** Home PLAY jumps to last-used (track, mode) — one interaction to race.
**Every race ends:** RESULTS → REWARDS → VICTORY/DEFEAT → REPLAY → STANDINGS → RACE AGAIN / CHANGE MODE / HOME.
**Global rules:** Esc/back always returns to previous screen; hold-to-confirm for destructive actions; RACE AGAIN = same track+mode+difficulty, zero detours.

---

# 05 — NAVIGATION FLOW (unchanged from v1.0)

## 5.1 Focus-Based Navigation (controller-like, no cursor required)

- One active focus element per screen; WASD/arrows/D-pad move focus on a per-screen 4-directional grid.
- **Enter/Space/A** = confirm; **Esc/Back** = back; **Tab** = cycle focus.
- Focus state: 2px accent ring + glow + scale 1.03 + hover sound.
- Touch: tap = focus + confirm. Gamepad: stick/D-pad move, A=confirm, B=back (Xbox), X/O (PS).
- **Hands never navigate menus** — in Endless Survival only (R5). Menu hint: "Hands steer in Endless Survival".

## 5.2 Keyboard Map (universal)

| Action | Key |
|---|---|
| Confirm / Next | Enter or Space |
| Back / Cancel | Escape |
| Move focus | W A S D / Arrows |
| Quick action (auto-accel toggle) | U (Endless Survival) |
| Pause during race | Esc / P |
| Replay: slow motion | Shift (hold) |
| Replay: free camera | C |
| Screenshot / photo mode | F12 / C in replay |

## 5.3 Screen State Machine

`AppState`: `Splash → Home → TrackSelect → ModeSelect → Lobby → Matchmaking → PreRace → CinematicIntro → Racing → Paused → Results → Rewards → Victory/Defeat → Replay → Standings → Home`
Single state machine; every transition plays blur/slide (150ms); screens pushed/popped on a stack (back = pop).

---

# 06 — GAMEPLAY ARCHITECTURE **(REVISED v2.0 — Input Manager + unified core)**

## 6.1 Shared Race Core (mode-agnostic)

One race engine drives all four modes; modes plug in rules + scoring + spawning + **input method**:

```
RaceCore (shared)
 ├─ PlayerState        (speed, position, lane, boost, alive, distance, times)
 ├─ RaceClock          (elapsed, lap, sector, finish triggers per mode)
 ├─ InputManager       (unified steering/throttle/brake interface — see 6.2)
 ├─ CameraRig          (chase/cockpit, FOV, shake, cinematic intro, finish, replay)
 ├─ FXLayer            (particles, speed lines, vignette, hit-stop, weather)
 ├─ AudioEngine        (engine, boost, collision, UI, adaptive music)
 └─ EventBus           (mode hook points: onSpawn, onNearMiss, onLap, onFinish, onRecord)
```

## 6.2 Input Manager Abstraction **(NEW v2.0 — core architectural change)**

**Design principle:** gameplay code NEVER depends directly on MediaPipe, keyboard events, or gamepads. All modes consume a unified `InputFrame { steer (-1..1), throttle (0..1), brake (0..1), boostButton }` produced by the Input Manager.

```
                  ┌───────────────────────────────┐
                  │         INPUT MANAGER          │
                  │  (mode-scoped, interchangeable)│
                  └──────────────┬────────────────┘
                                 │
        ┌────────────┬───────────┴────────────┬──────────────┐
        ▼            ▼                        ▼              ▼
  GestureSource   KeyboardSource          GamepadSource   TouchSource
  (MediaPipe      (WASD/arrows,           (gamepad API,   (screen buttons,
   hands)          remappable)             rumble hook)    one-hand mode)
        │            │                        │              │
        └────────────┴────────────────────────┴──────────────┘
                    unified InputFrame → RaceCore
```

**Rules:**
- **Endless Survival** → `GestureSource` required (fallback: keyboard allowed, banner warns "for full experience, show your hands").
- **You vs You, Multiplayer, AI Race** → `KeyboardSource` + `GamepadSource` (touch fallback on mobile). Gesture input is ignored in these modes (input source locked by mode config).
- New control methods (steering wheel, joystick, AR hands) = add one Source class; gameplay untouched.
- One-hand mode = TouchSource with combined steer+throttle control.

## 6.3 Mode Configs (rules per mode)

| Mode | Input | Spawning | Scoring | Finish |
|---|---|---|---|---|
| You vs You | Keyboard/Gamepad | None (ghost only) | Best time / distance vs ghost | Finish line or distance target |
| Multiplayer | Keyboard/Gamepad | None (pure race, no traffic) | Position → points | Finish order (4 players) |
| AI Race | Keyboard/Gamepad | 5 AI personalities | Position + beat best | Finish order (6 racers) |
| Endless Survival | **Gesture (MediaPipe)** | Traffic cars (kept) | Score, combo, near-miss, boost, distance | Timer or crash |

## 6.4 Mode 1 — YOU VS YOU (Ghost Time Trial) — input: Keyboard/Gamepad

- **Goal:** beat your best recorded run on the selected track.
- **Ghost:** see §08 — transparent holographic car + light trail.
- **HUD:** delta timer, sector splits (3), best-lap indicator, "NEW RECORD" celebration.
- **Why keyboard/gamepad:** precision and consistency for fair comparison between runs (R4).
- **Rewards:** time improvement %, coins + XP.

## 6.5 Mode 2 — MULTIPLAYER (up to 4 players) — input: Keyboard/Gamepad

- **Goal:** first across the finish line. Pure race, **no traffic**.
- **Net:** see §07. Lobby → room code → ready → countdown → live positions.
- **HUD:** player cards with live positions + ping; own delta to 1st.
- **Anti-frustration:** small last-place rubber band so races stay close.

## 6.6 Mode 3 — AI RACE (vs 5 AI racers) — input: Keyboard/Gamepad

- **Goal:** beat 5 AI racers with named identities (see §09).
- **Difficulty:** Easy / Medium / Hard / Expert / Adaptive.
- **Systems:** rubber-band, drafting, dynamic overtaking/defending, mistakes, boost.
- **Progression:** tournament ladder — divisions; podium + celebration.

## 6.7 Mode 4 — ENDLESS SURVIVAL (original game — GESTURE ONLY) **(REVISED v2.0)**

**KEEP & PROTECT:** traffic spawning, dodging, collision ends run, score, speed, 90s timer, difficulty ramp, **MediaPipe hand gesture steering — exclusive to this mode (P3/P7).**

**IMPROVE (additive only):**
| Feature | Design |
|---|---|
| **Steering smoothing** | Adaptive EMA: more smoothing at low speed, sharper at high speed; dead-zone calibration |
| **Gesture accuracy** | Improved palm-center tracking, hand-presence timeout, calibration screen |
| **Combo multiplier** | Near-miss or lane-switch streak builds ×2…×10; resets on hit |
| **Near-miss bonus** | < 1.5m clearance = +combo, +points, "NEAR MISS" pop |
| **Boost pickups** | Glowing pickup lane → speed boost + 1.5s invulnerability |
| **Dynamic difficulty** | Wave-based intensity (calm → intense → calm); existing ramp kept |
| **Progressive speed** | Speed cap rises with distance milestones |
| **Collision effects** | Hit-stop, camera shake, slow-mo 0.4s on hit, red flash |
| **High-score leaderboard** | Local best + track high-score table |
| **Rich visual feedback** | Boost flare, combo ring, speed lines, near-miss glow |

---

# 07 — MULTIPLAYER ARCHITECTURE **(REVISED v2.0 — premium lobby, input note)**

## 7.1 Topology Decision

**WebRTC full mesh** — 4 players max (6 links, tiny payloads). Upgrade path: SFU (LiveKit) if scale grows. **Host-authoritative** model with client prediction; host owns start/finish fairness.

## 7.2 Networking Components

| Component | Design |
|---|---|
| **Signaling** | PeerJS public cloud (free, static-host compatible) or self-hosted WebSocket |
| **Transport** | WebRTC DataChannel: ordered/reliable for lobby, unordered/unreliable for snapshots |
| **Room model** | Host creates room → 6-char code (no ambiguous chars). Join by code |
| **Quick Match** | Optional serverless directory function; fallback peer-ID scanning keeps zero-infra |
| **Lobby state** | Host-owned: player list (name, avatar, car, **ping**, **voice-ready indicator**, ready), settings (track, laps), start |
| **Ready system** | Per-player READY toggle; host START when ≥2 ready; countdown from synced clock |

## 7.3 Premium Lobby Experience **(NEW v2.0)**

- **Player cards:** avatar, name, car thumbnail, ping bar (animated), voice indicator, READY badge — card glows when ready, ping bar pulses live.
- **Room code:** large mono digits, copy button, invite hint.
- **Waiting state:** animated "Players Joining…" shimmer + slot silhouettes filling.
- **Host tools:** track/laps chips, kick player (hold-confirm), start button.
- **Pre-race transition:** "3… 2… 1… GO" synced across clients with camera zoom.

## 7.4 Synchronization Strategy (unchanged)

- Deterministic world seed broadcast at join → identical track/environment.
- 30 Hz car snapshots `{t, x, z, lane, speed, boost, alive}` on unreliable channel.
- Interpolation buffer (100ms) + dead-reckoning for other players; own car 100% predicted.
- NTP-lite clock sync for fair countdown and finish times.

## 7.5 Latency Compensation / Reconnection / Matchmaking / Leaderboards / Anti-Cheat

- **Latency:** client prediction; interpolation; extrapolation >150ms; synchronized start; timestamped finish tie-breaks.
- **Reconnection:** join token (session localStorage); 30s seat hold; spectator mode on failed rejoin.
- **Matchmaking:** private rooms primary; quick-match via optional directory; skill-based later.
- **Leaderboards:** local always (best times/wins); optional serverless global tables.
- **Anti-cheat:** host validates snapshot sanity (speed/teleport limits, monotonic progress); finish claims verified vs snapshot history; rate limits; documented browser honesty ceiling.

## 7.6 Multiplayer Input Constraint **(NEW v2.0)**

Multiplayer accepts **Keyboard/Gamepad/Touch only** — gesture input is disabled in this mode for low-latency competitive parity (R4). This is communicated on the Mode Select card.

---

# 08 — GHOST SYSTEM ARCHITECTURE (unchanged from v1.0)

## 8.1 Recording
- `{t (ms), x, z, speed}` at **20 Hz**, quantized 2 decimals; delta-compressed (~20KB / 10-min run).
- Best run per track + optional "last run" kept for comparison.

## 8.2 Storage
- `localStorage` for best-run metadata + compressed samples; **IndexedDB** fallback for large ghosts. Cloud sync = stretch.

## 8.3 Playback
- Ghost car: car mesh + fresnel shader, transparent ~45%, holographic cyan, additive, emissive flicker.
- Trail: fading line geometry (last 2s) — "light trail".
- Ghost fades in at GO.

## 8.4 Timing & HUD
- **Delta timer (T2):** `+0.342` / `-0.180`, green ahead / red behind.
- **Sector splits:** 3 sectors; 5s split display.
- **Best lap indicator** + lap-time table at results.
- **"NEW RECORD" celebration (T3):** 0.8s freeze + gold banner + confetti + finish camera orbit + sting.

## 8.5 Controls
- Toggle ghost on/off; choose "Best Run" / "Last Run"; friend ghosts = stretch (cloud).

---

# 09 — AI SYSTEM ARCHITECTURE **(REVISED v2.0 — named identities)**

## 9.1 AI Identities (players recognize opponents, not just "car #3")

| Identity | Personality archetype | Driving signature | Typical tier |
|---|---|---|---|
| **"Blaze"** | Aggressive | Late-brakes, blocks lanes, frequent overtakes | Hard/Expert |
| **"Shield"** | Defensive | Takes inside line, defends position, rarely attacks | Medium/Hard |
| **"Vector"** | Precision | Consistent apexes, near-perfect lines, low mistake | Expert |
| **"Risky"** | Risky | Late dives, boost gambles, occasional crashes | Medium |
| **"Chameleon"** | Adaptive | Calibrates to player speed every race | Adaptive |
| **"Comet"** | Rookie | Wide corners, hesitates, learns through the race | Easy |

## 9.2 Personality Parameter Model (per identity)

`aggression, consistency, braking, cornering, boostSense, mistakeFreq, draftSkill` (0–1 each) — seeded for deterministic tournament replay; identities have fixed parameter fingerprints with small per-race noise.

## 9.3 Difficulty Tiers

| Tier | Behavior |
|---|---|
| Easy | Forgiving; low aggression; mid-pack by default (Comet + Shield) |
| Medium | Balanced mix (Risky, Shield) |
| Hard | Pushes player; strong drafting/overtaking (Blaze) |
| Expert | Near-optimal precision (Vector) |
| Adaptive | Chameleon — recalibrates from last 3 race deltas; always a close race |

## 9.4 Race Behaviors (unchanged mechanics, now personality-flavored)

Rubber-band catch-up · dynamic overtaking/defending (aggression-gated) · drafting (pack racing) · mistakes (gated by tier — Expert never randomly mistakes) · boost usage (boostSense) · finish celebration & podium behavior.

## 9.5 Tournament Progression

Rookie → Pro → Elite → Champion. 3 races per division (one per track). Promotion = top-3 average finish. Defeat still pays partial rewards.

---

# 10 — TRACK DESIGN **(REVISED v2.0 — dynamic weather)**

## 10.1 Track Identity Model (per track)

Layout, weather system, time-of-day, skybox, lighting rig, road material, barriers, ambient SFX, music direction, UI accent, celebration. **NEW: every track has a dynamic weather state machine** (calm → active → storm, cycling on a timer; seeded per race so replays/matchmaking are consistent).

## 10.2 Track 1 — CYBER CITY (current neon tunnel, expanded)

| Property | Design |
|---|---|
| Layout | Straight highway + sweepers, long tunnel sections, elevated ramps |
| Theme | Cyberpunk metropolis at night |
| **Dynamic weather** | `Calm (dry)` → `Rain (wet reflections, mist, tire hiss)` → `Storm (heavy rain + lightning flashes + screen glints)` |
| Skybox | City skyline silhouette, neon billboards |
| Lighting | Neon cyan/magenta strips, rain glints, headlight shafts, lightning strike light |
| Audio | Synthwave; rain/storm ambience layers |
| UI accent | Cyan |
| Celebration | Neon confetti, "city lights" burst |

## 10.3 Track 2 — MOUNTAIN HIGHWAY

| Property | Design |
|---|---|
| Layout | Climbs, hairpins, cliff straights, two tunnels, waterfall crossing |
| Theme | Alpine |
| **Dynamic weather** | `Dawn fog` → `Sunrise golden light` → `Day breeze (drifting leaves)` → `Sunset flare` |
| Skybox | Sun low, warm gradient, distant peaks |
| Lighting | Warm key + cool shadow fill; volumetric fog bands |
| Audio | Cinematic strings + percussion; wind ambience |
| UI accent | Gold |
| Celebration | Warm confetti, mountain panorama finish |

## 10.4 Track 3 — SPACE HIGHWAY

| Property | Design |
|---|---|
| Layout | Floating segments, energy bridges, sweeping arcs |
| Theme | Deep-space orbital highway |
| **Dynamic weather** | `Calm starfield` → `Asteroid drift (passing rocks)` → `Nebula passage` → `Aurora + solar particles` |
| Skybox | Planets, nebula, procedural starfield shader |
| Lighting | Cool blue rim + planet light; additive energy bridges; aurora gradient |
| Audio | Synth pads + sub-bass; space ambience |
| UI accent | Violet |
| Celebration | Starfield burst, zero-g confetti |

## 10.5 Track Parity Rules

Same lane count, similar length profile (fair leaderboards), same spawn logic, same ghost/AI support. Tracks differ in presentation + weather only; gameplay-affecting geometry gated by difficulty, not track identity.

---

# 11 — GRAPHICS ROADMAP **(REVISED v2.0 — weather systems added)**

## 11.1 Perceptual Parity (honest platform reality)

| Feature | Implementation | Tier |
|---|---|---|
| Bloom/glow | `UnrealBloomPass` (subtle) | High/All |
| Fake SSR (wet road) | EnvMap-based reflection + fresnel + roughness ramp | High/Mid |
| Volumetric fog | Fog planes/sprites + fog uniforms | High |
| Light shafts | Gradient cones from headlights (few) | High |
| **Rain** | Instanced particle strips + screen streaks + splash rings; **storm = intensity ramp + lightning (flicker light)** | High/Mid |
| **Fog/sunset** | Distance fog color gradient + sun sprite + drifting leaf particles | High/Mid |
| **Space** | Starfield shader + nebula gradient planes + aurora ribbons + asteroid instances + solar particles | High/Mid |
| Particles | Pooled Points system (dust, sparks, confetti, rain, leaves, stardust) | All |
| Lens flare | Sprite-based on headlights/sun | High |
| Dynamic shadows | Existing PCF; off on mobile | All |

## 11.2 Quality Tiers

High (desktop: bloom, SSR, weather, shadows, ≤2 pixelRatio) · Mid (light bloom, no SSR, pixelRatio ≤1.5) · Low (mobile: current config, no post, pixelRatio 1). Auto-tier + rolling 2s frame-budget auto-drop.

---

# 12 — AUDIO ROADMAP

## 12.1 Architecture
Web Audio graph: master → music/SFX/UI/ambience buses. **Adaptive music:** layered stems (pads/beat/bass/leads) keyed to race intensity. Spatialization via StereoPannerNode.

## 12.2 Sound Map (kept from v1.0 + additions)
Engine (keep, refine) · boost swell · collision impact + hit-stop · near-miss whoosh · countdown clicks + GO horn · ghost delta tick · victory brass + crowd wash · defeat minor resolve · UI focus/confirm/back/deny · ambience loops (rain/storm/wind/space pads) · **NEW: cinematic intro sting (drone fly-through orchestral swell), lightning rumble, NEW RECORD gold sting.**

## 12.3 Mixing Rules
Menu music −6dB; UI never above peaks; transient < 0.9 crest; iOS silent-switch aware (AudioContext resume on first touch — implemented).

---

# 13 — ANIMATION ROADMAP **(REVISED v2.0 — cinematic intro + victory presentation)**

| Area | Key animations |
|---|---|
| **Cinematic race intro (ALL modes)** | Drone fly-through (camera spline along track) → track-name card → countdown lights (grid red→green) → slow-mo start → engine roar → GO. Skips on Esc/Space; Reduced-Motion users get countdown only |
| Menus | Staggered entrances, glass blur transitions, focus pulse, count-up numbers, progress fills |
| HUD | Speed flare, combo pop, near-miss tag slide, delta color flip, boost bar drain, minimap pulse |
| In-race | Camera shake decay, FOV boost, wheel rotation, cockpit bob, hit-stop freeze, slow-mo on crash (0.4s) |
| Ghost | Fade-in at GO, holographic flicker, trail fade |
| Multiplayer | Player cards ready-pulse, position slides, ping bar animation |
| **Victory presentation** | Finish camera rotates → fireworks (particle bursts) + confetti → statistics panel → XP/coins count-up → achievements unlock toasts → NEW RECORD banner → replay prompt |
| **Replay modes** | Free camera (WASD + mouse), slow motion (hold Shift), orbit camera, photo mode (depth of field + filters), screenshot capture/share |
| Transitions | Blur + slide 150ms; countdown ring on race start |

---

# 14 — TECHNICAL ARCHITECTURE **(REVISED v2.0 — InputManager + Replay modules)**

```
src/
├── main.ts                 → bootstrap + AppState machine
├── app/
│   ├── AppState.ts         → screen state machine + stack
│   ├── Router.ts           → focus navigation grid
│   └── UIRenderer.ts       → screen constructors (DOM/CSS)
├── input/
│   ├── InputManager.ts     → unified InputFrame producer (NEW v2.0)
│   ├── sources/            → GestureSource (MediaPipe) / KeyboardSource /
│   │                          GamepadSource / TouchSource (one-hand)
│   ├── HandTracker.ts      → (extended: calibration, hand-presence timeout)
│   └── Keyboard.ts         → (extended: remap, split key sets, focus nav)
├── game/
│   ├── Game.ts             → shared race core (refactored)
│   ├── modes/              → youVsYou / multiplayer / aiRace / endlessSurvival
│   ├── GhostRecorder.ts    → record/compress/store/playback
│   ├── GhostReplay.ts      → transparent car + trail
│   ├── ai/                 → identities, rubber-band, drafting, tournaments
│   ├── tracks/             → cyberCity / mountain / space (identity + builders)
│   ├── weather/            → weatherState, rain/fog/space FX drivers (NEW v2.0)
│   ├── replay/             → race recorder, cameras (free/orbit/photo) (NEW v2.0)
│   ├── fx/                 → bloom, SSR road, particles
│   └── audio/              → engine, adaptive music, SFX, buses
├── net/
│   ├── NetSession.ts       → peer/room/join abstraction
│   ├── SnapshotSync.ts     → 30Hz snapshots, interpolation
│   ├── Lobby.ts            → room state, ready, ping, voice indicators, host
│   └── ClockSync.ts        → NTP-lite
├── persistence/
│   ├── Storage.ts          → localStorage + IndexedDB wrapper
│   └── Profile.ts          → coins/XP/level/titles/achievements/garage items
└── ui/theme.css            → design system (Neo-Transport Glass)
```

**Key data contracts:** `InputFrame {steer, throttle, brake, boost}` · `GameModeConfig` · `PlayerSnapshot {t,x,z,lane,speed,boost,alive}` · `GhostRun {trackId, samples[], totalTime, bestLap, sectors[]}` · `AIPersonality` · `TrackDefinition` · `WeatherState {phase, intensity}` · `ReplayClip {frames[]}`.

**Constraints:** no framework added; CDN MediaPipe kept; all state serializable; single source of truth per screen.

---

# 15 — PERFORMANCE PLAN (unchanged targets, weather budgeted)

| Metric | Desktop (High) | Mid laptop | Mobile (Low) |
|---|---|---|---|
| FPS target | 60 | 60 | 30–60 |
| Draw calls | ≤ 250 | ≤ 150 | ≤ 80 |
| Materials | ≤ 60 | ≤ 40 | ≤ 25 |
| Post FX | bloom+SSR+weather | bloom | none |
| Pixel ratio | ≤ 2 | ≤ 1.5 | 1 |
| Particles | 300 (+weather share) | 150 | 80 |

Techniques: object pooling · frustum culling per segment · single renderer reused across modes · dynamic resolution scaling (auto-step down if frame > 18ms for 2s) · material sharing, ≤6 dynamic lights · IndexedDB ghosts · preload next screen during transitions · dispose on mode change · **weather layers share particle pools per track type (rain/leaves/stardust never all active simultaneously on Low tier).**

---

# 16 — RISK ANALYSIS **(REVISED v2.0 — input-split risks added)**

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Camera denied → Endless Survival loses identity | Medium | High | Keyboard fallback + banner; onboarding explains camera value; gesture calibration screen |
| 2 | Hand tracking latency/jitter | Medium | Medium | Adaptive EMA, dead zone, calibration; survival-only scope limits surface area |
| 3 | WebRTC NAT/firewall failures | Medium | High | STUN/TURN fallback; clear errors; local multiplayer fallback |
| 4 | 4-player mesh bandwidth (mobile) | Low | Medium | Small payloads, 20Hz drop under load; SFU path documented |
| 5 | Mobile 60fps with 3 tracks + weather | Medium | Medium | Quality tiers + auto-scale; weather layers disabled on Low |
| 6 | Scope creep (20+ screens, 4 modes, replay, garage) | High | High | Phasing (§17); every phase shippable; MoSCoW (§18) |
| 7 | Ghost storage quota | Low | Low | Delta encoding + IndexedDB |
| 8 | Browser inconsistencies (Safari WebRTC/WebGL) | Medium | Medium | Test matrix; graceful degradation |
| 9 | Current game regresses during refactor | Medium | High | Endless Survival = regression gate; manual playtest checklist per phase |
| 10 | Input split confuses players (why no hands in MP?) | Medium | Medium | Mode cards always show control-method chips; how-to explains the identity |
| 11 | Cinematic intro annoys veterans | Medium | Low | Skips on input; Reduced-Motion = countdown only |
| 12 | Audio pops/clicks | Low | Low | Gain ramps, bus limiter |

---

# 17 — DEVELOPMENT PHASES **(REVISED v2.0 — unified flow first, garage/replay phased)**

| Phase | Name | Scope | Exit criteria |
|---|---|---|---|
| P0 | Foundation refactor | InputManager abstraction, GameMode config, AppState machine, focus nav, design tokens | Existing game runs under new shell; build green |
| P1 | Unified flow + Home | PLAY → Track Select → Mode Select, cinematic home, living background, control chips | Boot→race ≤ 2 interactions |
| P2 | Cinematic intro + Pre-Race | Drone fly-through, countdown lights, orbit, slow-mo; skip logic | Every mode opens cinematically |
| P3 | You vs You | Ghost recorder/replay/storage, delta HUD, sectors, NEW RECORD | Beat-your-best loop fun & stable |
| P4 | Endless Survival upgrade (gesture only) | Combo, near-miss, boost, dynamic difficulty, gesture calibration, high-score table | Current game + new juice, no regressions |
| P5 | AI Race | Named identities, tiers, drafting, tournament ladder, podium | AI races feel fair & varied |
| P6 | Local Multiplayer (same-screen) | Split-screen, per-player input (keyboard/gamepad), finish order | Two-player fun on one device |
| P7 | Online Multiplayer | Lobby (ping/voice/ready cards), room code, snapshot sync, reconnect | 2–4 player race over internet |
| P8 | Tracks 2–3 + dynamic weather | Mountain, Space + weather state machines + per-track audio/celebration | 3 tracks with parity + weather |
| P9 | Garage + Progression | Wheel skins, gloves, trails, car themes, banners, titles, coins/XP/levels/achievements, daily/weekly challenges | Reward loop + cosmetics integrated |
| P10 | Replay + Photo mode | Race recorder, free/orbit/slow-mo cameras, screenshots | Replay after every race |
| P11 | Polish & QA | Perf tiers, accessibility (one-hand, presets), browser matrix, release | Release-ready |

---

# 18 — FEATURE PRIORITY MATRIX (MoSCoW) **(REVISED v2.0)**

| Feature | Priority | Effort | Value | Phase |
|---|---|---|---|---|
| Unified Play → Track → Mode flow | Must | M | AAA | P1 |
| Cinematic race intro | Must | M | AAA | P2 |
| You vs You (ghost) | Must | M–H | AAA | P3 |
| Endless Survival upgrades (gesture) | Must | M | AAA | P4 |
| AI Race (identities + ladder) | Must | H | High | P5 |
| Local multiplayer | Must | M | High | P6 |
| Online multiplayer (4P) | Should | H | AAA | P7 |
| Tracks 2–3 + dynamic weather | Should | H | High | P8 |
| Garage cosmetics + progression | Should | H | High | P9 |
| Replay + photo mode | Should | M | High | P10 |
| Cloud leaderboards | Could | M | Med | P11 |
| Voice chat (indicator only at launch) | Could | L | Low | P7 |
| Friend ghosts (cloud) | Won't (v2) | H | Med | — |
| SFU upgrade | Won't (v2) | H | Low | — |

---

# 19 — UI WIREFRAME DESCRIPTIONS **(REVISED v2.0)**

### HOME
Full-bleed living track background (40% brightness). Center: animated title. Mid: PLAY (large primary). Bottom bar: Garage / Profile / Leaderboard / Settings / How to Play / Exit (focus grid). PLAY shortcut = last (track, mode).

### TRACK SELECT
3 large track cards: live weather preview (animated), name, length/difficulty chips, UI accent preview. Footer: BACK. Focus starts on last-used track.

### MODE SELECT
4 mode cards, each showing: icon, title, one-line pitch, **control-method chip (✋ Gesture / ⌨ Keyboard / 🎮 Gamepad)**, track compatibility. Selecting a mode animates the chip + description. Footer: BACK.

### PRE-RACE + CINEMATIC INTRO
Left: track/mode summary card (control method banner prominent). Center: live grid camera. Overlay: track-name card → countdown lights → GO. Esc/Space skips to grid.

### LOBBY (multiplayer)
Left: room code (large mono + copy) + invite hint + track/laps chips (host). Center: 4 player slots — avatar, name, car thumb, **ping bar, voice-ready indicator**, READY badge; empty slots shimmer. Bottom: READY toggle, LEAVE (hold-confirm), host START (≥2 ready). Status ticker animated.

### RACE HUD (Endless Survival)
Top-left rank/lap + minimap; top-center timer; top-right score + coins. Bottom-center speedo (arc + digital `132 KM/H`). Right rail: boost bar + combo ring. Center-right: near-miss/boost toasts. Bottom-left: gear + mode tag. Top-right corner: FPS (toggle).

### RACE HUD (You vs You)
Same skeleton; right rail swaps boost for **GHOST +0.24** delta + sector splits; best-lap tag on lap counter.

### RESULTS / VICTORY
Position banner + medal → stats (time, best lap, delta, max speed) → XP/coins count-up → achievements toasts → NEW RECORD gold burst (if record) → REPLAY / RACE AGAIN / CHANGE TRACK / CHANGE MODE buttons. Victory adds fireworks + confetti + camera rotate.

### REPLAY / PHOTO MODE
Camera tool rail: FREE / ORBIT / SLOW-MO / PHOTO. Screenshot captures to file + share prompt (Web Share API where available).

### PAUSE
Blur viewport; card: RESUME (pre-selected) / RESTART / SETTINGS / QUIT (hold-confirm). Esc resumes.

---

# 20 — IMPLEMENTATION ORDER (dependency-ordered task list) **(REVISED v2.0)**

1. **P0 foundation** — InputManager abstraction (all modes depend on it), GameMode config, AppState, focus nav, design tokens.
2. **P1 unified flow** — Home → Track Select → Mode Select with control-method chips; living background.
3. **P2 cinematic intro** — pre-race camera choreography + countdown lights + skip logic.
4. **P3 You vs You** — GhostRecorder → storage → GhostReplay → delta HUD → NEW RECORD.
5. **P4 Endless Survival upgrade** — combo/near-miss/boost/calibration/high-scores (regression gate).
6. **P5 AI Race** — identity engine → tiers → drafting/overtaking → tournament → podium.
7. **P6 local multiplayer** — split render + per-player InputManager sources.
8. **P7 online multiplayer** — NetSession → Lobby → SnapshotSync → ClockSync → reconnect → quick-match.
9. **P8 tracks 2–3 + weather** — track identity builders → weather state machines → audio themes → celebrations.
10. **P9 garage + progression** — cosmetics, coins/XP/levels/achievements/challenges.
11. **P10 replay + photo mode** — race recorder → cameras → screenshots.
12. **P11 polish/QA** — perf tiers, accessibility (one-hand, presets), browser matrix, release.

**Each task ends with:** build green → manual playtest checklist (from REPORT-2 §7) → commit.

---

## Verification Confirmation

Reviewed against the project's existing code (REPORT-1: `Game.ts` race core, `main.ts` UI flow, MediaPipe input pipeline, kart-racing AI reference) and the project's own UI/UX skill files. Endless Survival (the current game) remains the regression gate and the exclusive gesture showcase.

**End of planning phase (v2.0). No code was written. Awaiting command: "IMPLEMENT THE PLAN".**
