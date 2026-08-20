# 03-DESIGN-SYSTEM-IMPLEMENTATION.md

**Virtual Steering — P15 Design System Implementation Spec**  
Tokens, typography, components, motion, responsive, accessibility, performance. Maps to existing project structure. Does NOT rewrite architecture.

---

## 1. TOKENS

### 1.1 Colors

CSS `:root` in `src/style.css` (replaces/extended current 57+ tokens). TS mirror in `src/ui/tokens.ts` for Three.js/canvas use.

```css
:root {
  /* Ground — deep, near-black, reduces glare */
  --bg: #05070b;
  --bg-elevated: #0a0d13;
  --surface: #0c0f14; /* cards, panels */
  --surface-elevated: #13171e; /* modals, toasts, dropdowns */

  /* Translucent glass */
  --glass: rgba(255, 255, 255, 0.03);
  --glass-strong: rgba(255, 255, 255, 0.06);
  --glass-border: rgba(255, 255, 255, 0.08);

  /* Borders — hierarchy of prominence */
  --border: rgba(255, 255, 255, 0.05);
  --border-bright: rgba(255, 255, 255, 0.12); /* hover, selected */
  --border-hot: rgba(255, 255, 255, 0.2); /* pressed, focus */

  /* Semantic accents — ONE meaning each */
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

  /* Text */
  --text: #ffffff;
  --text-muted: #8a8e9c;
  --text-dim: #4a4f5c; /* disabled, placeholder — NEVER interactive */

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

### 1.2 Typography

```css
:root {
  --ff-display: 'Orbitron', 'Rajdhani', system-ui, sans-serif;
  --ff-hud: 'Rajdhani', 'Share Tech Mono', system-ui, sans-serif;
  --ff-body: 'Inter', system-ui, sans-serif;
  --ff-mono: 'Share Tech Mono', 'JetBrains Mono', monospace;

  /* Fluid type scale (mobile-first) */
  --fs-display: clamp(24px, 6vw, 48px); /* logo */
  --fs-h1: clamp(20px, 5vw, 28px);
  --fs-h2: clamp(16px, 3.5vw, 20px);
  --fs-h3: 14px;
  --fs-body: 14px;
  --fs-body-sm: 12px;
  --fs-label: 10px; /* uppercase meta */
  --fs-btn: 11px; /* uppercase button */
  --fs-hud-lg: clamp(36px, 4vw, 48px); /* speed, position */
  --fs-hud-md: clamp(20px, 2.5vw, 24px); /* lap time */
  --fs-hud-sm: 14px; /* auxiliary HUD */

  --tabular: tabular-nums;
  --scale: 1; /* a11y large-HUD (1–1.5) */
}
```

### 1.3 Spacing & Sizing

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  --size-touch-min: 48px; /* interactive minimum */
  --size-touch-primary: 56px; /* primary CTA */
  --size-card-track: 280px; /* track rail card */
  --size-card-track-lg: 320px; /* desktop track card */
  --size-peek: 113px; /* rail peek on mobile */
}
```

### 1.4 Radius, Borders, Blur

```css
:root {
  --radius-sm: 6px;
  --radius: 10px;
  --radius-lg: 16px; /* default card */
  --radius-xl: 24px; /* hero/modal surfaces */
  --radius-pill: 999px; /* badges, chips, toggles */

  --blur-glass: blur(12px) saturate(160%); /* desktop */
  --blur-glass-mobile: blur(8px) saturate(160%); /* ≤600px */
  --border-width: 1px;
}
```

**Blur cap:** 12px desktop / 8px mobile. **NEVER animate blur radius.**

### 1.5 Opacity

```css
:root {
  --opacity-disabled: 0.5;
  --opacity-faint: 0.3; /* decorative layers */
  --opacity-overlay-bg: 0.6; /* modal backdrop */
  --opacity-hover-bg: 0.06;
  --opacity-pressed-bg: 0.12;
}
```

### 1.6 Z-Index / Layers

