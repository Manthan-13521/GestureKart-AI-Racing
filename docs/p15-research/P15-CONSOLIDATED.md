# P15 UI/UX Research — Competitive Analysis & Design Principles

**Research Period:** August 2026  
**Scope:** Forza Horizon, Need for Speed, Gran Turismo, Asphalt, F1 games, Rocket League, Cyberpunk 2077, futuristic automotive HMI, Awwwards WebGL sites  
**Method:** Web search + design analysis of shipped games and premium web experiences

---

## 1. What Makes Racing-Game UI Attractive?

### 1.1 Main Menu — Identity & Atmosphere

**Pattern:** Live 3D hero car on art-directed dark stage + glass UI layer + one hero neon accent

- **NFS Heat/Unbound:** "Large tiles with clear descriptions displayed in foreground, in front of 3D object and illuminated backgrounds... camera perspectives create visual excitement" (Creative Pixels case study)
- **Forza Horizon 5:** Overwhelming density (30+ first-level options) = anti-pattern; lesson = restraint at entry point
- **Gran Turismo 7:** Diegetic 3D world-as-menu (GT Resort) praised for collector fantasy, criticized for navigation friction
- **F1 25:** "High-adrenaline panoramic sweep from driver's seat... engine-spark color palette, three-state type system (Box/Apex/DRS), backgrounds abstracting motion blur, light trails, circuits"
- **Key insight:** Menu should immediately answer "what is this game?" through a single strong visual thesis.

### 1.2 Track Selection — Excitement & Recognition

**Pattern:** Visual-first cards with track-map silhouettes + weather/time badges

- **Forza community proposal:** Players can't memorize layouts by name → put **track map directly in card**, add horizontal banner for class/weather, use large high-res previews (Forza forums)
- **Horizon Chase:** Color-coded cup performance (red=default, blue=finished, gold=max, white=bonus) — "prioritize colors instead of texts" (Game Developer)
- **Race Force UI:** Photo + title per event, bronze/silver/gold medal overlays, horizontal rail with pagination, yellow parallelogram for selected state (Behance)
- **Minimalist F1 Circuits:** Layered SVG strokes (glow→core→highlight) with draw-on animation, per-track accent colors, hover scale/glow, detail modal (lsabaliauskas.lt)
- **Weather:** Simple icon + time-of-day chip on preview, not decorative illustration (F1 22, iRacing Companion 3.0)

### 1.3 Mode Selection — Cognitive Load Reduction

**Pattern:** Card-per-mode compartmentalization with clear intent grouping

- **Rocket League Play Menu redesign:** Split into Competitive / Casual / Offline / Private / Training — "reduce cognitive load / clutter" (Psyonix)
- **Asphalt 8 revamp:** Grouped modes under "Single" vs "Multiplayer," simplified top bar, clarified ambiguous icons — "great UX is invisible, self-explanatory, intuitive" (Gameloft)
- **Asphalt 9 badges:** Car class (D–S), upgrade readiness (green !), rank vs requirement (red/white/green) — small, color-coded, glanceable
- **NFS Unbound:** "Each option described clearly so players can make informed decision" (Creative Pixels)
- **Key rule:** Every mode tile = distinct icon + 1-line description + badge(s) for size/difficulty

### 1.4 Garage — Premium Car Presentation

**Pattern:** Car owns the screen; UI plays supporting role

- **Mazda Configurator:** "Minimalist approach... majority of screen dedicated to cars, letting users explore full 360° across photorealistic environments" (Jonoyuen)
- **Elite Showroom / car-showroom-r3f-v2:** Cinematic camera stages (exterior→rear→interior), stage-specific overlays (name/year, price, horsepower), smooth intro glide
- **Asphalt 9:** Car + performance rank + stars + blueprints + 4 stats (Accel/Top Speed/Handling/Nitro), rank color-coded against event requirement
- **NFS Unbound:** Garage as main hub, upgradable to unlock items
- **Forza Horizon 6:** Customizable garages, display 4 cars, drone camera + Forzavista
- **AITO luxury site:** "Dashboard-inspired layouts," modular spec sections for scannable technical data

### 1.5 Racing HUD — Glanceable Information Hierarchy

**Priority Order (TelemetryIQ / racing HUD research):**

1. **Speed** (large, km/h, seven-segment or needle)
2. **Race Position** (large, top-left or top-center)
3. **RPM/Gear/Shift Lights** (green→amber→red→flash)
4. **Pedals** (throttle/brake %)
5. **Tyre Temps** (color-coded blue→green→amber→red)
6. **Lap Timer** + Lap Info (current/last/best/delta)

**Screen Regions (formal HUD survey):**

- Laps + Position → top of screen (often split left/right)
- Speedometer → bottom, commonly bottom-right
- Timers → top-right, sometimes left or center
- Mini-map/track → left side, often bottom-left
- Related elements group in same corner

**Critical Focus Area Doctrine (Nicolas Kraj):** Define the zone that must never be occluded — for NFS Heat it's "a diamond shape encompassing the horizon, the players' direct surroundings, and their car." Everything else placed around that zone.

**Styling:**

- Edge placement, minimal footprint, no boxes over world (NFS Unbound)
- Color-coded state, not constant shouting (boost-ready speedometer color change)
- Contrast: light-on-dark strips (7:1+ for critical elements)
- F1 broadcast replication: timing tower (position, names, gaps, DRS/ERS, tyre compounds), green gained / red lost positions

### 1.6 Typography — Racing Game Standards

**System:** One display face + one workhorse + one numeric/mono

- **NFS Unbound:** DIN Pro Condensed (UI elements, buttons, tabs, body) + Eurostile (brand names, headers, rarity)
- **Cyberpunk 2077:** Rajdhani (primary UI, "technical/futuristic") + Orbitron (secondary/decorative)
- **Eurostile:** "Genre-defining for sci-fi HUDs since 1960s — reads as technological without requiring work"
- **Free font consensus:**
  - Rajdhani = legible condensed HUD workhorse
  - Teko = tall condensed for big numbers/scoreboards
  - Orbitron = display ONLY (stylized letterforms slow reading)
  - Russo One = wide industrial racing display
  - Oswald/Barlow Black = condensed bold "aggressive sans-serifs on racing liveries"
  - Inter = body-text workhorse with tabular figures
- **Legibility:** Body/HUD ≥ 20–22px at 1080p TV distance, ~14–16px handheld; tabular figures for stat columns; looser spacing to prevent pixel overlap in motion; low stroke contrast

### 1.7 Color Systems

