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
