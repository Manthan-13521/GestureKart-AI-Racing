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