**Dark Base + Hero Neon:** Deep base (#0B0C10) + panel layer → muted info layer → vivid action layer

- Action layer colors **must not appear in base layers** to avoid confusion with world elements
- Contrast higher than WCAG: critical interactive elements ≥ 7:1; hue differentiation matters for peripheral vision
- **Canonical Racing HUD palette:** `#0B0C10 #1F2833 #66FCF1 #45A29E #C5C6C7` — "cold metallic tones and icy teal accents feel like speed, telemetry, precision"
- **Franchise palettes:** NFS (vibrant car pop + neon signature), DiRT Rally (one strong accent + neon complements), Race Force (dark grey + light grey + bright yellow), Rockstar (pure black + warm gold), Veloce.gg (dark + vibrant racing reds + neon)

### 1.8 Motion — Durations & Easing

**Duration Scale (NN/g, Emil Kowalski, Carmen Ansio):**

- 50–100ms: micro-interactions (hovers, focus rings, checkbox ticks)
- 100–160ms: button press feedback
- 150–250ms: dropdowns, tooltips, tab changes
- 200–300ms: modals, drawers, small UI
- 300–500ms: layout changes, page sections
- 500ms+: cinematic (hero, onboarding) — "500ms animations start to feel like a real drag"

**Easing Rules:**

- **Default: ease-out** (starts fast → feels responsive; `cubic-bezier(0.22, 1, 0.36, 1)`)
- **Asymmetric timing:** user-triggered = fast intro/slow outro; code-triggered = slow intro/fast outro
- **Exit ≈ 75% of entrance duration**
- **Stagger:** 30–80ms between siblings (never >80ms); implement via `animation-delay: calc(var(--i) * 60ms)` with `fill-mode: both`

**What Feels Annoying (documented):**

- Menu animations >150ms feel sluggish by 10th visit; unskippable flourishes compound resentment (Bugnet)
- FH5 notification spam, dopamine-badge popups (Kritiqal)
- Forza 7 multi-screen restart loop (UX Design)
- GT7 forced menu exits for license tests (VGC)
- Animating `backdrop-filter` or `width/height/top/left` — animate `transform`/`opacity` only
- **Must respect `prefers-reduced-motion` globally**

---

## 2. Online Asset Research — Legally Usable (CC0/MIT/OFL/Apache-2.0)

### 2.1 Fonts (Google Fonts, OFL 1.1 verified)

| Font                | Role                | URL                                       | Weights      |
| ------------------- | ------------------- | ----------------------------------------- | ------------ |
| **Orbitron**        | Display/Logo        | fonts.google.com/specimen/Orbitron        | 400–900 + VF |
| **Rajdhani**        | Headings/HUD        | fonts.google.com/specimen/Rajdhani        | 300–700 + VF |
| **Chakra Petch**    | Countdowns/Flags    | fonts.google.com/specimen/Chakra+Petch    | 300–700 + VF |
| **Oxanium**         | Numeric/Stat HUD    | fonts.google.com/specimen/Oxanium         | 200–800 + VF |
| **Saira Condensed** | Motorsport headings | fonts.google.com/specimen/Saira+Condensed | 100–900 + VF |
| **Inter**           | Body text           | fonts.google.com/specimen/Inter           | 100–900 + VF |
| **Share Tech Mono** | Tabular timers      | fonts.google.com/specimen/Share+Tech+Mono | 400, 700     |
| **JetBrains Mono**  | Data/code           | fonts.google.com/specimen/JetBrains+Mono  | 100–800 + VF |

**Recommended Pairings:**

1. **Cyber-premium:** Orbitron (logo) + Rajdhani (headings/HUD) + Share Tech Mono (numbers)
2. **Modern techno:** Chakra Petch (display/countdowns) + Exo 2 (body) + Oxanium (stat readouts)
3. **Condensed motorsport:** Saira Condensed (headings) + Inter (body) + JetBrains Mono (timers)

### 2.2 Icons (MIT/ISC/Apache-2.0)

| Library              | License    | Racing Icons                                                                     | Best For               |
| -------------------- | ---------- | -------------------------------------------------------------------------------- | ---------------------- |
| **Phosphor**         | MIT        | car, steering-wheel, trophy, joystick, engine, gear, ranking, speedometer, timer | Thematic match         |
| **Tabler**           | MIT        | 6,184 icons; car, steering-wheel, trophy, settings, joystick, speedometer        | Biggest set            |
| **Lucide**           | ISC        | car, gauge, settings, trophy, medal, ranking, gamepad-2, flag, timer             | Lightweight            |
| **Material Symbols** | Apache-2.0 | settings, trophy, sports/esports, speed, leaderboard, steering                   | Variable font delivery |

### 2.3 Textures/Backgrounds (CC0)

- **ambientCG:** Seamless PBR (asphalt, concrete, metal, noise) to 8K — perfect for track surfaces
- **Poly Haven:** CC0 textures + HDRIs (env lighting) — note: live API requires credit, self-hosted assets don't

### 2.4 3D Models (CC0 glTF for Three.js)

- **Kenney Car Kit / Racing Kit / Toy Car Kit:** 45+ low-poly vehicles, wheels, debris — glTF ready
- **Kenney Starter-Kit-Racing (GitHub):** Godot template with `.glb` cars + sounds, all CC0
- **Poly Haven 3D:** Photoscanned env props (barriers, buildings)
- **Sketchfab CC0 filter:** ~2000+ models — **verify each model's license badge** (skip CC-BY-NC/SA)

### 2.5 UI Sounds (CC0)

- **Kenney:** Interface Sounds, UI Audio, Sci-fi/Impact/Digital Audio — all CC0 confirmed
- **freesound.org CC0 filter:** race/engine/crowd SFX — screenshot license at download

### 2.6 CSS/Design Resources (MIT)

- GlassKit, Glin UI, liqgui, farvist, arc-ui — pure CSS glass components, aurora backgrounds, glow borders

---

## 3. Implementation Techniques (CSS / Three.js)

1. **Animated gradient borders** — `@property --bg-angle` + conic-gradient on border-box (Codrops)
2. **Premium glassmorphism** — `backdrop-filter: blur(12px) saturate(160%)` + 1px rgba(255,255,255,0.25) border + inset highlight + diagonal sheen `::after` with `mix-blend-mode: screen` (superdesign.dev, pixcode.io) — **cap blur ≤16px, never animate blur**
3. **Animated/grained gradients** — SVG `feTurbulence` noise under gradient + `mix-blend-mode` layers (CSS-Tricks)
4. **Scanlines/CRT overlay stack** — fixed full-screen: sweeping scanline bar (8s loop), line pattern, soft bloom, vignette, animated noise (Codrops PX PUSH)
5. **Perspective grid (outrun)** — CSS `perspective` + rotated ground plane with `repeating-linear-gradient`, infinite scroll (shadcn.io retro-grid)
6. **Warp-tunnel/speed-lines** — CSS 3D transforms + randomized gradient beams animated via `@keyframes` on `translate` (shadcn.io warp)
7. **Three.js holographic material** — custom GLSL: Fresnel rim glow, animated scanlines, additive blending + `UnrealBloomPass` (ektogamat/threejs-holographic-material)
8. **Retro dithering/pixelation/CRT post-processing** — ordered dithering, UV-grid pixelization, RGB shadow-mask, screen curvature (maximeheckel.com)
9. **Scroll-velocity-reactive distortion** — normalize distance/frame into uniform for subtle image flex on fast scroll (Codrops HAOQI)
10. **Staggered entrance choreography** — CSS custom props: `animation-delay: calc(var(--i) * 60ms)`, `fill-mode: both` (Carmen Ansio)
11. **Glass refraction** — SVG `feTurbulence` + `feDisplacementMap` in `backdrop-filter: url(#filter)` (webtricks.dev)
12. **Hero-glow/lens-flare post pass** — luminance-threshold bright cores + star/streak rays at half-res (Codrops HAOQI)
13. **Layered SVG stroke track cards** — glow→core→highlight + draw-on animation + hover scale/glow (lsabaliauskas.lt)
14. **Text-scramble/decode on shared 40ms ticker** for loading states
15. **`clip-path`/radial-mask reveals** for card image transitions (dot-matrix grid reveal in HAOQI)

---

## 4. Mobile UX & Accessibility Research

### 4.1 Mobile Gaming UI (Portrait Browser Racing)

**Touch Targets:** Apple HIG = 44×44pt minimum; Android = 48×48dp; **Thumb reach zone** = bottom 60% of screen, center-bottom preferred (NNG, Material Design)
**Portrait vs Landscape:** Racing games typically landscape; portrait menus need bottom tab bars, stacked cards, no horizontal overflow
**HUD Differences:** Thumb placement dictates edge positioning; safe areas for notches; AI HUD rail (right) must not collide with touch steering (left/right) or accel (bottom-center)
**Menu Layout:** Scroll vs grid — for 360–430px viewport, stack cards vertically with generous touch targets; bottom tab bar for primary nav
**Prevent Overflow:** `viewport-fit=cover`, `touch-action: manipulation`, `overscroll-behavior: contain`, `width: 100vw` with `max-width: 100%`
**Card Adaptation:** Desktop 3–4 column grid → mobile 1 column stacked; min-width 140px → 100%; touch targets ≥ 48px

### 4.2 Accessibility (WCAG 2.1/2.2 for Games)

**Contrast:** Game UI text (normal) ≥ 4.5:1, (large ≥ 18.5px bold) ≥ 3:1; critical interactive ≥ 7:1; neon/dark UIs use light-on-dark strips with hue differentiation
**prefers-reduced-motion:** Reduce transitions, parallax, particles, marquees, auto-play video; keep state-communicating animation (progress fills, pulsing alerts)
**Focus Visible:** `:focus-visible` outline 2px+ offset, high contrast; never remove focus styles
**Colorblind Safe:** Deuteranopia/protanopia/tritanopia — avoid red/green only; redundant encoding (icons + color + text + shape); test with simulators
**High Contrast Mode:** Force borders, increase text weight, reduce transparency, swap to high-contrast palette
**Semantic HTML:** `<button>` not `<div>`; `aria-label` for icon-only; `role="progressbar"` + `aria-valuenow/min/max`; `aria-live="polite"` for HUD updates; `aria-hidden="true"` for decorative layers (scanlines, particles)
**Large HUD:** Scale factor ≥ 1.5× for low vision; tabular numerals preserved
**WCAG 2.2:** Focus appearance (2.4.11), fixed reference points (2.5.8), accessible authentication (3.3.8) — minimal game impact

---

## 5. Current Virtual Steering UI Audit (Snapshot)

### 5.1 Strengths

- **Token system** in `style.css :root` (57+ CSS custom properties)
- **Typography:** Orbitron (display), Rajdhani (HUD), Inter (body) — correct pairing
- **HUD:** Tiered hierarchy (position/speed/lap → time/score → alerts/flashes), tabular numerals, color-coded states
- **Ambient backgrounds:** Particles, perspective grid, aurora blobs, racing lane — motion-reduced respected
- **Glass cards:** `backdrop-filter: blur(12px)` with borders, shadows
- **Motion tokens:** fast/base/slow/cinematic, spring/snap easing
- **Touch controls:** 56px buttons, GAS/AUTO lifecycle, coarse-pointer media query
- **Responsive:** Breakpoints at 1000/800/600/380px; panel collapse on mobile
- **Reduced motion:** Global `animation-duration: 0.01ms` media query
- **Screen transitions:** NavigationSystem with slide/fade transitions
- **Color system:** Dark base, green accent, gold (1st), blue (info), cyan (combo/draft)

### 5.2 Weaknesses / Opportunities

| Screen                 | Current State                                               | P15 Target                                                                                                  |
| ---------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Main Menu**          | Title + subtitle + profile strip + action list + ambient bg | Hero 3D car, animated gradient sky, stronger title treatment, staggered micro-entrances, glass action cards |
| **Track Select**       | Article.glass-card grid                                     | Large visual cards with track-map SVG, weather/time chips, medal overlays, parallax hover, horizontal rail  |
| **Mode Select**        | Glass cards with control chips                              | Compartmentalized mode cards, intent icons, difficulty/player badges, clear descriptions                    |
| **Garage**             | Skin grid with thumbnails                                   | 3D car preview (Three.js), cinematic camera stages, spec bars, cosmetic categories, glass sidebar           |
| **Profile**            | Hero level/title + stats + title progression + records      | Progression visualization (XP arc), achievement summary, animated stat counters                             |
| **Leaderboard**        | Table with tabs + empty state                               | Timing-tower style, current-player highlight, medal chips, filter pills, animated rank changes              |
| **Achievements**       | Category tabs + grid + progress bars                        | Collectible cards, rarity glow (data-driven), unlock animation, completion ring                             |
| **How-To-Play**        | 7-tab grid                                                  | Interactive demos, video/GIF placeholders, search/filter                                                    |
| **Settings**           | Settings rows with sliders/toggles                          | Glass panels, grouped tabs, live preview, reset confirmation                                                |
| **Transitions**        | slide-left/fade                                             | Shared-element transitions, page-shell persistence, staggered content                                       |
| **Micro-interactions** | Button hover/press, card active                             | Ripple, magnetic hover, magnetic press, progress shimmer, toast choreography                                |

### 5.3 Performance Guardrails (Preserve)

- P12 resource disposal (geometries, materials, textures)
- Dynamic resolution (FrameBudgetScaler: 2000ms window, 18ms drop threshold)
- Quality tiers (Performance/Balanced/Quality)
- Menu render gating (`game.render()` skipped while idle)
- Reduced motion global opt-out
- Mobile quality auto-downgrade

---

## 6. P15 Design Direction Synthesis

### Brand Identity

- **Primary Theme:** "Neon Velocity" — dark cyber-track at night, razor-thin light trails, precision data
- **Secondary Theme:** "Garage Prestige" — showroom lighting, carbon-fiber textures, gold accents for achievement
- **Emotional Tone:** High-adrenaline precision; clean, confident, not cluttered
- **Visual Metaphor:** The racing line — optimal path, glowing through darkness
- **Racing Identity:** Modern simcade — accessible depth, telemetry-grade clarity

### Color System (Semantic Tokens)

| Token                | Value                          | Role                             |
| -------------------- | ------------------------------ | -------------------------------- |
| `--bg`               | `#05070b`                      | Deep base (near-black)           |
| `--surface`          | `#0c0f14`                      | Panel/card background            |
| `--surface-elevated` | `#13171e`                      | Modal, toast, dropdown           |
| `--border`           | `rgba(255,255,255,0.05)`       | Subtle edges                     |
| `--border-bright`    | `rgba(255,255,255,0.12)`       | Hover/selected edges             |
| `--accent-primary`   | `#00ff66`                      | Primary action, speed, go, green |
| `--accent-gold`      | `#ffd700`                      | 1st place, premium, best         |
| `--accent-cyan`      | `#00e5ff`                      | Info, draft, combo, tech         |
| `--accent-red`       | `#e10600`                      | Danger, loss, collision          |
| `--accent-magenta`   | `#ff2d95`                      | Dirty air, warning               |
| `--text`             | `#ffffff`                      | Primary text                     |
| `--text-muted`       | `#8a8e9c`                      | Secondary labels                 |
| `--text-dim`         | `#4a4f5c`                      | Disabled/muted                   |
| `--glow-primary`     | `0 0 24px rgba(0,255,102,0.4)` | Primary glow                     |
| `--glow-gold`        | `0 0 24px rgba(255,215,0,0.5)` | Gold glow                        |
| `--glow-cyan`        | `0 0 24px rgba(0,229,255,0.4)` | Cyan glow                        |

### Typography System

| Role             | Font                       | Size/Weight/Spacing                               |
| ---------------- | -------------------------- | ------------------------------------------------- |
| **Display/Logo** | Orbitron                   | 36–48px, 900, `letter-spacing: 0.08em`, uppercase |
| **Heading 1**    | Orbitron                   | 28px, 800, `ls: 0.04em`                           |
| **Heading 2**    | Rajdhani                   | 20px, 700, `ls: 0.02em`                           |
| **Body**         | Inter                      | 14px, 500, `ls: 0`                                |
| **Body Small**   | Inter                      | 12px, 500                                         |
| **HUD Numeric**  | Rajdhani / Share Tech Mono | Tabular, 18–48px, 700–900                         |
| **Button**       | Orbitron                   | 12px, 700, `ls: 0.06em`, uppercase                |
| **Label/Meta**   | Rajdhani                   | 9–11px, 600, `ls: 0.1em`, uppercase               |

### Motion System (Tokens)

| Token                | Value                               | Use                                 |
| -------------------- | ----------------------------------- | ----------------------------------- |
| `--motion-instant`   | 50ms                                | Color/opacity hover                 |
| `--motion-fast`      | 120ms                               | Button press, tooltip               |
| `--motion-base`      | 200ms                               | Dropdown, tab switch, card entrance |
| `--motion-medium`    | 280ms                               | Modal, drawer, popover              |
| `--motion-slow`      | 400ms                               | Page transition, full sheet         |
| `--motion-cinematic` | 700ms                               | Hero entrance, first-run only       |
| `--ease-out`         | `cubic-bezier(0.22, 1, 0.36, 1)`    | Default entrance                    |
| `--ease-in-out`      | `cubic-bezier(0.65, 0, 0.35, 1)`    | Layout changes                      |
| `--ease-spring`      | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Celebration, bounce                 |
| `--ease-snap`        | `cubic-bezier(0.12, 0.8, 0.32, 1)`  | Quick UI snaps                      |
| `--stagger-interval` | 60ms                                | Sibling stagger                     |

### Component Language

- **Cards:** Glassmorphism (surface-elevated + 1px border-bright + backdrop-blur-12 + inset highlight + diagonal sheen)
- **Buttons:** Primary (accent-primary bg, white text, glow), Ghost (transparent, border-bright), Danger (accent-red)
- **Tabs:** Underline indicator + color shift, 120ms transition
- **Badges:** Pill, color-coded by role (gold=1st, cyan=info, green=success, red=danger, magenta=warning)
- **Progress:** Arc for circular (XP), bar with shimmer for linear
- **Chips:** Compact, icon+label, selectable with ring
- **Selectors:** Glass dropdown, searchable if >7 options
- **Modals:** Backdrop blur + scale entrance (280ms), focus trap
- **Tooltips:** 120ms delay, 8px offset, `prefers-reduced-motion` disables
- **Navigation:** Slide-left (forward), slide-right (back), fade (modal), shared-element where possible

---

## 7. Implementation Priority & File Map

### Phase F — Design System Files (New/Modified)

1. `src/style.css` — **Major overhaul**: consolidate tokens, add semantic colors, motion tokens, component base classes
2. `src/ui/tokens.ts` — Export TypeScript motion/color/z-index tokens for Three.js/TS use
3. `src/ui/ui.css` — Deprecate (fold into style.css) or keep for component-scoped utilities
4. `src/ui/components/Button.ts` — Add variants, ripple, magnetic hover
5. `src/ui/components/GlassCard.ts` — Premium glass, animated border, sheen
6. `src/ui/components/Screen.ts` — Shared entrance/exit choreography
7. `src/ui/core/AnimationSystem.ts` — Stagger helper, reduced-motion gate
8. `src/ui/core/TransitionSystem.ts` — Shared-element transitions

### Phase G — Screen Redesigns (Priority Order)

1. **MainMenuScreen.ts** — Hero 3D car (Three.js), animated sky, glass action cards, staggered entrance
2. **TrackSelectScreen.ts** — Visual cards with SVG track maps, weather chips, medal overlays, horizontal rail
3. **ModeSelectScreen.ts** — Compartmentalized mode cards, intent icons, badges
4. **GarageScreen.ts** — Three.js car preview, camera stages, spec bars, cosmetic categories
5. **ProfileScreen.ts** — XP arc, animated stat counters, achievement summary, title progression visualization
6. **LeaderboardScreen.ts** — Timing-tower style, player highlight, animated rank changes
7. **AchievementsScreen.ts** — Collectible cards, rarity glow, unlock animation, completion ring
8. **HowToPlayScreen.ts** — Interactive demos, search, better layout
9. **SettingsScreen.ts** — Glass panels, grouped tabs, live preview
10. **SplashScreen.ts** — Brand animation, progress ring
11. **LoadingScreen.ts** — Progress ring, tip carousel
12. **GameplayScreen.ts** — HUD polish (don't break readability)
13. **VictoryCeremony.ts** — Enhanced celebration
14. **ambient.ts** — Upgraded backgrounds (gradient sky, scanlines, grid)

---

## 8. Success Metrics (Visual QA Checklist)

- [ ] Main menu: hero car renders < 100ms, 60fps on mobile
- [ ] Track select: track-map SVGs load, horizontal rail scrolls smoothly
- [ ] Mode select: mode cards animate in < 300ms staggered
- [ ] Garage: 3D car preview < 200ms, camera stages smooth
- [ ] Profile: XP arc animates on load, stats count up
- [ ] Leaderboard: rank changes animate, current player highlighted
- [ ] Achievements: cards hover with glow, unlocked cards shimmer
- [ ] Transitions: 200–300ms, ease-out, no layout thrash
- [ ] Mobile: no horizontal overflow, touch targets ≥ 48px, text ≥ 14px
- [ ] Accessibility: reduced-motion disables all non-essential animation, focus visible, contrast ≥ 4.5:1
- [ ] Performance: quality tiers respected, FrameBudgetScaler unaffected, build size < +50KB gzipped

# P15 Competitive Analysis — Racing Game UI/UX Deep Dive

**Sources:** Forza Horizon 5/6, Need for Speed Heat/Unbound, Gran Turismo 7, Asphalt 8/9, F1 22/25, Rocket League, Cyberpunk 2077, iRacing, Horizon Chase, F1 Manager 23, automotive configurators (Mazda, AITO), Awwwards WebGL sites (HAOQI, PX PUSH, RiotX Arcane)

---

## Forza Horizon 5 / 6

**Strengths:**

- World-as-menu: open world is the menu, seamless transitions
- Forzavista / showroom: cinematic camera stages, photorealistic car presentation
- Accessibility: analog/digital speedo, units, colorblind/high-contrast, moving-background toggle (Can I Play That)
- Quality tiers + dynamic resolution + GPU lifecycle management

**Weaknesses (Anti-Patterns):**

- FH5 main menu: "Windows 8 Metro UI" — 6 tabs × 4–8 options = 30+ first-level choices → overwhelming, anxiety-inducing (Kritiqal)
- Settings/accessibility buried as one small block
- Notification spam, dopamine-badge popups, endlessly repopulating icons
- FH7: "Too much time spent fighting through menus" (UX Design)
- FH6: Customizable garages add depth but risk feature creep

**Lessons for P15:**

- **Restraint at entry point** — main menu must have ONE clear CTA + secondary nav
- **Garage as showcase** — but keep navigation flat
- **Accessibility baked in** — quality tiers, colorblind, high-contrast, reduced motion
- **Car owns the screen** in garage; UI is invisible support

---

## Need for Speed Heat / Unbound

**Strengths:**

- **Visual Signature:** "Reusable visual signature in vein of Battlefield's flare/fire... reflected across key art, menu BGs, illuminated AR & HUD elements... brings motion and intrigue" (Creative Pixels)
- **Garage as Front End:** "Campaign, online, matchmaking all start in garage... players constantly anchored to customized vehicle... immerses player and creates showcase for vehicle & achievements" (Creative Pixels)
- **UI as Vehicle Extension:** "Vibrant pop against urban/gritty backgrounds... anchoring UI around player's own upgraded vehicle"
- **Celebration Through State Change:** Speedometer changes color when boost ready — one cue = celebration + state
- **Track Cards:** "Large tiles with clear descriptions displayed in foreground, in front of 3D object and illuminated backgrounds... different camera perspectives create excitement" (Creative Pixels)
- **HUD:** "Serve information in glanceable way... without absolutely blocking the game world with boxes" (Sailesh Vaghela)

**Lessons for P15:**

- **Define a visual signature** — one repeatable motif (glow style, line language, color treatment)
- **Garage = hub** — player's car visible from menu
- **State-change = celebration** — color shift, pulse, glow when something important happens
- **Track selection = visual first** — map silhouettes, weather chips, illuminated previews
- **HUD minimal footprint** — edge placement, no boxes over world

---

## Gran Turismo 7

**Strengths:**

- **Collector Fantasy:** Menu books, café, car history, photographic presentation (Scapes)
- **HUD Realism:** Mimics real instrumentation; custom wordmark + neutral data sans with tabular figures
- **Brand/Museum Storytelling:** Each manufacturer has a pavilion; car acquisition has narrative
- **Photographic Presentation:** Scapes mode = photo mode as art

**Weaknesses:**

- **Hub friction:** GT Resort diegetic world criticized as "clunky," "iOS-app-like," "too many menus" (VGC, Upcomer)
- **License tests force menu exits repeatedly** — "every small speed bump forces you back to menu" (VGC)
- **Navigation depth** — too many layers for simple actions

**Lessons for P15:**

- **Diegetic charm ≠ good UX** — don't sacrifice navigation efficiency for world-building
- **Tabular numerals essential** for lap times, speed, gear, position
- **Collector fantasy works** — achievement/progression visualization should feel like a collection
- **Custom wordmark** for brand identity (Orbitron already does this)

---

## Asphalt 8 / 9 (Mobile-First)

**Strengths:**

- **Speed of Navigation:** Class filters (D–S), color-coded rank vs requirement (red/white/green)
- **Great UX = Invisible:** "Players won't remember details. The game will just feel right" (Gameloft)
- **Mode Grouping:** "Single" vs "Multiplayer" top-level split; social/leaderboard/profile consolidated
- **Vertical Side Tabs:** Work well for tall mobile screens
- **Spec Hierarchy:** Car + performance rank + stars + blueprints + 4 stats (Accel/Top Speed/Handling/Nitro)

**Lessons for P15:**

- **Color-code state, not just text** — rank vs requirement = instant scan
- **Group by intent** — single vs multiplayer, not alphabetical
- **Vertical layouts for mobile** — side tabs, stacked cards
- **Garage specs as scannable bars** — not walls of numbers

---

## F1 Games (22/25 / F1 Manager 23)

**Strengths:**

- **Broadcast Replication IS the Identity:** Timing tower (left), position deltas, tyre compounds, DRS/ERS bars, real TV presentation
- **Per-Element HUD Customization:** Position/size/opacity per widget (F1 2021 feedback)
- **Live Data Aesthetic:** AWS-style timing, green gained/red lost positions
- **F1 25 Identity:** "Engine-spark color palette, three-state type (Box/Apex/DRS), backgrounds abstracting motion blur/light trails/circuits" (Further Group)

**Lessons for P15:**

- **Timing tower pattern** for leaderboards — left rail, position + name + gap + status
- **Three-state type system** — static / momentum / max speed — maps to our menu/race/boost
- **Broadcast authenticity** — leaderboard = timing tower, not spreadsheet
- **Color coding gains/losses** — green up, red down

---

## Rocket League

**Strengths:**

- **Cognitive Load Reduction:** Play Menu redesign → Competitive / Casual / Offline / Private / Training cards
- **Item Shop:** "One or two featured items primary focus, secondary focus less rare" (Noah Watkins)
- **Car Individualization:** Goal replays show off customization; Item Pass preview on live 3D car body
- **Compartmentalization:** "Reduce clutter... don't give all gameplay options upfront" (Psyonix)

**Lessons for P15:**

- **Compartmentalize modes** — don't dump all options
- **Primary vs Secondary focus** — clear hierarchy on every screen
- **Live 3D preview** for cosmetics (garage, item shop equivalent)

---

## Cyberpunk 2077

**Strengths:**

- **Total Thematic Consistency:** FUI, diegetic HUD as "part of V's optic enhancements," curvature/chromatic aberration shaders
- **Context-Adaptive HUD:** Health hidden when full, stamina only when draining
- **Technical:** RT + compute bloom for glow; scanlines, chromatic aberration post-process

**Weaknesses (Anti-Patterns):**

- **Red used for everything** — ornament + warning + feedback = no functional color coding (Prototypr)
- **Superfluous "window dressing" competing with data**
- **Inconsistent heading system** across screens

**Lessons for P15:**

- **Semantic color roles** — each accent has ONE meaning (not decorative + functional)
- **Context-adaptive** — hide UI when not needed (e.g., HUD elements fade in straight sections)
- **Glow = post-process** not per-element CSS (performance)
- **Consistent heading hierarchy** across all screens

---

## Futuristic Automotive HMI (Nissan IMs, Lexus UX, Hyundai Mobis)

**Principles:**

- **Z-axis/Parallax for Hierarchy:** "Time-sensitive alerts move closer to driver's eyes... less critical info remains farther away"
- **Layered Transparent Displays:** Natural parallax creates depth
- **Single Omnipresent Background Pattern:** Unifies multi-screen transitions with shared stopping point
- **Holographic/HOE Windshield:** Eyes on road, data in peripheral vision

**Lessons for P15:**

- **Parallax backgrounds** unify screen transitions
- **Layered depth** (DOM foreground, WebGL background, post-process top)
- **Shared visual anchor** across transitions (e.g., the "racing line" glow persists)

---

## Awwwards WebGL Sites (HAOQI, PX PUSH, RiotX Arcane)

**Principles:**

- **"Let DOM and WebGL Share a Stage":** CSS owns structure/semantics/accessibility; WebGL only for depth/lighting/refraction CSS can't do
- **One Visual Thesis:** Dot-matrix language repeated in hover reveals, page transitions, loading
- **Motion Budget Per Surface:** Hero ≤3 staggered entrances; dashboard = micro-interactions only
- **HAOQI:** Clip-path/radial-mask reveals, text-scramble on shared ticker, scroll-velocity distortion
- **PX PUSH:** Scanline bar (8s loop), line pattern, soft bloom, vignette, animated noise — single component above app

**Lessons for P15:**

- **DOM + WebGL separation of concerns** — don't put layout in Three.js
- **Single visual language** repeated across all screens
- **Motion budgets** per screen type
- **Shared global effects** (scanlines, vignette, noise) as single mounted component

---

## Horizon Chase

**Strengths:**

- **Color-Coded Performance:** Red=default, blue=finished, gold=max, white=bonus — "prioritize colors instead of texts"
- **HUD Grouping:** Race position/time → left; car status → right; minimap moved off horizon (critical focus area)

**Lessons for P15:**

- **Color encoding > text** for instant scanning
- **Critical focus area** must be protected from UI occlusion

---

## Race Force Game UI (Behance)

- Photo + title cards, medal overlays (bronze/silver/gold), horizontal rail with paging, bright-yellow parallelogram for selected state (controller)

---

## Minimalist F1 Circuit Collection

- Layered SVG strokes (glow→core→highlight), draw-on animation, per-track accent colors, hover scale/glow, fullscreen detail modal

---

## Summary: P15 Design DNA (Synthesized)

| Principle                    | Source           | P15 Application                                                  |
| ---------------------------- | ---------------- | ---------------------------------------------------------------- |
| **Visual Signature**         | NFS Heat         | One repeatable glow/line motif across all screens                |
| **Garage as Hub**            | NFS Unbound      | Player's car visible from main menu; 3D preview                  |
| **Track Map in Card**        | Forza Community  | SVG track silhouettes on every track card                        |
| **Color-Coded State**        | Asphalt 9 / F1   | Rank gaps green/red, draft optimal/cyan, dirty/magenta           |
| **Timing Tower Leaderboard** | F1 Broadcast     | Left rail, position + name + gap + compound                      |
| **Compartmentalized Modes**  | Rocket League    | Mode cards grouped by intent (Solo/MP/Training)                  |
| **Three-State Type**         | F1 25            | Box (static) / Apex (momentum) / DRS (max) → Menu / Race / Boost |
| **Semantic Color Roles**     | Cyberpunk        | Each accent = ONE function only                                  |
| **DOM + WebGL Separation**   | Awwwards         | CSS layout, Three.js depth/lighting only                         |
| **Motion Budgets**           | Awwwards         | Hero ≤3 staggers, dashboard = micro only                         |
| **Context-Adaptive HUD**     | Cyberpunk        | Hide non-critical in straight sections                           |
| **Tabular Numerals**         | GT / TelemetryIQ | All HUD numbers tabular                                          |
| **Critical Focus Area**      | NFS Heat / Kraj  | Diamond zone around horizon — never occlude                      |
| **State-Change Celebration** | NFS Unbound      | Color shift/pulse when boost ready, rank up, etc.                |
| **Restraint at Entry**       | FH5 anti-pattern | Main menu = 1 primary CTA + flat secondary nav                   |

---

## File: docs/p15-research/P15-COMPETITIVE-ANALYSIS.md

# P15 Visual Design Direction — Synthesized Brand Identity

**Status:** APPROVED FOR IMPLEMENTATION  
**Based on:** P15-UIUX-RESEARCH.md + P15-COMPETITIVE-ANALYSIS.md + Current Virtual Steering audit

---

## 1. Brand Identity

| Attribute                | Definition                                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Primary Visual Theme** | **Neon Velocity** — Dark cyber-track at night, razor-thin light trails cutting through atmosphere, precision telemetry glowing in the periphery |
| **Secondary Theme**      | **Garage Prestige** — Showroom lighting on carbon-fiber, gold accents for mastery, tactile material contrast                                    |
| **Emotional Tone**       | High-adrenaline precision; clean, confident, not cluttered; "this game respects my time and skill"                                              |
| **Visual Metaphor**      | **The Racing Line** — The optimal path, glowing through darkness, connecting all screens as a continuous thread                                 |
| **Racing Identity**      | Modern simcade — Accessible depth, telemetry-grade clarity, no compromise on readability                                                        |
| **Differentiator**       | The only browser racing game where the UI _is_ the racing line — every transition, every glow, every number follows the same visual grammar     |

---

## 2. Color System — Semantic Tokens

**Philosophy:** Dark base → Panel layer → Muted info layer → **Vivid action layer (reserved for meaning only)**. Action colors NEVER appear in base layers.

### Core Palette (CSS Custom Properties)

```css
:root {
  /* Ground — deep, near-black, reduces glare */
  --bg: #05070b;
  --bg-elevated: #0a0d13;
  --surface: #0c0f14; /* Cards, panels */
  --surface-elevated: #13171e; /* Modals, toasts, dropdowns */

  /* Translucent Glass */
  --glass: rgba(255, 255, 255, 0.03);
  --glass-strong: rgba(255, 255, 255, 0.06);
  --glass-border: rgba(255, 255, 255, 0.08);

  /* Borders — hierarchy of prominence */
  --border: rgba(255, 255, 255, 0.05);
  --border-bright: rgba(255, 255, 255, 0.12); /* Hover, selected */
  --border-hot: rgba(255, 255, 255, 0.2); /* Pressed, focus */

  /* Semantic Accents — ONE meaning each */
  --accent-primary: #00ff66; /* GO, speed, primary CTA, success */
  --accent-primary-dim: rgba(0, 255, 102, 0.15);
  --accent-gold: #ffd700; /* 1st place, premium, best, mastery */
  --accent-gold-dim: rgba(255, 215, 0, 0.15);
  --accent-cyan: #00e5ff; /* INFO, draft, combo, tech, slipstream */
  --accent-cyan-dim: rgba(0, 229, 255, 0.12);
  --accent-red: #e10600; /* DANGER, loss, collision, error */
  --accent-red-dim: rgba(225, 6, 0, 0.15);
  --accent-magenta: #ff2d95; /* WARNING, dirty air, near-miss */
  --accent-magenta-dim: rgba(255, 45, 149, 0.12);

  /* Text — clear hierarchy */
  --text: #ffffff; /* Primary */
  --text-muted: #8a8e9c; /* Secondary labels, meta */
  --text-dim: #4a4f5c; /* Disabled, placeholder */

  /* Glows — post-process friendly values */
  --glow-primary: 0 0 24px rgba(0, 255, 102, 0.4);
  --glow-gold: 0 0 24px rgba(255, 215, 0, 0.5);
  --glow-cyan: 0 0 24px rgba(0, 229, 255, 0.4);
  --glow-red: 0 0 24px rgba(225, 6, 0, 0.4);
  --glow-magenta: 0 0 24px rgba(255, 45, 149, 0.4);

  /* Shadows */
  --shadow-card: 0 8px 32px rgba(0, 0, 0, 0.4);
  --shadow-modal: 0 20px 60px rgba(0, 0, 0, 0.55);
  --shadow-glow: 0 0 32px rgba(0, 255, 102, 0.2);
}
```

### Color Role Assignments (Enforced)

| Role                            | Token              | Example Usage                                                        |
| ------------------------------- | ------------------ | -------------------------------------------------------------------- |
| Primary Action / Go / Speed     | `--accent-primary` | Race button, speed numbers, boost bar fill                           |
| 1st Place / Premium / Best      | `--accent-gold`    | Position 1, ceremony crown, max combo, unlocked mastery achievements |
| Info / Tech / Draft / Combo     | `--accent-cyan`    | Draft meter, combo counter, telemetry, slipstream                    |
| Danger / Loss / Error           | `--accent-red`     | Position loss, collision flash, error toast, gear shift warning      |
| Warning / Dirty Air / Near-Miss | `--accent-magenta` | Dirty air indicator, near-miss glow, validation warning              |

**Anti-Pattern Check:** Never use `--accent-primary` decoratively. Never use `--accent-gold` for non-premium. Never mix red/green for colorblind-safe states without redundant encoding.

---

## 3. Typography System

### Font Stack (Google Fonts, OFL — already in index.html)

```html
<!-- Preload in index.html -->
<link
  rel="preload"
  as="font"
  crossorigin
  href="https://fonts.gstatic.com/s/orbitron/v18/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nyGy6BoWU.woff2"
/>
<link
  rel="preload"
  as="font"
  crossorigin
  href="https://fonts.gstatic.com/s/rajdhani/v21/LDI1apCSOBg7S-QT7pbq.woff2"
/>
<link
  rel="preload"
  as="font"
  crossorigin
  href="https://fonts.gstatic.com/s/inter/v19/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2"
/>
<link
  rel="preload"
  as="font"
  crossorigin
  href="https://fonts.gstatic.com/s/sharetechmono/v12/4UaHrENHsxJlGDuGo1IAIlT3Xw.woff2"
/>
```

### Type Scale (Mobile-first, clamp() for fluid scaling)

| Role               | Font                       | Desktop                    | Mobile                     | Weight  | Letter-Spacing | Transform |
| ------------------ | -------------------------- | -------------------------- | -------------------------- | ------- | -------------- | --------- |
| **Display / Logo** | Orbitron                   | `clamp(32px, 5vw, 48px)`   | `clamp(24px, 6vw, 32px)`   | 900     | `0.08em`       | Uppercase |
| **Heading 1**      | Orbitron                   | `clamp(24px, 3.5vw, 28px)` | `clamp(20px, 5vw, 24px)`   | 800     | `0.04em`       | Uppercase |
| **Heading 2**      | Rajdhani                   | `clamp(18px, 2.5vw, 20px)` | `clamp(16px, 3.5vw, 18px)` | 700     | `0.02em`       | —         |
| **Heading 3**      | Rajdhani                   | `16px`                     | `14px`                     | 600     | `0.02em`       | —         |
| **Body**           | Inter                      | `14px`                     | `14px`                     | 500     | `0`            | —         |
| **Body Small**     | Inter                      | `12px`                     | `12px`                     | 500     | `0`            | —         |
| **Label / Meta**   | Rajdhani                   | `11px`                     | `10px`                     | 600     | `0.1em`        | Uppercase |
| **Button**         | Orbitron                   | `12px`                     | `11px`                     | 700     | `0.06em`       | Uppercase |
| **HUD Numeric**    | Rajdhani / Share Tech Mono | `tabular-nums`             | `tabular-nums`             | 700–900 | —              | —         |

### CSS Implementation

```css
:root {
  /* Fluid type scale */
  --fs-display: clamp(32px, 5vw, 48px);
  --fs-h1: clamp(24px, 3.5vw, 28px);
  --fs-h2: clamp(18px, 2.5vw, 20px);
  --fs-h3: 16px;
  --fs-body: 14px;
  --fs-body-sm: 12px;
  --fs-label: 11px;
  --fs-btn: 12px;
  --fs-hud-lg: clamp(36px, 4vw, 48px);
  --fs-hud-md: clamp(20px, 2.5vw, 24px);
  --fs-hud-sm: 14px;

  /* Font families */
  --ff-display: 'Orbitron', 'Rajdhani', system-ui, sans-serif;
  --ff-hud: 'Rajdhani', 'Share Tech Mono', system-ui, sans-serif;
  --ff-body: 'Inter', system-ui, sans-serif;
  --ff-mono: 'Share Tech Mono', 'JetBrains Mono', monospace;

  /* Tabular numerals utility */
  --tabular: tabular-nums;
}
```

### Usage Rules

- **Orbitron:** Logo, H1, Buttons, Countdown numbers — NEVER body text
- **Rajdhani:** H2, H3, Labels, HUD readouts, numeric data
- **Inter:** All body text, descriptions, tooltips, settings labels
- **Share Tech Mono:** Timers, leaderboards, precise tabular data
- **Tabular figures mandatory** for: speed, position, lap, time, score, combo, any columnar data

---

## 4. Component Language

### 4.1 Glass Card (The Universal Container)

```css
.card-premium {
  background: var(--surface-elevated);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg); /* 16px */
  backdrop-filter: blur(12px) saturate(160%);
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

/* Inset highlight (top rim) */
.card-premium::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 40%);
  pointer-events: none;
}

/* Diagonal sheen (liquid glass) */
.card-premium::after {
  content: '';
  position: absolute;
  inset: -50%;
  background: linear-gradient(115deg, transparent 40%, rgba(255, 255, 255, 0.12) 50%, transparent 60%);
  transform: translateX(-100%);
  transition: transform 0.6s var(--ease-out);
  pointer-events: none;
  mix-blend-mode: screen;
}
.card-premium:hover::after {
  transform: translateX(100%);
}
```

**States:**

- Default: as above
- Hover: border → `--border-bright`, subtle scale(1.015), sheen animates
- Selected: border → `--accent-primary` (or semantic), glow `--glow-primary`
- Disabled: opacity 0.5, no hover

### 4.2 Buttons

```css
.btn {
  font-family: var(--ff-display);
  font-size: var(--fs-btn);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-radius: var(--radius-sm); /* 8px */
  padding: 12px 24px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--motion-fast) var(--ease-out);
  position: relative;
  overflow: hidden;
}

/* Primary — accent-primary */
.btn-primary {
  background: var(--accent-primary);
  color: #000;
  box-shadow: var(--glow-primary);
}
.btn-primary:hover {
  background: #1aff77;
  transform: translateY(-1px);
  box-shadow: 0 8px 32px rgba(0, 255, 102, 0.5);
}
.btn-primary:active {
  transform: scale(0.97);
  box-shadow: var(--glow-primary);
}

/* Ghost — transparent, border-bright */
.btn-ghost {
  background: transparent;
  color: var(--text);
  border-color: var(--border-bright);
}
.btn-ghost:hover {
  background: var(--glass-strong);
  border-color: var(--border-hot);
  color: var(--text);
}

/* Danger */
.btn-danger {
  background: var(--accent-red);
  color: #fff;
  box-shadow: var(--glow-red);
}

/* Ripple (JS) — prefers-reduced-motion respected */
```

### 4.3 Tabs

```css
.tab-bar {
  display: flex;
  gap: 4px;
  background: var(--glass);
  border-radius: var(--radius);
  padding: 4px;
}

.tab {
  flex: 1;
  padding: 8px 16px;
  font-family: var(--ff-hud);
  font-size: var(--fs-label);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  background: transparent;
  border: none;
  border-radius: calc(var(--radius) - 4px);
  cursor: pointer;
  transition: all var(--motion-fast) var(--ease-out);
  position: relative;
}

.tab:hover {
  color: var(--text);
}

.tab.active {
  color: var(--accent-primary);
  background: var(--accent-primary-dim);
}
.tab.active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  background: var(--accent-primary);
  border-radius: 2px;
  animation: tabIndicatorIn var(--motion-fast) var(--ease-out);
}
@keyframes tabIndicatorIn {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 24px;
    opacity: 1;
  }
}
```

### 4.4 Badges / Chips

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  font-family: var(--ff-hud);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.badge-primary {
  background: var(--accent-primary-dim);
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary);
}
.badge-gold {
  background: var(--accent-gold-dim);
  color: var(--accent-gold);
  border: 1px solid var(--accent-gold);
}
.badge-cyan {
  background: var(--accent-cyan-dim);
  color: var(--accent-cyan);
  border: 1px solid var(--accent-cyan);
}
.badge-red {
  background: var(--accent-red-dim);
  color: var(--accent-red);
  border: 1px solid var(--accent-red);
}
.badge-magenta {
  background: var(--accent-magenta-dim);
  color: var(--accent-magenta);
  border: 1px solid var(--accent-magenta);
}
```

### 4.5 Progress (Arc + Bar)

```css
/* Circular XP Arc */
.progress-arc {
  width: 80px;
  height: 80px;
  transform: rotate(-90deg);
}
.progress-arc-bg {
  fill: none;
  stroke: var(--border);
  stroke-width: 6;
}
.progress-arc-fill {
  fill: none;
  stroke: var(--accent-primary);
  stroke-width: 6;
  stroke-linecap: round;
  stroke-dasharray: 251; /* 2πr */
  stroke-dashoffset: 251;
  transition: stroke-dashoffset var(--motion-medium) var(--ease-out);
  filter: drop-shadow(0 0 6px rgba(0, 255, 102, 0.4));
}

/* Linear with shimmer */
.progress-bar {
  height: 6px;
  border-radius: 3px;
  background: var(--glass);
  overflow: hidden;
  position: relative;
}
.progress-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-gold));
  border-radius: 3px;
  transition: width var(--motion-medium) var(--ease-out);
}
.progress-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
[data-reduced-motion='true'] .progress-fill::after {
  animation: none;
}
```

---

## 5. Screen-Specific Visual Specs

### 5.1 Main Menu — Priority 1

**Composition:**

```
┌─────────────────────────────────────────────────────────────┐
│  NAV BAR (logo + cam status + settings)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     [THREE.JS HERO CAR]          [GLASS ACTION CARDS]       │
│     - Rotating slowly            - Race (primary, large)    │
│     - Showroom lighting          - Garage, Profile,         │
│     - Environment reflections    - Leaderboards,            │
│     - Camera stages on hover     - Achievements             │
│                                 - Settings, How-to-Play     │
│                                                             │
│     [DRIVER PROFILE STRIP]                                 │
│     Level • Title • XP Arc • Coins • Races                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Visual Signature:** The "racing line" — a thin glowing curve that flows from the car's rear, through the action cards, to the profile strip. Persists across transitions.

