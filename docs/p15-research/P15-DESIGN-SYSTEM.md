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
