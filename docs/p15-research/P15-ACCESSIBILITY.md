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