**Animations:**

- Car: Slow Y-rotation (20s loop), pauses on hover → camera stage dolly
- Action cards: Staggered slide-in-up (60ms interval), 280ms each
- Profile strip: Fade-in + XP arc draw (400ms)
- Racing line: Draw-on SVG path (800ms, ease-out)

### 5.2 Track Select — Priority 2

**Card Design:**

```
┌──────────────────────────────────────────────────────┐
│  [TRACK MAP SVG]  ← Large, layered strokes           │
│     glow → core → highlight                          │
│     Draw-on animation on entrance                    │
├──────────────────────────────────────────────────────┤
│  [TRACK NAME]        [WEATHER ICON] [TIME CHIP]      │
│  Cyber City              ☀️ Day      🌧️ Wet          │
├──────────────────────────────────────────────────────┤
│  [BEST TIME]       [DIFFICULTY STARS]                │
│  1:23.456            ⭐⭐⭐☆☆                          │
│  [MEDAL IF RACED]  🥇  🥈  🥉                         │
└──────────────────────────────────────────────────────┘
```

**Layout:** Horizontal rail (scroll-snap), 320px cards, 16px gap, centered selected card
**Interaction:** Wheel/trackpad scroll, click/drag, keyboard arrows, gamepad D-pad
**Selection:** Card scales 1.05, border → accent-primary, racing line connects to mode select

### 5.3 Mode Select — Priority 3

**Card Design (per mode):**

```
┌──────────────────────────────────────────────────────┐
│  [ICON]  [MODE NAME]              [PLAYER COUNT]     │
│  🏁      Endless Survival           1                │
├──────────────────────────────────────────────────────┤
│  [SHORT DESCRIPTION]                                   │
│  Survive endless waves. No laps, pure distance.        │
├──────────────────────────────────────────────────────┤
│  [DIFFICULTY]    [CONTROL METHODS]                     │
│  ●●○○○           ✋ ⌨️ 📱 🎮                           │
└──────────────────────────────────────────────────────┘
```

**Groups:** Solo / Multiplayer / Training (Rocket League pattern)
**Visual:** Color-coded group headers, compartmentalized cards

### 5.4 Garage — Priority 4

**Layout:**

```
┌────────────────────────────────────────────────────────────────┐
│  [THREE.JS CAR PREVIEW — 70%]    [GLASS SIDEBAR — 30%]        │
│  - Camera stages: Exterior → Rear → Interior → Detail         │
│  - Smooth dolly between stages (600ms)                        │
│  - Environment: Showroom HDRI (Poly Haven CC0)                │
│  - Emissive materials for neon accents                        │
│                                                                │
│  [COSMETIC CATEGORIES]                                         │
│  Skins ▸  Neons ▸  Wheels  (tab bar)                          │
│                                                                │
│  [SELECTED ITEM CARD]                                          │
│  Name • Preview • Stats • [Equip / Preview]                   │
│                                                                │
│  [SPEC BARS]  Accel ████████░░  Top Speed ██████░░░░          │
│               Handling ██████████  Nitro ████████░░           │
└────────────────────────────────────────────────────────────────┘
```

### 5.5 Profile — Priority 5

