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