```css
:root {
  --z-screen: 10; /* base screen */
  --z-header: 20; /* nav bars */
  --z-hud: 50; /* in-race HUD */
  --z-ai-hud: 150; /* AI HUD rail (right) */
  --z-modal: 100; /* modals, dialogs */
  --z-ceremony: 200; /* victory overlay */
  --z-toast: 200; /* toasts, tooltips */
  --z-flash: 250; /* fullscreen flashes */
  --z-overlay: 300; /* racing line, scanlines, topmost decorative */
}
```

---

## 2. TYPOGRAPHY

### Font Roles (FIXED — no cross-role use)

| Role              | Font                       | Weight  | Letter-spacing | Transform    |
| ----------------- | -------------------------- | ------- | -------------- | ------------ |
| Display/Logo      | Orbitron                   | 900     | 0.08em         | Uppercase    |
| H1                | Orbitron                   | 800     | 0.04em         | Uppercase    |
| H2                | Rajdhani                   | 700     | 0.02em         | —            |
| H3                | Rajdhani                   | 600     | 0.02em         | —            |
| Body              | Inter                      | 500     | 0              | —            |
| Body Small        | Inter                      | 500     | 0              | —            |
| Label/Meta        | Rajdhani                   | 600     | 0.1em          | Uppercase    |
| Button            | Orbitron                   | 700     | 0.06em         | Uppercase    |
| HUD Numeric       | Rajdhani / Share Tech Mono | 700–900 | 0              | tabular-nums |
| Timer/Leaderboard | Share Tech Mono            | 700     | 0              | tabular-nums |

### Rules

- **Orbitron** = Display/Logo/Buttons/Countdown ONLY. Never body.
- **Rajdhani** = Headings/Labels/HUD readouts.
- **Inter** = All body/description/tooltip/settings text.
- **Share Tech Mono** = Timers, leaderboards, precise columns.
- **`font-variant-numeric: tabular-nums`** MANDATORY for: speed, position, lap, time, score, combo, any columnar data. Prevents jitter during count-up.
- **Responsive:** all sizes via `clamp()`. At 200% zoom → no horizontal overflow.
- **Large HUD:** `--scale` multiplies HUD/button/padding sizes. `transform-origin: top left`.

---

## 3. COMPONENTS

All components live under `src/ui/components/`, extend base classes in `src/style.css`.

### 3.1 Buttons — `Button.ts`