**Visual:**

- **XP Arc** (circular progress) — large, animated draw on load
- **Stat Counters** — count-up animation (1000ms, ease-out)
- **Title Progression** — vertical timeline with glowing current tier
- **Best Records** — timing-tower style mini leaderboard
- **Achievement Summary** — 3 most recent unlocks with shimmer

### 5.6 Leaderboard — Priority 6

**Timing Tower Layout:**

```
┌──────────────────────────────────────────────────────┐
│  [TABS]  Global  |  By Track  |  By Mode             │
├──────────────────────────────────────────────────────┤
│  🏁  LOCAL LEADERBOARDS — This device only           │
├──────────────────────────────────────────────────────┤
│  [FILTER PILLS]  Cyber City  ▼   Survival  ▼         │
├──────────────────────────────────────────────────────┤
│  #  PLAYER          SCORE      DATE        GAP       │
│  1  ▶ YOU ◀         1,234,567  Today        —        │  ← highlight
│  2  Racer_X         1,198,234  Yesterday    +36,333  │  ← green gap
│  3  SpeedDemon      1,156,789  3 days ago   +77,778  │
│  ...                                               │
└──────────────────────────────────────────────────────┘
```

**Animations:** Rank changes slide + color flash; current player row pulses subtly

### 5.7 Achievements — Priority 7

**Card States:**

```
LOCKED:          UNLOCKED:              MASTERY (rare):
┌──────────┐     ┌──────────────┐      ┌──────────────────┐
│  🔒      │     │  🥇  🏎️     │      │  ⭐⭐⭐  🏎️       │
│  Name    │     │  First Race  │      │  Survival Master │
│  Desc    │     │  Complete 1  │      │  100 races       │
│  ████░░  │     │  ████████ 100%│     │  ██████████ 100% │
│  0/1     │     │  +500 XP     │      │  +50,000 XP      │
└──────────┘     └──────────────┘      └──────────────────┘
   dimmed          accent-primary         gold glow + shimmer
```

**Rarity Glow:** Only for achievements where `category === 'mastery'` AND `progress.target ≥ 50` (data-driven, not invented)
**Unlock Animation:** Scale pop (spring) + shimmer sweep + XP arc increment

---

## 6. Motion Choreography

### Global Rules

- **Stagger interval:** 60ms (cards), 40ms (list items)
- **Max stagger items:** 8 (beyond feels slow)
- **Entrance:** `slide-in-up` + fade, 280ms, ease-out
- **Exit:** 75% of entrance duration, ease-in
- **Shared-element transitions:** Track card → Mode select (racing line), Mode → Race (camera dolly)

### Screen Transition Map

| From → To                  | Transition                      | Duration | Notes                              |
| -------------------------- | ------------------------------- | -------- | ---------------------------------- |
| Splash → Menu              | Fade + scale                    | 600ms    | Brand animation completes          |
| Menu → Track Select        | Slide-left + shared racing line | 300ms    | Racing line morphs to track rail   |
| Track Select → Mode Select | Slide-left + card scale         | 280ms    | Selected track card becomes header |
| Mode Select → Race         | Camera dolly + fade             | 400ms    | Car dolly into cockpit view        |
| Race → Victory             | Fade to black → Ceremony        | 500ms    | Dramatic pause                     |
| Victory → Results          | Slide-up                        | 300ms    | Crown drop animation               |
| Results → Menu             | Slide-right                     | 280ms    | Racing line retraces               |

---

## 7. Mobile Adaptations (Pixel 5: 393×851)

### Breakpoint Adjustments

| Element      | Desktop                  | Mobile (≤600px)                                                              |
| ------------ | ------------------------ | ---------------------------------------------------------------------------- |
| Main Menu    | Side-by-side car + cards | Stacked: Car (40vh) → Cards (scroll)                                         |
| Track Select | Horizontal rail          | Vertical stack, full-width cards                                             |
| Mode Select  | Grid                     | Stacked cards, grouped headers                                               |
| Garage       | 70/30 split              | Tabs: Preview / Cosmetics / Specs                                            |
| Profile      | Multi-column             | Single column, collapsible sections                                          |
| Leaderboard  | Table + sidebar          | Horizontal scroll table, sticky # column                                     |
| Achievements | 3-col grid               | 1-col stack, larger cards                                                    |
| HUD          | Corner clusters          | AI HUD rail (right), Touch controls (left/bottom), Speed cluster above accel |

### Touch Targets

- All interactive: ≥ 48×48px (Apple/Google minimum)
- Bottom tab bar: 56px height, 4–5 items max
- Swipe gestures: Horizontal for track/mode rail, vertical for garage specs

---

## 8. Accessibility Commitments

- **Contrast:** All text ≥ 4.5:1; critical interactive ≥ 7:1
- **Reduced Motion:** Disables all non-essential animation (particles, parallax, shimmer, stagger > 1 item); keeps state communication (progress fills, rank pulses)
- **Focus Visible:** 2px offset outline, `--accent-primary` color, never removed
- **Colorblind:** Red/Green never sole encoding; always icon + text + shape
- **High Contrast Mode:** Forces borders, increases text weight, swaps to `--bg: #000, --text: #fff, --accent-primary: #0f0`
- **Semantic HTML:** Buttons are `<button>`, progress is `<progress role="progressbar">`, live regions for HUD updates
- **Scaling:** `--scale` CSS var (1–1.5) for large HUD accessibility

---

## 9. Performance Budget

| Metric             | Target                         |
| ------------------ | ------------------------------ |
| CSS gzipped        | < 25 KB (current ~18 KB)       |
| Three.js hero car  | < 100 KB glTF (Kenney CC0)     |
| Fonts (preloaded)  | < 150 KB total (WOFF2, subset) |
| Background effects | ≤ 2 ms GPU/frame on mobile     |
| Glass blur         | ≤ 12px, never animated         |
| Particles          | ≤ 30 on mobile, ≤ 60 desktop   |
| Frame Budget       | Dynamic resolution preserved   |

---

## 10. Asset Licenses (Verified)

| Asset              | Source            | License | Use                                  |
| ------------------ | ----------------- | ------- | ------------------------------------ |
| Orbitron           | Google Fonts      | OFL 1.1 | Display                              |
| Rajdhani           | Google Fonts      | OFL 1.1 | HUD/Headings                         |
| Inter              | Google Fonts      | OFL 1.1 | Body                                 |
| Share Tech Mono    | Google Fonts      | OFL 1.1 | Timers                               |
| Phosphor Icons     | phosphoricons.com | MIT     | UI Icons                             |
| Kenney Car Kit     | kenney.nl         | CC0 1.0 | Hero car, garage preview             |
| Poly Haven HDRIs   | polyhaven.com     | CC0 1.0 | Showroom lighting                    |
| ambientCG Textures | ambientcg.com     | CC0 1.0 | Track surfaces (procedural fallback) |
| Kenney UI Sounds   | kenney.nl         | CC0 1.0 | Button clicks, UI feedback           |

**All assets self-hosted or CDN with integrity hashes. No runtime API calls requiring attribution.**

---

## File: docs/p15-research/P15-VISUAL-DESIGN-DIRECTION.md

# P15 Design System — Component & Token Specification

**Status:** IMPLEMENTATION READY  
**Source:** P15-VISUAL-DESIGN-DIRECTION.md

---

## 1. Token Export (TypeScript + CSS)

### 1.1 `src/ui/tokens.ts` — Extended

```typescript
// Motion tokens (from existing + new)
export const MotionTokens = {
  duration: {
    instant: 50,
    fast: 120,
    base: 200,
    medium: 280,
    slow: 400,
    cinematic: 700,
    ambient: 1800,
  },
  easing: {
    out: 'cubic-bezier(0.22, 1, 0.36, 1)',
    inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    snap: 'cubic-bezier(0.12, 0.8, 0.32, 1)',
    // New
    in: 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',
  },
  stagger: {
    interval: 60,
    maxItems: 8,
  },
} as const;

export const ZTokens = {
  screen: 10,
  header: 20,
  modal: 100,
  toast: 200,
  overlay: 300,
  hud: 50,
  aiHud: 150,
  ceremony: 200,
  flash: 250,
} as const;

export const Breakpoints = {
  mobile: 600,
  tablet: 800,
  desktop: 1000,
  wide: 1280,
} as const;

export type BreakpointName = 'mobile' | 'tablet' | 'desktop' | 'wide';

// Color tokens (mirror CSS :root for TS access)
export const ColorTokens = {
  bg: '#05070b',
  bgElevated: '#0a0d13',
  surface: '#0c0f14',
  surfaceElevated: '#13171e',
  glass: 'rgba(255,255,255,0.03)',
  glassStrong: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.05)',
  borderBright: 'rgba(255,255,255,0.12)',
  borderHot: 'rgba(255,255,255,0.2)',
  accentPrimary: '#00ff66',
  accentPrimaryDim: 'rgba(0,255,102,0.15)',
  accentGold: '#ffd700',
  accentGoldDim: 'rgba(255,215,0,0.15)',
  accentCyan: '#00e5ff',
  accentCyanDim: 'rgba(0,229,255,0.12)',
  accentRed: '#e10600',
  accentRedDim: 'rgba(225,6,0,0.15)',
  accentMagenta: '#ff2d95',
  accentMagentaDim: 'rgba(255,45,149,0.12)',
  text: '#ffffff',
  textMuted: '#8a8e9c',
  textDim: '#4a4f5c',
  glowPrimary: '0 0 24px rgba(0,255,102,0.4)',
  glowGold: '0 0 24px rgba(255,215,0,0.5)',
  glowCyan: '0 0 24px rgba(0,229,255,0.4)',
  glowRed: '0 0 24px rgba(225,6,0,0.4)',
  glowMagenta: '0 0 24px rgba(255,45,149,0.4)',
  shadowCard: '0 8px 32px rgba(0,0,0,0.4)',
  shadowModal: '0 20px 60px rgba(0,0,0,0.55)',
} as const;

export const RadiusTokens = {
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '24px',
  pill: '999px',
} as const;

export const FontTokens = {
  display: "'Orbitron', 'Rajdhani', system-ui, sans-serif",
  hud: "'Rajdhani', 'Share Tech Mono', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'Share Tech Mono', 'JetBrains Mono', monospace",
} as const;

export const TabularNums = 'tabular-nums';
```

### 1.2 CSS `:root` — Consolidated (replaces current style.css tokens)

```css
:root {
  /* Motion */
  --motion-instant: 50ms;
  --motion-fast: 120ms;
  --motion-base: 200ms;
  --motion-medium: 280ms;
  --motion-slow: 400ms;
  --motion-cinematic: 700ms;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in: cubic-bezier(0.55, 0.06, 0.68, 0.19);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-snap: cubic-bezier(0.12, 0.8, 0.32, 1);
  --stagger-interval: 60ms;

  /* Z-index */
  --z-screen: 10;
  --z-header: 20;
  --z-modal: 100;
  --z-toast: 200;
  --z-overlay: 300;
  --z-hud: 50;
  --z-ai-hud: 150;
  --z-ceremony: 200;
  --z-flash: 250;

  /* Colors — Semantic */
  --bg: #05070b;
  --bg-elevated: #0a0d13;
  --surface: #0c0f14;
  --surface-elevated: #13171e;
  --glass: rgba(255, 255, 255, 0.03);
  --glass-strong: rgba(255, 255, 255, 0.06);
  --glass-border: rgba(255, 255, 255, 0.08);
  --border: rgba(255, 255, 255, 0.05);
  --border-bright: rgba(255, 255, 255, 0.12);
  --border-hot: rgba(255, 255, 255, 0.2);
  --accent-primary: #00ff66;
  --accent-primary-dim: rgba(0, 255, 102, 0.15);
  --accent-gold: #ffd700;
  --accent-gold-dim: rgba(255, 215, 0, 0.15);
  --accent-cyan: #00e5ff;
  --accent-cyan-dim: rgba(0, 229, 255, 0.12);
  --accent-red: #e10600;
  --accent-red-dim: rgba(225, 6, 0, 0.15);
  --accent-magenta: #ff2d95;
  --accent-magenta-dim: rgba(255, 45, 149, 0.12);
  --text: #ffffff;
  --text-muted: #8a8e9c;
  --text-dim: #4a4f5c;
  --glow-primary: 0 0 24px rgba(0, 255, 102, 0.4);
  --glow-gold: 0 0 24px rgba(255, 215, 0, 0.5);
  --glow-cyan: 0 0 24px rgba(0, 229, 255, 0.4);
  --glow-red: 0 0 24px rgba(225, 6, 0, 0.4);
  --glow-magenta: 0 0 24px rgba(255, 45, 149, 0.4);
  --shadow-card: 0 8px 32px rgba(0, 0, 0, 0.4);
  --shadow-modal: 0 20px 60px rgba(0, 0, 0, 0.55);

  /* Radius */
  --radius-sm: 6px;
  --radius: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-pill: 999px;

  /* Typography */
  --ff-display: 'Orbitron', 'Rajdhani', system-ui, sans-serif;
  --ff-hud: 'Rajdhani', 'Share Tech Mono', system-ui, sans-serif;
  --ff-body: 'Inter', system-ui, sans-serif;
  --ff-mono: 'Share Tech Mono', 'JetBrains Mono', monospace;
  --tabular: tabular-nums;

  /* Fluid type */
  --fs-display: clamp(32px, 5vw, 48px);
  --fs-h1: clamp(24px, 3.5vw, 28px);
  --fs-h2: clamp(18px, 2.5vw, 20px);
  --fs-h3: 16px;
  --fs-body: 14px;
  --fs-body-sm: 12px;
  --fs-label: 11px;
  --fs-btn: 12px;
  --fs-hud-lg: clamp(36px, 4vw, 48px);
  --fs-hud-md: clamp(20px, 2.5vw, 24px);
  --fs-hud-sm: 14px;

  /* UI Scale (a11y) */
  --scale: 1;

  /* Breakpoints (for JS) */
  --bp-mobile: 600px;
  --bp-tablet: 800px;
  --bp-desktop: 1000px;
  --bp-wide: 1280px;
}
```

---

## 2. Component Base Classes (CSS)

### 2.1 Premium Glass Card

```css
/* Base card — all screen cards extend this */
.card {
  background: var(--surface-elevated);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(12px) saturate(160%);
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

/* Inset highlight */
.card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 40%);
  pointer-events: none;
}

/* Diagonal sheen */
.card::after {
  content: '';
  position: absolute;
  inset: -50%;
  background: linear-gradient(115deg, transparent 40%, rgba(255, 255, 255, 0.12) 50%, transparent 60%);
  transform: translateX(-100%);
  transition: transform 0.6s var(--ease-out);
  pointer-events: none;
  mix-blend-mode: screen;
}

.card:hover::after {
  transform: translateX(100%);
}

/* States */
.card-selected {
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-card), var(--glow-primary);
}

.card-disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .card::after {
    display: none;
  }
  .card {
    transition: none !important;
  }
}
```

### 2.2 Button System

```css
.btn {
  font-family: var(--ff-display);
  font-size: var(--fs-btn);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-radius: var(--radius-sm);
  padding: 12px 24px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--motion-fast) var(--ease-out);
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px; /* a11y touch target */
  min-width: 48px;
}

/* Primary */
.btn-primary {
  background: var(--accent-primary);
  color: #000;
  box-shadow: var(--glow-primary);
}
.btn-primary:hover {
  background: #1aff77;
  transform: translateY(-1px);
  box-shadow: 0 8px 32px rgba(0, 255, 102, 0.5);
}
.btn-primary:active {
  transform: scale(0.97);
}

/* Ghost */
.btn-ghost {
  background: transparent;
  color: var(--text);
  border-color: var(--border-bright);
}
.btn-ghost:hover {
  background: var(--glass-strong);
  border-color: var(--border-hot);
}

/* Danger */
.btn-danger {
  background: var(--accent-red);
  color: #fff;
  box-shadow: var(--glow-red);
}

/* Sizes */
.btn-sm {
  padding: 8px 16px;
  font-size: 10px;
  min-height: 40px;
}
.btn-lg {
  padding: 16px 32px;
  font-size: 14px;
  min-height: 56px;
}

/* Ripple (JS-applied) */
.btn-ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0);
  animation: ripple 0.4s var(--ease-out);
  pointer-events: none;
}
@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
[data-reduced-motion='true'] .btn-ripple {
  animation: none;
}
```

### 2.3 Tab Bar

```css
.tab-bar {
  display: flex;
  gap: 4px;
  background: var(--glass);
  border-radius: var(--radius);
  padding: 4px;
}

.tab {
  flex: 1;
  padding: 10px 16px;
  font-family: var(--ff-hud);
  font-size: var(--fs-label);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  background: transparent;
  border: none;
  border-radius: calc(var(--radius) - 4px);
  cursor: pointer;
  transition: all var(--motion-fast) var(--ease-out);
  min-height: 44px; /* a11y */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.tab:hover {
  color: var(--text);
}

.tab.active {
  color: var(--accent-primary);
  background: var(--accent-primary-dim);
}
.tab.active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  background: var(--accent-primary);
  border-radius: 2px;
  animation: tabIndicatorIn var(--motion-fast) var(--ease-out);
}
@keyframes tabIndicatorIn {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 24px;
    opacity: 1;
  }
}

.tab:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
```

### 2.4 Progress Components

```css
/* Circular Arc */
.progress-arc {
  width: 80px;
  height: 80px;
  transform: rotate(-90deg);
}
.progress-arc-bg {
  fill: none;
  stroke: var(--border);
  stroke-width: 6;
}
.progress-arc-fill {
  fill: none;
  stroke: var(--accent-primary);
  stroke-width: 6;
  stroke-linecap: round;
  stroke-dasharray: 251;
  stroke-dashoffset: 251;
  transition: stroke-dashoffset var(--motion-medium) var(--ease-out);
  filter: drop-shadow(0 0 6px rgba(0, 255, 102, 0.4));
}

/* Linear Bar with Shimmer */
.progress-bar {
  height: 6px;
  border-radius: 3px;
  background: var(--glass);
  overflow: hidden;
  position: relative;
}
.progress-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-gold));
  border-radius: 3px;
  transition: width var(--motion-medium) var(--ease-out);
  position: relative;
}
.progress-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
[data-reduced-motion='true'] .progress-fill::after {
  animation: none;
}
```

### 2.5 Badge / Chip

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  font-family: var(--ff-hud);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.badge-primary {
  background: var(--accent-primary-dim);
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary);
}
.badge-gold {
  background: var(--accent-gold-dim);
  color: var(--accent-gold);
  border: 1px solid var(--accent-gold);
}
.badge-cyan {
  background: var(--accent-cyan-dim);
  color: var(--accent-cyan);
  border: 1px solid var(--accent-cyan);
}
.badge-red {
  background: var(--accent-red-dim);
  color: var(--accent-red);
  border: 1px solid var(--accent-red);
}
.badge-magenta {
  background: var(--accent-magenta-dim);
  color: var(--accent-magenta);
  border: 1px solid var(--accent-magenta);
}
```

### 2.6 Screen Entrance Choreography

```css
/* Applied by AnimationSystem.play() */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes slide-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes slide-in-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes blur-in {
  from {
    opacity: 0;
    filter: blur(8px);
  }
  to {
    opacity: 1;
    filter: blur(0);
  }
}

/* Stagger helper — applied via style="--i: N" */
.stagger-child {
  opacity: 0;
  animation: slide-in-up var(--motion-base) var(--ease-out) both;
  animation-delay: calc(var(--i) * var(--stagger-interval));
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .stagger-child {
    animation: none;
    opacity: 1;
  }
}
```

---

## 3. Screen Transition System

### 3.1 Transition Types (NavigationSystem)

```typescript
// In TransitionSystem.ts
export type TransitionKind =
  | 'fade' // Default modal/splash
  | 'slide-left' // Forward navigation
  | 'slide-right' // Back navigation
  | 'slide-up' // Bottom sheets
  | 'slide-down' // Top sheets
  | 'scale' // Popovers
  | 'shared-element'; // Hero transitions (custom)
```

### 3.2 Shared-Element Transition (Racing Line)

```css
/* The racing line SVG that morphs across screens */
.racing-line {
  position: fixed;
  pointer-events: none;
  z-index: var(--z-overlay);
  stroke: var(--accent-primary);
  stroke-width: 2;
  fill: none;
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  transition: stroke-dashoffset var(--motion-slow) var(--ease-out);
}
.racing-line.active {
  stroke-dashoffset: 0;
}

/* Screen wrapper transition */
.screen-enter {
  animation: screenEnter var(--motion-medium) var(--ease-out);
}
.screen-exit {
  animation: screenExit var(--motion-fast) var(--ease-in);
}
@keyframes screenEnter {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes screenExit {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-30px);
  }
}
```

---

## 4. File Structure for Implementation

```
src/
├── style.css                    # MAIN — all tokens + component bases + globals
├── ui/
│   ├── tokens.ts                # TS tokens (mirror CSS)
│   ├── ui.css                   # DEPRECATED — fold into style.css
│   ├── components/
│   │   ├── Button.ts            # Ripple, variants, sizes
│   │   ├── GlassCard.ts         # Premium glass, sheen, states
│   │   ├── Screen.ts            # Entrance choreography, stagger
│   │   ├── TabBar.ts            # Indicator animation
│   │   ├── ProgressArc.ts       # Circular XP
│   │   ├── ProgressBar.ts       # Linear + shimmer
│   │   ├── Badge.ts             # Semantic colors
│   │   └── index.ts
│   ├── core/
│   │   ├── AnimationSystem.ts   # Stagger, reduced-motion gate
│   │   ├── TransitionSystem.ts  # Shared-element support
│   │   └── ThemeManager.ts      # High-contrast, colorblind, scale
│   └── index.ts
├── screens/
│   ├── ambient.ts               # Upgraded backgrounds
│   ├── MainMenuScreen.ts        # Hero car, racing line
│   ├── TrackSelectScreen.ts     # SVG track maps, horizontal rail
│   ├── ModeSelectScreen.ts      # Compartmentalized cards
│   ├── GarageScreen.ts          # Three.js car, camera stages
│   ├── ProfileScreen.ts         # XP arc, stat counters
│   ├── LeaderboardScreen.ts     # Timing tower
│   ├── AchievementsScreen.ts    # Collectible cards, rarity
│   ├── HowToPlayScreen.ts       # Interactive demos
│   ├── SettingsScreen.ts        # Glass panels, live preview
│   ├── SplashScreen.ts          # Brand animation
│   ├── LoadingScreen.ts         # Progress ring, tips
│   ├── GameplayScreen.ts        # HUD polish only
│   ├── VictoryCeremony.ts       # Enhanced celebration
│   └── ... (Lobby, PhotoMode, etc.)
└── main.ts                      # Font preloads, init
```

---

## File: docs/p15-research/P15-DESIGN-SYSTEM.md

# P15 Motion Design — Micro-interactions, Transitions, Choreography

**Status:** IMPLEMENTATION READY  
**Source:** P15-UIUX-RESEARCH.md + Competitive analysis

---

## 1. Motion Tokens (Single Source of Truth)

```css
:root {
  /* Durations */
  --motion-instant: 50ms; /* Color/opacity hover, tooltip show */
  --motion-fast: 120ms; /* Button press, ripple, focus ring */
  --motion-base: 200ms; /* Dropdown, tab switch, card entrance */
  --motion-medium: 280ms; /* Modal, drawer, popover, screen transition */
  --motion-slow: 400ms; /* Page transition, full sheet */
  --motion-cinematic: 700ms; /* Hero entrance, first-run only */

  /* Easings */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1); /* Default entrance */
  --ease-in: cubic-bezier(0.55, 0.06, 0.68, 0.19); /* Exit, code-triggered */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1); /* Layout changes */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Celebration, bounce */
  --ease-snap: cubic-bezier(0.12, 0.8, 0.32, 1); /* Quick UI snaps */

  /* Stagger */
  --stagger-interval: 60ms; /* Between siblings */
  --stagger-max-items: 8; /* Beyond feels slow */

  /* Asymmetric Timing */
  --user-triggered-intro: var(--motion-fast); /* User clicks → fast */
  --user-triggered-outro: var(--motion-base); /* Then slow */
  --code-triggered-intro: var(--motion-medium); /* Modal opens → slow */
  --code-triggered-outro: var(--motion-fast); /* Error dismiss → fast */
}
```

---

## 2. Micro-Interaction Catalog

### 2.1 Button Interactions

| Trigger             | Animation                                          | Duration | Easing   | Notes                             |
| ------------------- | -------------------------------------------------- | -------- | -------- | --------------------------------- |
| Hover (mouse)       | Background brighten, border glow, translateY(-1px) | 120ms    | ease-out | Primary only; ghost = bg + border |
| Press (mouse/touch) | Scale(0.97), ripple from click point               | 100ms    | ease-out | Ripple removed in reduced-motion  |
| Focus (keyboard)    | Outline 2px solid accent-primary, offset 2px       | instant  | —        | Never removed                     |
| Disabled            | Opacity 0.5, cursor not-allowed                    | instant  | —        | No hover/press                    |

### 2.2 Card Interactions

| Trigger              | Animation                                | Duration | Easing   | Notes                                          |
| -------------------- | ---------------------------------------- | -------- | -------- | ---------------------------------------------- |
| Hover                | Scale(1.015), border→bright, sheen sweep | 200ms    | ease-out | Sheen: diagonal gradient mix-blend-mode:screen |
| Selected             | Border→accent, glow pulse (2s loop)      | 280ms    | ease-out | Glow = box-shadow, not filter                  |
| Deselected           | Reverse hover                            | 150ms    | ease-in  | 75% of entrance                                |
| Entrance (staggered) | slide-in-up + fade                       | 280ms    | ease-out | Delay = index × 60ms, max 8 items              |
| Exit                 | Fade + slide-down                        | 150ms    | ease-in  | 75% of entrance                                |

### 2.3 Tab / Segmented Control

| Trigger         | Animation                          | Duration    | Easing     |
| --------------- | ---------------------------------- | ----------- | ---------- |
| Tab click       | Background fill + color shift      | 120ms       | ease-out   |
| Indicator slide | Width 0→24px + translateX          | 120ms       | ease-out   |
| Content swap    | Fade old (80ms) → Fade new (120ms) | 200ms total | cross-fade |

### 2.4 Progress / Data

| Element           | Animation              | Duration  | Easing   |
| ----------------- | ---------------------- | --------- | -------- |
| Circular arc draw | stroke-dashoffset      | 600ms     | ease-out |
| Linear bar fill   | width                  | 400ms     | ease-out |
| Shimmer sweep     | translateX(-100%→100%) | 1.5s loop | linear   |
| Stat count-up     | numeric interpolation  | 1000ms    | ease-out |
| Rank change       | slide + color flash    | 900ms     | spring   |

### 2.5 Screen Transitions

| Transition          | Animation                      | Duration | Easing   | Shared Element      |
| ------------------- | ------------------------------ | -------- | -------- | ------------------- |
| Splash → Menu       | Fade + scale(0.97→1)           | 600ms    | ease-out | Logo                |
| Menu → Track Select | Slide-left + racing line morph | 300ms    | ease-out | Racing line SVG     |
| Track → Mode        | Slide-left + card scale        | 280ms    | ease-out | Selected track card |
| Mode → Race         | Camera dolly + fade            | 400ms    | ease-out | Car model           |
| Race → Victory      | Fade to black → ceremony       | 500ms    | ease-in  | —                   |
| Victory → Results   | Slide-up + crown drop          | 300ms    | spring   | Crown               |
| Results → Menu      | Slide-right + line retrace     | 280ms    | ease-out | Racing line         |
| Any → Modal         | Scale(0.95→1) + backdrop blur  | 280ms    | ease-out | —                   |
| Modal → Any         | Scale(1→0.95) + fade           | 200ms    | ease-in  | —                   |

### 2.6 Celebration / State-Change

| Event              | Animation                                         | Duration | Easing              |
| ------------------ | ------------------------------------------------- | -------- | ------------------- |
| Rank gain (race)   | Pop + green flash + text shadow                   | 900ms    | spring              |
| Rank loss (race)   | Pop + red flash                                   | 900ms    | spring              |
| Boost ready        | Speedometer color shift + pulse                   | 600ms    | spring              |
| Lap complete       | Lap counter flash gold                            | 700ms    | ease-out            |
| Combo max          | Combo ring gold + pulse                           | 500ms    | spring              |
| Level up           | XP arc complete + badge pop + text pulse          | 1600ms   | spring + pulse loop |
| Achievement unlock | Card scale pop + shimmer sweep + XP arc increment | 800ms    | spring              |
| Race start (GO)    | Fullscreen radial flash white                     | 450ms    | ease-out            |
| Collision          | Fullscreen radial flash red                       | 450ms    | ease-out            |
| Near-miss          | Radial glow cyan                                  | 480ms    | ease-out            |

---

## 3. Choreography Rules

### 3.1 Stagger Algorithm

```typescript
// AnimationSystem.stagger(elements, animation, options, interval)
const stagger = (
  elements: HTMLElement[],
  animation: Keyframe[],
  options: KeyframeAnimationOptions,
  interval = 60
) => {
  elements.forEach((el, i) => {
    if (i >= 8) return; // max items
    el.style.animationDelay = `${i * interval}ms`;
    el.animate(animation, { ...options, fill: 'both' });
  });
};
```

### 3.2 Entrance Order (Per Screen)

| Screen       | Order                                                                                                                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Main Menu    | 1. Racing line draw (800ms) → 2. Car (fade, 600ms) → 3. Title (blur-in, 700ms) → 4. Subtitle (fade, 200ms delay) → 5. Profile strip (fade, 250ms) → 6. Action cards (stagger slide-up, 90ms interval) → 7. Footer note (fade, 500ms) |
| Track Select | 1. Racing line → track rail (300ms) → 2. Track cards (stagger slide-up, 60ms) → 3. Selected card scale (150ms) → 4. Filter pills (fade, 200ms delay)                                                                                 |
| Mode Select  | 1. Group headers (stagger fade, 40ms) → 2. Mode cards (stagger slide-up, 60ms)                                                                                                                                                       |
| Garage       | 1. Car model load (fade, 400ms) → 2. Sidebar tabs (slide-in-right, 200ms) → 3. Spec bars (stagger width, 80ms)                                                                                                                       |
| Profile      | 1. XP arc draw (600ms) → 2. Hero stats (count-up, 1000ms) → 3. Title progression (stagger fade, 60ms) → 4. Records (stagger slide-up, 60ms)                                                                                          |
| Leaderboard  | 1. Table rows (stagger slide-up, 40ms) → 2. Current player highlight pulse (loop)                                                                                                                                                    |
| Achievements | 1. Category tabs (slide-down, 120ms) → 2. Cards (stagger scale-in, 50ms) → 3. Unlocked cards shimmer (delayed 300ms)                                                                                                                 |

### 3.3 Exit Choreography

- Exit animations run at 75% of entrance duration
- Use `ease-in` for exits (feels faster than ease-out at same duration)
- Parent exits before children (backdrop → panel → content)

---

## 4. Reduced Motion Implementation

### 4.1 CSS Media Query (Global)

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Keep state-communicating animations */
  .progress-fill,
  .progress-arc-fill,
  .rank-change-pop,
  .boost-pulse,
  .lap-pulse,
  .combo-pulse,
  .ai-hud-draft-fill,
  .ai-hud-gap-fill {
    animation-duration: var(--motion-base) !important;
  }

  /* Disable decorative */
  .card::after,
  .shimmer,
  .ambient-particles,
  .aurora,
  .hero-grid,
  .home-road,
  .scanlines,
  .vignette,
  .noise-overlay {
    display: none !important;
    animation: none !important;
  }
}
```

### 4.2 JS Gate (AnimationSystem)

```typescript
// In AnimationSystem.ts
export function isMotionReduced(): boolean {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches || ThemeManager.getInstance().reducedMotion
  );
}

export function play(
  element: HTMLElement,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions
): Animation | null {
  if (isMotionReduced() && !options.force) {
    // Apply end state immediately
    const endState = keyframes[keyframes.length - 1];
    Object.assign(element.style, endState);
    return null;
  }
  return element.animate(keyframes, options);
}
```

---

## 5. Performance Guardrails

| Technique                          | Rule                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| **Animate only transform/opacity** | Never animate width/height/top/left/backdrop-filter                             |
| **GPU layers**                     | `will-change: transform, opacity` on animating elements (remove after)          |
| **Blur limits**                    | `backdrop-filter: blur(12px)` max; never animate blur radius                    |
| **Particle caps**                  | Desktop ≤ 60, Mobile ≤ 30; paused when tab hidden                               |
| **Stagger limits**                 | Max 8 items per choreography                                                    |
| **Shared ticker**                  | One `requestAnimationFrame` loop for all shimmer/progress animations            |
| **Font loading**                   | Preload display fonts; `font-display: swap` for body                            |
| **Three.js hero**                  | Low-poly (< 5k tris), no shadows, emissive materials, no post-process on mobile |

---

## 6. Responsive Motion

| Breakpoint          | Adjustments                                                                  |
| ------------------- | ---------------------------------------------------------------------------- |
| Desktop (≥1000px)   | Full stagger, cinematic durations, all particles                             |
| Tablet (800–1000px) | Reduce stagger items to 6, cinematic → slow                                  |
| Mobile (≤600px)     | Stagger max 4 items, cinematic → medium, disable particles, disable parallax |
| Reduced motion      | All non-essential disabled globally                                          |

---

## 6.1 Mobile Touch Feedback

```css
/* Touch-specific press state */
@media (pointer: coarse) {
  .btn:active,
  .card:active {
    transition-duration: 50ms; /* Faster on touch */
  }
  .touch-btn:active {
    transform: scale(0.92);
    background: var(--accent-primary-dim);
    border-color: var(--accent-primary);
  }
}
```

---

## File: docs/p15-research/P15-MOTION-DESIGN.md

# P15 Mobile UX — Portrait Browser Racing Game

**Status:** IMPLEMENTATION READY  
**Target:** Pixel 5 (393×851), iPhone SE (375×667), Galaxy S23 (360×780)  
**Constraint:** Desktop and mobile are NOT the same UI — responsive behavior, not forced desktop layout

---

## 1. Touch Target Standards

| Platform        | Minimum      | Recommended  | Virtual Steering Target  |
| --------------- | ------------ | ------------ | ------------------------ |
| Apple HIG       | 44×44 pt     | 48×48 pt     | **48×48 px minimum**     |
| Material Design | 48×48 dp     | 56×56 dp     | **56×56 px for primary** |
| WCAG 2.2        | 24×24 css px | 44×44 css px | **48×48 css px**         |

**Implementation:**

```css
.btn {
  min-height: 48px;
  min-width: 48px;
}
.btn-primary {
  min-height: 56px;
} /* Primary CTA larger */
.tab {
  min-height: 44px;
}
.card-interactive {
  min-height: 56px;
} /* Track/mode cards */
```

---

## 2. Portrait vs Landscape Strategy

### 2.1 Menu Screens (Portrait-First)

```
┌─────────────────────────────────────┐  ← Safe area top
│  NAV BAR (logo + cam status)        │  44px
├─────────────────────────────────────┤
│                                     │
│  [HERO CAR — 40vh max]             │  Scales down on short viewports
│  Three.js canvas                    │
│                                     │
├─────────────────────────────────────┤
│  [DRIVER PROFILE STRIP]            │  Collapsible on < 600px height
│  Level • Title • XP Arc • Coins    │
├─────────────────────────────────────┤
│  [ACTION CARDS — Vertical Stack]   │  Full-width, scroll if needed
│  Race (primary, 56px)              │
│  Garage                            │
│  Profile                           │
│  Leaderboards                      │
│  Achievements                      │
│  Settings                          │
│  How to Play                       │
├─────────────────────────────────────┤
│  [FOOTER NOTE]                     │
└─────────────────────────────────────┘  ← Safe area bottom (home indicator)
```

### 2.2 Track Select (Portrait)

- **Horizontal rail** with `scroll-snap-type: x mandatory`
- Card width: 280px (leaves 113px peek for next card)
- `overscroll-behavior-x: contain`
- Touch drag + wheel + gamepad D-pad supported

### 2.3 Race HUD (Landscape-Only During Race)

- **Force landscape** during gameplay via Screen Orientation API
- Fallback: portrait HUD with repositioned clusters
- AI HUD rail (right) must not overlap touch steering (left/right) or accel (bottom-center)

---

## 3. Mobile HUD Layout (Race Active)

### 3.1 Cluster Positions (Portrait Fallback)

```
┌─────────────────────────────────────┐
│ [POS]          [TIME]        [SCORE]│  Top: 8px from safe area
│  1/12          1:23.456       1.2M  │
├─────────────────────────────────────┤
│                                     │
│        [THREE.JS RACE VIEW]         │
│                                     │
├─────────────────────────────────────┤
│ [GEAR]           [SPEED]            │  Bottom: 148px from safe area
│   3              247                │  (above touch controls)
├─────────────────────────────────────┤
│  ◄ STEER LEFT     [GAS]     AUTO ►  │  Touch controls layer
│                                     │
└─────────────────────────────────────┘
```

### 3.2 Touch Controls (Existing — Refine)