Variants: `primary` (accent-primary bg, #000 text, glow), `ghost` (transparent, border-bright), `danger` (accent-red bg, white text). Sizes: `sm` (40px), default (48px), `lg` (56px primary).

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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  min-width: 48px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition:
    transform var(--motion-fast) var(--ease-out),
    background var(--motion-fast) var(--ease-out),
    border-color var(--motion-fast) var(--ease-out),
    box-shadow var(--motion-fast) var(--ease-out);
}
```

States: hover = brighten + translateY(-1px) + glow; pressed = scale(0.97) + ripple; focus-visible = 2px outline; disabled = opacity 0.5, no hover. Ripple via `AnimationSystem.ripple()`, removed under reduced motion.

### 3.2 Glass Card — `GlassCard.ts` (universal container)

```css
.card {
  background: var(--surface-elevated);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  backdrop-filter: var(--blur-glass);
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}
.card::before {
  /* inset highlight: linear-gradient(180deg, rgba(255,255,255,0.08), transparent 40%) */
}
.card::after {
  /* diagonal sheen: 115deg gradient, mix-blend-mode: screen, translateX sweep on hover */
}
.card-selected {
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-card), var(--glow-primary);
}
.card-disabled {
  opacity: 0.5;
  pointer-events: none;
}
```

Reduced motion: `::after` display none, transitions none.

### 3.3 Navigation — `NavigationSystem` (preserved) + `TransitionSystem`

- Keep existing `NavigationSystem`. Add transition kinds in `TransitionSystem.ts`: `fade | slide-left | slide-right | slide-up | slide-down | scale | shared-element`.
- **Shared-element racing line:** `RacingLine.ts` — fixed SVG stroke (2px, accent-primary, dasharray 1000), morphs between Menu→Track→Mode. `stroke-dashoffset` transition (400ms ease-out). `pointer-events: none`, `z-index: var(--z-overlay)`, `aria-hidden`.
- Screen wrapper: `.screen-enter` (slide-in from right 280ms) / `.screen-exit` (slide-out left, 75% duration, ease-in).

### 3.4 Tabs — `TabBar.ts`

`role="tablist"` → `button role="tab" aria-selected` → `div role="tabpanel"`. Flex bar, glass bg, 4px padding. Active = accent-primary text + accent-primary-dim bg + 24px×2px indicator (120ms width/translateX). Min-height 44px. Focus-visible outline. Content cross-fade 200ms.

### 3.5 Chips — `Chip.ts`

Compact selectable pills: icon + label, `border-radius: pill`, glass bg. Selected = accent-primary border + dim bg + glow. Available (full opacity) vs unavailable (dimmed but focusable). Min-height 32px (interactive chips 40px).

### 3.6 Badges — `Badge.ts`

`role="status"` when live-changing. Semantic variants:

| Variant | BG                     | Text               | Border | Use                |
| ------- | ---------------------- | ------------------ | ------ | ------------------ |
| primary | `--accent-primary-dim` | `--accent-primary` | same   | success, ready     |
| gold    | `--accent-gold-dim`    | `--accent-gold`    | same   | 1st, mastery       |
| cyan    | `--accent-cyan-dim`    | `--accent-cyan`    | same   | info, tech         |
| red     | `--accent-red-dim`     | `--accent-red`     | same   | danger, error      |
| magenta | `--accent-magenta-dim` | `--accent-magenta` | same   | warning, dirty air |

9px, 700, 0.08em, uppercase, pill.

### 3.7 Progress Bars — `ProgressBar.ts`

`<progress role="progressbar" aria-valuenow/min/max>` wrapped in styled track. 6px tall, glass track, `--accent-primary→gold` gradient fill. Fill transitions width (400ms ease-out) — **animating width on the fill layer only (not container layout)**; shimmer `::after` sweep (1.5s loop, mix-blend screen, disabled reduced-motion).

### 3.8 XP Arcs — `ProgressArc.ts`

`<svg role="progressbar" aria-valuenow/min/max>` circle, rotate(-90deg), stroke-dasharray 251, stroke-dashoffset transitions (600ms ease-out), `stroke-linecap: round`, drop-shadow glow. 80px default; scale with `--scale`.

### 3.9 Stat Blocks — `StatBlock.ts`

Label (Rajdhani 10px uppercase, muted) + value (Orbitron/Rajdhani 700, tabular-nums, count-up 1000ms via rAF). Optionally delta indicator (green ↑ / red ↓ + arrow + text).

### 3.10 Achievement Cards — `AchievementCard.ts`

Locked: dimmed, 🔒, progress bar. Unlocked: primary border, hover shimmer. Mastery (data-driven `category==='mastery' && target>=50`): gold glow + ⭐⭐⭐. Unlock animation: scale pop (spring 800ms) + shimmer + XP arc increment. Rarity glow is data-driven, never hardcoded.

### 3.11 Leaderboard Rows — `LeaderboardRow.ts`

Position | player | score | date | gap. Highlight current player (pulse). Gain/loss: green ↑ arrow + label / red ↓ + label (redundant encoding). Medal chips + "1st/2nd/3rd" text. Row stagger 40ms.

### 3.12 Track Cards — `TrackCard.ts`

SVG map (layered strokes glow→core→highlight, draw-on via dasharray on entrance), name, weather/time chips, best time (tabular), difficulty stars, medal overlays. Selected: scale 1.05 + primary border + glow. Horizontal rail container.

### 3.13 Mode Cards — `ModeCard.ts`

Intent icon (Phosphor), name, 1-line description, difficulty dots (●●○○○ + text), player-count badge, control chips with availability dimming.

### 3.14 Modal / Dialog — `Modal.ts`

`role="dialog" aria-modal="true"`. Backdrop `rgba(0,0,0,0.6)` + blur. Scale-in (280ms ease-out), scale-out (200ms ease-in). **Focus trap** (Tab cycling within), Escape closes, focus returns to opener. Single modal layer at a time.

### 3.15 Toast — `Toast.ts`

`role="status"` + `aria-live="polite"`. Slide-in-right, stack with 80ms stagger, max 3 visible, auto-dismiss 3–4s, close button. Variants: primary/gold/cyan/red/magenta borders. Positioned above safe-area bottom.

### 3.16 Tooltip — `Tooltip.ts`

120ms delay show, 8px offset, `surface-elevated` bg + border, appears on hover + focus, `role="tooltip"`. Disabled under reduced motion. Dismiss on Escape.

### 3.17 Toggle — `Toggle.ts`

Real checkbox or `<button aria-pressed>`. Knob slides 120ms ease-out; on = accent-primary. Min 44px hit area. Visible focus.

### 3.18 Slider — `Slider.ts`

`<input type="range">` styled or `role="slider"`. Thumb ease-out; arrow-key support; value pop on change; debounced apply. Min 48px thumb target.

### 3.19 Dropdown — `Dropdown.ts`

`role="listbox"`. Glass panel, 200ms ease-out open, searchable if >7 options, Escape closes, arrow-key nav, selected state accent-primary. Min item height 44px.

### 3.20 Loading States — `LoadingState.ts`

Progress ring (arc draw) OR skeleton. `role="progressbar"` when determinate, `aria-busy` when not.

### 3.21 Skeletons — `Skeleton.ts`

Glass track + shimmer sweep. **Shimmer disabled under reduced motion** (static track). Tabular layout reserved to prevent shift.

### 3.22 Empty States — `EmptyState.ts`

Icon + title + 1-line description + (optional) action. E.g., "No times set" + ghost car illustration + "Race now" button. Never bare text.

### 3.23 Error States — `ErrorState.ts`

Red border/dim bg + ✕ icon + error text + retry action. `role="alert"`. Never color-only.

---

## 4. MOTION

### 4.1 Duration Hierarchy

```css
:root {
  --motion-instant: 50ms; /* hover color/opacity, tooltip show */
  --motion-fast: 120ms; /* press, ripple, focus ring, tab switch */
  --motion-base: 200ms; /* dropdown, card entrance */
  --motion-medium: 280ms; /* modal, drawer, screen transition */
  --motion-slow: 400ms; /* page transition, full sheet, racing line */
  --motion-cinematic: 700ms; /* hero entrance, FIRST-RUN ONLY */
  --motion-ambient: 1800ms; /* background loops (grid, aurora) */
}
```

### 4.2 Easing

```css
:root {
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1); /* DEFAULT */
  --ease-in: cubic-bezier(0.55, 0.06, 0.68, 0.19); /* exits, code-triggered */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1); /* layout changes */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* celebration, pop */
  --ease-snap: cubic-bezier(0.12, 0.8, 0.32, 1); /* quick snaps */
}
```

### 4.3 Behavior Matrix

| Trigger         | Animation                             | Duration              | Easing            |
| --------------- | ------------------------------------- | --------------------- | ----------------- |
| **Entrance**    | slide-in-up + fade                    | 280ms                 | ease-out          |
| **Exit**        | fade + slide-down (75% of entrance)   | 150–210ms             | ease-in           |
| **Hover**       | brighten / scale 1.015 / sheen / glow | 120–200ms             | ease-out          |
| **Press**       | scale 0.97 + ripple                   | 100ms                 | ease-out          |
| **Selection**   | border→accent + glow (pulse 2s loop)  | 280ms                 | ease-out          |
| **Loading**     | shimmer / arc draw                    | 400–600ms / 1.5s loop | ease-out / linear |
| **Celebration** | spring pop + shimmer + pulse          | 800–1600ms            | spring            |
| **Transitions** | shared-element morph / slide / fade   | 200–400ms             | ease-out          |

### 4.4 Rules

- Stagger: `calc(var(--i) * 60ms)`, max 8 items, `fill-mode: both`.
- Asymmetric timing: user-triggered = fast intro/slow outro; code-triggered = slow intro/fast outro.
- Exit = 75% entrance duration.
- Animate **transform/opacity only**. Never width/height/top/left/backdrop-filter.
- `will-change: transform, opacity` on animating elements; remove after.
- One shared rAF ticker for shimmer/progress (no per-element timers).

### 4.5 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  /* KEEP state-communicating: */
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
  /* REMOVE decorative: */
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
  }
}
```