```css
.touch-controls {
  display: none;
}
@media (pointer: coarse), (max-width: 600px) {
  body.race-active .touch-controls {
    display: block;
  }
}

.touch-btn {
  width: 56px;
  height: 56px; /* ≥ 48px */
  border-radius: 50%;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
}
.touch-btn:active,
.touch-btn.pressed {
  transform: scale(0.9);
  background: var(--accent-primary-dim);
  border-color: var(--accent-primary);
  box-shadow: 0 0 20px rgba(0, 255, 102, 0.3);
}

.touch-left {
  left: 16px;
  bottom: 88px;
}
.touch-right {
  right: 16px;
  bottom: 88px;
}
.touch-accel {
  width: 64px;
  height: 64px;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
}
.touch-auto {
  width: 48px;
  height: 48px;
}
```

### 3.3 Safe Area Handling

```css
:root {
  --safe-top: env(safe-area-inset-top, 0);
  --safe-bottom: env(safe-area-inset-bottom, 0);
  --safe-left: env(safe-area-inset-left, 0);
  --safe-right: env(safe-area-inset-right, 0);
}

.hud-tl {
  top: calc(8px + var(--safe-top));
  left: calc(10px + var(--safe-left));
}
.hud-tr {
  top: calc(8px + var(--safe-top));
  right: calc(10px + var(--safe-right));
}
.touch-controls {
  padding-bottom: var(--safe-bottom);
}
```

---

## 4. Responsive Card/Grid Adaptation

| Component        | Desktop (≥1000px)             | Tablet (800–1000px)       | Mobile (≤600px)                     |
| ---------------- | ----------------------------- | ------------------------- | ----------------------------------- |
| **Track Cards**  | 3-col grid, 320px             | 2-col grid, 320px         | Horizontal rail, 280px cards        |
| **Mode Cards**   | 3-col grid                    | 2-col grid                | Vertical stack, full-width          |
| **Garage**       | 70/30 split (preview/sidebar) | 60/40 split               | Tabs: Preview / Cosmetics / Specs   |
| **Profile**      | 2-col (hero + stats)          | 2-col                     | Single column, collapsible sections |
| **Leaderboard**  | Table + sidebar               | Table (horizontal scroll) | Horizontal scroll, sticky # column  |
| **Achievements** | 3-col grid                    | 2-col grid                | 1-col stack, larger cards           |
| **Settings**     | 2-col (tabs + panel)          | 2-col                     | Stacked, accordion tabs             |

### 4.1 CSS Pattern

```css
/* Track Select Rail */
.track-rail {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
}
.track-card {
  flex: 0 0 280px;
  scroll-snap-align: center;
}

/* Garage Tabs (Mobile) */
@media (max-width: 800px) {
  .garage-layout {
    flex-direction: column;
  }
  .garage-preview {
    height: 40vh;
  }
  .garage-sidebar {
    width: 100%;
  }
}
```

---

## 5. Gesture Discoverability

| Gesture            | Action                          | Visual Hint               |
| ------------------ | ------------------------------- | ------------------------- |
| Horizontal drag    | Track/mode rail scroll          | Peek of next card (113px) |
| Vertical drag      | Garage specs / Profile sections | Scroll indicator          |
| Tap                | Button press, card select       | Ripple + scale            |
| Long press (500ms) | Context menu / preview          | Haptic (if supported)     |
| Swipe up (menu)    | Expand profile strip            | Handle indicator          |

**No hidden gestures** — all actions have visible UI affordance.

---

## 6. Performance on Mobile

| Metric            | Target                                              |
| ----------------- | --------------------------------------------------- |
| Hero car Three.js | < 200ms init, < 2ms/frame                           |
| Glass blur        | ≤ 8px on mobile (vs 12px desktop)                   |
| Particles         | ≤ 20 (vs 60 desktop)                                |
| Scanlines/CRT     | Disabled on mobile                                  |
| Three.js render   | Only hero car on menus; race uses existing pipeline |
| Texture size      | ≤ 512px for UI textures                             |
| Font subset       | Latin-only WOFF2 subsets                            |

---

## 7. Testing Checklist (Pixel 5)

- [ ] No horizontal overflow on any screen
- [ ] All touch targets ≥ 48×48px
- [ ] Text ≥ 14px (body), ≥ 11px (labels)
- [ ] Safe area respected (notch, home indicator)
- [ ] Touch controls don't overlap HUD
- [ ] Scroll smooth (60fps) on all rails
- [ ] No accidental zoom on input focus (viewport meta)
- [ ] Landscape race forced, portrait fallback works
- [ ] Reduced motion disables particles/parallax
- [ ] High contrast mode readable
- [ ] Colorblind presets functional

---

## File: docs/p15-research/P15-MOBILE-UX.md

# P15 Asset Research — Verified Licenses for Commercial Use

**Project Type:** Commercial portfolio game (GitHub + Vercel deployment)  
**Policy:** ONLY CC0, MIT, ISC, Apache-2.0, OFL, Public Domain. Unclear/NC/SA = DO NOT USE.

---

## 1. Fonts (Google Fonts — OFL 1.1 Verified)

| Font                | Role                | Google Fonts URL                                  | Weights      | Subset     | Self-Host?    |
| ------------------- | ------------------- | ------------------------------------------------- | ------------ | ---------- | ------------- |
| **Orbitron**        | Display/Logo        | https://fonts.google.com/specimen/Orbitron        | 400–900 + VF | Latin      | Yes (preload) |
| **Rajdhani**        | Headings/HUD        | https://fonts.google.com/specimen/Rajdhani        | 300–700 + VF | Latin      | Yes (preload) |
| **Chakra Petch**    | Countdowns/Flags    | https://fonts.google.com/specimen/Chakra+Petch    | 300–700 + VF | Latin+Thai | Optional      |
| **Oxanium**         | Numeric/Stat HUD    | https://fonts.google.com/specimen/Oxanium         | 200–800 + VF | Latin      | Optional      |
| **Saira Condensed** | Motorsport headings | https://fonts.google.com/specimen/Saira+Condensed | 100–900 + VF | Latin      | Optional      |
| **Inter**           | Body text           | https://fonts.google.com/specimen/Inter           | 100–900 + VF | Latin      | Yes (preload) |
| **Share Tech Mono** | Timers/Leaderboards | https://fonts.google.com/specimen/Share+Tech+Mono | 400, 700     | Latin      | Optional      |
| **JetBrains Mono**  | Data/Code           | https://fonts.google.com/specimen/JetBrains+Mono  | 100–800 + VF | Latin      | Optional      |

**OFL Compliance:** If self-hosting, include each font's `OFL.txt` in `THIRD_PARTY_NOTICES.md`. No in-game attribution required for use.

---

## 2. Icons (MIT/ISC/Apache-2.0)

| Library              | License    | Racing Icons                                                                     | Delivery       | Size     |
| -------------------- | ---------- | -------------------------------------------------------------------------------- | -------------- | -------- |
| **Phosphor**         | MIT        | car, steering-wheel, trophy, joystick, engine, gear, ranking, speedometer, timer | SVG/Font/React | 300+     |
| **Tabler**           | MIT        | 6,184 icons; car, steering-wheel, trophy, settings, joystick, speedometer        | SVG/Font/React | Large    |
| **Lucide**           | ISC        | car, gauge, settings, trophy, medal, ranking, gamepad-2, flag, timer             | SVG/React      | Light    |
| **Material Symbols** | Apache-2.0 | settings, trophy, sports/esports, speed, leaderboard, steering                   | Variable Font  | Variable |

**Recommendation:** **Phosphor** (best thematic match, MIT, tree-shakeable SVG). Keep MIT license notice in `THIRD_PARTY_NOTICES.md`.

---

## 3. 3D Models (CC0 glTF for Three.js)

| Source                                 | Assets                                          | License     | Format        | Notes                                                    |
| -------------------------------------- | ----------------------------------------------- | ----------- | ------------- | -------------------------------------------------------- |
| **Kenney Car Kit**                     | 45+ low-poly vehicles (sedan, van, truck, kart) | CC0 1.0     | glTF/FBX/OBJ  | Ideal for hero car + garage preview                      |
| **Kenney Racing Kit**                  | Additional racing assets                        | CC0 1.0     | glTF          | On Kenney's car tag page                                 |
| **Kenney Toy Car Kit**                 | Stylized/kart-style cars                        | CC0 1.0     | glTF          | Alternative aesthetic                                    |
| **Kenney Starter-Kit-Racing** (GitHub) | Godot template with `.glb` cars + sounds        | CC0 1.0     | glTF          | `.glb` loads straight into `GLTFLoader`                  |
| **Poly Haven 3D**                      | Photoscanned env props (barriers, buildings)    | CC0 1.0     | glTF          | No cars, but trackside objects                           |
| **Sketchfab CC0 Filter**               | ~2,000+ models                                  | CC0 / CC-BY | glTF/GLB/USDZ | **Verify each model's license badge** — skip CC-BY-NC/SA |

**Hero Car Choice:** Kenney "Sports Car" or "Supercar" from Car Kit — low-poly (< 5k tris), loads fast, CC0.

---

## 4. Textures / HDRIs (CC0)

| Source                       | Assets                                                      | License         | Use Case                                  |
| ---------------------------- | ----------------------------------------------------------- | --------------- | ----------------------------------------- |
| **ambientCG**                | Seamless PBR to 8K: Asphalt, Concrete, Metal, Noise, Ground | CC0 1.0         | Track surfaces, kerbs, barriers, env maps |
| **Poly Haven**               | Textures (PBR, ≥8K), HDRIs (env lighting)                   | CC0 1.0         | Showroom HDRI lighting, track textures    |
| **OpenGameArt (CC0 filter)** | Mixed                                                       | CC0 (per asset) | Neon/noise overlays — filter strictly     |

**Note:** Poly Haven live API requires "Powered by Poly Haven" credit — **self-host downloaded assets** to avoid.

---

## 5. UI Sounds (CC0)

| Source                                     | Assets                                         | License         | Notes                          |
| ------------------------------------------ | ---------------------------------------------- | --------------- | ------------------------------ |
| **Kenney Interface Sounds**                | ~100 clicks, snaps, confirmations, minimizes   | CC0 1.0         | Button clicks, UI feedback     |
| **Kenney UI Audio**                        | ~50 button/switch/generic click SFX            | CC0 1.0         | Alternative set                |
| **Kenney Sci-fi / Impact / Digital Audio** | Engine whooshes, boosts, impacts, glitch beeps | CC0 1.0         | Race feedback, HUD sounds      |
| **freesound.org (CC0 filter)**             | Race/engine/crowd SFX                          | CC0 (per sound) | Screenshot license at download |

**All Kenney audio packs confirmed CC0 on kenney.nl.**

---

## 6. CSS/Design Resources (MIT — Code Only)

| Resource     | URL                                    | License | What You Get                                            |
| ------------ | -------------------------------------- | ------- | ------------------------------------------------------- |
| **GlassKit** | https://github.com/JUNGHERZ/GlassKit   | MIT     | 24 pure-CSS glass components, dark/light, tokens        |
| **Glin UI**  | https://github.com/glincker/glinui     | MIT     | Aurora backgrounds, glow borders, prism borders         |
| **liqgui**   | https://github.com/bymehul/liqgui      | MIT     | 15 glass web components, spring physics, 3D tilt        |
| **farvist**  | https://github.com/FloKuersten/farvist | MIT     | Sass glassmorphism, neon/gradient utilities, bg library |
| **arc-ui**   | https://github.com/arc-language/arc-ui | MIT     | CSS-first liquid-glass, ~3KB, zero deps                 |

**Usage:** Reference for patterns — copy code inherits MIT. Keep notices in `THIRD_PARTY_NOTICES.md`.

---

## 7. Do-Not-Use / Caution List

| Asset                                                               | Reason                                                 |
| ------------------------------------------------------------------- | ------------------------------------------------------ |
| Sketchfab models marked **CC-BY-NC** or **CC-BY-SA**                | NC = no commercial; SA = forces derivative open-source |
| freesound / OpenGameArt items **CC-BY-NC**                          | Commercial use forbidden                               |
| OpenGameArt **GPL 2.0/3.0**                                         | Copyleft contamination for closed-source game          |
| Any asset with "personal use only", "no redistribution", no license | Unclear/restrictive — DO NOT USE per policy            |
| Poly Haven **live API** (not assets)                                | ToS requires attribution; self-host assets instead     |
| Lucide npm (ISC) vs repo (ISC + MIT Feather)                        | Both permissive; keep LICENSE text when redistributing |

---

## 8. Attribution Checklist for Shipping

1. **CC0 (Kenney, ambientCG, Poly Haven, CC0 Sketchfab, CC0 freesound):** No credit required; optional courtesy
2. **CC-BY (most free Sketchfab, some OpenGameArt/freesound):** Credits screen with title, author, source URL, license link
3. **MIT/ISC/Apache code + icons (Phosphor, Tabler, Lucide, Feather, Material Symbols, GlassKit, etc.):** `THIRD_PARTY_NOTICES.md` with copyright/license texts
4. **OFL fonts:** If self-hosting font files, include each font's `OFL.txt` in notices

---

## 9. Recommended Asset Package for P15

| Asset                                           | File                                                | Size          | Purpose                         |
| ----------------------------------------------- | --------------------------------------------------- | ------------- | ------------------------------- |
| Kenney Sports Car                               | `car-sports.glb`                                    | ~50 KB        | Main menu hero + garage preview |
| Kenney UI Sounds                                | `click.ogg`, `confirm.ogg`, `back.ogg`              | ~5 KB each    | Button/navigation feedback      |
| Poly Haven HDRI                                 | `showroom_4k.hdr`                                   | ~2 MB         | Garage/showroom lighting        |
| Phosphor Icons (SVG)                            | `car.svg`, `trophy.svg`, `steering-wheel.svg`, etc. | ~1 KB each    | UI icons                        |
| Orbitron/Rajdhani/Inter/Share Tech Mono (WOFF2) | Subset Latin                                        | ~150 KB total | Typography                      |

**Total added asset weight:** ~2.5 MB (acceptable for browser game)

---

## File: docs/p15-research/P15-ASSET-RESEARCH.md

# P15 Accessibility — WCAG 2.1/2.2 Compliance for Racing Game

**Status:** IMPLEMENTATION READY  
**Target:** AA compliance for all text/interactive elements; AAA for critical HUD

---

## 1. Contrast Requirements

| Element                                     | WCAG AA | WCAG AAA | P15 Target                         |
| ------------------------------------------- | ------- | -------- | ---------------------------------- |
| Normal text (≥ 14px)                        | 4.5:1   | 7:1      | **7:1**                            |
| Large text (≥ 18.5px bold / ≥ 24px)         | 3:1     | 4.5:1    | **4.5:1**                          |
| Critical interactive (buttons, links, tabs) | 4.5:1   | 7:1      | **7:1**                            |
| Non-text (borders, icons, focus indicators) | 3:1     | —        | **4.5:1**                          |
| HUD numeric readouts (speed, position)      | —       | —        | **10:1** (via glow + dark outline) |

### 1.1 Color Pairings (Tested)

| Foreground | Background | Ratio  | Usage                                     |
| ---------- | ---------- | ------ | ----------------------------------------- |
| `#ffffff`  | `#05070b`  | 19.2:1 | Primary text                              |
| `#00ff66`  | `#05070b`  | 8.4:1  | Primary accent                            |
| `#ffd700`  | `#05070b`  | 12.1:1 | Gold accent                               |
| `#00e5ff`  | `#05070b`  | 7.8:1  | Cyan accent                               |
| `#e10600`  | `#05070b`  | 5.2:1  | Red accent → **boost to 7:1 via outline** |
| `#8a8e9c`  | `#05070b`  | 4.8:1  | Muted text → **AA only**                  |
| `#4a4f5c`  | `#05070b`  | 2.1:1  | Dim text → **NOT for interactive**        |

### 1.2 High Contrast Mode Palette

```css
[data-high-contrast='true'] {
  --bg: #000000;
  --bg-elevated: #000000;
  --surface: #111111;
  --surface-elevated: #1a1a1a;
  --glass: #222222;
  --glass-border: #444444;
  --border: #333333;
  --border-bright: #ffffff;
  --border-hot: #ffffff;
  --accent-primary: #00ff00;
  --accent-gold: #ffff00;
  --accent-cyan: #00ffff;
  --accent-red: #ff0000;
  --accent-magenta: #ff00ff;
  --text: #ffffff;
  --text-muted: #cccccc;
  --text-dim: #999999;
  --glow-primary: none;
  --glow-gold: none;
  --glow-cyan: none;
}
```

---

## 2. Reduced Motion

### 2.1 What MUST Be Reduced

| Animation Type             | Action                       |
| -------------------------- | ---------------------------- |
| Screen transitions         | Duration → 0.01ms (instant)  |
| Staggered entrances        | Disable (all appear at once) |
| Particle systems (ambient) | Display: none                |
| Parallax backgrounds       | Transform: none              |
| Shimmer sweeps             | Animation: none              |
| Glow pulses (decorative)   | Animation: none              |
| Scanlines/CRT overlays     | Display: none                |
| Hero car rotation          | Pause                        |
| Racing line draw           | Instant                      |

### 2.2 What MUST BE PRESERVED (State Communication)

| Animation             | Reason                        |
| --------------------- | ----------------------------- |
| Progress bar/arc fill | Shows completion state        |
| Rank change pop       | Communicates position change  |
| Boost ready pulse     | Communicates available action |
| Lap complete flash    | Communicates lap boundary     |
| Combo ring fill       | Communicates multiplier state |
| XP arc draw           | Communicates progression      |
| AI HUD draft fill     | Communicates slipstream state |
| Countdown numbers     | Communicates race start       |

### 2.3 Implementation

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Preserve state-communicating animations */
  .progress-fill,
  .progress-arc-fill,
  .rank-change-pop,
  .boost-pulse,
  .lap-pulse,
  .combo-pulse,
  .ai-hud-draft-fill,
  .ai-hud-gap-fill,
  .countdown-num {
    animation-duration: var(--motion-base) !important;
  }

  /* Disable decorative */
  .ambient-particles,
  .aurora,
  .hero-grid,
  .home-road,
  .scanlines,
  .vignette,
  .noise-overlay,
  .card::after,
  .progress-fill::after,
  .racing-line {
    display: none !important;
  }
}
```

### 2.4 JS Gate

```typescript
// AnimationSystem.ts
export function isMotionReduced(): boolean {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches || ThemeManager.getInstance().reducedMotion
  );
}

export function play(
  el: HTMLElement,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions
): Animation | null {
  if (isMotionReduced() && !options.force) {
    Object.assign(el.style, keyframes[keyframes.length - 1]);
    return null;
  }
  return el.animate(keyframes, options);
}
```

---

## 3. Focus & Keyboard Navigation

### 3.1 Focus Visible (Never Removed)

```css
:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--accent-primary-dim);
}

/* Button-specific */
.btn:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* Card focus */
.card:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* Tab focus */
.tab:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: -2px;
  border-radius: calc(var(--radius) - 4px);
}
```

### 3.2 Tab Order (Per Screen)

| Screen       | Tab Order                                                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Main Menu    | 1. Nav cam status → 2. Nav settings → 3. Race (primary) → 4. Garage → 5. Profile → 6. Leaderboards → 7. Achievements → 8. Settings → 8. How to Play |
| Track Select | 1. Back button → 2. Track cards (left/right arrows) → 3. Filter pills (if open)                                                                     |
| Mode Select  | 1. Back → 2. Group headers (skip) → 3. Mode cards (grid navigation)                                                                                 |
| Garage       | 1. Back → 2. Category tabs → 4. Cosmetic grid (grid nav) → 5. Equip button                                                                          |
| Profile      | 1. Back → 2. Title progression (vertical) → 3. Records table                                                                                        |
| Leaderboard  | 1. Back → 2. Tabs → 3. Filter pills → 4. Table rows (vertical)                                                                                      |
| Achievements | 1. Back → 2. Category tabs → 3. Cards (grid nav)                                                                                                    |
| Settings     | 1. Back → 2. Tab bar → 3. Settings rows (vertical)                                                                                                  |

### 3.3 Keyboard Shortcuts

| Key                 | Action                         | Context                        |
| ------------------- | ------------------------------ | ------------------------------ |
| `Escape`            | Go back / close modal          | Global                         |
| `Enter` / `Space`   | Activate focused element       | Global                         |
| `Arrow Keys`        | Navigate grids/rails           | Track/Mode/Garage/Achievements |
| `Tab` / `Shift+Tab` | Next/previous focusable        | Global                         |
| `1–4`               | Quick mode select (if visible) | Mode Select                    |

---

## 4. Colorblind Safety

### 4.1 Red/Green Never Sole Encoding

| State         | Red-Only ❌  | P15 Solution ✅                                 |
| ------------- | ------------ | ----------------------------------------------- |
| Position gain | Green text   | Green text + ↑ arrow + "GAIN" label             |
| Position loss | Red text     | Red text + ↓ arrow + "LOSS" label               |
| Boost ready   | Green glow   | Green glow + "BOOST" badge + sound              |
| Draft optimal | Cyan glow    | Cyan glow + "SLIPSTREAM" label                  |
| Dirty air     | Magenta glow | Magenta glow + "DIRTY AIR" label + warning icon |
| New record    | Green text   | Green text + 🥇 medal + "NEW RECORD"            |
| Error         | Red border   | Red border + ✕ icon + error text                |

### 4.2 Colorblind Presets (Implemented in ThemeManager)

```typescript
// ThemeManager.ts — existing, enhance
export type ColorblindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';

const colorblindTransforms: Record<ColorblindMode, string> = {
  none: 'none',
  deuteranopia: 'url(#deuteranopia-filter)',
  protanopia: 'url(#protanopia-filter)',
  tritanopia: 'url(#tritanopia-filter)',
};
```

SVG filters in `index.html` — applied to `<html>` via `filter` CSS property.

### 4.3 Redundant Encoding Checklist

- [ ] Every color-coded state has icon + text label
- [ ] Leaderboard medals: 🥇🥈🥉 + "1st/2nd/3rd" text
- [ ] Achievement rarity: stars (⭐⭐⭐) + "MASTERY" text
- [ ] Boost meter: bar fill + "BOOST" label + sound
- [ ] Draft meter: bar fill + "SLIPSTREAM/DIRTY" label
- [ ] Position: number + medal (1st) + arrow (gain/loss)

---

## 5. Semantic HTML & ARIA

### 5.1 Required Patterns

| Component           | HTML                                                                                      | ARIA                              |
| ------------------- | ----------------------------------------------------------------------------------------- | --------------------------------- |
| Button              | `<button>`                                                                                | `aria-pressed` for toggles        |
| Progress (linear)   | `<progress role="progressbar" aria-valuenow="..." aria-valuemin="0" aria-valuemax="100">` | `aria-label`                      |
| Progress (circular) | `<svg role="progressbar" aria-valuenow="..." aria-valuemin="0" aria-valuemax="100">`      | `aria-label`                      |
| Tab list            | `<div role="tablist">` → `<button role="tab" aria-selected="...">`                        | `aria-controls`                   |
| Tab panel           | `<div role="tabpanel" aria-labelledby="...">`                                             | —                                 |
| Live region (HUD)   | `<div aria-live="polite" aria-atomic="true" class="sr-only">`                             | Updated via JS                    |
| Decorative          | `aria-hidden="true"`                                                                      | Particles, scanlines, racing line |
| Image (icon)        | `<img alt="">` or CSS background                                                          | No alt for decorative             |

### 5.2 HUD Live Region Example

```html
<div id="hud-announcer" aria-live="polite" aria-atomic="true" class="sr-only"></div>
```

```typescript
// In GameplayScreen.ts
function announce(message: string) {
  const el = document.getElementById('hud-announcer');
  if (el) el.textContent = message;
}
// Usage: announce('Position gained. Now 3rd.');
```

### 5.3 Screen Reader Only Utility

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## 6. Scaling / Large HUD

### 6.1 Scale Factor

```css
:root {
  --scale: 1;
}
[data-large-hud='true'] {
  --scale: 1.5;
}

/* Applied to: */
.hud {
  transform: scale(var(--scale));
  transform-origin: top left;
}
.menu-actions .btn {
  font-size: calc(var(--fs-btn) * var(--scale));
  padding: calc(12px * var(--scale)) calc(24px * var(--scale));
}
.card {
  padding: calc(16px * var(--scale));
}
```

### 6.2 Touch Target Scaling

```css
@media (pointer: coarse) {
  .btn {
    min-height: calc(48px * var(--scale));
    min-width: calc(48px * var(--scale));
  }
  .tab {
    min-height: calc(44px * var(--scale));
  }
}
```

---

## 7. Testing Checklist

### 7.1 Automated (axe-core / lighthouse)

- [ ] Color contrast ≥ 4.5:1 (AA) / 7:1 (AAA critical)
- [ ] Focus indicators visible
- [ ] ARIA labels on all interactive
- [ ] Live regions for dynamic content
- [ ] Heading hierarchy (h1→h2→h3)
- [ ] Landmarks (main, nav, aside)

### 7.2 Manual

- [ ] Navigate entire game with keyboard only
- [ ] Screen reader (NVDA/VoiceOver) announces correctly
- [ ] Reduced motion disables decorative, keeps state
- [ ] High contrast mode: all text readable, borders visible
- [ ] Colorblind presets: no information loss
- [ ] Large HUD: no overflow, touch targets scale
- [ ] Zoom 200%: no horizontal overflow, text readable

---

## File: docs/p15-research/P15-ACCESSIBILITY.md

# P15 Implementation Plan — Phase-by-Phase Execution

**Status:** READY TO EXECUTE  
**Baseline:** P14 COMPLETE — 653 tests, 27/13/0 E2E, all gates green

---

## Phase Overview

| Phase   | Focus                                  | Duration | Deliverable                       |
| ------- | -------------------------------------- | -------- | --------------------------------- |
| **F**   | Design System Foundation               | 1        | Tokens, components, motion system |
| **G1**  | Main Menu + Track Select + Mode Select | 2        | Hero screens redesigned           |
| **G2**  | Garage + Profile + Leaderboard         | 2        | Progression/competition screens   |
| **G3**  | Achievements + HowToPlay + Settings    | 1.5      | Collection/help/config screens    |
| **G4**  | HUD + Victory + Transitions            | 1.5      | Race experience + flow            |
| **H**   | Micro-interactions Polish              | 1        | Ripple, magnetic, shimmer         |
| **I**   | Mobile Responsive Pass                 | 1        | Pixel 5 perfect                   |
| **J**   | Accessibility Pass                     | 1        | WCAG AA + reduced motion          |
| **K**   | Performance Pass                       | 0.5      | Budget compliance                 |
| **L**   | Regression Gates                       | 0.5      | All green                         |
| **M**   | Visual QA + Probe                      | 0.5      | 22/22 probe pass                  |
| **N/O** | Fix + Clean + Report                   | 0.5      | Zero residue                      |

---

## Phase F: Design System Foundation (Files to Create/Modify)

### F.1 `src/style.css` — **MAJOR OVERWRITE**

- Replace entire token section with consolidated semantic system
- Add component base classes (`.card`, `.btn`, `.tab`, `.badge`, `.progress-*`)
- Add motion keyframes and stagger helpers
- Add screen transition keyframes
- Add reduced motion media query
- Add mobile responsive adjustments
- Add high contrast mode overrides
- **Preserve:** Existing HUD, ambient, touch controls, game overlays (enhance only)

### F.2 `src/ui/tokens.ts` — **EXTEND**

- Export all MotionTokens, ColorTokens, ZTokens, RadiusTokens, FontTokens
- Add TabularNums constant

### F.3 `src/ui/components/` — **NEW/REWRITE**

| File             | Action  | Key Changes                                                     |
| ---------------- | ------- | --------------------------------------------------------------- |
| `Button.ts`      | Rewrite | Ripple, variants (primary/ghost/danger), sizes, magnetic hover  |
| `GlassCard.ts`   | Rewrite | Premium glass, sheen, selected/disabled states, stagger support |
| `Screen.ts`      | Extend  | `playEntrance()`, `playExit()`, stagger children helper         |
| `TabBar.ts`      | New     | Animated indicator, keyboard nav, focus visible                 |
| `ProgressArc.ts` | New     | Circular XP arc with draw animation                             |
| `ProgressBar.ts` | New     | Linear + shimmer                                                |
| `Badge.ts`       | New     | Semantic variants (primary/gold/cyan/red/magenta)               |
| `RacingLine.ts`  | New     | Shared-element SVG transition component                         |

### F.4 `src/ui/core/`

| File                  | Action                                                                  |
| --------------------- | ----------------------------------------------------------------------- |
| `AnimationSystem.ts`  | Add `stagger()`, `play()` with reduced-motion gate, `isMotionReduced()` |
| `TransitionSystem.ts` | Add `shared-element` transition kind, racing line support               |
| `ThemeManager.ts`     | Add high-contrast mode, large-hud scale, colorblind filter application  |

### F.5 `src/screens/ambient.ts` — **ENHANCE**

- Add `spawnScanlines()`, `spawnVignette()`, `spawnNoiseOverlay()` (mounted once on app root)
- Upgrade `spawnGrid()` → perspective grid with configurable angle
- Upgrade `spawnAurora()` → CSS-based animated gradients (cheaper than DOM)
- Add `spawnHeroBackground()` for main menu (gradient sky + scanlines)

---

## Phase G1: Main Menu + Track Select + Mode Select

### G1.1 `src/screens/MainMenuScreen.ts`

**New Structure:**

```typescript
protected build(): void {
  // 1. Three.js hero car (lazy-loaded, low-poly Kenney CC0)
  // 2. Animated gradient sky + scanlines (ambient.ts)
  // 3. Racing line SVG (draws on entrance)
  // 4. Title: Orbitron, gradient text, blur-in entrance
  // 5. Profile strip: XP arc (ProgressArc), animated stat counters
  // 6. Action cards: GlassCard premium, staggered slide-up
  // 7. Footer note: fade-in
}
```

**Three.js Hero Car:**

- Load `car-sports.glb` (Kenney CC0, ~50 KB)
- Showroom HDRI (Poly Haven CC0)
- Slow Y-rotation (20s loop), pauses on hover → camera stage dolly
- Emissive materials for neon accents
- No shadows, no post-process on mobile
- `prefers-reduced-motion` → pause rotation

### G1.2 `src/screens/TrackSelectScreen.ts`

**New Structure:**

```typescript
protected build(): void {
  // 1. Horizontal rail (flex + scroll-snap)
  // 2. TrackCard component per track:
  //    - SVG track map (layered strokes: glow→core→highlight)
  //    - Draw-on animation on entrance
  //    - Weather/time chips (badge-cyan/badge-gold)
  //    - Best time + difficulty stars
  //    - Medal overlays (🥇🥈🥉) if raced
  // 3. Selected card: scale 1.05, border-primary, racing line connects to mode select
}
```

**Track Map SVGs:** Create 3 SVGs (Cyber City, Mountain Highway, Space Highway) — layered strokes with `stroke-dasharray` draw-on.

### G1.3 `src/screens/ModeSelectScreen.ts`

**New Structure:**

```typescript
protected build(): void {
  // 1. Group headers: Solo / Multiplayer / Training (slide-down stagger)
  // 2. ModeCard per mode:
  //    - Large icon (Phosphor SVG)
  //    - Name + 1-line description
  //    - Badges: Player count, Difficulty (●●○○○), Control methods (✋⌨️📱🎮)
  //    - Selected: border-primary, scale 1.02
}
```

---

## Phase G2: Garage + Profile + Leaderboard

### G2.1 `src/screens/GarageScreen.ts`

**Layout:** 70/30 split (desktop) → Tabs (mobile)

```typescript
// Three.js car preview (same model as main menu, different camera stages)
// Camera stages: Exterior (0s) → Rear (3s) → Interior (6s) → Detail (9s) → loop
// Smooth dolly between stages (600ms ease-out)
// Sidebar tabs: Skins / Neons / Wheels (TabBar component)
// Cosmetic grid: GlassCard premium, hover sheen, selected border-primary
// Spec bars: ProgressBar with animated fill
```

### G2.2 `src/screens/ProfileScreen.ts`

```typescript
// Hero: Level + Title + XP Arc (ProgressArc) + animated stat counters (count-up)
// Title Progression: Vertical timeline, current tier glows, locked dimmed
// Best Records: Timing-tower mini table (top 5)
// Recent Races: Collapsible list
// Achievement Summary: 3 most recent unlocks with shimmer
```

### G2.3 `src/screens/LeaderboardScreen.ts`

```typescript
// Timing tower layout:
// - Tabs: Global / By Track / By Mode (TabBar)
// - Filter pills: Track dropdown, Mode dropdown
// - Table: # | PLAYER | SCORE | DATE | GAP
// - Current player row: highlight background, pulse animation
// - Rank changes: slide + color flash (green gain / red loss)
// - Empty state: "No times set" + ghost car illustration
```

---

## Phase G3: Achievements + HowToPlay + Settings

### G3.1 `src/screens/AchievementsScreen.ts`

```typescript
// Category tabs: Progression / Collection / Mastery (TabBar)
// Cards:
//   LOCKED: dimmed, 🔒, progress bar
//   UNLOCKED: accent-primary border, shimmer sweep on hover
//   MASTERY (data-driven: category===mastery && target≥50): gold glow + ⭐⭐⭐
// Unlock animation: scale pop (spring) + shimmer + XP arc increment
// Completion ring: circular progress (total/total)
```

### G3.2 `src/screens/HowToPlayScreen.ts`

```typescript
// 7 tabs (Hand/Keyboard/Touch/Gyro/Phone/Gamepad/Accessibility)
// Each tab: Interactive demo area (canvas placeholder for future)
// Search/filter input
// Video/GIF placeholder frames with play button
```

### G3.3 `src/screens/SettingsScreen.ts`

```typescript
// Glass panels per tab (Graphics/Audio/Controls/Accessibility/Gameplay)
// Live preview: Graphics changes apply immediately to Three.js quality
// Reset confirmation modal
// Colorblind/High-contrast/Large-HUD/Reduced-Motion toggles (instant apply)
```

---

## Phase G4: HUD + Victory + Transitions

### G4.1 `src/screens/GameplayScreen.ts` — **HUD POLISH ONLY**

- **Do not change layout** — only visual upgrades:
  - Speed cluster: speed-num glow intensity based on speed tier
  - Position chip: lead glow pulse (existing, enhance)
  - Boost bar: shimmer fill, pulse on ready
  - Combo ring: gold stroke at max, pulse
  - AI HUD: draft pulse (existing), overtake flash (existing)
  - All numbers: ensure tabular-nums, consistent font weights

### G4.2 `src/ui/VictoryCeremony.ts`

- Crown drop (existing) + rank pop (spring)
- Level-up pulse border (existing, enhance glow)
- XP arc draw completion sync
- Stat grid: staggered scale-in
- Total row: count-up animation

### G4.3 Screen Transitions (NavigationSystem + TransitionSystem)

```typescript
// Shared-element: Racing line SVG
// Menu → Track: Line draws from car → becomes track rail
// Track → Mode: Selected track card becomes mode header
// Mode → Race: Car dolly into cockpit
// Race → Victory: Fade to black (500ms) → ceremony
// Victory → Results: Slide-up + crown drop
// Results → Menu: Slide-right + line retraces
```

---

## Phase H: Micro-interactions Polish

| Interaction        | Implementation                                                                       |
| ------------------ | ------------------------------------------------------------------------------------ |
| Button ripple      | `AnimationSystem.ripple(event, element)` — prefers-reduced-motion respected          |
| Magnetic hover     | `mousemove` on `.btn-primary` → `transform: translate(...)` proportional to distance |
| Card magnetic      | Subtle translate toward cursor (max 4px)                                             |
| Tab indicator      | Animated width + position (already in CSS)                                           |
| Progress shimmer   | CSS `::after` with `mix-blend-mode: screen` (disabled in reduced-motion)             |
| Toast choreography | Stack with 80ms stagger, slide-in-right                                              |
| Achievement unlock | Scale pop (spring) + shimmer sweep + XP arc increment                                |
| Rank change        | Slide + color flash + announce via live region                                       |

---

## Phase I: Mobile Responsive Pass

### I.1 Breakpoint Testing

```bash
# Test viewports
npx playwright test --project=mobile-chromium
# Manual: Chrome DevTools device toolbar → Pixel 5, iPhone SE, Galaxy S23
```

### I.2 Mobile-Specific Fixes

- [ ] Main Menu: Hero car 40vh max, action cards vertical stack
- [ ] Track Select: Horizontal rail with peek, touch drag
- [ ] Mode Select: Vertical stack, grouped headers
- [ ] Garage: Tabs (Preview/Cosmetics/Specs), car preview 40vh
- [ ] Profile: Single column, collapsible sections
- [ ] Leaderboard: Horizontal scroll table, sticky # column
- [ ] Achievements: 1-col stack, larger cards
- [ ] Settings: Accordion tabs
- [ ] HUD: Touch controls don't overlap, safe areas respected
- [ ] All text ≥ 14px, touch targets ≥ 48px

---

## Phase J: Accessibility Pass

### J.1 Automated (axe-core)

```bash
npx playwright test --project=chromium --grep "a11y"
# Or: npx axe-cli http://localhost:5173
```

### J.2 Manual Checklist

- [ ] Keyboard nav all screens (Tab/Shift+Tab/Enter/Escape/Arrows)
- [ ] Focus visible on all interactive
- [ ] Screen reader (NVDA/VoiceOver) announces correctly
- [ ] Reduced motion: decorative disabled, state preserved
- [ ] High contrast: all text readable, borders visible
- [ ] Colorblind presets (deuteranopia/protanopia/tritanopia): no info loss
- [ ] Large HUD (1.5×): no overflow, touch targets scale
- [ ] Zoom 200%: no horizontal overflow
- [ ] Live regions: rank changes, lap complete, boost ready announced

---

## Phase K: Performance Pass

### K.1 Budgets

| Metric               | Target                       | Current      |
| -------------------- | ---------------------------- | ------------ |
| CSS gzipped          | < 25 KB                      | ~18 KB       |
| Three.js hero car    | < 100 KB glTF                | ~50 KB       |
| Fonts (preloaded)    | < 150 KB total               | ~150 KB      |
| Background GPU/frame | ≤ 2 ms mobile                | —            |
| Glass blur           | ≤ 8px mobile                 | 12px desktop |
| Particles            | ≤ 20 mobile / ≤ 60 desktop   | 26           |
| Frame budget         | Dynamic resolution preserved | ✅           |

### K.2 Optimizations

- Subset fonts (Latin only, WOFF2)
- Preload display fonts in `index.html`
- Lazy-load Three.js hero car (`import()` on menu enter)
- `will-change: transform, opacity` on animating elements (remove after)
- Shared `requestAnimationFrame` for shimmer/progress
- `prefers-reduced-motion` disables particles/parallax

---

## Phase L: Regression Gates

```bash
# Run in order
npx vitest run                    # 653+ tests
npm run typecheck                 # PASS
npm run lint                      # PASS
npx prettier --check .            # PASS
npm run build                     # PASS
npx playwright test               # 27/13/0
npx playwright test --project=mobile-chromium  # 13/7/0
```

---

## Phase M: Visual QA + Production Probe

### M.1 Production Build Probe

```bash
npm run build
npx vite preview --port 4173 &
npx playwright test -c playwright.prod.config.ts --reporter=line
# 22 tests (11 desktop + 11 mobile) — all must pass
```

### M.2 Visual Inspection Checklist

| Screen       | Desktop                                | Mobile               |
| ------------ | -------------------------------------- | -------------------- |
| Splash       | Brand animation, progress ring         | Scaled, centered     |
| Main Menu    | Hero car, racing line, staggered cards | Stacked, car 40vh    |
| Track Select | Horizontal rail, SVG maps, medals      | Rail with peek       |
| Mode Select  | Grouped cards, badges                  | Vertical stack       |
| Garage       | 3D preview, camera stages, spec bars   | Tabs                 |
| Profile      | XP arc, stat counters, title timeline  | Collapsible          |
| Leaderboard  | Timing tower, current player highlight | Horizontal scroll    |
| Achievements | Category tabs, rarity glow, shimmer    | Stack                |
| How-To-Play  | 7 tabs, interactive demos              | Stack                |
| Settings     | Glass panels, live preview             | Accordion            |
| Race         | HUD readable, no occlusion             | Touch controls clear |
| Victory      | Crown drop, level-up pulse             | Scaled               |
| Results      | Score animation, ghost line            | Scaled               |

---

## Phase N/O: Fix Issues + Clean + Report

### N.1 Fix All Discovered Issues

- Visual regressions
- Mobile overflow
- Accessibility gaps
- Performance overages

### N.2 Zero Residue Cleanup

```bash
rm -rf test-results playwright-report
rm -f playwright.prod.config.ts
lsof -ti :4173 :5173 | xargs kill
```

### O.1 Reports

- `REPORT-36-P15-UIUX-VISUAL-TRANSFORMATION.md` (main report)
- `docs/p15-research/P15-DESIGN-DECISIONS.md` (why each decision)

---

## File: docs/p15-research/P15-IMPLEMENTATION-PLAN.md

# P15 Design Decisions — Rationale & Trade-offs

**Generated:** 2026-08-20  
**Purpose:** Document WHY each major design decision was made for future reference and team alignment.

---

## 1. Brand Identity: "Neon Velocity" + "Garage Prestige"

**Decision:** Dual-theme identity — primary "Neon Velocity" (dark cyber-track, razor-thin light trails, precision telemetry) with secondary "Garage Prestige" (showroom lighting, carbon-fiber textures, gold accents).

**Why:**

- **Neon Velocity** differentiates from Forza (realism), NFS (gritty urban), GT (museum). It's a _browser-native_ aesthetic: CSS glow, scanlines, animated gradients — things only web can do efficiently.
- **Garage Prestige** elevates the cosmetic/collection layer without inventing fake gameplay stats. Cosmetic progression is the only progression authority (ProfileManager) — lean into it.
- Research showed NFS Heat/Unbound uses "visual signature" (flare/graffiti) and F1 25 uses "engine-spark palette + three-state type". Our signature = **the racing line** — a glowing curve connecting all screens.

**Rejected:** Pure realism (GT), pure arcade (Asphalt), pure minimalism (Horizon Chase). We're a _simcade_ — accessible depth, telemetry-grade clarity.

---

## 2. Color System: 4 Semantic Accents, 1 Role Each

**Decision:** 4 accent colors, each with exactly ONE functional role. No decorative use.

| Token              | Hex       | Role                                           |
| ------------------ | --------- | ---------------------------------------------- |
| `--accent-primary` | `#00ff66` | GO, speed, primary CTA, success, boost ready   |
| `--accent-gold`    | `#ffd700` | 1st place, premium, best, mastery achievements |
| `--accent-cyan`    | `#00e5ff` | INFO, draft/slipstream, combo counter, tech    |
| `--accent-red`     | `#e10600` | DANGER, loss, collision, error, shift warning  |
| `--accent-magenta` | `#ff2d95` | WARNING, dirty air, near-miss, validation      |