JS gate in `AnimationSystem.isMotionReduced()` → `play()` applies end-state instead of animating unless `force`.

---

## 5. RESPONSIVE

### 5.1 Breakpoints

```css
:root {
  --bp-mobile: 600px;
  --bp-tablet: 800px;
  --bp-desktop: 1000px;
  --bp-wide: 1280px;
}
```

### 5.2 Layout Adaptation

| Component    | Desktop ≥1000px         | Tablet 800–1000px | Mobile ≤600px                                  |
| ------------ | ----------------------- | ----------------- | ---------------------------------------------- |
| Main Menu    | 55/45 split (car/cards) | 50/50             | Stacked: car 40vh → cards                      |
| Track Cards  | 3-col grid 320px        | 2-col 320px       | Horizontal rail 280px + peek                   |
| Mode Cards   | 3-col grid              | 2-col             | Vertical stack, sticky headers                 |
| Garage       | 70/30 (preview/sidebar) | 60/40             | Tabs: Preview/Cosmetics/Specs                  |
| Profile      | 2-col                   | 2-col             | Single col, collapsible                        |
| Leaderboard  | Table + sidebar         | Table h-scroll    | H-scroll, sticky # column                      |
| Achievements | 3-col                   | 2-col             | 1-col, larger cards                            |
| Settings     | 2-col (tabs+panel)      | 2-col             | Accordion tabs                                 |
| HUD          | Corner clusters         | Corner clusters   | Repositioned; AI rail right, touch left/bottom |