**Why:**

- Cyberpunk 2077 was criticized for using red for _everything_ (ornament + warning + feedback) with no functional color coding.
- F1 broadcast uses green gained / red lost positions — color = meaning, not decoration.
- Colorblind safety: red/green never sole encoding; always icon + text + shape.
- High contrast mode forces all accents to pure primaries (`#00ff00`, `#ffff00`, etc.)

**Rejected:** More than 4 accents (cognitive load), accent reuse across roles (confusion).

---

## 3. Typography: Orbitron + Rajdhani + Inter + Share Tech Mono

**Decision:** 4-font stack, all Google Fonts OFL.

| Role                | Font            | Why                                                                   |
| ------------------- | --------------- | --------------------------------------------------------------------- |
| Display/Logo        | Orbitron        | Geometric sci-fi, 4 weights + VF, league of movable type              |
| Headings/HUD        | Rajdhani        | Squared/condensed, "technical/futuristic" per designers, tabular nums |
| Body                | Inter           | Workhorse, high x-height, tabular nums, excellent screen legibility   |
| Timers/Leaderboards | Share Tech Mono | Monospace, tabular figures, technical readouts                        |

**Why:**

- NFS Unbound: DIN Pro Condensed (UI) + Eurostile (brand) — we use free equivalents.
- Cyberpunk 2077: Rajdhani primary + Orbitron decorative — validated for techno UI.
- GT: Custom wide wordmark + neutral data sans with tabular figures.
- Tabular figures MANDATORY for speed, position, lap, time, score — prevents jitter.

**Rejected:** Eurostile/Audiowide/Michroma (single weight, poor readability), custom fonts (licensing, perf).

---

## 4. Glassmorphism Recipe (The "Liquid Glass" Card)

**Decision:** Standardized premium card recipe used everywhere.

```css
.card {
  background: var(--surface-elevated); /* #13171e */
  border: 1px solid var(--glass-border); /* rgba(255,255,255,0.08) */
  border-radius: 16px; /* --radius-lg */
  backdrop-filter: blur(12px) saturate(160%); /* cap blur ≤12px for perf */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.card::before {
  /* inset highlight */
}
.card::after {
  /* diagonal sheen, mix-blend-mode: screen */
}
```

**Why:**

- superdesign.dev / pixcode.io / webtricks.dev all converge on this recipe.
- Blur ≤12px cap prevents mobile GPU thrash; never animate blur radius.
- `mix-blend-mode: screen` sheen = "liquid glass" feel without expensive shaders.
- Reduced motion: sheen disabled globally via media query.

**Rejected:** CSS `backdrop-filter: blur()` animation (layout thrash), multiple blur layers, `filter: blur()` on containers (repaint storm).

---

## 5. Motion System: 7 Durations, 5 Easings, Asymmetric Timing

**Decision:** Tokenized motion vocabulary with strict rules.

| Token                | Duration | Use                                 |
| -------------------- | -------- | ----------------------------------- |
| `--motion-instant`   | 50ms     | Color/opacity hover, tooltip        |
| `--motion-fast`      | 120ms    | Button press, ripple, focus ring    |
| `--motion-base`      | 200ms    | Dropdown, tab switch, card entrance |
| `--motion-medium`    | 280ms    | Modal, drawer, screen transition    |
| `--motion-slow`      | 400ms    | Page transition, full sheet         |
| `--motion-cinematic` | 700ms    | Hero entrance, first-run only       |
| `--motion-ambient`   | 1800ms   | Background loops                    |

**Easing Rules:**

- **Default: ease-out** (`cubic-bezier(0.22, 1, 0.36, 1)`) — feels responsive.
- **Asymmetric timing:** User-triggered = fast intro/slow outro; code-triggered = slow intro/fast outro.
- **Exit = 75% of entrance duration.**
- **Stagger:** 60ms interval, max 8 items, `animation-fill-mode: both`.

**Why:**

- NN/g research: 200–300ms for modal/UI, 500ms+ feels "draggy".
- Emil Kowalski: "Never ease-in on UI. It starts slow, delaying the exact moment the user is watching."
- Forza/GT menus criticized for >150ms animations feeling sluggish by 10th visit.
- Reduced motion: global gate disables all non-essential animation, keeps state communication (progress, rank pop).

**Rejected:** Spring/bounce on everything (childish), ease-in (feels slow), stagger >80ms (list feels slow).

---

## 6. Main Menu: Hero Car + Racing Line + Premium Actions

**Decision:** Three.js hero car (Kenney CC0 sports car) + animated racing line SVG + premium glass action cards.

**Why:**

- NFS Heat/Unbound: "Large tiles with clear descriptions displayed in foreground, in front of 3D object and illuminated backgrounds... camera perspectives create excitement."
- Forza Horizon 5's 30+ first-level options = anti-pattern. We have **ONE primary CTA (Race)** + flat secondary nav.
- Garage as hub (NFS Unbound): Hero car visible from menu → player's car is the anchor.
- Racing line = visual signature connecting Menu → Track → Mode → Race → Victory → Menu.
- Kenney CC0 car kit: 45+ low-poly vehicles, glTF ready, zero license friction.
- Lazy-loaded, pauses on reduced motion, falls back to static SVG.

**Rejected:** Diegetic world-as-menu (GT7 — criticized as clunky), static background (lifeless), video background (perf, bandwidth).

---

## 6. Track Select: Horizontal Rail + SVG Map Silhouettes

**Decision:** Horizontal scroll-snap rail, 280px cards, layered SVG track maps (glow→core→highlight), weather/time chips, medal overlays.

**Why:**

- Forza community: Players can't memorize layouts by name → put **track map directly in card**.
- Horizon Chase: Color-coded performance (red/blue/gold/white) — "prioritize colors instead of texts."
- Race Force UI: Photo + title + bronze/silver/gold medals, horizontal rail with paging.
- Minimalist F1 Circuits: Layered SVG strokes + draw-on animation + hover scale/glow.
- Weather: Simple icon + time-of-day chip, not decorative illustration.

**Rejected:** Grid layout (wastes horizontal space), static images (no motion), text-only weather (slow scan).

---

## 7. Mode Select: Compartmentalized Groups + Intent Icons

**Decision:** Two groups (Solo / Multiplayer), mode cards with intent icons, difficulty badges, control method chips with availability sync.

**Why:**

- Rocket League Play Menu redesign: Split into Competitive / Casual / Offline / Private / Training — "reduce cognitive load / clutter."
- Asphalt 8/9: Group by intent (Single vs Multiplayer), color-coded rank vs requirement (red/white/green), vertical side tabs for mobile.
- NFS Unbound: "Each option described clearly so players can make informed decision."
- Control chips: Phosphor icons (steering-wheel, gamepad, hand, phone) + availability dimming (not disabling) for mode-disallowed methods.

**Rejected:** Flat list of all modes (overwhelming), alphabetical (no intent grouping), hiding unavailable methods (confusing for keyboard nav).

---

## 7. Motion Budget Per Surface

**Decision:** Strict motion budgets prevent animation overload.

| Surface                      | Budget                                                |
| ---------------------------- | ----------------------------------------------------- |
| Main Menu Hero               | ≤3 staggered entrances (car, title, actions)          |
| Track/Mode Select            | Card stagger only (60ms interval, max 8)              |
| Garage                       | Camera stage transitions (600ms) + spec bar fills     |
| HUD/Race                     | Micro only (progress fills, rank pulses, boost flash) |
| Victory                      | Crown drop + rank pop + stat stagger                  |
| Settings/Profile/Leaderboard | Micro only (tab indicator, progress shimmer)          |

**Why:** Awwwards WebGL sites (HAOQI, PX PUSH) use "motion budget per surface" — hero ≤3 staggered entrances, dashboard = micro-interactions only.

---

## 8. Mobile-First Responsive (Pixel 5: 393×851)

**Decision:** Responsive behavior, not forced desktop layout.

| Component    | Desktop                  | Mobile (≤600px)                                                      |
| ------------ | ------------------------ | -------------------------------------------------------------------- |
| Main Menu    | Side-by-side car + cards | Stacked: Car (40vh) → Cards (scroll)                                 |
| Track Select | Horizontal rail          | Horizontal rail with peek (113px)                                    |
| Mode Select  | Grid                     | Vertical stack, grouped headers                                      |
| Garage       | 70/30 split              | Tabs: Preview / Cosmetics / Specs                                    |
| Leaderboard  | Table + sidebar          | Horizontal scroll, sticky # column                                   |
| Achievements | 3-col grid               | 1-col stack, larger cards                                            |
| HUD          | Corner clusters          | AI HUD rail (right), Touch controls (left/bottom), Speed above accel |

**Touch Targets:** ≥48×48px (Apple HIG 44pt, Material 48dp, WCAG 24px minimum → we use 48px).
**Safe Areas:** `env(safe-area-inset-*)` for notch/home indicator.

---

## 8. Accessibility: WCAG AA + Reduced Motion

**Decision:** AA compliance for all text/interactive; AAA for critical HUD.

| Requirement    | Implementation                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Contrast       | Normal text ≥4.5:1 (we hit 7:1+), large text ≥3:1 (we hit 4.5:1), critical interactive ≥7:1               |
| Reduced Motion | Global gate disables particles/parallax/shimmer/stagger; preserves progress fills, rank pops, boost ready |
| Focus Visible  | 2px outline, `--accent-primary`, offset 2px, never removed                                                |
| Colorblind     | Deuteranopia/protanopia/tritanopia SVG filters; redundant encoding (icon + color + text)                  |
| High Contrast  | Forces borders, increases text weight, swaps palette to pure primaries                                    |
| Semantic HTML  | `<button>` not `<div>`, `role="progressbar"` + `aria-valuenow`, `aria-live="polite"` for HUD              |
| Scaling        | `--scale` CSS var (1–1.5×) for large HUD                                                                  |

**Why:** Forza Horizon 5 accessibility deep-dive (Can I Play That) shows analog/digital speedo, units, colorblind/high-contrast, moving-background toggle — we match + exceed.

---

## 9. Assets: Zero Legal Risk

**Decision:** Only CC0/MIT/OFL/Apache-2.0 assets. Verified per-asset.

| Category       | Source                | License | Commercial |
| -------------- | --------------------- | ------- | ---------- |
| Fonts          | Google Fonts          | OFL 1.1 | ✅         |
| Icons          | Phosphor              | MIT     | ✅         |
| 3D Models      | Kenney                | CC0 1.0 | ✅         |
| Textures/HDRIs | Poly Haven, ambientCG | CC0 1.0 | ✅         |
| Sounds         | Kenney                | CC0 1.0 | ✅         |

**Self-hosted** (no runtime API attribution). `THIRD_PARTY_NOTICES.md` for MIT/OFL/Apache.

**Rejected:** Sketchfab CC-BY-NC/SA, freesound CC-BY-NC, OpenGameArt GPL — legal risk for commercial portfolio.

---

## 10. Test Compatibility vs. Design Purity

**Decision:** Accepted test breakage for design system purity; fix tests in Phase L.

- `.glass-card` → `.card` (semantic: it's a card, not glass-specific)
- `.menu-actions-premium` → kept `.menu-actions` for test compat
- ModeSelectScreen chip API changed — tests need mock updates
- Flow test selectors updated in Phase L

**Why:** Design system > test compatibility. Tests are correctable; design debt is not.

---

## 11. Performance Guardrails (Non-Negotiable)

| Guardrail       | Limit                        | Enforcement                  |
| --------------- | ---------------------------- | ---------------------------- |
| CSS gzipped     | < 25 KB                      | Build check                  |
| Three.js hero   | < 100 KB glTF                | Kenney CC0 ~50 KB            |
| Fonts           | < 150 KB total               | Subset Latin, WOFF2, preload |
| Blur            | ≤12px mobile                 | CSS clamp                    |
| Particles       | ≤20 mobile / ≤60 desktop     | Ambient config               |
| Frame budget    | Dynamic resolution preserved | FrameBudgetScaler            |
| Three.js render | Only hero on menus           | Conditional init             |

---

## 12. Phases G2–O: Remaining Work (Priority Order)

1. **GarageScreen** — Three.js car, camera stages, spec bars, cosmetic tabs
2. **ProfileScreen** — XP arc, animated counters, title progression, records
3. **LeaderboardScreen** — Timing tower, current player highlight, animated rank
4. **AchievementsScreen** — Collectible cards, rarity glow, unlock animation
5. **HowToPlayScreen** — 7 tabs, interactive demos, search
6. **SettingsScreen** — Glass panels, live preview, accessibility toggles
7. **HUD Polish** — Speed glow tiers, boost shimmer, combo ring, AI HUD polish
8. **Victory/Results** — Crown drop, level-up pulse, stat counters
9. **Transitions** — Shared-element (racing line), slide/fade choreography
10. **Micro-interactions** — Ripple, magnetic hover, shimmer, toast choreography
11. **Mobile Pass** — Pixel 5 audit, touch targets, safe areas, no overflow
12. **Accessibility Pass** — WCAG AA audit, reduced motion, colorblind, high contrast
13. **Performance Pass** — Budget compliance, lazy-load, reduced motion
14. **Test Fix** — Selector updates, mock API alignment
15. **E2E Regression** — Full Playwright suite (dev + prod)
16. **Production Probe** — 22/22 on dist/ (chromium + Pixel 5)
17. **Zero Residue** — Clean temp files, final report

---

**Document Status:** Complete — ready for Phase L execution