### 5.3 Touch Targets

- All interactive: `min-width/height: 48px` (Apple 44pt / Material 48dp / WCAG 44css px → take 48).
- Primary CTA: 56px. Track/mode cards: ≥56px. Tabs: 44px. Dropdown items: 44px.
- `@media (pointer: coarse)`: press transitions 50ms, larger active states.

### 5.4 Safe Areas

```css
:root {
  --safe-top: env(safe-area-inset-top, 0);
  --safe-bottom: env(safe-area-inset-bottom, 0);
  --safe-left: env(safe-area-inset-left, 0);
  --safe-right: env(safe-area-inset-right, 0);
}
/* Apply to fixed HUD clusters, touch controls, bottom tab bar, modals. */
```

### 5.5 Horizontal Overflow Prevention

```css
html,
body {
  max-width: 100%;
  overflow-x: hidden;
}
.track-rail {
  overscroll-behavior-x: contain;
  touch-action: pan-x;
  -webkit-overflow-scrolling: touch;
}
/* viewport meta: width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no (no accidental zoom on input focus) */
/* 200% zoom: no horizontal scroll (layout must tolerate). */
```

---

## 6. ACCESSIBILITY

### 6.1 Keyboard Navigation

- Logical tab order per screen (see 02-SCREEN-BY-SCREEN-UX tab orders).
- `Escape` = back/close globally. `Enter`/`Space` = activate. Arrows = grids/rails/lists. `1–4` = quick mode select (Mode Select).
- Focus trap in modals; return focus on close.

### 6.2 Focus-Visible

```css
:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--accent-primary-dim);
}
/* NEVER removed. Tabs use offset -2px within bar. */
```

### 6.3 Contrast

| Element                        | Target                        |
| ------------------------------ | ----------------------------- |
| Normal text ≥14px              | ≥4.5:1 (design hits 7:1)      |
| Large text ≥18.5px bold        | ≥3:1 (design hits 4.5:1)      |
| Critical interactive           | ≥7:1                          |
| Non-text (borders/icons/focus) | ≥3:1 (design hits 4.5:1)      |
| HUD numeric                    | ≥10:1 via glow + dark outline |

**Red `#e10600` on `#05070b` = 5.2:1 → boost to 7:1 via outline/darker red in critical cases.**

High-contrast palette: pure primaries (`#000`/`#fff`/`#0f0`/`#ff0`/`#0ff`/`#f00`/`#f0f`), forced borders, increased text weight, glows disabled. Applied via `[data-high-contrast='true']` on `:root`.

### 6.4 Colorblind Support

- SVG filters (`url(#deuteranopia-filter)` etc.) applied to `<html>` via `filter` — managed by `ThemeManager`.
- **Redundant encoding rule:** Every color-coded state = icon + text + shape + color. Never color alone.
- Gain/loss = ↑↓ arrows + GAIN/LOSS text; medals = 🥇🥈🥉 + "1st/2nd/3rd"; rarity = ⭐⭐⭐ + "MASTERY"; boost/draft = label + sound.

### 6.5 Reduced Motion

Global CSS media query + JS gate (see §4.5). Preserve state-communicating animation only.

### 6.6 Screen-Reader Semantics

- `<button>` for buttons; `<progress role="progressbar">` + `aria-valuenow/min/max`.
- Tabs: `role="tablist"/tab/tabpanel` + `aria-selected` + `aria-controls`.
- HUD: `aria-live="polite" aria-atomic="true"` announcer (`#hud-announcer`) for rank/lap/boost/record changes.
- Decorative (scanlines, particles, racing line): `aria-hidden="true"`.
- Toasts: `role="status"`. Errors: `role="alert"`.
- Heading hierarchy h1→h2→h3 preserved; landmarks (`main`, `nav`, `aside`).

### 6.7 Touch Target Sizing

See §5.3. Additionally `--scale` (1–1.5×) multiplies HUD, buttons, padding, and touch targets for large-HUD mode.

---

## 7. PERFORMANCE

### 7.1 Budgets

| Metric            | Budget                                           |
| ----------------- | ------------------------------------------------ |
| CSS gzipped       | < 25 KB                                          |
| Three.js hero car | < 100 KB glTF                                    |
| Fonts preloaded   | < 150 KB (Latin subset, WOFF2)                   |
| Glass blur        | ≤12px desktop / ≤8px mobile, never animated      |
| Particles         | ≤60 desktop / ≤20 mobile, paused when tab hidden |
| Background GPU    | ≤2ms/frame mobile                                |
| DOM nodes (menus) | < 2000                                           |
| Build size delta  | < +50KB gzipped                                  |

### 7.2 Rules

- **Blur:** cap values above; never animate; `backdrop-filter` only on cards/modals, not large containers.
- **Shadows:** use tokens (`--shadow-card/modal/glow`); glows via `box-shadow`/`drop-shadow`, not `filter: blur()` on big elements.
- **Particles:** cap per breakpoint; single system; `visibility: hidden` when tab hidden; disabled reduced-motion.
- **Animations:** transform/opacity only; `will-change` then remove; shared rAF ticker; no per-element intervals.
- **Three.js integration:** hero car only on Main Menu + Garage; lazy `import()`; single GLTF cache; low-poly <5k tris; no shadows; emissive for neon; no post-process on mobile; pause render when screen idle (existing menu render gating preserved); FrameBudgetScaler + dynamic resolution + quality tiers (Performance/Balanced/Quality) untouched.
- **DOM complexity:** component reuse; virtualize/paginate leaderboard >100 rows; lazy-render offscreen rail cards; cap toasts at 3; one modal layer.
- **Mobile GPU:** hero car skips shadows/post-process; blur 8px; particles ≤20; scanlines/CRT disabled; textures ≤512px UI; fonts Latin-only subsets.
- **Fonts:** preload display fonts (`<link rel="preload" as="font">`); `font-display: swap` for body; subset Latin.

### 7.3 Existing Guardrails (PRESERVE — do not regress)

- P12 resource disposal (geometries, materials, textures).
- FrameBudgetScaler (2000ms window, 18ms drop threshold).
- Quality tiers (Performance/Balanced/Quality).
- Menu render gating (`game.render()` skipped while idle).
- Reduced-motion global opt-out.
- Mobile quality auto-downgrade.

---

## 8. PROJECT STRUCTURE MAP

```
src/
├── style.css                    # MAIN — tokens + component bases + globals (§1–§6)
├── main.ts                      # font preloads, init (unchanged)
├── ui/
│   ├── tokens.ts                # TS mirror of CSS tokens (§1)
│   ├── ui.css                   # fold into style.css (deprecate)
│   ├── components/
│   │   ├── Button.ts            # §3.1
│   │   ├── GlassCard.ts         # §3.2
│   │   ├── TabBar.ts            # §3.4
│   │   ├── Chip.ts              # §3.5
│   │   ├── Badge.ts             # §3.6
│   │   ├── ProgressBar.ts       # §3.7
│   │   ├── ProgressArc.ts       # §3.8
│   │   ├── StatBlock.ts         # §3.9
│   │   ├── AchievementCard.ts   # §3.10
│   │   ├── LeaderboardRow.ts    # §3.11
│   │   ├── TrackCard.ts         # §3.12
│   │   ├── ModeCard.ts          # §3.13
│   │   ├── Modal.ts             # §3.14
│   │   ├── Toast.ts             # §3.15
│   │   ├── Tooltip.ts           # §3.16
│   │   ├── Toggle.ts            # §3.17
│   │   ├── Slider.ts            # §3.18
│   │   ├── Dropdown.ts          # §3.19
│   │   ├── LoadingState.ts      # §3.20
│   │   ├── Skeleton.ts          # §3.21
│   │   ├── EmptyState.ts        # §3.22
│   │   ├── ErrorState.ts        # §3.23
│   │   ├── RacingLine.ts        # §3.3 shared-element
│   │   └── index.ts
│   ├── core/
│   │   ├── AnimationSystem.ts   # §4 stagger/play/reduced-motion gate
│   │   ├── TransitionSystem.ts  # §3.3 shared-element kinds
│   │   └── ThemeManager.ts      # §6 high-contrast/colorblind/large-HUD
│   └── index.ts
├── screens/                     # consumers of the above (see 02-SCREEN-BY-SCREEN-UX)
│   ├── ambient.ts               # scanlines/vignette/noise/grid/aurora/hero bg
│   ├── heroCar.ts               # Three.js hero car (P15 already added)
│   ├── MainMenuScreen.ts        # P0
│   ├── TrackSelectScreen.ts     # P0
│   ├── ModeSelectScreen.ts      # P0
│   ├── GarageScreen.ts          # P1
│   ├── ProfileScreen.ts         # P1
│   ├── LeaderboardScreen.ts     # P1
│   ├── AchievementsScreen.ts    # P1
│   ├── HowToPlayScreen.ts       # P2
│   ├── SettingsScreen.ts        # P2
│   ├── SplashScreen.ts          # P2
│   ├── LoadingScreen.ts         # P2
│   ├── GameplayScreen.ts        # P0 HUD polish only
│   ├── VictoryCeremony.ts       # P2
│   └── ... (Lobby, Results, Replay, PhotoMode)
```

**Do NOT rewrite architecture. Do NOT replace authorities. Add/restyle only.**
